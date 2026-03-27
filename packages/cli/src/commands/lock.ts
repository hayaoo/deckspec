import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { loadDeckFile, lockSlide } from "@deckspec/dsl";
import type { Deck } from "@deckspec/schema";
import { renderSlide, extractThemeName, resolveThemePatternsDir, resolveThemePatternsSrcDir } from "@deckspec/renderer";

/**
 * Extracts text nodes from HTML as variable candidates.
 * Returns a map of variable names to their values.
 */
function extractVarsFromHtml(html: string): Record<string, string> {
  const vars: Record<string, string> = {};

  // Extract <h1> → title
  const h1Match = /<h1[^>]*>(.*?)<\/h1>/i.exec(html);
  if (h1Match) {
    vars.title = h1Match[1].replace(/<[^>]*>/g, "").trim();
  }

  // Extract <h2> → headline
  const h2Match = /<h2[^>]*>(.*?)<\/h2>/i.exec(html);
  if (h2Match) {
    vars.headline = h2Match[1].replace(/<[^>]*>/g, "").trim();
  }

  // Extract first <p> → subtitle or body
  const pMatch = /<p[^>]*>(.*?)<\/p>/i.exec(html);
  if (pMatch) {
    const text = pMatch[1].replace(/<[^>]*>/g, "").trim();
    if (vars.title && !vars.headline) {
      vars.subtitle = text;
    } else {
      vars.body = text;
    }
  }

  return vars;
}

/**
 * Generates a .tsx pattern file from HTML content and extracted vars.
 */
function generatePatternTsx(
  name: string,
  html: string,
  vars: Record<string, string>,
): string {
  const componentName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  const schemaFields = Object.entries(vars)
    .map(([key, value]) => {
      const maxLen = Math.max(value.length * 2, 60);
      return `  ${key}: z.string().min(1).max(${maxLen}).describe("${key}"),`;
    })
    .join("\n");

  // Replace literal values with JSX expressions in the HTML
  let jsxBody = html.trim();
  for (const [key, value] of Object.entries(vars)) {
    // Escape special regex characters in value
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    jsxBody = jsxBody.replace(new RegExp(`>${escaped}<`, "g"), `>{${key}}<`);
  }

  // Convert HTML attributes to JSX
  jsxBody = jsxBody.replace(/class="/g, 'className="');
  jsxBody = jsxBody.replace(/style="([^"]*)"/g, (_match, styleStr: string) => {
    const props = styleStr
      .split(";")
      .filter(Boolean)
      .map((prop: string) => {
        const [k, v] = prop.split(":").map((s: string) => s.trim());
        const camelKey = k.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
        // Try to convert numeric values
        const numVal = parseFloat(v);
        if (!isNaN(numVal) && v.endsWith("px")) {
          return `${camelKey}: ${numVal}`;
        }
        return `${camelKey}: "${v}"`;
      })
      .join(", ");
    return `style={{ ${props} }}`;
  });

  const propsDestructure = Object.keys(vars).join(", ");

  return `import { z } from "zod";

export const schema = z.object({
${schemaFields}
});

type Props = z.infer<typeof schema>;

export default function ${componentName}({ ${propsDestructure} }: Props) {
  return (
    ${jsxBody}
  );
}
`;
}

interface LockOptions {
  slideIndex: number;
  patternName: string;
}

function parseOptions(args: string[]): LockOptions {
  let slideIndex: number | undefined;
  let patternName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--slide" && args[i + 1]) {
      slideIndex = parseInt(args[i + 1], 10);
      if (Number.isNaN(slideIndex) || slideIndex < 0) {
        throw new Error(`Invalid slide index: "${args[i + 1]}"`);
      }
      i++;
    } else if (arg === "--name" && args[i + 1]) {
      patternName = args[i + 1];
      i++;
    }
  }

  if (slideIndex === undefined) {
    throw new Error("Missing --slide <index>");
  }
  if (!patternName) {
    throw new Error("Missing --name <pattern-name>");
  }

  return { slideIndex, patternName };
}

export async function lockCommand(
  filePath: string,
  extraArgs: string[],
): Promise<void> {
  const options = parseOptions(extraArgs);
  const absPath = resolve(filePath);
  const basePath = dirname(absPath);
  const raw = await loadDeckFile(absPath);
  const themeName = extractThemeName(raw);
  const patternsDir = resolveThemePatternsDir(themeName);
  const patternsSrcDir = resolveThemePatternsSrcDir(themeName);

  const deck = raw as Deck;

  if (options.slideIndex < 0 || options.slideIndex >= deck.slides.length) {
    console.error(
      `Error: Slide index ${options.slideIndex} out of range (0–${deck.slides.length - 1})`,
    );
    process.exit(1);
  }

  const slide = deck.slides[options.slideIndex];
  const currentState = slide.state ?? "generated";

  if (currentState !== "approved") {
    console.error(
      `Error: Slide ${options.slideIndex} is "${currentState}". Only "approved" slides can be locked.`,
    );
    process.exit(1);
  }

  // Render the slide to get its HTML
  const slideHtml = await renderSlide(slide, { basePath, patternsDir, patternsSrcDir });

  // Extract variables from the HTML
  const vars = extractVarsFromHtml(slideHtml);

  if (Object.keys(vars).length === 0) {
    console.error("Warning: No text variables could be extracted from the slide.");
    console.error("The pattern will be generated without variables.");
  }

  // Generate the .tsx pattern
  const tsxContent = generatePatternTsx(options.patternName, slideHtml, vars);

  // Write the pattern file to source directory
  const patternDir = join(patternsSrcDir, options.patternName);
  await mkdir(patternDir, { recursive: true });
  const patternPath = join(patternDir, "index.tsx");
  await writeFile(patternPath, tsxContent, "utf-8");
  console.log(`\u2713 Generated pattern: ${patternPath}`);

  // Update the deck YAML: rewrite the slide entry
  await lockSlide(absPath, options.slideIndex, options.patternName, vars);
  console.log(`\u2713 Locked slide ${options.slideIndex} → pattern "${options.patternName}"`);
  console.log(`\nRebuild patterns to use: pnpm build`);
}
