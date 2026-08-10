import type { Harness, HarnessRules } from "@deckspec/schema";

/**
 * Pure lint logic for the design harness ("evaluation" layer).
 *
 * These functions do no I/O — they take already-loaded data (a parsed harness,
 * a deck's slide list, or a pattern's source text) and return findings. The
 * lint command wires them to the filesystem; the tests exercise them directly.
 */

export type LintLevel = "error" | "warning" | "info";

export interface LintFinding {
  level: LintLevel;
  message: string;
  /** 1-based slide number, when the finding concerns a deck slide. */
  slide?: number;
  /** Pattern name the finding concerns (deck-local or theme pattern). */
  pattern?: string;
  /** 1-based line number within a pattern source file, when applicable. */
  line?: number;
}

/** A single slide reference from a deck, reduced to what the linter needs. */
export interface LintSlide {
  file: string;
  vars?: Record<string, unknown>;
}

// --- Helpers ---------------------------------------------------------------

/** Recursively collects every string value found in a vars object/array. */
function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
}

/** Total character count across all string values in a vars object. */
export function countVarsChars(vars: Record<string, unknown> | undefined): number {
  if (!vars) return 0;
  const strings: string[] = [];
  collectStrings(vars, strings);
  return strings.reduce((sum, s) => sum + s.length, 0);
}

const HEX_COLOR_RE = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/;
const RAW_HTML_RE = /<\s*[a-zA-Z][\w-]*(\s|>|\/)|style\s*=/;

/** 1-based line number for a match index within a source string. */
function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === "\n") line++;
  }
  return line;
}

// --- Deck composition lint -------------------------------------------------

/**
 * Lints a deck's slide sequence against the harness composition rules.
 * Static analysis only — never renders.
 */
export function lintComposition(
  slides: LintSlide[],
  harness: Harness,
): LintFinding[] {
  const findings: LintFinding[] = [];
  const composition = harness.composition ?? {};
  const patterns = harness.patterns ?? {};

  // 1. Monotony: too many identical patterns in a row.
  const maxRun = composition.maxConsecutiveSamePattern;
  if (typeof maxRun === "number" && slides.length > 0) {
    let runStart = 0;
    for (let i = 1; i <= slides.length; i++) {
      if (i < slides.length && slides[i].file === slides[runStart].file) continue;
      const runLength = i - runStart;
      if (runLength > maxRun) {
        findings.push({
          level: "warning",
          slide: runStart + 1,
          pattern: slides[runStart].file,
          message: `パターン "${slides[runStart].file}" が ${runLength} 枚連続しています（上限 ${maxRun}）。単調になっています — パターンを変えて変化をつけましょう。`,
        });
      }
      runStart = i;
    }
  }

  // 2. Opening slide should use an opening pattern.
  const opening = composition.openingPatterns;
  if (opening && opening.length > 0 && slides.length > 0) {
    if (!opening.includes(slides[0].file)) {
      findings.push({
        level: "info",
        slide: 1,
        pattern: slides[0].file,
        message: `先頭スライドが opening パターン (${opening.join(", ")}) ではありません。`,
      });
    }
  }

  // 3. Closing slide should use a closing pattern.
  const closing = composition.closingPatterns;
  if (closing && closing.length > 0 && slides.length > 0) {
    const last = slides[slides.length - 1];
    if (!closing.includes(last.file)) {
      findings.push({
        level: "info",
        slide: slides.length,
        pattern: last.file,
        message: `最終スライドが closing パターン (${closing.join(", ")}) ではありません。`,
      });
    }
  }

  // 4. Per-slide checks: char budget + design/content separation.
  const defaultBudget = composition.charBudgetPerSlide;
  slides.forEach((slide, idx) => {
    const slideNo = idx + 1;

    // 4a. Character budget (pattern-specific overrides deck default).
    const patternBudget = patterns[slide.file]?.charBudget;
    const budget = patternBudget ?? defaultBudget;
    if (typeof budget === "number") {
      const chars = countVarsChars(slide.vars);
      if (chars > budget) {
        findings.push({
          level: "warning",
          slide: slideNo,
          pattern: slide.file,
          message: `文字量が多すぎます（${chars} 文字 / 目安 ${budget}）。1スライド1メッセージ — 文字を削るかスライドを分割しましょう。`,
        });
      }
    }

    // 4b. Content/design separation: raw colors or HTML in vars.
    const strings: string[] = [];
    collectStrings(slide.vars, strings);
    for (const s of strings) {
      if (HEX_COLOR_RE.test(s)) {
        findings.push({
          level: "warning",
          slide: slideNo,
          pattern: slide.file,
          message: `vars にカラーコードが混入しています（"${truncate(s)}"）。色はテーマ／パターン側で定義し、コンテンツと分離しましょう。`,
        });
        break;
      }
    }
    for (const s of strings) {
      if (RAW_HTML_RE.test(s)) {
        findings.push({
          level: "warning",
          slide: slideNo,
          pattern: slide.file,
          message: `vars に生 HTML／style が混入しています（"${truncate(s)}"）。装飾はパターン側で行いましょう。`,
        });
        break;
      }
    }
  });

  return findings;
}

