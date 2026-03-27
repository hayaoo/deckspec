import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Theme token structure matching themes/{name}/tokens.json.
 */
export interface ThemeTokens {
  name: string;
  displayName: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    muted: string;
    "muted-foreground": string;
    border: string;
    accent: string;
    "card-background"?: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    "slide-padding": string;
    "slide-padding-x": string;
    "slide-gap": string;
  };
  borderRadius: string;
  slide: {
    width: number;
    height: number;
    aspectRatio: string;
  };
}

/**
 * Resolves the path to a theme directory relative to the project root.
 */
function themeDir(themeName: string): string {
  return join(process.cwd(), "themes", themeName);
}

/**
 * Loads and parses the tokens.json for a given theme.
 *
 * @param themeName - Theme directory name (e.g. "noir-display").
 * @returns Parsed theme tokens.
 */
export async function loadThemeTokens(
  themeName: string,
): Promise<ThemeTokens> {
  const filePath = join(themeDir(themeName), "tokens.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as ThemeTokens;
}

/**
 * Loads the raw CSS string from a theme's globals.css.
 *
 * @param themeName - Theme directory name (e.g. "noir-display").
 * @returns Raw CSS string.
 */
export async function loadThemeCSS(themeName: string): Promise<string> {
  const filePath = join(themeDir(themeName), "globals.css");
  return readFile(filePath, "utf-8");
}

/**
 * Resolves theme name → compiled patterns directory (dist/patterns/).
 * Used for importing compiled .js pattern modules.
 */
export function resolveThemePatternsDir(themeName: string): string {
  return join(themeDir(themeName), "dist", "patterns");
}

/**
 * Resolves theme name → source patterns directory (patterns/).
 * Used for reading style.css and writing new patterns (lock command).
 */
export function resolveThemePatternsSrcDir(themeName: string): string {
  return join(themeDir(themeName), "patterns");
}

/**
 * Extracts the theme name from raw parsed YAML.
 * Defaults to "noir-display" if not specified.
 */
export function extractThemeName(raw: unknown): string {
  const obj = raw as { meta?: { theme?: string } };
  return obj?.meta?.theme ?? "noir-display";
}
