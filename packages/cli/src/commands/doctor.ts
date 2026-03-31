import { resolve, join } from "node:path";
import { access, readdir, readFile, stat } from "node:fs/promises";

interface CheckResult {
  ok: boolean;
  label: string;
  hint?: string;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * deckspec doctor [--theme <name>]
 *
 * Checks theme health and project setup.
 */
export async function doctorCommand(args: string[]): Promise<void> {
  let themeName = "noir-display";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--theme" && args[i + 1]) {
      themeName = args[i + 1];
      i++;
    }
  }

  const root = process.cwd();
  const results: CheckResult[] = [];

  // 1. Check themes directory
  const themesDir = join(root, "themes");
  const themeDir = join(themesDir, themeName);
  if (await exists(themeDir)) {
    results.push({ ok: true, label: `Theme directory: themes/${themeName}/` });
  } else {
    results.push({
      ok: false,
      label: `Theme directory: themes/${themeName}/`,
      hint: `Run \`npx deckspec init --theme ${themeName}\` to set up the theme.`,
    });
  }

  // 2. Check tokens.json
  const tokensPath = join(themeDir, "tokens.json");
  if (await exists(tokensPath)) {
    try {
      const raw = await readFile(tokensPath, "utf-8");
      const tokens = JSON.parse(raw);
      if (tokens.slide?.width && tokens.slide?.height) {
        results.push({ ok: true, label: `tokens.json (slide: ${tokens.slide.width}x${tokens.slide.height})` });
      } else {
        results.push({ ok: false, label: "tokens.json: missing slide dimensions", hint: "Add slide.width and slide.height to tokens.json." });
      }
    } catch {
      results.push({ ok: false, label: "tokens.json: invalid JSON", hint: "Fix JSON syntax in tokens.json." });
    }
  } else {
    results.push({ ok: false, label: "tokens.json not found", hint: "Theme requires tokens.json for colors, fonts, and slide dimensions." });
  }

  // 3. Check globals.css
  if (await exists(join(themeDir, "globals.css"))) {
    results.push({ ok: true, label: "globals.css" });
  } else {
    results.push({ ok: false, label: "globals.css not found", hint: "Theme requires globals.css for base styles." });
  }

  // 4. Check design.md
  if (await exists(join(themeDir, "design.md"))) {
    results.push({ ok: true, label: "design.md" });
  } else {
    results.push({ ok: false, label: "design.md not found", hint: "Recommended: add design.md for design system documentation." });
  }

  // 5. Check patterns source directory
  const patternsSrcDir = join(themeDir, "patterns");
  if (await exists(patternsSrcDir)) {
    try {
      const entries = await readdir(patternsSrcDir);
      const patternDirs = [];
      for (const e of entries) {
        if (e.startsWith("_") || e.startsWith(".")) continue;
        const s = await stat(join(patternsSrcDir, e));
        if (s.isDirectory()) patternDirs.push(e);
      }
      results.push({ ok: true, label: `patterns/ (${patternDirs.length} patterns found)` });

      // Check each pattern has index.tsx and schema export
      for (const name of patternDirs) {
        const indexPath = join(patternsSrcDir, name, "index.tsx");
        if (!(await exists(indexPath))) {
          results.push({ ok: false, label: `  patterns/${name}/index.tsx missing`, hint: "Each pattern must have an index.tsx." });
        }
      }
    } catch {
      results.push({ ok: false, label: "patterns/ directory unreadable" });
    }
  } else {
    results.push({ ok: false, label: "patterns/ directory not found", hint: "Theme needs patterns/ directory with slide patterns." });
  }

  // 6. Check node_modules (project-level dependencies)
  const nodeModules = join(root, "node_modules");
  if (await exists(nodeModules)) {
    const deps = ["react", "react-dom", "zod"];
    for (const dep of deps) {
      if (await exists(join(nodeModules, dep))) {
        results.push({ ok: true, label: `dependency: ${dep}` });
      } else {
        results.push({ ok: false, label: `dependency: ${dep} not installed`, hint: `Run \`npm install\` to install dependencies.` });
      }
    }
  } else {
    results.push({ ok: false, label: "node_modules/ not found", hint: "Run `npm install` to install dependencies." });
  }

  // 7. Check decks directory
  const decksDir = join(root, "decks");
  if (await exists(decksDir)) {
    results.push({ ok: true, label: "decks/ directory" });
  } else {
    results.push({ ok: false, label: "decks/ directory not found", hint: "Create a decks/ directory with your presentation YAML files." });
  }

  // Print results
  console.log(`\nDeckSpec Doctor (theme: ${themeName})\n`);

  let hasIssues = false;
  for (const r of results) {
    if (r.ok) {
      console.log(`  \u2713 ${r.label}`);
    } else {
      hasIssues = true;
      console.error(`  \u2717 ${r.label}`);
      if (r.hint) {
        console.error(`    \u2192 ${r.hint}`);
      }
    }
  }

  console.log("");
  if (hasIssues) {
    console.log("Some issues were found. Fix them and run `npx deckspec doctor` again.");
    process.exit(1);
  } else {
    console.log("All checks passed!");
  }
}
