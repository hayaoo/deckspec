import { resolve, dirname } from "node:path";
import { access } from "node:fs/promises";
import { loadDeckFile, validateDeck } from "@deckspec/dsl";
import { extractThemeName, resolveThemePatternsDir, resolveThemePatternsSrcDir, compileTsxCached } from "@deckspec/renderer";

/**
 * Check theme health before validation.
 * Warns about missing theme files and provides recovery hints.
 */
async function checkThemeHealth(themeName: string): Promise<void> {
  const themeDir = resolve(process.cwd(), "themes", themeName);
  const issues: string[] = [];

  try {
    await access(themeDir);
  } catch {
    console.error(`\u2717 Theme "${themeName}" not found at ${themeDir}`);
    console.error(`  Hint: Run \`npx deckspec init --theme ${themeName}\` to set up the theme.`);
    process.exit(1);
  }

  try {
    await access(resolve(themeDir, "tokens.json"));
  } catch {
    issues.push(`  - tokens.json not found. Theme may be incomplete.`);
  }

  try {
    await access(resolve(themeDir, "globals.css"));
  } catch {
    issues.push(`  - globals.css not found. Theme styles will be missing.`);
  }

  const patternsDir = resolve(themeDir, "dist", "patterns");
  const patternsSrcDir = resolve(themeDir, "patterns");
  let hasDistPatterns = false;
  let hasSrcPatterns = false;

  try { await access(patternsDir); hasDistPatterns = true; } catch {}
  try { await access(patternsSrcDir); hasSrcPatterns = true; } catch {}

  if (!hasDistPatterns && !hasSrcPatterns) {
    issues.push(`  - No patterns directory found (neither dist/patterns/ nor patterns/).`);
  } else if (!hasDistPatterns && hasSrcPatterns) {
    issues.push(`  - dist/patterns/ not found. Using source .tsx files (on-the-fly compilation).`);
  }

  if (issues.length > 0) {
    console.warn(`\u26A0 Theme "${themeName}" health check:`);
    for (const issue of issues) {
      console.warn(issue);
    }
    console.warn("");
  }
}

/**
 * Validates a deck YAML file.
 * Prints per-slide results to stdout and exits with code 1 if any errors.
 */
export async function validateCommand(filePath: string): Promise<void> {
  const raw = await loadDeckFile(filePath);
  const basePath = dirname(resolve(filePath));
  const themeName = extractThemeName(raw);

  await checkThemeHealth(themeName);

  const patternsDir = resolveThemePatternsDir(themeName);
  const patternsSrcDir = resolveThemePatternsSrcDir(themeName);

  const result = await validateDeck(raw, { basePath, patternsDir, patternsSrcDir, compileTsx: compileTsxCached });

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
        const path = issue.path.length > 0 ? issue.path.join(".") : "";
        const expected = "expected" in issue ? ` (expected: ${(issue as any).expected})` : "";
        const detail = path ? `${path}: ${issue.message}${expected}` : `${issue.message}${expected}`;
        console.error(`\u2717 slides[${slideResult.index}]: ${detail}`);
      }
    }
  }

  if (!result.valid) {
    process.exit(1);
  }

  console.log(`\nAll ${result.results.length} slide(s) passed validation.`);
}
