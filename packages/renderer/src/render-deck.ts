import type { Deck } from "@deckspec/schema";
import { resolveSlideFile } from "@deckspec/dsl";
import { renderSlide, type RenderSlideContext } from "./render-slide.js";
import { viewerCSS } from "./viewer-css.js";
import { viewerJS } from "./viewer-js.js";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Renders a full deck to a standalone HTML document string with an
 * integrated slide viewer.
 *
 * The viewer provides:
 * - Single-slide display with viewport-fit scaling (default)
 * - Maximum option (M): on = fill viewport, off = cap at 1200px
 * - Grid option (G): thumbnail overview, click to jump
 * - Fullscreen (F): always scales slide to fill screen
 * - Keyboard navigation: ←/→, Space, Home/End, Esc
 * - Floating nav bar with auto-hide
 * - URL params: ?page=N&maximum=off&grid=on
 */
export async function renderDeck(
  deck: Deck,
  themeCSS: string,
  context?: RenderSlideContext,
): Promise<string> {
  const total = deck.slides.length;

  // Collect pattern-specific CSS
  let patternCSS = "";
  if (context) {
    const seenPatterns = new Set<string>();
    for (const slide of deck.slides) {
      const ext = slide.file.includes(".") ? slide.file.split(".").pop() : null;
      if (!ext) {
        // Pattern slide — try to load style.css
        const patternName = slide.file;
        if (!seenPatterns.has(patternName)) {
          seenPatterns.add(patternName);
          try {
            // Resolve to find the actual pattern location (deck-local or theme)
            const resolved = await resolveSlideFile(patternName, context.basePath, context.patternsDir, context.patternsSrcDir);
            let cssPath: string;
            if (resolved.tsx || resolved.path.includes("/patterns/")) {
              // Deck-local or theme source — style.css is next to the pattern source
              cssPath = join(dirname(resolved.path), "style.css");
            } else {
              const cssSrcDir = context.patternsSrcDir ?? context.patternsDir;
              cssPath = join(cssSrcDir, patternName, "style.css");
            }
            const css = await readFile(cssPath, "utf-8");
            patternCSS += `\n/* pattern: ${patternName} */\n${css}`;
          } catch {
            // No style.css for this pattern — that's fine
          }
        }
      }
    }
  }

  const slideHtmlParts: string[] = [];
  for (let index = 0; index < deck.slides.length; index++) {
    const slide = deck.slides[index];
    const state = slide.state ?? "generated";
    let html: string;

    if (context) {
      html = await renderSlide(slide, { ...context, slideIndex: index, slideTotal: total });
    } else {
      // Fallback: no context, can't resolve files
      html = `<div class="slide slide-center"><p>Cannot render: no context</p></div>`;
    }

    slideHtmlParts.push(
      `<div class="slide-outer" data-slide-index="${index}" data-state="${escapeHtml(state)}">${html}</div>`,
    );
  }

  const slidesHtml = slideHtmlParts.join("\n");

  const navHtml = `
  <nav class="nav-controls" id="nav-controls">
    <a href="/" class="nav-home" title="Home">←</a>
    <span class="divider"></span>
    <button id="btn-prev" title="Previous (\u2190)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
    <span class="slide-counter"><span id="current-slide">1</span> / ${total}</span>
    <button id="btn-next" title="Next (\u2192)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
    <span class="divider"></span>
    <button id="btn-fullscreen" title="Fullscreen (F)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg></button>
    <span class="divider"></span>
    <button id="btn-more" title="More options"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>
    <div class="nav-menu" id="nav-menu">
      <button id="btn-maximum"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg><span class="menu-label">Maximum off</span><span class="menu-key">M</span></button>
      <button id="btn-grid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg><span class="menu-label">Grid on</span><span class="menu-key">G</span></button>
    </div>
  </nav>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(deck.meta.title)}</title>
<style>
${themeCSS}
${patternCSS}
${viewerCSS}
</style>
</head>
<body class="maximum">
${slidesHtml}
${navHtml}
<script>
${viewerJS}
</script>
</body>
</html>`;
}

/**
 * Escapes HTML special characters in a string.
 */
function escapeHtml(text: string | undefined | null): string {
  if (text == null) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
