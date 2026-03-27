import { z } from "zod";

/**
 * Slide lifecycle state.
 * Controls whether a slide can be edited, is approved, or locked as a template.
 */
export const slideStateSchema = z
  .enum(["generated", "derived", "approved", "locked"])
  .describe("Slide lifecycle state: generated → approved → locked");

export type SlideState = z.infer<typeof slideStateSchema>;

/**
 * Deck lifecycle state.
 * Decks are either active (in use) or archived (shelved).
 * Separate from slide approval — decks don't need approval.
 */
export const deckLifecycleSchema = z
  .enum(["active", "archived"])
  .describe("Deck lifecycle: active (in use) or archived (shelved)");

export type DeckLifecycle = z.infer<typeof deckLifecycleSchema>;

/**
 * Deck-level metadata.
 */
export const metaSchema = z.object({
  title: z.string().describe("Deck title displayed on the cover slide"),
  theme: z.string().describe("Theme name from themes/ directory"),
  state: deckLifecycleSchema
    .default("active")
    .describe("Deck lifecycle state; defaults to active"),
});

export type Meta = z.infer<typeof metaSchema>;

/**
 * Slide schema for file-based slides.
 * Each slide references a file (.html passthrough or pattern name for .tsx SSR).
 * Pattern slides can include vars validated against the pattern's Zod schema.
 */
export const slideSchema = z.object({
  file: z.string().min(1).describe("Slide file path (.html) or pattern name"),
  state: slideStateSchema
    .optional()
    .describe("Per-slide state override; inherits deck state if omitted"),
  vars: z
    .record(z.unknown())
    .optional()
    .describe("Variables for pattern slides, validated against pattern schema"),
});

export type Slide = z.infer<typeof slideSchema>;
