import { describe, it, expect } from "vitest";
import type { Harness, HarnessRules } from "@deckspec/schema";
import {
  lintComposition,
  lintPatternSource,
  countVarsChars,
  hasErrors,
  hasWarnings,
  type LintSlide,
} from "./lint-core.js";

const harness: Harness = {
  rules: {
    forbiddenTextColors: ["#000", "#000000", "black"],
    allowedFontWeights: [400, 600],
    minFontSize: 14,
    maxShadowAlpha: 0.06,
    forbiddenFontKeywords: ["serif", "明朝"],
  },
  composition: {
    openingPatterns: ["title-center", "hero-statement"],
    closingPatterns: ["thank-you"],
    maxConsecutiveSamePattern: 2,
    charBudgetPerSlide: 400,
  },
  patterns: {
    "title-center": { charBudget: 120 },
    "thank-you": { charBudget: 360 },
  },
};

const rules: HarnessRules = harness.rules!;

describe("countVarsChars", () => {
  it("sums nested string values", () => {
    expect(
      countVarsChars({ a: "12345", b: { c: "678" }, d: ["9", "0"], n: 42 }),
    ).toBe(10);
  });
  it("returns 0 for undefined vars", () => {
    expect(countVarsChars(undefined)).toBe(0);
  });
});

describe("lintComposition — consecutive patterns", () => {
  it("warns when a pattern repeats beyond the limit", () => {
    const slides: LintSlide[] = [
      { file: "title-center", vars: { title: "A", subtitle: "B" } },
      { file: "three-pillars" },
      { file: "three-pillars" },
      { file: "three-pillars" },
      { file: "thank-you", vars: { headline: "Bye" } },
    ];
    const findings = lintComposition(slides, harness);
    const monotony = findings.filter((f) => f.message.includes("単調"));
    expect(monotony).toHaveLength(1);
    expect(monotony[0].level).toBe("warning");
    expect(monotony[0].slide).toBe(2);
  });

  it("does not warn at exactly the limit", () => {
    const slides: LintSlide[] = [
      { file: "three-pillars" },
      { file: "three-pillars" },
    ];
    const findings = lintComposition(slides, harness);
    expect(findings.some((f) => f.message.includes("単調"))).toBe(false);
  });
});

describe("lintComposition — opening/closing", () => {
  it("emits info when first/last slides are off-pattern", () => {
    const slides: LintSlide[] = [
      { file: "three-pillars" },
      { file: "bullet-list" },
    ];
    const findings = lintComposition(slides, harness);
    const infos = findings.filter((f) => f.level === "info");
    expect(infos.length).toBe(2);
    expect(infos[0].slide).toBe(1);
    expect(infos[1].slide).toBe(2);
  });

  it("is quiet when opening/closing are correct", () => {
    const slides: LintSlide[] = [
      { file: "title-center", vars: { title: "A", subtitle: "B" } },
      { file: "thank-you", vars: { headline: "Bye" } },
    ];
    const findings = lintComposition(slides, harness);
    expect(findings.filter((f) => f.level === "info")).toHaveLength(0);
  });
});

describe("lintComposition — char budget", () => {
  it("warns when vars exceed the pattern budget", () => {
    const slides: LintSlide[] = [
      { file: "title-center", vars: { title: "x".repeat(100), subtitle: "y".repeat(100) } },
    ];
    const findings = lintComposition(slides, harness);
    const over = findings.filter((f) => f.message.includes("文字量"));
    expect(over).toHaveLength(1);
    expect(over[0].level).toBe("warning");
  });

  it("uses the deck default when no pattern budget exists", () => {
    const slides: LintSlide[] = [
      { file: "bullet-list", vars: { heading: "z".repeat(500) } },
    ];
    const findings = lintComposition(slides, harness);
    expect(findings.some((f) => f.message.includes("文字量"))).toBe(true);
  });
});

describe("lintComposition — content/design separation", () => {
  it("warns on hex colors in vars", () => {
    const slides: LintSlide[] = [
      { file: "hero-statement", vars: { headline: "Red #ff0000 text" } },
    ];
    const findings = lintComposition(slides, harness);
    expect(findings.some((f) => f.message.includes("カラーコード"))).toBe(true);
  });

  it("warns on raw HTML in vars", () => {
    const slides: LintSlide[] = [
      { file: "hero-statement", vars: { body: 'a <span style="x">b</span>' } },
    ];
    const findings = lintComposition(slides, harness);
    expect(findings.some((f) => f.message.includes("HTML"))).toBe(true);
  });

  it("does not flag clean content", () => {
    const slides: LintSlide[] = [
      { file: "hero-statement", vars: { eyebrow: "Vision", headline: "The future", body: "Plain text." } },
    ];
    const findings = lintComposition(slides, harness);
    expect(findings.filter((f) => f.level === "warning")).toHaveLength(0);
  });
});

