import { resolve, dirname } from "node:path";
import { loadDeckFile, validateDeck } from "@deckspec/dsl";
import { extractThemeName, resolveThemePatternsDir, compileTsxCached } from "@deckspec/renderer";

/**
 * Validates a deck YAML file.
 * Prints per-slide results to stdout and exits with code 1 if any errors.
 */
export async function validateCommand(filePath: string): Promise<void> {
  const raw = await loadDeckFile(filePath);
  const basePath = dirname(resolve(filePath));
  const themeName = extractThemeName(raw);
  const patternsDir = resolveThemePatternsDir(themeName);

  const result = await validateDeck(raw, { basePath, patternsDir, compileTsx: compileTsxCached });

  if (result.deckError) {
    console.error("\u2717 Deck structure is invalid:");
    for (const issue of result.deckError.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  for (const slideResult of result.results) {
    if (slideResult.valid) {
      console.log(`\u2713 slides[${slideResult.index}]: valid`);
    } else {
      for (const issue of slideResult.errors!.issues) {
        const detail = issue.message;
        console.error(`\u2717 slides[${slideResult.index}]: ${detail}`);
      }
    }
  }

  if (!result.valid) {
    process.exit(1);
  }

  console.log(`\nAll ${result.results.length} slide(s) passed validation.`);
}
