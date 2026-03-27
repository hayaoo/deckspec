import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Slide } from "@deckspec/schema";
import { resolveSlideFile } from "@deckspec/dsl";
import { resolveAssets } from "./resolve-assets.js";
import { compileTsxCached } from "./compile-tsx.js";

export interface RenderSlideContext {
  basePath: string;
  patternsDir: string;
  patternsSrcDir?: string;
}

/**
 * Renders a single slide to HTML string.
 *
 * - .html files: reads and returns content as-is (passthrough)
 * - Pattern names: imports compiled module, validates vars with schema, SSR renders
 * - .tsx patterns (deck-local): compiled on-the-fly via esbuild before import
 */
export async function renderSlide(
  slide: Slide,
  context: RenderSlideContext,
): Promise<string> {
  const resolved = await resolveSlideFile(
    slide.file,
    context.basePath,
    context.patternsDir,
    context.patternsSrcDir,
  );

  if (resolved.type === "html") {
    return readFile(resolved.path, "utf-8");
  }

  // Pattern: import compiled module, validate vars, SSR
  let modulePath = resolved.path;
  if (resolved.tsx) {
    modulePath = await compileTsxCached(resolved.path);
  }

  const mod = await import(modulePath);
  let vars = slide.vars ?? {};
  if (mod.assets && Array.isArray(mod.assets)) {
    vars = await resolveAssets(vars, mod.assets, context.basePath);
  }
  const validated = mod.schema ? mod.schema.parse(vars) : vars;
  return renderToStaticMarkup(createElement(mod.default, validated));
}
