export const dashboardCSS = /* css */ `
/* ================================================================ */
/* Reset                                                            */
/* ================================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ================================================================ */
/* Body                                                             */
/* ================================================================ */
body {
  background: #fff;
  color: #1a1a1a;
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

/* ================================================================ */
/* Layout                                                           */
/* ================================================================ */
.dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

/* ================================================================ */
/* Navigation                                                       */
/* ================================================================ */
.page-nav {
  margin-bottom: 1rem;
}

.page-nav a {
  color: #737373;
  text-decoration: none;
  font-size: 0.85rem;
}

.page-nav a:hover {
  color: #1a1a1a;
}

/* ================================================================ */
/* Page Title                                                       */
/* ================================================================ */
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 2rem;
}

/* ================================================================ */
/* Sections                                                         */
/* ================================================================ */
.section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

/* ================================================================ */
/* List Group (shared by themes & decks on Home)                    */
/* ================================================================ */
.list-group {
  border: 1px solid #e5e5e5;
  border-radius: 0.5rem;
  overflow: hidden;
}

.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.list-row:last-child {
  border-bottom: none;
}

.list-row-link {
  text-decoration: none;
  color: inherit;
  transition: background 0.1s;
}

.list-row-link:hover {
  background: #fafafa;
}

.list-row-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.list-row-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.list-row-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.list-row-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-row-meta {
  font-size: 0.75rem;
  color: #a3a3a3;
}

.list-row-arrow {
  color: #d4d4d4;
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* ================================================================ */
/* Color Dots (Theme row on Home)                                   */
/* ================================================================ */
.color-dots {
  display: flex;
  gap: 0;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #e5e5e5;
  flex-shrink: 0;
}

.color-dot + .color-dot {
  margin-left: -6px;
}

/* ================================================================ */
/* Deck Thumbnail (Deck row on Home)                                */
/* ================================================================ */
.deck-thumb {
  width: 64px;
  height: 36px;
  border-radius: 0.25rem;
  overflow: hidden;
  border: 1px solid #e5e5e5;
  flex-shrink: 0;
  background: var(--color-background, #f4f4f4);
}

.deck-thumb-inner {
  transform-origin: top left;
  transform: scale(calc(64 / 1200));
  width: 1200px;
  height: 675px;
  pointer-events: none;
}

.deck-thumb-inner .slide {
  width: 1200px;
  height: 675px;
}

.deck-thumb-empty {
  background: #f5f5f5;
}

/* ================================================================ */
/* Approval Chip (Deck row)                                         */
/* ================================================================ */
.approval-chip {
  font-size: 0.7rem;
  font-weight: 600;
  color: #737373;
  background: #f5f5f5;
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  white-space: nowrap;
}

.approval-chip.approval-done {
  background: #dcfce7;
  color: #166534;
}

/* ================================================================ */
/* Theme Description (Theme Detail page)                            */
/* ================================================================ */
.theme-description {
  font-size: 0.9rem;
  color: #525252;
  line-height: 1.7;
  margin-bottom: 2rem;
  white-space: pre-line;
}

/* ================================================================ */
/* Color Grid (Theme Detail)                                        */
/* ================================================================ */
.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.color-swatch {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.color-swatch-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #e5e5e5;
  flex-shrink: 0;
}

.color-swatch-info {
  display: flex;
  flex-direction: column;
}

.color-swatch-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1a1a1a;
}

.color-swatch-hex {
  font-size: 0.7rem;
  color: #a3a3a3;
  font-family: ui-monospace, monospace;
}

/* ================================================================ */
/* Typography Samples (Theme Detail)                                */
/* ================================================================ */
.typo-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.typo-row {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.typo-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #737373;
  width: 2.5rem;
  flex-shrink: 0;
  font-family: ui-monospace, monospace;
}

.typo-meta {
  font-size: 0.7rem;
  color: #a3a3a3;
  width: 7rem;
  flex-shrink: 0;
}

.typo-sample {
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================================================================ */
/* Spacing Bars (Theme Detail)                                      */
/* ================================================================ */
.spacing-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.spacing-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.spacing-bar {
  height: 8px;
  background: #e5e5e5;
  border-radius: 2px;
}

.spacing-label {
  font-size: 0.7rem;
  color: #a3a3a3;
  font-family: ui-monospace, monospace;
}

/* ================================================================ */
/* Pattern Grid (Theme Detail)                                      */
/* ================================================================ */
.pattern-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.pattern-card {
  border: 1px solid #e5e5e5;
  border-radius: 0.375rem;
  overflow: hidden;
  background: #fff;
}

.pattern-thumb {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--color-background, #f4f4f4);
  position: relative;
}

.pattern-thumb-inner {
  transform-origin: top left;
  --thumb-scale: 0.155;
  transform: scale(var(--thumb-scale));
  width: 1200px;
  height: 675px;
  pointer-events: none;
}

.pattern-thumb-inner .slide,
.pattern-thumb-inner .slide-pad,
.pattern-thumb-inner .slide-stack,
.pattern-thumb-inner .slide-center,
.pattern-thumb-inner .slide-white {
  width: 1200px;
  height: 675px;
}

.pattern-thumb-empty {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pattern-thumb-empty::after {
  content: "";
  width: 24px;
  height: 24px;
  border: 2px dashed #d4d4d4;
  border-radius: 0.25rem;
}

.pattern-card-name {
  display: block;
  padding: 0.375rem 0.5rem;
  font-size: 0.7rem;
  color: #525252;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ================================================================ */
/* Count Badge                                                      */
/* ================================================================ */
.count-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: #a3a3a3;
  background: #f5f5f5;
  padding: 0.1rem 0.4rem;
  border-radius: 1rem;
  margin-left: 0.375rem;
  text-transform: none;
  letter-spacing: 0;
}

/* ================================================================ */
/* Empty State                                                      */
/* ================================================================ */
.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #a3a3a3;
  font-size: 0.85rem;
}
`;
