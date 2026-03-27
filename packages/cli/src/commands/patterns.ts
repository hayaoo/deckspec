import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { resolveThemePatternsDir, resolveThemePatternsSrcDir } from "@deckspec/renderer";
import yaml from "js-yaml";

/**
 * Lists available patterns with their schema definitions.
 * --examples flag shows example vars from examples.yaml.
 */
export async function patternsCommand(args: string[]): Promise<void> {
  let themeName = "noir-display";
  let showExamples = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--theme" && args[i + 1]) {
      themeName = args[i + 1];
      i++;
    }
    if (args[i] === "--examples") {
      showExamples = true;
    }
  }

  const patternsDir = resolveThemePatternsDir(themeName);
  const patternsSrcDir = resolveThemePatternsSrcDir(themeName);

  let entries: string[];
  try {
    entries = await readdir(patternsDir);
  } catch {
    console.log(`No patterns found for theme "${themeName}".`);
    return;
  }

  // Filter to directories that look like pattern names
  const patternNames: string[] = [];
  for (const name of entries) {
    if (name.startsWith(".") || name.startsWith("_") || name === "node_modules" || name === "dist") continue;
    try {
      const s = await stat(join(patternsDir, name));
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
  console.log(`Available patterns (theme: ${themeName}):\n`);

  for (const name of patternNames) {
    const indexPath = join(patternsDir, name, "index.js");
    try {
      const mod = await import(indexPath);

      // Check for examples.yaml
      let hasExamples = false;
      let examples: Array<{ name: string; description?: string; vars: unknown }> = [];
      try {
        const examplesPath = join(patternsSrcDir, name, "examples.yaml");
        const examplesContent = await readFile(examplesPath, "utf-8");
        examples = yaml.load(examplesContent) as typeof examples;
        hasExamples = true;
      } catch {
        // no examples
      }

      if (mod.schema) {
        const shape = mod.schema.shape;
        const fields = Object.entries(shape)
          .map(([key, val]: [string, any]) => {
            const desc = val.description ?? "";
            const optional = val.isOptional?.() ? "?" : "";
            return `    ${key}${optional}: ${desc}`;
          })
          .join("\n");
        const badge = hasExamples ? " [examples]" : "";
        console.log(`  ${name}:${badge}`);
        console.log(fields);
      } else {
        console.log(`  ${name}: (no schema)`);
      }

      // Show examples if requested
      if (showExamples && examples.length > 0) {
        console.log(`    --- examples ---`);
        for (const ex of examples) {
          console.log(`    "${ex.name}"${ex.description ? ` — ${ex.description}` : ""}`);
        }
      }
    } catch {
      console.log(`  ${name}: (not compiled — run pnpm build)`);
    }
    console.log();
  }
}
