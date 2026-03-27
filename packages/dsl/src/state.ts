import yaml from "js-yaml";
import { readFile, writeFile } from "node:fs/promises";
import type { SlideState, DeckLifecycle } from "@deckspec/schema";

/**
 * Valid slide state transitions.
 * Only these transitions are allowed:
 *   generated → approved
 *   derived   → approved
 *   approved  → locked
 */
const VALID_SLIDE_TRANSITIONS: Record<string, SlideState[]> = {
  generated: ["approved"],
  derived: ["approved"],
  approved: ["locked"],
  locked: [],
};

interface RawDeck {
  meta: { state?: string; [key: string]: unknown };
  slides: Array<{ state?: string; [key: string]: unknown }>;
}

async function loadRawYaml(filePath: string): Promise<{ raw: RawDeck; content: string }> {
  const content = await readFile(filePath, "utf-8");
  const raw = yaml.load(content) as RawDeck;
  if (!raw?.slides || !Array.isArray(raw.slides)) {
    throw new Error(`Invalid deck file: ${filePath}`);
  }
  return { raw, content };
}

async function saveYaml(filePath: string, data: RawDeck): Promise<void> {
  const output = yaml.dump(data, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
  await writeFile(filePath, output, "utf-8");
}

function validateSlideTransition(from: SlideState, to: SlideState): void {
  const allowed = VALID_SLIDE_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new Error(
      `Invalid state transition: "${from}" → "${to}". Allowed from "${from}": [${(allowed ?? []).join(", ")}]`,
    );
  }
}

/**
 * Approve a slide — sets its state to "approved".
 */
export async function approveSlide(
  filePath: string,
  slideIndex: number,
): Promise<void> {
  const { raw } = await loadRawYaml(filePath);
  if (slideIndex < 0 || slideIndex >= raw.slides.length) {
    throw new Error(
      `Slide index ${slideIndex} out of range (0–${raw.slides.length - 1})`,
    );
  }
  const current = (raw.slides[slideIndex].state ?? "generated") as SlideState;
  validateSlideTransition(current, "approved");
  raw.slides[slideIndex].state = "approved";
  await saveYaml(filePath, raw);
}

/**
 * Reject a slide — resets its state to "generated".
 * Only allowed from "approved" state.
 */
export async function rejectSlide(
  filePath: string,
  slideIndex: number,
): Promise<void> {
  const { raw } = await loadRawYaml(filePath);
  if (slideIndex < 0 || slideIndex >= raw.slides.length) {
    throw new Error(
      `Slide index ${slideIndex} out of range (0–${raw.slides.length - 1})`,
    );
  }
  const current = (raw.slides[slideIndex].state ?? "generated") as SlideState;
  if (current !== "approved") {
    throw new Error(
      `Cannot reject slide in "${current}" state. Only "approved" slides can be rejected.`,
    );
  }
  raw.slides[slideIndex].state = "generated";
  await saveYaml(filePath, raw);
}

/**
 * Archive a deck — sets meta.state to "archived".
 */
export async function archiveDeck(filePath: string): Promise<void> {
  const { raw } = await loadRawYaml(filePath);
  const current = (raw.meta.state ?? "active") as DeckLifecycle;
  if (current === "archived") {
    throw new Error("Deck is already archived.");
  }
  raw.meta.state = "archived";
  await saveYaml(filePath, raw);
}

/**
 * Activate a deck — sets meta.state to "active".
 */
export async function activateDeck(filePath: string): Promise<void> {
  const { raw } = await loadRawYaml(filePath);
  const current = (raw.meta.state ?? "active") as DeckLifecycle;
  if (current === "active") {
    throw new Error("Deck is already active.");
  }
  raw.meta.state = "active";
  await saveYaml(filePath, raw);
}

/**
 * Lock a slide — sets state to "locked" and rewrites it as a pattern reference.
 * The slide must be in "approved" state.
 *
 * @param filePath - Path to the deck YAML file.
 * @param slideIndex - Zero-based index of the slide to lock.
 * @param patternName - Name for the new pattern.
 * @param vars - Variables extracted from the slide.
 */
export async function lockSlide(
  filePath: string,
  slideIndex: number,
  patternName: string,
  vars: Record<string, unknown>,
): Promise<void> {
  const { raw } = await loadRawYaml(filePath);
  if (slideIndex < 0 || slideIndex >= raw.slides.length) {
    throw new Error(
      `Slide index ${slideIndex} out of range (0–${raw.slides.length - 1})`,
    );
  }
  const current = (raw.slides[slideIndex].state ?? "generated") as SlideState;
  validateSlideTransition(current, "locked");

  // Rewrite the slide entry
  raw.slides[slideIndex] = {
    file: patternName,
    state: "locked",
    vars,
  };

  await saveYaml(filePath, raw);
}
