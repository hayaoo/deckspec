import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import yaml from "js-yaml";

export interface SlideSummary {
  index: number;
  state: string;
  /** Label extracted from first <h1> or <h2> in the HTML */
  label?: string;
}

export interface DeckSummary {
  filePath: string;
  relativePath: string;
  meta: {
    title: string;
    theme: string;
    state: string;
  };
  slideCount: number;
  slideSummaries: SlideSummary[];
  approvedCount: number;
}

const HEADING_RE = /<h[12][^>]*>(.*?)<\/h[12]>/i;

function extractLabel(html: string): string | undefined {
  const match = HEADING_RE.exec(html);
  if (match) {
    // Strip any nested HTML tags from the heading content
    return match[1].replace(/<[^>]*>/g, "").trim() || undefined;
  }
  return undefined;
}

async function findDeckFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name === "deck.yaml") {
        results.push(fullPath);
      }
    }
  }

  await walk(dir);
  return results.sort();
}

/**
 * Scans a directory recursively for deck.yaml files and returns summaries.
 */
export async function scanDecks(dir: string): Promise<DeckSummary[]> {
  const files = await findDeckFiles(dir);
  const summaries: DeckSummary[] = [];

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, "utf-8");
      const raw = yaml.load(content) as {
        meta?: Record<string, unknown>;
        slides?: Array<Record<string, unknown>>;
      };

      if (!raw?.meta || !raw?.slides || !Array.isArray(raw.slides)) {
        continue;
      }

      const slideSummaries: SlideSummary[] = raw.slides.map((slide, index) => {
        const state = String(slide.state ?? "generated");
        // For file-based slides: use file name as label fallback
        const file = typeof slide.file === "string" ? slide.file : undefined;
        // Try extracting from vars (pattern slides)
        const vars = slide.vars as Record<string, unknown> | undefined;
        const varsTitle = vars?.title ?? vars?.headline;
        const label = typeof varsTitle === "string"
          ? varsTitle
          : file
            ? file.replace(/\.[^.]+$/, "").split("/").pop()
            : undefined;
        return { index, state, label };
      });

      const approvedCount = slideSummaries.filter(
        (s) => s.state === "approved" || s.state === "locked",
      ).length;

      summaries.push({
        filePath,
        relativePath: relative(dir, filePath),
        meta: {
          title: String(raw.meta.title ?? "Untitled"),
          theme: String(raw.meta.theme ?? "noir-display"),
          state: String(raw.meta.state ?? "active"),
        },
        slideCount: raw.slides.length,
        slideSummaries,
        approvedCount,
      });
    } catch {
      // Skip files that can't be parsed
    }
  }

  return summaries;
}