describe("lintPatternSource — forbidden colors", () => {
  it("flags pure black text color as error", () => {
    const src = `const s = { color: "#000000" };`;
    const findings = lintPatternSource(src, rules, { pattern: "x" });
    expect(hasErrors(findings)).toBe(true);
    expect(findings[0].line).toBe(1);
  });

  it("flags the `black` keyword", () => {
    const src = `<div style={{ color: "black" }} />`;
    expect(hasErrors(lintPatternSource(src, rules))).toBe(true);
  });

  it("does not flag backgroundColor", () => {
    const src = `const s = { backgroundColor: "#000000" };`;
    const findings = lintPatternSource(src, rules);
    expect(findings.filter((f) => f.message.includes("禁止色"))).toHaveLength(0);
  });

  it("does not flag an allowed color", () => {
    const src = `const s = { color: "#1d1d1f" };`;
    expect(hasErrors(lintPatternSource(src, rules))).toBe(false);
  });
});

describe("lintPatternSource — font weight", () => {
  it("flags fontWeight 700 as error", () => {
    const src = `const s = { fontWeight: 700 };`;
    expect(hasErrors(lintPatternSource(src, rules))).toBe(true);
  });

  it("flags fontWeight bold as error", () => {
    const src = `const s = { fontWeight: "bold" };`;
    expect(hasErrors(lintPatternSource(src, rules))).toBe(true);
  });

  it("accepts allowed weights", () => {
    const src = `const a = { fontWeight: 400 }; const b = { fontWeight: 600 };`;
    expect(hasErrors(lintPatternSource(src, rules))).toBe(false);
  });
});

describe("lintPatternSource — shadows", () => {
  it("warns on a shadow darker than the cap", () => {
    const src = `const s = { boxShadow: "0 2px 8px rgba(0,0,0,0.25)" };`;
    const findings = lintPatternSource(src, rules);
    expect(hasWarnings(findings)).toBe(true);
    expect(hasErrors(findings)).toBe(false);
  });

  it("accepts a subtle shadow at the cap", () => {
    const src = `const s = { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };`;
    expect(hasWarnings(lintPatternSource(src, rules))).toBe(false);
  });

  it("does not flag a border rgba above the cap (not a shadow)", () => {
    const src = `const s = { borderBottom: "1px solid rgba(0,0,0,0.08)" };`;
    expect(hasWarnings(lintPatternSource(src, rules))).toBe(false);
  });
});

describe("lintPatternSource — font size", () => {
  it("warns on a font size below the minimum", () => {
    const src = `const s = { fontSize: 12 };`;
    expect(hasWarnings(lintPatternSource(src, rules))).toBe(true);
  });

  it("accepts a font size at the minimum", () => {
    const src = `const s = { fontSize: 14 };`;
    expect(hasWarnings(lintPatternSource(src, rules))).toBe(false);
  });
});

describe("lintPatternSource — fonts", () => {
  it("flags a serif font-family as error", () => {
    const src = `const s = { fontFamily: "Georgia, serif" };`;
    expect(hasErrors(lintPatternSource(src, rules))).toBe(true);
  });

  it("does not flag sans-serif fallback", () => {
    const src = `const s = { fontFamily: "Helvetica Neue, sans-serif" };`;
    expect(hasErrors(lintPatternSource(src, rules))).toBe(false);
  });

  it("flags 明朝 (CJK keyword)", () => {
    const src = `const s = { fontFamily: "Hiragino Mincho, 明朝" };`;
    expect(hasErrors(lintPatternSource(src, rules))).toBe(true);
  });
});

describe("empty / partial harness", () => {
  it("produces no findings when composition is absent", () => {
    const slides: LintSlide[] = [{ file: "anything", vars: { a: "b".repeat(9999) } }];
    expect(lintComposition(slides, {})).toHaveLength(0);
  });

  it("produces no findings when rules are absent", () => {
    const src = `const s = { color: "#000000", fontWeight: 700 };`;
    expect(lintPatternSource(src, {})).toHaveLength(0);
  });
});
