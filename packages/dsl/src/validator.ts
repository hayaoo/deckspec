import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { deckSchema } from "@deckspec/schema";
import type { ValidationResult, SlideValidationResult } from "./types.js";
import { resolveSlideFile } from "./parser.js";

export interface ValidationContext {
  basePath: string;
  patternsDir: string;
  /** Source patterns directory for .tsx fallback (e.g. themes/{theme}/patterns/) */
  patternsSrcDir?: string;
  /** Optional function to compile .tsx files on-the-fly. Provided by renderer. */
  compileTsx?: (tsxPath: string) => Promise<string>;
}

/**
 * Validates a raw parsed deck object.
 *
 * Validates the overall deck structure (meta + slides array) with deckSchema.
 * For each slide:
 * - .html files: checks file exists on disk
 * - pattern names: imports compiled .js, validates vars against exported schema
 * - .tsx patterns (deck-local): compiled via compileTsx if provided, otherwise skips vars validation
 */
export async function validateDeck(
  raw: unknown,
  context?: ValidationContext,
): Promise<ValidationResult> {
  const deckResult = deckSchema.safeParse(raw);

  if (!deckResult.success) {
    return {
      valid: false,
      results: [],
      deckError: deckResult.error,
    };
  }

  const deck = deckResult.data;
  const results: SlideValidationResult[] = [];
  let allValid = true;

  for (let index = 0; index < deck.slides.length; index++) {
    const slide = deck.slides[index];

    // If no context provided, only do structural validation
    if (!context) {
      results.push({ index, valid: true });
      continue;
    }

    try {
      const resolved = await resolveSlideFile(
        slide.file,
        context.basePath,
        context.patternsDir,
        context.patternsSrcDir,
      );

      if (resolved.type === "html") {
        // Check file exists
        await access(resolved.path);
        results.push({ index, valid: true });
      } else {
        // Pattern: import module and validate vars
        let modulePath = resolved.path;
        if (resolved.tsx && context.compileTsx) {
          modulePath = await context.compileTsx(resolved.path);
        } else if (resolved.tsx) {
          // No compiler provided — just check file exists (structural validation only)
          await access(resolved.path);
          results.push({ index, valid: true });
          continue;
        }

        const mod = await import(modulePath);

        // Check asset file existence
        if (mod.assets && Array.isArray(mod.assets) && slide.vars) {
          for (const spec of mod.assets as Array<{ field: string; type: string }>) {
            const val = slide.vars[spec.field];
            if (typeof val === "string" && !val.startsWith("https://")) {
              await access(resolve(context.basePath, val));
            }
          }
        }

        if (mod.schema && slide.vars) {
          const parseResult = mod.schema.safeParse(slide.vars);
          if (!parseResult.success) {
            results.push({ index, valid: false, errors: parseResult.error });
            allValid = false;
            continue;
          }
        } else if (mod.schema && !slide.vars) {
          // Check if schema has required fields
          const parseResult = mod.schema.safeParse({});
          if (!parseResult.success) {
            results.push({ index, valid: false, errors: parseResult.error });
            allValid = false;
            continue;
          }
        }

        results.push({ index, valid: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Create a synthetic ZodError-like structure for file resolution errors
      const { ZodError, ZodIssueCode } = await import("zod");
      const zodError = new ZodError([
        {
          code: ZodIssueCode.custom,
          path: ["slides", index, "file"],
          message,
        },
      ]);
      results.push({ index, valid: false, errors: zodError });
      allValid = false;
    }
  }

  return {
    valid: allValid,
    results,
  };
}
