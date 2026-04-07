#!/usr/bin/env node
/**
 * deck-to-pptx.mjs — Convert a DeckSpec deck.yaml to PowerPoint (.pptx)
 *
 * Usage: node scripts/deck-to-pptx.mjs decks/my-deck/deck.yaml -o output/my-deck.pptx
 *
 * Each theme pattern can provide a colocated `pptx.mjs` file that exports a
 * default render function: `export default function render(slide, vars, ctx)`.
 * The renderer is dynamically imported from `themes/<theme>/patterns/<name>/pptx.mjs`.
 */
import { readFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { load as loadYaml } from "js-yaml";
import PptxGenJS from "pptxgenjs";

// ─── Args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const inputIdx = args.findIndex((a) => !a.startsWith("-"));
const outputIdx = args.indexOf("-o");
if (inputIdx < 0 || outputIdx < 0 || !args[outputIdx + 1]) {
  console.error("Usage: node deck-to-pptx.mjs <deck.yaml> -o <output.pptx>");
  process.exit(1);
}
const inputPath = resolve(args[inputIdx]);
const outputPath = resolve(args[outputIdx + 1]);
const basePath = dirname(inputPath);

// ─── Load deck.yaml & tokens ────────────────────────────────────────
const deck = loadYaml(readFileSync(inputPath, "utf-8"));
const themeName = deck.meta?.theme ?? "noir-display";
const themeDir = resolve("themes", themeName);
const tokens = JSON.parse(readFileSync(join(themeDir, "tokens.json"), "utf-8"));

// ─── Color / Font helpers ───────────────────────────────────────────
const hex = (c) => {
  if (c.startsWith("rgba")) {
    const m = c.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (m) return [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
  }
  if (c.startsWith("rgb")) {
    const m = c.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (m) return [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
  }
  return c.replace(/^#/, "");
};
const C = {
  primary: hex(tokens.colors.primary),
  fg: hex(tokens.colors.foreground),
  bg: hex(tokens.colors.background),
  muted: hex(tokens.colors["muted-foreground"]),
  border: hex(tokens.colors.border),
  card: hex(tokens.colors["card-background"] ?? "#ffffff"),
};
const FONT_H = "Noto Sans JP";
const FONT_B = "Noto Sans JP";

// Slide inches
const W = 10;
const H = 5.625;

// px→inch (1200px = 10in)
const px = (v) => v / 120;

// ─── Image helper (local file → base64 data URI) ───────────────────
function resolveImage(filename) {
  if (!filename) return null;
  if (filename.startsWith("data:") || filename.startsWith("http")) return filename;
  const abs = resolve(basePath, filename);
  const buf = readFileSync(abs);
  const ext = filename.split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
  return `${mime};base64,${buf.toString("base64")}`;
}

/** Get image pixel dimensions via sips (macOS) */
function getImageSize(filename) {
  if (!filename || filename.startsWith("data:") || filename.startsWith("http")) return null;
  const abs = resolve(basePath, filename);
  try {
    const out = execSync(`sips -g pixelWidth -g pixelHeight "${abs}"`, { encoding: "utf-8" });
    const w = parseInt(out.match(/pixelWidth:\s*(\d+)/)?.[1] ?? "0");
    const h = parseInt(out.match(/pixelHeight:\s*(\d+)/)?.[1] ?? "0");
    return w > 0 && h > 0 ? { w, h } : null;
  } catch { return null; }
}

/** Fit image within box preserving aspect ratio, centered */
function containImage(imgW, imgH, boxW, boxH) {
  const imgRatio = imgW / imgH;
  const boxRatio = boxW / boxH;
  let w, h;
  if (imgRatio > boxRatio) {
    w = boxW;
    h = boxW / imgRatio;
  } else {
    h = boxH;
    w = boxH * imgRatio;
  }
  const x = (boxW - w) / 2;
  const y = (boxH - h) / 2;
  return { w, h, offX: x, offY: y };
}

// ─── Create presentation ────────────────────────────────────────────
const pres = new PptxGenJS();
pres.layout = "LAYOUT_16x9";
pres.title = deck.meta?.title ?? "Untitled";
pres.author = "DeckSpec";

// ─── Load shared helpers & build context ────────────────────────────
const patternsDir = join(themeDir, "patterns");
const helpersUrl = pathToFileURL(join(patternsDir, "_lib", "pptx-helpers.mjs")).href;
const helpers = await import(helpersUrl);

const ctx = {
  C, FONT_H, FONT_B, W, H, px, pres,
  resolveImage, getImageSize, containImage,
  renderLabel: helpers.renderLabel,
  renderHeading: helpers.renderHeading,
  renderHeader: helpers.renderHeader,
  renderFootnote: helpers.renderFootnote,
  renderCard: helpers.renderCard,
  renderImage: helpers.renderImage,
  resolveIcon: helpers.resolveIcon,
  ICON_MAP: helpers.ICON_MAP,
};

// ─── Dynamic pattern renderer loader ────────────────────────────────
const rendererCache = new Map();

async function loadRenderer(patternName) {
  if (rendererCache.has(patternName)) return rendererCache.get(patternName);
  const pptxPath = join(patternsDir, patternName, "pptx.mjs");
  try {
    const mod = await import(pathToFileURL(pptxPath).href);
    const fn = mod.default;
    rendererCache.set(patternName, fn);
    return fn;
  } catch (e) {
    if (e.code === "ERR_MODULE_NOT_FOUND") {
      rendererCache.set(patternName, null);
      return null;
    }
    throw e;
  }
}

// ─── Main ───────────────────────────────────────────────────────────
let rendered = 0;
for (const slideData of deck.slides) {
  const slide = pres.addSlide();
  slide.background = { color: C.bg };

  const renderer = await loadRenderer(slideData.file);
  if (!renderer) {
    console.warn(`⚠ No pptx renderer for pattern "${slideData.file}" — blank slide`);
    continue;
  }

  renderer(slide, slideData.vars ?? {}, ctx);
  rendered++;
}

console.log(`✓ Rendered ${rendered}/${deck.slides.length} slide(s)`);

mkdirSync(dirname(outputPath), { recursive: true });
await pres.writeFile({ fileName: outputPath });
console.log(`✓ Written to ${outputPath}`);
