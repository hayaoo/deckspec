#!/usr/bin/env node
/**
 * deck-to-pptx.mjs — Convert a DeckSpec deck.yaml to PowerPoint (.pptx)
 *
 * Usage: node .claude/skills/deckspec-to-pptx/deck-to-pptx.mjs decks/my-deck/deck.yaml -o output/my-deck.pptx
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { execSync } from "node:child_process";
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
const hex = (c) => c.replace(/^#/, "");
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

// ─── Icon color map ─────────────────────────────────────────────────
const iconColors = { good: "2563EB", bad: C.primary, warn: "D97706" };
const iconSymbol = { good: "●", bad: "✕", warn: "▲" };

// ─── Create presentation ────────────────────────────────────────────
const pres = new PptxGenJS();
pres.layout = "LAYOUT_16x9";
pres.title = deck.meta?.title ?? "Untitled";
pres.author = "DeckSpec";

// ─── Slide renderers ────────────────────────────────────────────────

function renderPriceBeforeAfter(slide, vars) {
  const padX = px(64);
  const padY = px(48);

  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  slide.addText(vars.heading, {
    x: padX, y: padY + 0.25, w: W - 2 * padX, h: 0.35,
    fontSize: 18, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0,
  });

  const items = vars.items;
  const cardTop = padY + 0.85;
  const cardBot = H - padY - (vars.footnote ? 0.35 : 0);
  const cardH = cardBot - cardTop;
  const gap = px(1);
  const cardW = (W - 2 * padX - gap * (items.length - 1)) / items.length;

  items.forEach((item, i) => {
    const cx = padX + i * (cardW + gap);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: cardTop, w: cardW, h: cardH, fill: { color: C.card },
    });
    slide.addText(item.name, {
      x: cx, y: cardTop + px(32), w: cardW, h: 0.35,
      fontSize: 15, fontFace: FONT_H, bold: true, color: C.fg, align: "center", margin: 0,
    });
    const priceY = cardTop + cardH * 0.35;
    slide.addText("BEFORE", {
      x: cx, y: priceY, w: cardW * 0.38, h: 0.18,
      fontSize: 8, fontFace: FONT_B, bold: true, color: C.muted, align: "center", charSpacing: 1, margin: 0,
    });
    slide.addText(item.before, {
      x: cx, y: priceY + 0.18, w: cardW * 0.38, h: 0.35,
      fontSize: 20, fontFace: FONT_H, bold: true, color: C.muted, align: "center", strike: true, margin: 0,
    });
    slide.addText("→", {
      x: cx + cardW * 0.38, y: priceY + 0.12, w: cardW * 0.24, h: 0.35,
      fontSize: 22, color: C.primary, align: "center", margin: 0,
    });
    slide.addText("AFTER", {
      x: cx + cardW * 0.62, y: priceY, w: cardW * 0.38, h: 0.18,
      fontSize: 8, fontFace: FONT_B, bold: true, color: C.primary, align: "center", charSpacing: 1, margin: 0,
    });
    slide.addText(item.after, {
      x: cx + cardW * 0.62, y: priceY + 0.18, w: cardW * 0.38, h: 0.35,
      fontSize: 26, fontFace: FONT_H, bold: true, color: C.fg, align: "center", margin: 0,
    });
    if (item.note) {
      slide.addText(item.note, {
        x: cx + px(8), y: cardTop + cardH - px(48), w: cardW - px(16), h: 0.3,
        fontSize: 9, fontFace: FONT_B, color: C.muted, align: "center", margin: 0,
      });
    }
  });

  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - padY - 0.25, w: W - 2 * padX, h: 0.25,
      fontSize: 9, fontFace: FONT_B, color: C.muted, align: "center", margin: 0,
    });
  }
}

function renderComparisonTable(slide, vars) {
  const padX = px(64);
  const padY = px(40);

  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  slide.addText(vars.heading, {
    x: padX, y: padY + 0.22, w: W - 2 * padX, h: 0.35,
    fontSize: 16, fontFace: FONT_H, bold: true, color: C.fg, margin: 0,
  });

  const colCount = vars.columns.length;
  const rowLabelW = 1.5;
  const dataW = (W - 2 * padX - rowLabelW) / colCount;
  const colWidths = [rowLabelW, ...Array(colCount).fill(dataW)];
  const badgeColor = { red: C.primary, blue: "2563EB", green: "16A34A" };
  const tableRows = [];

  const headerRow = [{ text: "", options: { fill: { color: C.fg }, color: C.card } }];
  vars.columns.forEach((col) => {
    const cellText = [
      { text: col.name, options: { bold: true, fontSize: 12, color: "FFFFFF", breakLine: true } },
    ];
    if (col.status) {
      cellText.push({
        text: ` ${col.status}`,
        options: { fontSize: 8, bold: true, color: "FFFFFF", highlight: badgeColor[col.statusColor ?? "red"] },
      });
    }
    headerRow.push({ text: cellText, options: { fill: { color: C.fg }, color: "FFFFFF", valign: "middle" } });
  });
  tableRows.push(headerRow);

  vars.rows.forEach((rowLabel, ri) => {
    const rowBg = ri % 2 === 0 ? C.card : C.bg;
    const row = [{
      text: rowLabel,
      options: { fontSize: 9, bold: true, color: C.muted, fill: { color: rowBg }, valign: "middle" },
    }];
    vars.columns.forEach((col) => {
      const cell = col.values[ri];
      const isObj = cell != null && typeof cell === "object";
      const text = isObj ? cell.text : (cell ?? "—");
      const icon = isObj ? cell.icon : undefined;
      const cellContent = [];
      if (icon) {
        cellContent.push({ text: iconSymbol[icon] + " ", options: { color: iconColors[icon], fontSize: 9, bold: true } });
      }
      cellContent.push({ text, options: { fontSize: 10, color: C.fg } });
      row.push({ text: cellContent, options: { fill: { color: rowBg }, valign: "middle" } });
    });
    tableRows.push(row);
  });

  const tableY = padY + 0.75;
  const tableH = H - tableY - (vars.footnote ? px(44) : px(32));

  slide.addTable(tableRows, {
    x: padX, y: tableY, w: W - 2 * padX, h: tableH,
    colW: colWidths,
    border: { type: "solid", pt: 0.5, color: C.border },
    rowH: [0.42, ...Array(vars.rows.length).fill((tableH - 0.42) / vars.rows.length)],
    margin: [4, 8, 4, 8],
    autoPage: false,
  });

  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - px(36), w: W - 2 * padX, h: 0.25,
      fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }
}

function renderImageFull(slide, vars) {
  const padX = px(48);
  const padY = px(32);

  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  slide.addText(vars.heading, {
    x: padX, y: padY + 0.22, w: W - 2 * padX, h: 0.32,
    fontSize: 16, fontFace: FONT_H, bold: true, color: C.fg, margin: 0,
  });

  let imgTop = padY + 0.6;
  if (vars.subtitle) {
    slide.addText(vars.subtitle, {
      x: padX, y: padY + 0.56, w: W - 2 * padX, h: 0.22,
      fontSize: 10, fontFace: FONT_B, color: C.muted, margin: 0,
    });
    imgTop = padY + 0.82;
  }

  const imgData = resolveImage(vars.image);
  if (imgData) {
    const imgBot = H - padY - (vars.footnote ? 0.3 : 0);
    const boxH = imgBot - imgTop;
    const boxW = W - 2 * padX;
    const size = getImageSize(vars.image);
    if (size) {
      const fit = containImage(size.w, size.h, boxW, boxH);
      slide.addImage({ data: imgData, x: padX + fit.offX, y: imgTop + fit.offY, w: fit.w, h: fit.h });
    } else {
      slide.addImage({ data: imgData, x: padX, y: imgTop, w: boxW, h: boxH });
    }
  }

  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - padY - 0.22, w: W - 2 * padX, h: 0.22,
      fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }
}

function renderConclusionSummary(slide, vars) {
  const padX = px(64);

  const logoData = resolveImage(vars.logo);
  if (logoData) {
    const logoBoxW = 2.5;
    const logoBoxH = 0.7;
    const logoSize = getImageSize(vars.logo);
    if (logoSize) {
      const fit = containImage(logoSize.w, logoSize.h, logoBoxW, logoBoxH);
      slide.addImage({ data: logoData, x: (W - logoBoxW) / 2 + fit.offX, y: 0.5 + fit.offY, w: fit.w, h: fit.h });
    } else {
      slide.addImage({ data: logoData, x: (W - logoBoxW) / 2, y: 0.5, w: logoBoxW, h: logoBoxH });
    }
  }

  slide.addText(vars.heading, {
    x: padX, y: 1.35, w: W - 2 * padX, h: 0.45,
    fontSize: 16, fontFace: FONT_H, bold: true, color: C.fg, align: "center", margin: 0,
  });

  const pointsStartY = 2.0;
  const pointW = 6;
  const pointX = (W - pointW) / 2;
  const pointH = 0.55;

  vars.points.forEach((p, i) => {
    const py = pointsStartY + i * pointH;
    slide.addShape(pres.shapes.LINE, {
      x: pointX, y: py + pointH, w: pointW, h: 0,
      line: { color: C.border, width: 0.5 },
    });
    slide.addText(p.label.toUpperCase(), {
      x: pointX, y: py + 0.06, w: 0.8, h: pointH - 0.12,
      fontSize: 9, fontFace: FONT_B, bold: true, color: C.primary, charSpacing: 1, margin: 0, valign: "top",
    });
    slide.addText(p.text, {
      x: pointX + 0.9, y: py + 0.06, w: pointW - 0.9, h: pointH - 0.12,
      fontSize: 11, fontFace: FONT_B, color: C.fg, margin: 0, valign: "top", lineSpacingMultiple: 1.3,
    });
  });
}

function renderClosingTriad(slide, vars) {
  const padX = px(64);
  const leftW = (W - 2 * padX) * 0.5;

  slide.addText(vars.heading, {
    x: padX, y: 1.2, w: leftW, h: 0.8,
    fontSize: 20, fontFace: FONT_H, bold: true, color: C.fg, margin: 0, valign: "top", lineSpacingMultiple: 1.4,
  });

  slide.addText(vars.description, {
    x: padX, y: 2.1, w: leftW, h: 2.8,
    fontSize: 11, fontFace: FONT_B, bold: true, color: C.fg, margin: 0, valign: "top", lineSpacingMultiple: 1.9,
  });

  const rightX = padX + leftW + px(48);
  const rightW = W - rightX - padX;
  const centerX = rightX + rightW / 2;
  const circR = 0.6;
  const topCX = centerX;
  const topCY = 1.5;
  const botLCX = centerX - 1.2;
  const botRCX = centerX + 1.2;
  const botCY = 3.8;

  [[topCX, topCY, botLCX, botCY], [topCX, topCY, botRCX, botCY], [botLCX, botCY, botRCX, botCY]].forEach(([x1, y1, x2, y2]) => {
    slide.addShape(pres.shapes.LINE, {
      x: x1, y: y1, w: x2 - x1, h: y2 - y1,
      line: { color: C.border, width: 1.5 },
    });
  });

  const drawEntity = (cx, cy, entity) => {
    slide.addShape(pres.shapes.OVAL, {
      x: cx - circR, y: cy - circR, w: circR * 2, h: circR * 2,
      fill: { color: C.bg }, line: { color: C.fg, width: 1.5 },
    });
    slide.addText(entity.name, {
      x: cx - circR, y: cy - 0.15, w: circR * 2, h: 0.25,
      fontSize: 13, fontFace: FONT_H, bold: true, color: C.fg, align: "center", valign: "middle", margin: 0,
    });
    if (entity.role) {
      slide.addText(entity.role, {
        x: cx - circR, y: cy + 0.12, w: circR * 2, h: 0.2,
        fontSize: 8, fontFace: FONT_B, color: C.muted, align: "center", valign: "middle", margin: 0,
      });
    }
  };

  drawEntity(topCX, topCY, vars.top);
  drawEntity(botLCX, botCY, vars.bottomLeft);
  drawEntity(botRCX, botCY, vars.bottomRight);
}

// ─── Pattern registry ───────────────────────────────────────────────
const renderers = {
  "price-before-after": renderPriceBeforeAfter,
  "comparison-table": renderComparisonTable,
  "image-full": renderImageFull,
  "conclusion-summary": renderConclusionSummary,
  "closing-triad": renderClosingTriad,
};

// ─── Main ───────────────────────────────────────────────────────────
let rendered = 0;
for (const slideData of deck.slides) {
  const slide = pres.addSlide();
  slide.background = { color: C.bg };

  const renderer = renderers[slideData.file];
  if (!renderer) {
    console.warn(`⚠ No pptx renderer for pattern "${slideData.file}" — blank slide`);
    continue;
  }

  renderer(slide, slideData.vars ?? {});
  rendered++;
}

console.log(`✓ Rendered ${rendered}/${deck.slides.length} slide(s)`);

mkdirSync(dirname(outputPath), { recursive: true });
await pres.writeFile({ fileName: outputPath });
console.log(`✓ Written to ${outputPath}`);
