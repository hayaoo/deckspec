import { z } from "zod";

/**
 * Extracts `.describe()` metadata from each field of a ZodObject schema
 * into a plain record. Useful for generating documentation or AI prompts
 * from schema definitions.
 *
 * Fields without a description are omitted from the result.
 *
 * @example
 * ```ts
 * const descriptions = describeSchema(baseSlideSchema);
 * // { html: 'Freeform HTML content for the slide', ... }
 * ```
 */
export function describeSchema(
  schema: z.ZodObject<z.ZodRawShape>,
): Record<string, string> {
  const shape = schema.shape;
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(shape)) {
    const description = (value as z.ZodTypeAny).description;
    if (description) {
      result[key] = description;
    }
  }

  return result;
}
