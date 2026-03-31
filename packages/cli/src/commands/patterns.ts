import { readdir, readFile, stat, access } from "node:fs/promises";
import { join } from "node:path";
import { resolveThemePatternsDir, resolveThemePatternsSrcDir, compileTsxCached } from "@deckspec/renderer";
import yaml from "js-yaml";

/**
 * Lists available patterns with their schema definitions.
 * --examples flag shows example vars from examples.yaml.
 */
export async function patternsCommand(args: string[]): Promise<void> {
  let themeName = "noir-display";
  let showExamples = false;
  let jsonOutput = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--theme" && args[i + 1]) {
      themeName = args[i + 1];
      i++;
    }
    if (args[i] === "--examples") {
      showExamples = true;
    }
    if (args[i] === "--json") {
      jsonOutput = true;
    }
  }

  const patternsDir = resolveThemePatternsDir(themeName);
  const patternsSrcDir = resolveThemePatternsSrcDir(themeName);

  // Try dist/patterns/ first, fall back to patterns/ (source)
  let scanDir: string;
  let usingSrc = false;
  try {
    await access(patternsDir);
    scanDir = patternsDir;
  } catch {
    try {
      await access(patternsSrcDir);
      scanDir = patternsSrcDir;
      usingSrc = true;
    } catch {
      console.log(`No patterns found for theme "${themeName}".`);
      return;
    }
  }

  let entries: string[];
  try {
    entries = await readdir(scanDir);
  } catch {
    console.log(`No patterns found for theme "${themeName}".`);
    return;
  }

  // Filter to directories that look like pattern names
  const patternNames: string[] = [];
  for (const name of entries) {
    if (name.startsWith(".") || name.startsWith("_") || name === "node_modules" || name === "dist") continue;
    try {
      const s = await stat(join(scanDir, name));
      if (s.isDirectory()) patternNames.push(name);
    } catch {
      // skip
    }
  }

  if (patternNames.length === 0) {
    console.log(`No patterns found for theme "${themeName}".`);
    return;
  }

  patternNames.sort();

  // Collect pattern data
  const patternData: Array<{
    name: string;
    fields: Array<{ key: string; optional: boolean; description: string }>;
    examples: Array<{ name: string; description?: string; vars: unknown }>;
  }> = [];

  for (const name of patternNames) {
    try {
      let mod: any;
      if (usingSrc) {
        // Compile .tsx on-the-fly
        const tsxPath = join(patternsSrcDir, name, "index.tsx");
        const compiled = await compileTsxCached(tsxPath);
        mod = await import(compiled);
      } else {
        const indexPath = join(patternsDir, name, "index.js");
        mod = await import(indexPath);
      }

      // Check for examples.yaml
      let examples: Array<{ name: string; description?: string; vars: unknown }> = [];
      try {
        const examplesPath = join(patternsSrcDir, name, "examples.yaml");
        const examplesContent = await readFile(examplesPath, "utf-8");
        examples = yaml.load(examplesContent) as typeof examples;
      } catch {
        // no examples
      }

      const fields: Array<{ key: string; optional: boolean; description: string }> = [];
      if (mod.schema?.shape) {
        for (const [key, val] of Object.entries(mod.schema.shape) as Array<[string, any]>) {
          fields.push({
            key,
            optional: val.isOptional?.() ?? false,
            description: val.description ?? "",
          });
        }
      }

      patternData.push({ name, fields, examples });
    } catch {
      patternData.push({ name, fields: [], examples: [] });
    }
  }

  // JSON output mode
  if (jsonOutput) {
    console.log(JSON.stringify({ theme: themeName, patterns: patternData }, null, 2));
    return;
  }

  // Human-readable output
  console.log(`Available patterns (theme: ${themeName}):\n`);

  for (const pattern of patternData) {
    const hasExamplesFlag = pattern.examples.length > 0;

    if (pattern.fields.length > 0) {
      const fields = pattern.fields
        .map((f) => {
          const optional = f.optional ? "?" : "";
          return `    ${f.key}${optional}: ${f.description}`;
        })
        .join("\n");
      const badge = hasExamplesFlag ? " [examples]" : "";
      console.log(`  ${pattern.name}:${badge}`);
      console.log(fields);
    } else {
      console.log(`  ${pattern.name}: (no schema)`);
    }

    // Show examples if requested
    if (showExamples && pattern.examples.length > 0) {
      console.log(`    --- examples ---`);
      for (const ex of pattern.examples) {
        console.log(`    "${ex.name}"${ex.description ? ` — ${ex.description}` : ""}`);
      }
    }
    console.log();
  }
}
