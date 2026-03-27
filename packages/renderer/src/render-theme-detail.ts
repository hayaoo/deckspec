import type { ThemeTokens } from "./theme.js";
import { dashboardCSS } from "./dashboard-css.js";
import { dashboardJS } from "./dashboard-js.js";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface PatternInfo {
  name: string;
  /** SSR rendered HTML of first example (undefined if no examples.yaml) */
  previewHtml?: string;
}

interface ThemeDetailOptions {
  tokens: ThemeTokens;
  /** Pattern info with optional previews */
  patterns: PatternInfo[];
  /** design.md raw content (first ~30 lines for description) */
  designDescription: string;
  /** Theme CSS to embed for pattern previews */
  themeCSS?: string;
}

function renderColorSwatch(name: string, hex: string): string {
  return `<div class="color-swatch">
  <div class="color-swatch-circle" style="background:${escapeHtml(hex)}"></div>
  <div class="color-swatch-info">
    <span class="color-swatch-name">${escapeHtml(name)}</span>
    <span class="color-swatch-hex">${escapeHtml(hex)}</span>
  </div>
</div>`;
}

function renderTypographySample(
  label: string,
  fontFamily: string,
  size: string,
  sample: string,
): string {
  return `<div class="typo-row">
  <span class="typo-label">${escapeHtml(label)}</span>
  <span class="typo-meta">${escapeHtml(fontFamily)} ${escapeHtml(size)}</span>
  <span class="typo-sample" style="font-family:'${escapeHtml(fontFamily)}',sans-serif;font-size:${escapeHtml(size)}">${escapeHtml(sample)}</span>
</div>`;
}

export function renderThemeDetail(options: ThemeDetailOptions): string {
  const { tokens, patterns, designDescription, themeCSS } = options;

  // Colors section
  const colorEntries = Object.entries(tokens.colors) as [string, string][];
  const colorsHtml = colorEntries
    .map(([name, hex]) => renderColorSwatch(name, hex))
    .join("\n");

  // Typography section
  const typoHtml = [
    renderTypographySample("h1", tokens.fonts.heading, "32px", "The quick brown fox"),
    renderTypographySample("h2", tokens.fonts.heading, "24px", "The quick brown fox"),
    renderTypographySample("h3", tokens.fonts.heading, "20px", "The quick brown fox"),
    renderTypographySample("h4", tokens.fonts.heading, "18px", "The quick brown fox"),
    renderTypographySample("body", tokens.fonts.body, "16px", "素早い茶色のキツネが怠惰な犬を飛び越える"),
  ].join("\n");

  // Spacing section
  const spacingValues = ["8px", "16px", "24px", "32px", "48px", "64px"];
  const spacingHtml = spacingValues
    .map(
      (s) =>
        `<div class="spacing-item"><div class="spacing-bar" style="width:${s}"></div><span class="spacing-label">${s}</span></div>`,
    )
    .join("\n");

  // Patterns section — grid cards with optional SSR thumbnails
  const patternsHtml = patterns
    .map((p) => {
      const thumb = p.previewHtml
        ? `<div class="pattern-thumb"><div class="pattern-thumb-inner">${p.previewHtml}</div></div>`
        : `<div class="pattern-thumb pattern-thumb-empty"></div>`;
      return `<div class="pattern-card">${thumb}<span class="pattern-card-name">${escapeHtml(p.name)}</span></div>`;
    })
    .join("\n");

  // Description from design.md
  const descHtml = designDescription
    ? `<div class="theme-description">${escapeHtml(designDescription)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(tokens.displayName)} — Theme Detail</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(tokens.fonts.heading)}:wght@400;600;700&display=swap" rel="stylesheet">
<style>
${themeCSS ?? ""}
${dashboardCSS}
</style>
</head>
<body>
<div class="dashboard">
  <div class="page-nav"><a href="/">← Home</a></div>
  <h1 class="page-title">${escapeHtml(tokens.displayName)}</h1>
  ${descHtml}

  <section class="section">
    <h2 class="section-title">Colors</h2>
    <div class="color-grid">${colorsHtml}</div>
  </section>

  <section class="section">
    <h2 class="section-title">Typography</h2>
    <div class="typo-list">${typoHtml}</div>
  </section>

  <section class="section">
    <h2 class="section-title">Spacing</h2>
    <div class="spacing-list">${spacingHtml}</div>
  </section>

  <section class="section">
    <h2 class="section-title">Patterns <span class="count-badge">${patterns.length}</span></h2>
    <div class="pattern-grid">${patternsHtml}</div>
  </section>
</div>
<script>
${dashboardJS}
</script>
</body>
</html>`;
}
