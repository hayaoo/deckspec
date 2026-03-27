import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { loadDeckFile, validateDeck } from "@deckspec/dsl";
import type { Deck } from "@deckspec/schema";
import { renderDeck, loadThemeCSS, extractThemeName, resolveThemePatternsDir, resolveThemePatternsSrcDir, compileTsxCached } from "@deckspec/renderer";

/**
 * Renders a deck YAML file to standalone HTML.
 * Validates the deck first, then renders via @deckspec/renderer.
 */
export async function renderCommand(
  filePath: string,
  outputPath: string,
): Promise<void> {
  const raw = await loadDeckFile(filePath);
  const basePath = dirname(resolve(filePath));
  const themeName = extractThemeName(raw);
  const patternsDir = resolveThemePatternsDir(themeName);

  // Validate first
  const result = await validateDeck(raw, { basePath, patternsDir, compileTsx: compileTsxCached });

  if (result.deckError) {
    console.error("\u2717 Deck structure is invalid:");
    for (const issue of result.deckError.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  if (!result.valid) {
    console.error("\u2717 Validation failed. Fix errors before rendering:");
    for (const slideResult of result.results) {
      if (!slideResult.valid) {
        for (const issue of slideResult.errors!.issues) {
          console.error(`  slides[${slideResult.index}]: ${issue.message}`);
        }
      }
    }
    process.exit(1);
  }

  const deck = raw as Deck;
  const themeCSS = await loadThemeCSS(deck.meta.theme);
  const patternsSrcDir = resolveThemePatternsSrcDir(themeName);
  const html = await renderDeck(deck, themeCSS, { basePath, patternsDir, patternsSrcDir });

  await writeFile(outputPath, html, "utf-8");
  console.log(`\u2713 Rendered ${result.results.length} slide(s) to ${outputPath}`);
}
