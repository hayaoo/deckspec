import { z } from "zod";

/**
 * Machine-readable design rules for a theme.
 *
 * Lives at `themes/{name}/harness.json`. Consumed by `deckspec lint` to
 * evaluate decks and deck-local patterns against the theme's design system.
 *
 * Every field is optional so theme authors can adopt the harness incrementally
 * — a partial harness.json still lints what it declares and skips the rest.
 */

/** Enforceable design constraints (the "evaluation" layer). */
export const harnessRulesSchema = z
  .object({
    forbiddenTextColors: z
      .array(z.string())
      .optional()
      .describe("Colors that must never be used for text (e.g. pure black)"),
    allowedFontWeights: z
      .array(z.number())
      .optional()
      .describe("Permitted numeric font-weight values (e.g. [400, 600])"),
    minFontSize: z
      .number()
      .optional()
      .describe("Smallest allowed font-size in px"),
    maxShadowAlpha: z
      .number()
      .optional()
      .describe("Maximum alpha for rgba(0,0,0,a) box-shadows"),
    forbiddenFontKeywords: z
      .array(z.string())
      .optional()
      .describe("font-family keywords that must not appear (e.g. serif, 明朝)"),
  })
  .describe("Enforceable design rules");

export type HarnessRules = z.infer<typeof harnessRulesSchema>;

/** Deck-level composition guidance. */
export const harnessCompositionSchema = z
  .object({
    openingPatterns: z
      .array(z.string())
      .optional()
      .describe("Patterns appropriate for the first slide"),
    closingPatterns: z
      .array(z.string())
      .optional()
      .describe("Patterns appropriate for the last slide"),
    maxConsecutiveSamePattern: z
      .number()
      .optional()
      .describe("How many identical patterns may appear in a row before it reads as monotonous"),
    charBudgetPerSlide: z
      .number()
      .optional()
      .describe("Default character budget for a single slide's text"),
  })
  .describe("Deck composition guidance");

export type HarnessComposition = z.infer<typeof harnessCompositionSchema>;

/** Per-pattern context (the "context" layer: when to reach for a pattern). */
export const harnessPatternSchema = z
  .object({
    whenToUse: z
      .string()
      .optional()
      .describe("One or two sentences on when this pattern fits"),
    whenNotToUse: z
      .string()
      .optional()
      .describe("One or two sentences on when to avoid this pattern"),
    charBudget: z
      .number()
      .optional()
      .describe("Character budget for a slide using this pattern"),
  })
  .describe("Per-pattern usage context");

export type HarnessPattern = z.infer<typeof harnessPatternSchema>;

/** Top-level harness.json shape. */
export const harnessSchema = z
  .object({
    rules: harnessRulesSchema.optional(),
    composition: harnessCompositionSchema.optional(),
    patterns: z
      .record(harnessPatternSchema)
      .optional()
      .describe("Pattern name → usage context"),
  })
  .describe("Theme design harness — machine-readable design rules");

export type Harness = z.infer<typeof harnessSchema>;
