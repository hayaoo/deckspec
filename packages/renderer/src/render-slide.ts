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
  /** When true, bust Node.js ESM import cache for pre-compiled JS modules (used by dev server) */
  bustCache?: boolean;
  /** Auto-injected slide index (0-based) */
  slideIndex?: number;
  /** Auto-injected total slide count */
  slideTotal?: number;
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

  // Bust Node.js ESM cache for pre-compiled JS by appending a query string
  const importUrl = (!resolved.tsx && context.bustCache)
    ? `${modulePath}?t=${Date.now()}`
    : modulePath;
  const mod = await import(importUrl);

  let vars = slide.vars ?? {};
  if (mod.assets && Array.isArray(mod.assets)) {
    vars = await resolveAssets(vars, mod.assets, context.basePath);
  }
  const validated = mod.schema ? mod.schema.parse(vars) : vars;

  // Inject slide metadata after validation (no schema change needed)
  const propsWithMeta = {
    ...validated,
    _slideIndex: context.slideIndex ?? 0,
    _slideTotal: context.slideTotal ?? 1,
  };

  return renderToStaticMarkup(createElement(mod.default, propsWithMeta));
}
