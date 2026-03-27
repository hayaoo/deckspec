import yaml from "js-yaml";
import { readFile, access } from "node:fs/promises";
import { resolve, extname } from "node:path";

/**
 * Parses a YAML string into a raw JavaScript object.
 * Does not perform any schema validation — returns the parsed value as-is.
 *
 * @throws Error with a descriptive message if YAML parsing fails.
 */
export function parseDeckYaml(yamlString: string): unknown {
  try {
    return yaml.load(yamlString);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown YAML parse error";
    throw new Error(`Failed to parse deck YAML: ${message}`);
  }
}

/**
 * Reads a deck YAML file from disk and parses it.
 *
 * @throws Error if the file cannot be read or the YAML is malformed.
 */
export async function loadDeckFile(filePath: string): Promise<unknown> {
  let content: string;
  try {
    content = await readFile(filePath, "utf-8");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown file read error";
    throw new Error(`Failed to read deck file "${filePath}": ${message}`);
  }
  return parseDeckYaml(content);
}

/**
 * Resolved slide file reference.
 */
export interface ResolvedSlideFile {
  type: "html" | "pattern";
  path: string;
  /** True when the resolved pattern is a .tsx source file (needs on-the-fly compilation) */
  tsx?: boolean;
}

/**
 * Resolves a slide `file:` value to an absolute path and type.
 *
 * Resolution priority (ADR-022):
 * 1. Deck-local pattern: {basePath}/patterns/{name}/index.tsx
 * 2. Deck-local pattern: {basePath}/patterns/{name}/index.js
 * 3. Theme pattern:      {patternsDir}/{name}/index.js (compiled)
 * 4. Theme pattern:      {patternsDir}/{name}.js (compiled, flat)
 * 5. Theme pattern:      {patternsSrcDir}/{name}/index.tsx (source, on-the-fly compile)
 *
 * Files with extensions (.html etc) are resolved relative to basePath as passthrough.
 */
export async function resolveSlideFile(
  file: string,
  basePath: string,
  patternsDir: string,
  patternsSrcDir?: string,
): Promise<ResolvedSlideFile> {
  const ext = extname(file);

  if (ext) {
    // File with extension → relative to deck directory
    const fullPath = resolve(basePath, file);
    return { type: "html", path: fullPath };
  }

  // No extension → pattern name
  // 1. Deck-local: {basePath}/patterns/{name}/index.tsx
  const localTsxPath = resolve(basePath, "patterns", file, "index.tsx");
  try {
    await access(localTsxPath);
    return { type: "pattern", path: localTsxPath, tsx: true };
  } catch {
    // continue
  }

  // 2. Deck-local: {basePath}/patterns/{name}/index.js
  const localJsPath = resolve(basePath, "patterns", file, "index.js");
  try {
    await access(localJsPath);
    return { type: "pattern", path: localJsPath };
  } catch {
    // continue
  }

  // 3. Theme: patterns/{name}/index.js (directory)
  const dirIndexPath = resolve(patternsDir, file, "index.js");
  try {
    await access(dirIndexPath);
    return { type: "pattern", path: dirIndexPath };
  } catch {
    // 4. Theme: patterns/{name}.js (flat file)
    const flatPath = resolve(patternsDir, `${file}.js`);
    try {
      await access(flatPath);
      return { type: "pattern", path: flatPath };
    } catch {
      // continue
    }
  }

  // 5. Theme source: patternsSrcDir/{name}/index.tsx (on-the-fly compile)
  if (patternsSrcDir) {
    const themeTsxPath = resolve(patternsSrcDir, file, "index.tsx");
    try {
      await access(themeTsxPath);
      return { type: "pattern", path: themeTsxPath, tsx: true };
    } catch {
      // continue
    }
  }

  throw new Error(
    `Pattern "${file}" not found. Looked in:\n  ${localTsxPath}\n  ${localJsPath}\n  ${resolve(patternsDir, file, "index.js")}\n  ${resolve(patternsDir, `${file}.js`)}${patternsSrcDir ? `\n  ${resolve(patternsSrcDir, file, "index.tsx")}` : ""}`,
  );
}
