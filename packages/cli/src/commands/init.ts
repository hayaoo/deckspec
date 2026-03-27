import { resolve, join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mkdir,
  readdir,
  copyFile,
  writeFile,
  stat,
} from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Directories to skip when copying a theme. */
const SKIP_DIRS = new Set(["dist", "node_modules", ".turbo"]);

/**
 * Recursively copy a directory, skipping entries in SKIP_DIRS.
 */
async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await copyDirRecursive(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

/**
 * List pattern directory names under a theme's patterns/ folder.
 * Excludes _lib and index.ts; returns only directories.
 */
async function listPatternNames(patternsDir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(patternsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort();
}

/**
 * Resolve the templates directory bundled with the CLI package.
 * Works both in dev (src/commands/) and installed (dist/commands/).
 *
 * __dirname is packages/cli/dist/commands or packages/cli/src/commands
 * Go up 2 levels to packages/cli/, then into templates/
 */
function resolveTemplatesDir(): string {
  return resolve(__dirname, "..", "..", "templates");
}

function generateSampleDeck(theme: string): string {
  return `meta:
  title: "My Presentation"
  theme: ${theme}
  state: active
slides:
  - file: title-center
    vars:
      title: "Welcome"
      subtitle: "A presentation built with DeckSpec"

  - file: feature-metrics
    vars:
      headline: "Key Numbers"
      metrics:
        - label: "Slides"
          value: "3"
        - label: "Patterns"
          value: "17+"
        - label: "Build Steps"
          value: "0"

  - file: three-pillars
    vars:
      label: "How It Works"
      heading: "Three Simple Steps"
      pillars:
        - title: "Write"
          value: "YAML"
          description: "Define your content in a simple, structured format."
        - title: "Validate"
          value: "Zod"
          description: "Schemas catch mistakes before you ever see the output."
        - title: "Render"
          value: "HTML"
          description: "Patterns produce standalone HTML — no dependencies."
`;
}

function generatePackageJson(): string {
  return JSON.stringify(
    {
      private: true,
      type: "module",
      dependencies: {
        "@deckspec/cli": "^0.1.0",
      },
    },
    null,
    2,
  ) + "\n";
}

function generateGitignore(): string {
  return `node_modules/
dist/
output/
tmp/
*.tsbuildinfo
`;
}

function generateClaudeMd(theme: string, patterns: string[]): string {
  const patternList = patterns.map((p) => `- \`${p}\``).join("\n");

  return `# DeckSpec Project

Programmable presentations. YAML で書く。Zod で守る。React で描く。

## YAML DSL Spec

A deck is defined by a single \`deck.yaml\` file:

\`\`\`yaml
meta:
  title: "Presentation Title"
  theme: ${theme}
  state: active          # active | archived
slides:
  - file: pattern-name   # pattern from themes/${theme}/patterns/
    vars:
      key: "value"       # content injected into the pattern
\`\`\`

### Slide Fields

| Field | Required | Description |
|-------|----------|-------------|
| \`file\` | yes | Pattern name (resolved from theme) or relative path |
| \`vars\` | yes | Content variables — validated by the pattern's Zod schema |
| \`state\` | no | \`generated\` (default) / \`approved\` / \`locked\` |

## Available Patterns (theme: ${theme})

${patternList}

Each pattern lives in \`themes/${theme}/patterns/<name>/index.tsx\` and exports:
- \`export const schema\` — Zod schema defining accepted \`vars\`
- \`export default Component\` — React component for SSR

Check each pattern's \`examples.yaml\` (if present) for usage examples.

## Commands

\`\`\`bash
npx deckspec validate decks/sample/deck.yaml        # Validate YAML against Zod schemas
npx deckspec render decks/sample/deck.yaml -o out    # Render to standalone HTML
npx deckspec dev                                     # Live preview at http://localhost:3002
npx deckspec patterns                                # List all patterns with schemas
\`\`\`

## Creating a New Slide

1. Pick a pattern from the list above
2. Add a slide entry to \`deck.yaml\` with \`file:\` and \`vars:\`
3. Run \`npx deckspec validate\` to check your YAML
4. Run \`npx deckspec dev\` to preview

## Creating a Deck-Local Pattern

If no existing pattern fits, create a custom one:

1. Create \`decks/<deck>/patterns/<name>/index.tsx\`
2. Export \`schema\` (Zod) and \`default\` (React component)
3. Reference it in \`deck.yaml\` with \`file: <name>\`
4. Deck-local patterns are compiled on-the-fly with esbuild — no build step needed

## Theme Design Reference

See \`themes/${theme}/design.md\` for the theme's design principles, color palette, and typography rules.
`;
}

/**
 * deckspec init [dir] --theme <name>
 */
export async function initCommand(args: string[]): Promise<void> {
  // Parse arguments
  let targetDir = ".";
  let themeName = "noir-display";

  const themeIdx = args.indexOf("--theme");
  if (themeIdx !== -1) {
    const val = args[themeIdx + 1];
    if (!val) {
      console.error("Error: --theme requires a value.");
      process.exit(1);
    }
    themeName = val;
  }

  // First positional arg (not a flag) is the target directory
  for (const arg of args) {
    if (arg === "--theme") break;
    if (!arg.startsWith("-")) {
      targetDir = arg;
      break;
    }
  }

  const root = resolve(targetDir);
  const templatesDir = resolveTemplatesDir();
  const themeSrc = join(templatesDir, themeName);

  // Verify theme exists
  try {
    const s = await stat(themeSrc);
    if (!s.isDirectory()) throw new Error();
  } catch {
    console.error(`Error: Theme "${themeName}" not found at ${themeSrc}`);
    process.exit(1);
  }

  console.log(`Initializing DeckSpec project in ${root}`);
  console.log(`  Theme: ${themeName}`);

  // 1. Copy theme
  const themeDest = join(root, "themes", themeName);
  console.log(`  Copying theme to themes/${themeName}/`);
  await copyDirRecursive(themeSrc, themeDest);

  // 2. Create sample deck
  const deckDir = join(root, "decks", "sample");
  await mkdir(deckDir, { recursive: true });
  const deckPath = join(deckDir, "deck.yaml");
  await writeFile(deckPath, generateSampleDeck(themeName));
  console.log("  Created decks/sample/deck.yaml");

  // 3. Create package.json
  const pkgPath = join(root, "package.json");
  await writeFile(pkgPath, generatePackageJson());
  console.log("  Created package.json");

  // 4. Create CLAUDE.md
  const patterns = await listPatternNames(join(themeDest, "patterns"));
  const claudePath = join(root, "CLAUDE.md");
  await writeFile(claudePath, generateClaudeMd(themeName, patterns));
  console.log("  Created CLAUDE.md");

  // 5. Create .gitignore
  const gitignorePath = join(root, ".gitignore");
  await writeFile(gitignorePath, generateGitignore());
  console.log("  Created .gitignore");

  console.log("");
  console.log("Done! Next steps:");
  console.log("");
  console.log(`  cd ${relative(process.cwd(), root) || "."}`);
  console.log("  npm install");
  console.log("  npx deckspec dev");
  console.log("");
}
