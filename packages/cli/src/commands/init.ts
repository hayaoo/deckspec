import { resolve, join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mkdir,
  readdir,
  copyFile,
  writeFile,
  stat,
} from "node:fs/promises";
import { compileTsxCached } from "@deckspec/renderer";

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
        "@deckspec/cli": "^0.2.0",
        "@phosphor-icons/react": "^2.1.0",
        "lucide-react": "^1.7.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0",
        "zod": "^3.23.0",
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

interface PatternSchema {
  name: string;
  fields: Array<{ key: string; optional: boolean; description: string }>;
}

async function extractPatternSchemas(patternsDir: string, patternNames: string[]): Promise<PatternSchema[]> {
  const schemas: PatternSchema[] = [];
  for (const name of patternNames) {
    try {
      const tsxPath = join(patternsDir, name, "index.tsx");
      const compiled = await compileTsxCached(tsxPath);
      const mod = await import(compiled);
      if (mod.schema?.shape) {
        const fields = Object.entries(mod.schema.shape).map(([key, val]: [string, any]) => ({
          key,
          optional: val.isOptional?.() ?? false,
          description: val.description ?? "",
        }));
        schemas.push({ name, fields });
      } else {
        schemas.push({ name, fields: [] });
      }
    } catch {
      schemas.push({ name, fields: [] });
    }
  }
  return schemas;
}

function generateClaudeMd(theme: string, schemas: PatternSchema[]): string {
  const patternSection = schemas.map((s) => {
    if (s.fields.length === 0) return `### \`${s.name}\`\n\n(schema not available)`;
    const fields = s.fields.map((f) => {
      const opt = f.optional ? " (optional)" : "";
      return `  - \`${f.key}\`${opt}: ${f.description}`;
    }).join("\n");
    return `### \`${s.name}\`\n\n${fields}`;
  }).join("\n\n");

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

${patternSection}

Each pattern lives in \`themes/${theme}/patterns/<name>/index.tsx\` and exports:
- \`export const schema\` — Zod schema defining accepted \`vars\`
- \`export default Component\` — React component for SSR

Check each pattern's \`examples.yaml\` (if present) for usage examples.
Run \`npx deckspec patterns\` to see the latest schema definitions.
Run \`npx deckspec patterns --json\` for machine-readable output.

## Commands

\`\`\`bash
npx deckspec validate decks/sample/deck.yaml        # Validate YAML against Zod schemas
npx deckspec lint decks/sample/deck.yaml            # Evaluate deck & patterns against the theme's design rules (harness.json)
npx deckspec render decks/sample/deck.yaml -o out    # Render to standalone HTML
npx deckspec dev                                     # Live preview at http://localhost:3002
npx deckspec patterns                                # List all patterns with schemas
npx deckspec doctor                                  # Check theme health and project setup
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

**Important**: All slides are fixed at 1200×675px (16:9). Patterns must not overflow this area.
See \`themes/${theme}/design.md\` for design constraints.

## Tips

### Line Breaks in YAML Text
Use \`\\n\` in double-quoted strings for line breaks: \`"Line 1\\nLine 2"\`.
Patterns that support this split on \`\\n\` and render \`<br />\` tags.

### Auto-Injected Slide Metadata
Every pattern receives \`_slideIndex\` (0-based) and \`_slideTotal\` automatically.
Use \`props._slideIndex + 1\` for page numbers — no need to add \`page\` to vars manually.

### CSS Variable Fallbacks
Always include fallback values: \`var(--color-primary, #0071e3)\`.
This ensures patterns render correctly even if theme CSS is not loaded.

## Theme Design Reference

The theme carries its design system in two paired files — read both before touching a deck or a pattern:

| File | What it holds | Enforced by |
|------|---------------|-------------|
| \`themes/${theme}/design.md\` | Design *rationale* — principles, palette, typography, the "why" (human + AI context) | prose (read it) |
| \`themes/${theme}/harness.json\` | *Machine-readable* rules — forbidden colors, allowed font weights, min font size, shadow cap, char budgets, per-pattern usage | \`deckspec lint\` |

**AI agents must read design.md _and_ harness.json before creating or modifying patterns.**
The loop is read → obey → verify: read both files, follow them while authoring, then run \`npx deckspec lint\` after editing a deck or a pattern and fix everything it flags. \`design.md\` explains intent; \`harness.json\` is the enforceable subset — keep their values in sync if you edit either.

## Image Generation

If the theme bundles image skills (see \`.claude/skills/\`), use them instead of ad-hoc prompts so every deck shares one visual language:

- **\`deckspec-image-photo\`** — "写真を生成" / "generate a photo": clean, minimal product-style photography.
- **\`deckspec-image-diagram\`** — "図解画像を作って" / "generate a diagram": flat thin-line illustrations.

Both read \`themes/${theme}/harness.json\` → \`images\` for the provider (codex CLI or Gemini API) and the photo/diagram style recipes, write to \`decks/<deck>/assets/\`, and reference the file from \`deck.yaml\` with a relative path. **Images must contain no text** (\`noTextInImages\`) — all words live in slide \`vars\`, rendered with the brand font.

## Theme Compatibility Note

Different themes define different sets of patterns. Switching a deck's theme may require updating pattern names.
Run \`npx deckspec patterns --theme <name>\` to check available patterns in a theme.
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

  // 4. Create CLAUDE.md (with schema info extracted from patterns)
  const patternNames = await listPatternNames(join(themeDest, "patterns"));
  const schemas = await extractPatternSchemas(join(themeDest, "patterns"), patternNames);
  const claudePath = join(root, "CLAUDE.md");
  await writeFile(claudePath, generateClaudeMd(themeName, schemas));
  console.log("  Created CLAUDE.md");

  // 5. Create .gitignore
  const gitignorePath = join(root, ".gitignore");
  await writeFile(gitignorePath, generateGitignore());
  console.log("  Created .gitignore");

  // 6. Copy generic skills to .claude/skills/
  const skillsDest = join(root, ".claude", "skills");
  const skillsSrc = join(templatesDir, "skills");
  try {
    const s2 = await stat(skillsSrc);
    if (s2.isDirectory()) {
      console.log("  Copying skills to .claude/skills/");
      await copyDirRecursive(skillsSrc, skillsDest);
    }
  } catch {
    // skills template directory not found — skip silently
  }

  // 7. Copy theme-bundled skills (e.g. image generation) to .claude/skills/.
  //    The theme was copied in step 1, so its skills/ already exists at
  //    themeDest/skills/. Copying them last lets a theme override a same-named
  //    generic skill with its own visual-language-aware version.
  const themeSkillsSrc = join(themeDest, "skills");
  try {
    const s3 = await stat(themeSkillsSrc);
    if (s3.isDirectory()) {
      const themeSkillNames = (await readdir(themeSkillsSrc, { withFileTypes: true }))
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort();
      if (themeSkillNames.length > 0) {
        await copyDirRecursive(themeSkillsSrc, skillsDest);
        console.log(
          `  Copying theme skills to .claude/skills/ (${themeSkillNames.join(", ")})`,
        );
      }
    }
  } catch {
    // theme has no bundled skills — skip silently
  }

  console.log("");
  console.log("Done! Next steps:");
  console.log("");
  console.log(`  cd ${relative(process.cwd(), root) || "."}`);
  console.log("  npm install");
  console.log("  npx deckspec dev");
  console.log("");
}