function truncate(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// --- Pattern source lint ---------------------------------------------------

const ASCII_ONLY_RE = /^[\x00-\x7F]+$/;

function fontWeightToNumber(raw: string): number | null {
  const v = raw.trim().replace(/^["'`]|["'`]$/g, "").toLowerCase();
  if (/^\d+$/.test(v)) return parseInt(v, 10);
  if (v === "normal") return 400;
  if (v === "bold") return 700;
  if (v === "bolder") return 700;
  if (v === "lighter") return 300;
  return null;
}

/**
 * Lints a pattern's source text (.tsx) against the harness rules.
 * Regex-based static analysis — no AST, no compilation.
 */
export function lintPatternSource(
  source: string,
  rules: HarnessRules,
  ctx: { pattern?: string } = {},
): LintFinding[] {
  const findings: LintFinding[] = [];
  const pattern = ctx.pattern;

  // 1. Forbidden text colors in a `color` property context.
  if (rules.forbiddenTextColors && rules.forbiddenTextColors.length > 0) {
    const forbidden = new Set(
      rules.forbiddenTextColors.map((c) => c.trim().toLowerCase()),
    );
    // Match `color:` / `color=` but not `backgroundColor` / `borderColor`
    // (the preceding char must not be a word char).
    const colorRe = /(?:^|[^\w-])color\s*[:=]\s*["'`]?\s*(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = colorRe.exec(source)) !== null) {
      const value = m[1].toLowerCase();
      if (forbidden.has(value)) {
        findings.push({
          level: "error",
          pattern,
          line: lineOf(source, m.index),
          message: `純黒／禁止色 "${m[1]}" をテキスト color に使用しています。foreground トークン（例 #1d1d1f）を使いましょう。`,
        });
      }
    }
  }

  // 2. Font weights outside the allowed set.
  if (rules.allowedFontWeights && rules.allowedFontWeights.length > 0) {
    const allowed = new Set(rules.allowedFontWeights);
    const weightRe = /font-?weight\s*[:=]\s*(["'`]?[a-zA-Z0-9]+["'`]?)/gi;
    let m: RegExpExecArray | null;
    while ((m = weightRe.exec(source)) !== null) {
      const num = fontWeightToNumber(m[1]);
      if (num !== null && !allowed.has(num)) {
        findings.push({
          level: "error",
          pattern,
          line: lineOf(source, m.index),
          message: `font-weight ${m[1].replace(/["'`]/g, "")} は許可されていません（許可: ${rules.allowedFontWeights.join(", ")}）。`,
        });
      }
    }
  }

  // 3. Dark box-shadows: rgba(0,0,0,a) with a above the cap.
  // Scoped to a shadow property context so border/divider rgba (which
  // legitimately use higher alpha) are not flagged.
  if (typeof rules.maxShadowAlpha === "number") {
    const rgbaRe = /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*([0-9.]+)\s*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = rgbaRe.exec(source)) !== null) {
      const alpha = parseFloat(m[1]);
      if (Number.isNaN(alpha) || alpha <= rules.maxShadowAlpha) continue;
      // Confirm the rgba sits inside a shadow property value (the nearest
      // preceding `key: "…` still open at the rgba is a *shadow property).
      const before = source.slice(0, m.index);
      const keyMatch = before.match(/([a-zA-Z][\w-]*)\s*[:=]\s*["'`][^"'`]*$/);
      if (!keyMatch || !/shadow/i.test(keyMatch[1])) continue;
      findings.push({
        level: "warning",
        pattern,
        line: lineOf(source, m.index),
        message: `影が濃すぎます（rgba(0,0,0,${m[1]}) > 上限 ${rules.maxShadowAlpha}）。subtle な影に抑えましょう。`,
      });
    }
  }

  // 4. Font sizes below the minimum.
  if (typeof rules.minFontSize === "number") {
    const sizeRe = /font-?size\s*[:=]\s*["'`]?\s*(\d+(?:\.\d+)?)/gi;
    let m: RegExpExecArray | null;
    while ((m = sizeRe.exec(source)) !== null) {
      const size = parseFloat(m[1]);
      if (!Number.isNaN(size) && size < rules.minFontSize) {
        findings.push({
          level: "warning",
          pattern,
          line: lineOf(source, m.index),
          message: `fontSize ${m[1]} は最小サイズ ${rules.minFontSize}px を下回っています。`,
        });
      }
    }
  }

  // 5. Forbidden font-family keywords (serif, 明朝, ...).
  if (rules.forbiddenFontKeywords && rules.forbiddenFontKeywords.length > 0) {
    const fontDeclRe = /font-?family\s*[:=]\s*([^;\n}]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = fontDeclRe.exec(source)) !== null) {
      // Ignore the legitimate `sans-serif` fallback before matching `serif`.
      const value = m[1].replace(/sans-serif/gi, "");
      for (const kw of rules.forbiddenFontKeywords) {
        const kwRe = ASCII_ONLY_RE.test(kw)
          ? new RegExp(`\\b${escapeRegex(kw)}\\b`, "i")
          : new RegExp(escapeRegex(kw), "i");
        if (kwRe.test(value)) {
          findings.push({
            level: "error",
            pattern,
            line: lineOf(source, m.index),
            message: `禁止フォント "${kw}" を font-family に指定しています。sans-serif 系を使いましょう。`,
          });
        }
      }
    }
  }

  return findings;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when any finding is an error. */
export function hasErrors(findings: LintFinding[]): boolean {
  return findings.some((f) => f.level === "error");
}

/** True when any finding is a warning. */
export function hasWarnings(findings: LintFinding[]): boolean {
  return findings.some((f) => f.level === "warning");
}
