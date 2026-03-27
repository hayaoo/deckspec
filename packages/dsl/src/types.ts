import type { ZodError } from "zod";

/**
 * Validation result for a single slide.
 */
export interface SlideValidationResult {
  /** Zero-based index of the slide in the deck. */
  index: number;
  /** Whether the slide passed validation. */
  valid: boolean;
  /** Zod validation errors, present only when valid is false. */
  errors?: ZodError;
}

/**
 * Validation result for an entire deck.
 */
export interface ValidationResult {
  /** Whether all slides (and deck structure) passed validation. */
  valid: boolean;
  /** Per-slide validation results. */
  results: SlideValidationResult[];
  /** Deck-level structural error, if any. */
  deckError?: ZodError;
}
