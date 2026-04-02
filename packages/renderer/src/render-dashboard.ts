import type { DeckSummary } from "@deckspec/dsl";
import { dashboardCSS } from "./dashboard-css.js";
import { dashboardJS } from "./dashboard-js.js";

export interface SlidePreview {
  index: number;
  state: string;
  html: string;
  file?: string;
}

export interface DeckWithPreviews {
  summary: DeckSummary;
  slidePreviews: SlidePreview[];
  /** Last modified date of deck.yaml (ISO string or undefined) */
  mtime?: string;
}

export interface ThemeSummary {
  name: string;
  displayName: string;
  patternCount: number;
  /** Key colors for visual identification (3-4 swatches) */
  colors: { name: string; hex: string }[];
}

interface DashboardOptions {
  /** "interactive" enables approve/reject buttons (dev server mode) */
  mode: "static" | "interactive";
  /** Theme CSS to embed for slide previews */
  themeCSS?: string;
}

function escapeHtml(text: string | undefined | null): string {
  if (text == null) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderThemeRow(theme: ThemeSummary): string {
  const colorDots = theme.colors
    .map(
      (c) =>
        `<span class="color-dot" style="background:${escapeHtml(c.hex)}" title="${escapeHtml(c.name)}: ${escapeHtml(c.hex)}"></span>`,
    )
    .join("");

  return `<a class="list-row list-row-link" href="/theme/${escapeHtml(theme.name)}">
  <div class="list-row-left">
    <div class="color-dots">${colorDots}</div>
    <div class="list-row-text">
      <span class="list-row-name">${escapeHtml(theme.displayName)}</span>
      <span class="list-row-meta">${theme.patternCount} patterns</span>
    </div>
  </div>
  <span class="list-row-arrow">›</span>
</a>`;
}

function renderDeckRow(deck: DeckWithPreviews): string {
  const { summary } = deck;
  const deckName = summary.relativePath
    .replace(/^decks\//, "")
    .replace(/\/deck\.yaml$/, "");
  const themeName = escapeHtml(summary.meta.theme);
  const approved = summary.approvedCount;
  const total = summary.slideCount;

  // First slide thumbnail
  const firstSlide = deck.slidePreviews[0];
  const thumbHtml = firstSlide
    ? `<div class="deck-thumb"><div class="deck-thumb-inner">${firstSlide.html}</div></div>`
    : `<div class="deck-thumb deck-thumb-empty"></div>`;

  // Format mtime
  const dateStr = deck.mtime
    ? ` · ${new Date(deck.mtime).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })}`
    : "";

  return `<a class="list-row list-row-link" href="/deck/${escapeHtml(deckName)}">
  <div class="list-row-left">
    ${thumbHtml}
    <div class="list-row-text">
      <span class="list-row-name">${escapeHtml(summary.meta.title)}</span>
      <span class="list-row-meta">${themeName} · ${total} slides${dateStr}</span>
    </div>
  </div>
  <div class="list-row-right">
    <span class="list-row-arrow">›</span>
  </div>
</a>`;
}

/**
 * Renders the dashboard as a standalone HTML page.
 */
export function renderDashboard(
  decks: DeckWithPreviews[],
  options: DashboardOptions = { mode: "static" },
  themes: ThemeSummary[] = [],
): string {
  const themesHtml =
    themes.length > 0
      ? themes.map((t) => renderThemeRow(t)).join("\n")
      : `<div class="empty-state">No themes found.</div>`;

  const decksHtml =
    decks.length > 0
      ? decks.map((d) => renderDeckRow(d)).join("\n")
      : `<div class="empty-state">No decks found. Create a deck.yaml to get started.</div>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DeckSpec</title>
<style>
${options.themeCSS ?? ""}
${dashboardCSS}
</style>
</head>
<body>
<div class="dashboard">
  <h1 class="page-title">DeckSpec</h1>

  <section class="section">
    <h2 class="section-title">Themes</h2>
    <div class="list-group">${themesHtml}</div>
  </section>

  <section class="section">
    <h2 class="section-title">Decks</h2>
    <div class="list-group">${decksHtml}</div>
  </section>
</div>
<script>
${dashboardJS}
</script>
</body>
</html>`;
}
