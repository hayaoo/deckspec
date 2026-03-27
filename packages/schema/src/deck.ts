import { z } from "zod";
import { metaSchema, slideSchema } from "./base.js";

/**
 * Deck schema for file-based slides.
 * Validates structure (meta + slides array with file references).
 */
export const deckSchema = z.object({
  meta: metaSchema.describe("Deck metadata (title, theme, state)"),
  slides: z
    .array(slideSchema)
    .min(1)
    .describe("Ordered list of slides; at least one required"),
});

export type Deck = z.infer<typeof deckSchema>;
