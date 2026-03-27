#!/usr/bin/env node
/**
 * deck-to-pptx.mjs — Convert a DeckSpec deck.yaml to PowerPoint (.pptx)
 *
 * Usage: node scripts/deck-to-pptx.mjs decks/hashimotoya-fuel/deck.yaml -o output/hashimotoya-fuel.pptx
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
  console.error("Usage: node scripts/deck-to-pptx.mjs <deck.yaml> -o <output.pptx>");
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
  primary: hex(tokens.colors.primary),           // E5001F
  fg: hex(tokens.colors.foreground),              // 222222
  bg: hex(tokens.colors.background),              // F4F4F4
  muted: hex(tokens.colors["muted-foreground"]),  // 737373
  border: hex(tokens.colors.border),              // e5e5e5
  card: hex(tokens.colors["card-background"] ?? "#ffffff"), // ffffff
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

  // Label
  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY + 0.25, w: W - 2 * padX, h: 0.35,
    fontSize: 18, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0,
  });

  // Cards area
  const items = vars.items;
  const cardTop = padY + 0.85;
  const cardBot = H - padY - (vars.footnote ? 0.35 : 0);
  const cardH = cardBot - cardTop;
  const gap = px(1);
  const cardW = (W - 2 * padX - gap * (items.length - 1)) / items.length;

  items.forEach((item, i) => {
    const cx = padX + i * (cardW + gap);

    // Card bg
    slide.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: cardTop, w: cardW, h: cardH,
      fill: { color: C.card },
    });

    // Company name
    slide.addText(item.name, {
      x: cx, y: cardTop + px(32), w: cardW, h: 0.35,
      fontSize: 15, fontFace: FONT_H, bold: true,
      color: C.fg, align: "center", margin: 0,
    });

    // Before label
    const priceY = cardTop + cardH * 0.35;
    slide.addText("BEFORE", {
      x: cx, y: priceY, w: cardW * 0.38, h: 0.18,
      fontSize: 8, fontFace: FONT_B, bold: true,
      color: C.muted, align: "center", charSpacing: 1, margin: 0,
    });
    // Before price
    slide.addText(item.before, {
      x: cx, y: priceY + 0.18, w: cardW * 0.38, h: 0.35,
      fontSize: 20, fontFace: FONT_H, bold: true,
      color: C.muted, align: "center", strike: true, margin: 0,
    });

    // Arrow
    slide.addText("→", {
      x: cx + cardW * 0.38, y: priceY + 0.12, w: cardW * 0.24, h: 0.35,
      fontSize: 22, color: C.primary, align: "center", margin: 0,
    });

    // After label
    slide.addText("AFTER", {
      x: cx + cardW * 0.62, y: priceY, w: cardW * 0.38, h: 0.18,
      fontSize: 8, fontFace: FONT_B, bold: true,
      color: C.primary, align: "center", charSpacing: 1, margin: 0,
    });
    // After price
    slide.addText(item.after, {
      x: cx + cardW * 0.62, y: priceY + 0.18, w: cardW * 0.38, h: 0.35,
      fontSize: 26, fontFace: FONT_H, bold: true,
      color: C.fg, align: "center", margin: 0,
    });

    // Note
    if (item.note) {
      slide.addText(item.note, {
        x: cx + px(8), y: cardTop + cardH - px(48), w: cardW - px(16), h: 0.3,
        fontSize: 9, fontFace: FONT_B,
        color: C.muted, align: "center", margin: 0,
      });
    }
  });

  // Footnote
  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - padY - 0.25, w: W - 2 * padX, h: 0.25,
      fontSize: 9, fontFace: FONT_B,
      color: C.muted, align: "center", margin: 0,
    });
  }
}

function renderComparisonTable(slide, vars) {
  const padX = px(64);
  const padY = px(40);

  // Label
  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY + 0.22, w: W - 2 * padX, h: 0.35,
    fontSize: 16, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0,
  });

  // Table
  const colCount = vars.columns.length;
  const rowLabelW = 1.5;
  const dataW = (W - 2 * padX - rowLabelW) / colCount;
  const colWidths = [rowLabelW, ...Array(colCount).fill(dataW)];

  const badgeColor = { red: C.primary, blue: "2563EB", green: "16A34A" };

  // Build table data
  const tableRows = [];

  // Header row
  const headerRow = [
    { text: "", options: { fill: { color: C.fg }, color: C.card } },
  ];
  vars.columns.forEach((col) => {
    const cellText = [
      { text: col.name, options: { bold: true, fontSize: 12, color: "FFFFFF", breakLine: true } },
    ];
    if (col.status) {
      cellText.push({
        text: ` ${col.status}`,
        options: {
          fontSize: 8, bold: true, color: "FFFFFF",
          highlight: badgeColor[col.statusColor ?? "red"],
        },
      });
    }
    headerRow.push({
      text: cellText,
      options: { fill: { color: C.fg }, color: "FFFFFF", valign: "middle" },
    });
  });
  tableRows.push(headerRow);

  // Data rows
  vars.rows.forEach((rowLabel, ri) => {
    const rowBg = ri % 2 === 0 ? C.card : C.bg;
    const row = [
      {
        text: rowLabel,
        options: {
          fontSize: 9, bold: true, color: C.muted,
          fill: { color: rowBg }, valign: "middle",
        },
      },
    ];
    vars.columns.forEach((col) => {
      const cell = col.values[ri];
      const isObj = cell != null && typeof cell === "object";
      const text = isObj ? cell.text : (cell ?? "—");
      const icon = isObj ? cell.icon : undefined;

      const cellContent = [];
      if (icon) {
        cellContent.push({
          text: iconSymbol[icon] + " ",
          options: { color: iconColors[icon], fontSize: 9, bold: true },
        });
      }
      cellContent.push({ text, options: { fontSize: 10, color: C.fg } });

      row.push({
        text: cellContent,
        options: { fill: { color: rowBg }, valign: "middle" },
      });
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

  // Footnote
  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - px(36), w: W - 2 * padX, h: 0.25,
      fontSize: 9, fontFace: FONT_B,
      color: C.muted, margin: 0,
    });
  }
}

function renderRatioSimulation(slide, vars) {
  const padX = px(64);
  const padY = px(40);
  const colorMap = { red: C.primary, blue: "2563EB" };

  const formatYen = (n) => "¥" + Math.round(n).toLocaleString("ja-JP");

  // Label
  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY + 0.22, w: W - 2 * padX, h: 0.35,
    fontSize: 16, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0,
  });

  // Description + volume
  let descY = padY + 0.65;
  if (vars.description) {
    slide.addText(vars.description, {
      x: padX, y: descY, w: (W - 2 * padX) * 0.65, h: 0.22,
      fontSize: 10, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }
  const volText = `試算総量: ${vars.totalVolume.toLocaleString("ja-JP")}L${vars.volumeNote ? ` (${vars.volumeNote})` : ""}`;
  slide.addText(volText, {
    x: padX + (W - 2 * padX) * 0.65, y: descY, w: (W - 2 * padX) * 0.35, h: 0.22,
    fontSize: 9, fontFace: FONT_B, color: C.muted, align: "right", margin: 0,
  });

  // Legend
  const legendY = descY + 0.32;
  vars.sources.forEach((s, i) => {
    const lx = padX + i * px(160);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: lx, y: legendY + 0.06, w: px(16), h: px(4),
      fill: { color: colorMap[s.color] },
    });
    slide.addText(`${s.name}  ${formatYen(s.unitPrice)}/L`, {
      x: lx + px(22), y: legendY, w: px(130), h: 0.2,
      fontSize: 9, fontFace: FONT_B, bold: true, color: C.fg, margin: 0,
    });
  });

  // Plan cards
  const plans = vars.plans;
  const cardTop = legendY + 0.32;
  const cardBot = H - padY - (vars.footnote ? 0.28 : 0);
  const cardH = cardBot - cardTop;
  const gap = px(1);
  const cardW = (W - 2 * padX - gap * (plans.length - 1)) / plans.length;

  plans.forEach((plan, pi) => {
    const cx = padX + pi * (cardW + gap);
    const totalCost = vars.sources.reduce(
      (sum, s, si) => sum + s.unitPrice * vars.totalVolume * (plan.ratios[si] / 100), 0,
    );
    const blendedPrice = totalCost / vars.totalVolume;

    // Card bg
    slide.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: cardTop, w: cardW, h: cardH,
      fill: { color: C.card },
      line: plan.recommended ? { color: C.primary, width: 2 } : undefined,
    });

    // Plan name + badge
    let nameY = cardTop + px(16);
    const nameParts = [
      { text: plan.name, options: { bold: true, fontSize: 12, fontFace: FONT_H, color: C.fg } },
    ];
    if (plan.recommended) {
      nameParts.push({
        text: "  推奨",
        options: { bold: true, fontSize: 8, color: "FFFFFF", highlight: C.primary },
      });
    }
    slide.addText(nameParts, {
      x: cx + px(16), y: nameY, w: cardW - px(32), h: 0.25,
      margin: 0,
    });

    // Ratio bar
    const barY = nameY + 0.32;
    const barH = px(20);
    const barW = cardW - px(32);
    vars.sources.forEach((s, si) => {
      const prevPct = plan.ratios.slice(0, si).reduce((a, b) => a + b, 0);
      const segW = barW * (plan.ratios[si] / 100);
      slide.addShape(pres.shapes.RECTANGLE, {
        x: cx + px(16) + barW * (prevPct / 100), y: barY, w: segW, h: barH,
        fill: { color: colorMap[s.color] },
      });
      if (plan.ratios[si] >= 20) {
        slide.addText(`${plan.ratios[si]}%`, {
          x: cx + px(16) + barW * (prevPct / 100), y: barY, w: segW, h: barH,
          fontSize: 8, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0,
        });
      }
    });

    // Breakdown
    let breakY = barY + barH + px(12);
    vars.sources.forEach((s, si) => {
      const vol = vars.totalVolume * (plan.ratios[si] / 100);
      slide.addText(`${s.name} (${plan.ratios[si]}%)`, {
        x: cx + px(16), y: breakY, w: (cardW - px(32)) * 0.42, h: 0.18,
        fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
      });
      slide.addText(`${vol.toLocaleString("ja-JP")}L × ${formatYen(s.unitPrice)}`, {
        x: cx + px(16) + (cardW - px(32)) * 0.42, y: breakY, w: (cardW - px(32)) * 0.58, h: 0.18,
        fontSize: 9, fontFace: FONT_H, bold: true, color: C.fg, align: "right", margin: 0,
      });
      breakY += 0.2;
    });

    // Divider
    const divY = breakY + px(8);
    slide.addShape(pres.shapes.LINE, {
      x: cx + px(16), y: divY, w: cardW - px(32), h: 0,
      line: { color: C.border, width: 0.5 },
    });

    // Total cost
    const totalY = divY + px(10);
    slide.addText("合計金額", {
      x: cx + px(16), y: totalY, w: (cardW - px(32)) * 0.4, h: 0.25,
      fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
    });
    slide.addText(formatYen(totalCost), {
      x: cx + px(16) + (cardW - px(32)) * 0.4, y: totalY, w: (cardW - px(32)) * 0.6, h: 0.25,
      fontSize: 15, fontFace: FONT_H, bold: true, color: C.fg, align: "right", margin: 0,
    });

    // Blended price
    const blendY = totalY + 0.28;
    slide.addText("加重平均単価", {
      x: cx + px(16), y: blendY, w: (cardW - px(32)) * 0.4, h: 0.22,
      fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
    });
    slide.addText(`${formatYen(blendedPrice)}/L`, {
      x: cx + px(16) + (cardW - px(32)) * 0.4, y: blendY, w: (cardW - px(32)) * 0.6, h: 0.22,
      fontSize: 12, fontFace: FONT_H, bold: true, color: C.primary, align: "right", margin: 0,
    });
  });

  // Footnote
  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - px(32), w: W - 2 * padX, h: 0.22,
      fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }
}

function renderImageFull(slide, vars) {
  const padX = px(48);
  const padY = px(32);

  // Label
  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY + 0.22, w: W - 2 * padX, h: 0.32,
    fontSize: 16, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0,
  });

  // Subtitle
  let imgTop = padY + 0.6;
  if (vars.subtitle) {
    slide.addText(vars.subtitle, {
      x: padX, y: padY + 0.56, w: W - 2 * padX, h: 0.22,
      fontSize: 10, fontFace: FONT_B, color: C.muted, margin: 0,
    });
    imgTop = padY + 0.82;
  }

  // Image — manual aspect-ratio-preserving contain
  const imgData = resolveImage(vars.image);
  if (imgData) {
    const imgBot = H - padY - (vars.footnote ? 0.3 : 0);
    const boxH = imgBot - imgTop;
    const boxW = W - 2 * padX;
    const size = getImageSize(vars.image);
    if (size) {
      const fit = containImage(size.w, size.h, boxW, boxH);
      slide.addImage({
        data: imgData,
        x: padX + fit.offX, y: imgTop + fit.offY,
        w: fit.w, h: fit.h,
      });
    } else {
      // fallback: stretch to box
      slide.addImage({ data: imgData, x: padX, y: imgTop, w: boxW, h: boxH });
    }
  }

  // Footnote
  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - padY - 0.22, w: W - 2 * padX, h: 0.22,
      fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }
}

function renderConclusionSummary(slide, vars) {
  const padX = px(64);

  // Logo — manual contain
  const logoData = resolveImage(vars.logo);
  if (logoData) {
    const logoBoxW = 2.5;
    const logoBoxH = 0.7;
    const logoSize = getImageSize(vars.logo);
    if (logoSize) {
      const fit = containImage(logoSize.w, logoSize.h, logoBoxW, logoBoxH);
      slide.addImage({
        data: logoData,
        x: (W - logoBoxW) / 2 + fit.offX, y: 0.5 + fit.offY,
        w: fit.w, h: fit.h,
      });
    } else {
      slide.addImage({ data: logoData, x: (W - logoBoxW) / 2, y: 0.5, w: logoBoxW, h: logoBoxH });
    }
  }

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: 1.35, w: W - 2 * padX, h: 0.45,
    fontSize: 16, fontFace: FONT_H, bold: true,
    color: C.fg, align: "center", margin: 0,
  });

  // Points
  const pointsStartY = 2.0;
  const pointW = 6;
  const pointX = (W - pointW) / 2;
  const pointH = 0.55;

  vars.points.forEach((p, i) => {
    const py = pointsStartY + i * pointH;

    // Divider line
    slide.addShape(pres.shapes.LINE, {
      x: pointX, y: py + pointH, w: pointW, h: 0,
      line: { color: C.border, width: 0.5 },
    });

    // Label
    slide.addText(p.label.toUpperCase(), {
      x: pointX, y: py + 0.06, w: 0.8, h: pointH - 0.12,
      fontSize: 9, fontFace: FONT_B, bold: true,
      color: C.primary, charSpacing: 1, margin: 0, valign: "top",
    });

    // Text
    slide.addText(p.text, {
      x: pointX + 0.9, y: py + 0.06, w: pointW - 0.9, h: pointH - 0.12,
      fontSize: 11, fontFace: FONT_B, color: C.fg, margin: 0, valign: "top",
      lineSpacingMultiple: 1.3,
    });
  });
}

// ─── New patterns ───────────────────────────────────────────────────

function renderFuelPriceCompare(slide, vars) {
  const padX = px(64);
  const padY = px(48);
  const formatPrice = (n) => "¥" + n.toLocaleString("ja-JP");

  // Label
  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY + 0.25, w: W - 2 * padX, h: 0.4,
    fontSize: 18, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0,
  });

  // Table
  const cols = vars.companies;
  const colW_label = (W - 2 * padX) * 0.38;
  const colW_data = ((W - 2 * padX) - colW_label) / cols.length;
  const colWidths = [colW_label, ...Array(cols.length).fill(colW_data)];

  const tableRows = [];

  // Header
  const headerRow = [
    { text: `油種${vars.unit ? ` (${vars.unit})` : ""}`, options: { fontSize: 10, bold: true, color: "FFFFFF", fill: { color: C.fg } } },
  ];
  cols.forEach((c) => {
    headerRow.push({
      text: c,
      options: { fontSize: 13, bold: true, color: "FFFFFF", fill: { color: C.fg }, align: "center", fontFace: FONT_H },
    });
  });
  tableRows.push(headerRow);

  // Data rows
  vars.fuels.forEach((fuel, fi) => {
    const minPrice = Math.min(...fuel.prices);
    const uniqueMin = fuel.prices.filter((p) => p === minPrice).length === 1;
    const rowBg = fi % 2 === 0 ? C.card : C.bg;
    const row = [
      { text: fuel.name, options: { fontSize: 12, bold: true, color: C.fg, fill: { color: rowBg } } },
    ];
    fuel.prices.forEach((price) => {
      const isCheapest = price === minPrice && uniqueMin;
      row.push({
        text: formatPrice(price),
        options: {
          fontSize: 15, bold: true, fontFace: FONT_H,
          color: isCheapest ? C.primary : C.fg,
          fill: { color: rowBg }, align: "center",
        },
      });
    });
    tableRows.push(row);
  });

  const tableY = padY + 0.85;
  const tableH = H - tableY - (vars.footnote ? px(40) : px(32));

  slide.addTable(tableRows, {
    x: padX, y: tableY, w: W - 2 * padX,
    colW: colWidths,
    border: { type: "solid", pt: 0.5, color: C.border },
    rowH: [0.42, ...Array(vars.fuels.length).fill((tableH - 0.42) / vars.fuels.length)],
    margin: [6, 12, 6, 12],
    autoPage: false,
  });

  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - px(32), w: W - 2 * padX, h: 0.25,
      fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }
}

function renderSupplierAdvantage(slide, vars) {
  const padX = px(56);
  const padY = px(40);
  const verdictSymbol = { good: "●", bad: "✕", warn: "▲" };
  const verdictColor = { good: "2563EB", bad: C.primary, warn: "D97706" };

  // Label
  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY + 0.22, w: W - 2 * padX, h: 0.35,
    fontSize: 16, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0,
  });

  // Column headers
  const hdrY = padY + 0.7;
  const labelW = 1.7;
  const dataW = (W - 2 * padX - labelW) / 2;

  slide.addShape(pres.shapes.RECTANGLE, {
    x: padX, y: hdrY, w: W - 2 * padX, h: 0.35,
    fill: { color: C.fg },
  });
  slide.addText(vars.leftName, {
    x: padX + labelW, y: hdrY, w: dataW, h: 0.35,
    fontSize: 12, fontFace: FONT_H, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0,
  });
  slide.addText(vars.rightName, {
    x: padX + labelW + dataW, y: hdrY, w: dataW, h: 0.35,
    fontSize: 12, fontFace: FONT_H, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0,
  });

  // Items
  const itemTop = hdrY + 0.36;
  const itemBot = H - padY - (vars.footnote ? 0.25 : 0);
  const itemH = (itemBot - itemTop) / vars.items.length;
  const gap = px(1);

  vars.items.forEach((item, i) => {
    const iy = itemTop + i * itemH + (i > 0 ? gap : 0);
    const h = itemH - gap;

    // Card bg
    slide.addShape(pres.shapes.RECTANGLE, {
      x: padX, y: iy, w: W - 2 * padX, h,
      fill: { color: C.card },
    });

    // Row label (title)
    slide.addText(item.title, {
      x: padX + px(12), y: iy, w: labelW - px(24), h,
      fontSize: 10, fontFace: FONT_H, bold: true, color: C.fg, valign: "middle", margin: 0,
    });

    // Left side
    const lx = padX + labelW;
    // Verdict + value
    const leftParts = [];
    if (item.left.verdict) {
      leftParts.push({ text: verdictSymbol[item.left.verdict] + " ", options: { color: verdictColor[item.left.verdict], fontSize: 9, bold: true } });
    }
    if (item.left.value) {
      leftParts.push({ text: item.left.value, options: { fontSize: 13, fontFace: FONT_H, bold: true, color: C.fg, breakLine: true } });
    }
    leftParts.push({ text: item.left.description, options: { fontSize: 9, color: C.muted } });
    slide.addText(leftParts, {
      x: lx + px(12), y: iy + px(8), w: dataW - px(24), h: h - px(16),
      valign: "middle", margin: 0,
    });

    // Vertical border
    slide.addShape(pres.shapes.LINE, {
      x: padX + labelW + dataW, y: iy, w: 0, h,
      line: { color: C.border, width: 0.5 },
    });

    // Right side
    const rx = padX + labelW + dataW;
    const rightParts = [];
    if (item.right.verdict) {
      rightParts.push({ text: verdictSymbol[item.right.verdict] + " ", options: { color: verdictColor[item.right.verdict], fontSize: 9, bold: true } });
    }
    if (item.right.value) {
      rightParts.push({ text: item.right.value, options: { fontSize: 13, fontFace: FONT_H, bold: true, color: "2563EB", breakLine: true } });
    }
    rightParts.push({ text: item.right.description, options: { fontSize: 9, color: C.muted } });
    slide.addText(rightParts, {
      x: rx + px(12), y: iy + px(8), w: dataW - px(24), h: h - px(16),
      valign: "middle", margin: 0,
    });
  });

  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - padY, w: W - 2 * padX, h: 0.22,
      fontSize: 9, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }
}

function renderProposalWithTable(slide, vars) {
  const padX = px(56);
  const padY = px(36);
  const colorMap = { red: C.primary, blue: "2563EB" };
  const formatYen = (n) => "¥" + Math.round(n).toLocaleString("ja-JP");

  // Label
  slide.addText(vars.label.toUpperCase(), {
    x: padX, y: padY, w: W - 2 * padX, h: 0.2,
    fontSize: 9, fontFace: FONT_B, bold: true,
    color: C.primary, charSpacing: 1.5, margin: 0,
  });

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY + 0.2, w: W - 2 * padX, h: 0.32,
    fontSize: 16, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0,
  });

  // Fuel table
  const tableY = padY + 0.6;
  const headers = ["油種", "総量", vars.companies[0], vars.companies[1], "推奨"];
  const tColW = [1.8, 0.9, 1.5, 1.5, 1.5];
  const tW = tColW.reduce((a, b) => a + b, 0);

  const tableRows = [];
  // Header row
  tableRows.push(headers.map((h) => ({
    text: h,
    options: { fontSize: 9, bold: true, color: "FFFFFF", fill: { color: C.fg }, fontFace: FONT_H },
  })));

  // Data rows
  vars.fuels.forEach((fuel, fi) => {
    const rowBg = fi % 2 === 0 ? C.card : C.bg;
    const opts = (extra = {}) => ({ fontSize: 10, color: C.fg, fill: { color: rowBg }, ...extra });
    tableRows.push([
      { text: fuel.name, options: { ...opts(), bold: true } },
      { text: fuel.volume, options: { ...opts({ color: C.muted }) } },
      { text: fuel.priceA, options: { ...opts(), fontFace: FONT_H } },
      { text: fuel.priceB, options: { ...opts(), fontFace: FONT_H } },
      { text: fuel.recommendation, options: { ...opts({ color: C.primary, bold: true, fontFace: FONT_H }) } },
    ]);
  });

  const rowH = 0.3;
  slide.addTable(tableRows, {
    x: padX, y: tableY, w: tW,
    colW: tColW,
    border: { type: "solid", pt: 0.5, color: C.border },
    rowH: Array(tableRows.length).fill(rowH),
    margin: [4, 8, 4, 8],
    autoPage: false,
  });

  // Plan section
  const planY = tableY + rowH * tableRows.length + px(16);

  // Plan section title + legend
  if (vars.planSectionTitle) {
    slide.addText(vars.planSectionTitle, {
      x: padX, y: planY, w: (W - 2 * padX) * 0.5, h: 0.2,
      fontSize: 9, fontFace: FONT_B, bold: true, color: C.muted, margin: 0,
    });
  }
  // Legend
  vars.sources.forEach((s, i) => {
    const lx = padX + (W - 2 * padX) * 0.55 + i * px(140);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: lx, y: planY + 0.04, w: px(12), h: px(12),
      fill: { color: colorMap[s.color] },
    });
    slide.addText(`${s.name} (${formatYen(s.unitPrice)}/L)`, {
      x: lx + px(16), y: planY, w: px(120), h: 0.2,
      fontSize: 9, fontFace: FONT_B, bold: true, color: C.fg, margin: 0,
    });
  });

  // Plan cards
  const plans = vars.plans;
  const cardTop = planY + 0.28;
  const cardBot = H - padY - (vars.footnote ? 0.28 : 0);
  const cardH = cardBot - cardTop;
  const cardGap = px(1);
  const cardW = (W - 2 * padX - cardGap * (plans.length - 1)) / plans.length;

  plans.forEach((plan, pi) => {
    const cx = padX + pi * (cardW + cardGap);
    const totalCost = vars.sources.reduce(
      (sum, s, si) => sum + s.unitPrice * vars.totalVolume * (plan.ratios[si] / 100), 0,
    );

    // Card bg
    slide.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: cardTop, w: cardW, h: cardH,
      fill: { color: C.card },
    });

    // Pie chart as stacked rectangles (horizontal bar approximation)
    const pieY = cardTop + px(12);
    const pieSize = cardH - px(24);
    const pieX = cx + px(12);
    // Draw as proportional vertical bar
    let cumH = 0;
    vars.sources.forEach((s, si) => {
      const segH = pieSize * (plan.ratios[si] / 100);
      slide.addShape(pres.shapes.OVAL, {
        x: pieX, y: pieY, w: pieSize, h: pieSize,
        // Use first source only for full oval, then overlay
      });
      // Simplified: draw ratio bar instead
    });
    // Simpler: horizontal ratio bar
    const barX = cx + px(12);
    const barY2 = cardTop + cardH * 0.3;
    const barW = cardW * 0.3;
    const barH2 = px(12);
    vars.sources.forEach((s, si) => {
      const prevPct = plan.ratios.slice(0, si).reduce((a, b) => a + b, 0);
      const segW = barW * (plan.ratios[si] / 100);
      slide.addShape(pres.shapes.RECTANGLE, {
        x: barX + barW * (prevPct / 100), y: barY2, w: segW, h: barH2,
        fill: { color: colorMap[s.color] },
      });
    });

    // Plan name
    slide.addText(plan.name, {
      x: cx + px(8), y: cardTop + px(8), w: cardW - px(16), h: 0.22,
      fontSize: 10, fontFace: FONT_H, bold: true, color: C.fg, margin: 0,
    });

    // Source breakdown
    let ty = barY2 + barH2 + px(8);
    vars.sources.forEach((s, si) => {
      slide.addText(`${s.name} ${plan.ratios[si]}%`, {
        x: cx + px(8), y: ty, w: cardW - px(16), h: 0.16,
        fontSize: 8, fontFace: FONT_B, color: C.muted, margin: 0,
      });
      ty += 0.16;
    });

    // Total cost
    slide.addText(formatYen(totalCost), {
      x: cx + px(8), y: cardTop + cardH - px(32), w: cardW - px(16), h: 0.25,
      fontSize: 14, fontFace: FONT_H, bold: true, color: C.fg, margin: 0,
    });
  });

  if (vars.footnote) {
    slide.addText(vars.footnote, {
      x: padX, y: H - padY, w: W - 2 * padX, h: 0.22,
      fontSize: 8, fontFace: FONT_B, color: C.muted, margin: 0,
    });
  }
}

function renderClosingTriad(slide, vars) {
  const padX = px(64);
  const padY = px(48);

  // Left side: heading + description
  const leftW = (W - 2 * padX) * 0.5;

  slide.addText(vars.heading, {
    x: padX, y: 1.2, w: leftW, h: 0.8,
    fontSize: 20, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0, valign: "top",
    lineSpacingMultiple: 1.4,
  });

  slide.addText(vars.description, {
    x: padX, y: 2.1, w: leftW, h: 2.8,
    fontSize: 11, fontFace: FONT_B, bold: true,
    color: C.fg, margin: 0, valign: "top",
    lineSpacingMultiple: 1.9,
  });

  // Right side: triad diagram
  const rightX = padX + leftW + px(48);
  const rightW = W - rightX - padX;
  const centerX = rightX + rightW / 2;

  // Three entities in triangle
  const circR = 0.6;
  const topCX = centerX;
  const topCY = 1.5;
  const botLCX = centerX - 1.2;
  const botRCX = centerX + 1.2;
  const botCY = 3.8;

  // Connection lines
  [[topCX, topCY, botLCX, botCY], [topCX, topCY, botRCX, botCY], [botLCX, botCY, botRCX, botCY]].forEach(([x1, y1, x2, y2]) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    slide.addShape(pres.shapes.LINE, {
      x: x1, y: y1, w: dx, h: dy,
      line: { color: C.border, width: 1.5 },
    });
  });

  // Draw circles + text
  const drawEntity = (cx, cy, entity) => {
    slide.addShape(pres.shapes.OVAL, {
      x: cx - circR, y: cy - circR, w: circR * 2, h: circR * 2,
      fill: { color: C.bg }, line: { color: C.fg, width: 1.5 },
    });
    slide.addText(entity.name, {
      x: cx - circR, y: cy - 0.15, w: circR * 2, h: 0.25,
      fontSize: 13, fontFace: FONT_H, bold: true, color: C.fg,
      align: "center", valign: "middle", margin: 0,
    });
    if (entity.role) {
      slide.addText(entity.role, {
        x: cx - circR, y: cy + 0.12, w: circR * 2, h: 0.2,
        fontSize: 8, fontFace: FONT_B, color: C.muted,
        align: "center", valign: "middle", margin: 0,
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
  "ratio-simulation": renderRatioSimulation,
  "image-full": renderImageFull,
  "conclusion-summary": renderConclusionSummary,
  "fuel-price-compare": renderFuelPriceCompare,
  "supplier-advantage": renderSupplierAdvantage,
  "proposal-with-table": renderProposalWithTable,
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
console.log(`✓ Saved to ${outputPath}`);
