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

/** A single image style (photo / diagram) declared by the theme. */
export const harnessImageStyleSchema = z
  .object({
    stylePrompt: z
      .string()
      .optional()
      .describe("Base prompt fragment describing the theme's visual language for this style"),
    negativePrompt: z
      .string()
      .optional()
      .describe("Things the generator must avoid (text, watermarks, loud colors, …)"),
    background: z
      .string()
      .optional()
      .describe("Canonical background color for images in this style (e.g. #f5f5f7)"),
    aspectRatios: z
      .array(z.string())
      .optional()
      .describe("Allowed aspect ratios (e.g. [\"16:9\", \"1:1\"])"),
  })
  .describe("One image style's machine-readable prompt recipe");

export type HarnessImageStyle = z.infer<typeof harnessImageStyleSchema>;

/** Provider configuration (how images are actually generated). */
export const harnessImageProviderSchema = z
  .object({
    note: z
      .string()
      .optional()
      .describe("Human/AI note on how this provider is invoked"),
    model: z
      .string()
      .optional()
      .describe("Model identifier passed to the provider (e.g. gemini-2.5-flash-image)"),
  })
  .describe("Image provider configuration");

export type HarnessImageProvider = z.infer<typeof harnessImageProviderSchema>;

/**
 * Theme-driven image generation layer.
 *
 * The theme declares which provider generates images (codex CLI or Gemini API)
 * and the machine-readable style recipes for the two supported styles
 * (photo / diagram). Theme-bundled skills read this section and follow it, so a
 * theme author can define their own visual language by swapping `styles`.
 */
export const harnessImagesSchema = z
  .object({
    provider: z
      .enum(["codex", "gemini"])
      .optional()
      .describe("Default image provider declared by the theme"),
    providers: z
      .record(harnessImageProviderSchema)
      .optional()
      .describe("Provider name → configuration"),
    outputDir: z
      .string()
      .optional()
      .describe("Where generated images are written, e.g. decks/{deck}/assets"),
    noTextInImages: z
      .boolean()
      .optional()
      .describe("If true, generated images must contain no text — text lives in slide vars"),
    styles: z
      .record(harnessImageStyleSchema)
      .optional()
      .describe("Style name (photo / diagram) → prompt recipe"),
  })
  .describe("Theme-driven image generation layer");

export type HarnessImages = z.infer<typeof harnessImagesSchema>;

/** Top-level harness.json shape. */
export const harnessSchema = z
  .object({
    rules: harnessRulesSchema.optional(),
    composition: harnessCompositionSchema.optional(),
    patterns: z
      .record(harnessPatternSchema)
      .optional()
      .describe("Pattern name → usage context"),
    images: harnessImagesSchema
      .optional()
      .describe("Theme-driven image generation layer (provider + style recipes)"),
  })
  .describe("Theme design harness — machine-readable design rules");

export type Harness = z.infer<typeof harnessSchema>;
