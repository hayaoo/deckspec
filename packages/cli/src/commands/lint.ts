import { resolve, dirname, join } from "node:path";
import { readFile, readdir, stat, access } from "node:fs/promises";
import { loadDeckFile } from "@deckspec/dsl";
import { extractThemeName, resolveThemePatternsSrcDir } from "@deckspec/renderer";
import { harnessSchema, type Harness } from "@deckspec/schema";
import {
  lintComposition,
  lintPatternSource,
  hasErrors,
  hasWarnings,
  type LintFinding,
  type LintSlide,
} from "../lint-core.js";

interface LintOptions {
  deckPath?: string;
  theme?: string;
  strict: boolean;
  json: boolean;
}

function parseArgs(args: string[]): LintOptions {
  const opts: LintOptions = { strict: false, json: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--theme" && args[i + 1]) {
      opts.theme = args[i + 1];
      i++;
    } else if (a === "--strict") {
      opts.strict = true;
    } else if (a === "--json") {
      opts.json = true;
    } else if (!a.startsWith("-") && !opts.deckPath) {
      opts.deckPath = a;
    }
  }
  return opts;
}

/** Loads and parses a theme's harness.json. Returns null if it does not exist. */
async function loadHarness(themeName: string): Promise<Harness | null> {
  const harnessPath = join(process.cwd(), "themes", themeName, "harness.json");
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(harnessPath, "utf-8"));
  } catch {
    return null;
  }
  const parsed = harnessSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(`⚠ harness.json for theme "${themeName}" has an invalid shape — linting with best effort.`);
    return raw as Harness;
  }
  return parsed.data;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Lists theme pattern directories that contain an index.tsx. */
async function listThemePatterns(patternsSrcDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(patternsSrcDir);
  } catch {
    return [];
  }
  const names: string[] = [];
  for (const name of entries) {
    if (name.startsWith(".") || name.startsWith("_") || name === "node_modules" || name === "dist") continue;
    try {
      const s = await stat(join(patternsSrcDir, name));
      if (s.isDirectory() && (await exists(join(patternsSrcDir, name, "index.tsx")))) {
        names.push(name);
      }
    } catch {
      // skip
    }
  }
  names.sort();
  return names;
}

/**
 * deckspec lint [<deck.yaml>] [--theme <name>] [--strict] [--json]
 *
 * Evaluation layer of the design harness: checks a deck's composition and any
 * deck-local pattern sources against the theme's machine-readable design rules
 * (themes/<theme>/harness.json). With --theme, also self-checks that theme's
 * own pattern sources.
 */
export async function lintCommand(args: string[]): Promise<void> {
  const opts = parseArgs(args);

  if (!opts.deckPath && !opts.theme) {
    console.error("Error: Missing target.\n");
    console.error("Usage: deckspec lint <deck.yaml> [--theme <name>] [--strict] [--json]");
    console.error("       deckspec lint --theme <name>   (theme self-check)");
    process.exit(1);
  }

  const findings: LintFinding[] = [];

  // Resolve the theme that supplies the harness rules.
  let deckRaw: any;
  let deckTheme: string | undefined;
  if (opts.deckPath) {
    deckRaw = await loadDeckFile(opts.deckPath);
    deckTheme = extractThemeName(deckRaw);
  }
  const harnessTheme = deckTheme ?? opts.theme!;

  const harness = await loadHarness(harnessTheme);
  if (!harness) {
    if (!opts.json) {
      console.log(`harness.json not found for theme "${harnessTheme}" — skipping design lint.`);
    } else {
      console.log(JSON.stringify({ theme: harnessTheme, skipped: true, findings: [] }, null, 2));
    }
    process.exit(0);
  }

  const rules = harness.rules ?? {};

  // --- Deck composition + deck-local pattern lint ---
  if (opts.deckPath) {
    const rawSlides: any[] = Array.isArray(deckRaw?.slides) ? deckRaw.slides : [];
    const slides: LintSlide[] = rawSlides.map((s) => ({
      file: String(s?.file ?? ""),
      vars: (s?.vars ?? undefined) as Record<string, unknown> | undefined,
    }));

    findings.push(...lintComposition(slides, harness));

    // Lint deck-local pattern sources referenced by the deck.
    const basePath = dirname(resolve(opts.deckPath));
    const uniqueFiles = [...new Set(slides.map((s) => s.file))];
    for (const file of uniqueFiles) {
      if (!file || /\.[a-z]+$/i.test(file)) continue; // skip html passthrough / empty
      const localTsx = join(basePath, "patterns", file, "index.tsx");
      if (await exists(localTsx)) {
        const source = await readFile(localTsx, "utf-8");
        findings.push(...lintPatternSource(source, rules, { pattern: file }));
      }
    }
  }

  // --- Theme self-check ---
  if (opts.theme) {
    const themeHarness = opts.theme === harnessTheme ? harness : await loadHarness(opts.theme);
    const themeRules = themeHarness?.rules ?? rules;
    const patternsSrcDir = resolveThemePatternsSrcDir(opts.theme);
    const patternNames = await listThemePatterns(patternsSrcDir);
    for (const name of patternNames) {
      const source = await readFile(join(patternsSrcDir, name, "index.tsx"), "utf-8");
      findings.push(...lintPatternSource(source, themeRules, { pattern: name }));
    }
  }

  // --- Output ---
  if (opts.json) {
    const summary = {
      errors: findings.filter((f) => f.level === "error").length,
      warnings: findings.filter((f) => f.level === "warning").length,
      infos: findings.filter((f) => f.level === "info").length,
    };
    console.log(JSON.stringify({ theme: harnessTheme, findings, summary }, null, 2));
  } else {
    printFindings(findings, harnessTheme);
  }

  if (hasErrors(findings)) {
    process.exit(1);
  }
  if (opts.strict && hasWarnings(findings)) {
    process.exit(1);
  }
}

function locationLabel(f: LintFinding): string {
  const parts: string[] = [];
  if (typeof f.slide === "number") parts.push(`slide ${f.slide}`);
  if (f.pattern && typeof f.slide !== "number") parts.push(`pattern ${f.pattern}`);
  else if (f.pattern) parts.push(`[${f.pattern}]`);
  if (typeof f.line === "number") parts.push(`L${f.line}`);
  return parts.join(" ");
}

function printFindings(findings: LintFinding[], theme: string): void {
  console.log(`\nDesign lint (theme: ${theme})\n`);

  if (findings.length === 0) {
    console.log("  ✓ No design issues found.");
    console.log("");
    return;
  }

  for (const f of findings) {
    const loc = locationLabel(f);
    const prefix = loc ? `${loc}: ` : "";
    if (f.level === "error") {
      console.error(`  ✗ ${prefix}${f.message}`);
    } else if (f.level === "warning") {
      console.warn(`  ⚠ ${prefix}${f.message}`);
    } else {
      console.log(`  ℹ ${prefix}${f.message}`);
    }
  }

  const errors = findings.filter((f) => f.level === "error").length;
  const warnings = findings.filter((f) => f.level === "warning").length;
  const infos = findings.filter((f) => f.level === "info").length;
  console.log("");
  console.log(`  ${errors} error(s), ${warnings} warning(s), ${infos} info.`);
  console.log("");
}
