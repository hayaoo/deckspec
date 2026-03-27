/**
 * Viewer CSS — slide viewer shell.
 *
 * Options (body classes):
 *   .maximum  — scale slide to fill viewport (default on)
 *   .grid-on  — thumbnail overview grid
 *
 * Fullscreen always forces maximum scaling.
 */
export const viewerCSS = /* css */ `
/* ================================================================ */
/* Reset                                                            */
/* ================================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ================================================================ */
/* Body — default: single-slide, centered on black                  */
/* ================================================================ */
body {
  background: #000;
  margin: 0;
  overflow: hidden;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ================================================================ */
/* Slide outer — scaling container (container queries)              */
/* ================================================================ */
.slide-outer {
  container-type: size;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--color-background, #fff);
  position: absolute;
  visibility: hidden;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-outer.active {
  position: relative;
  visibility: visible;
  pointer-events: auto;
}

/* .slide is scaled by JS (resizeObserver sets --s on .slide-outer) */
.slide-outer .slide,
.slide-outer .slide-pad,
.slide-outer .slide-stack,
.slide-outer .slide-center,
.slide-outer .slide-white {
  transform-origin: center center;
  transform: scale(var(--s, 1));
  flex-shrink: 0;
}

/* ================================================================ */
/* Maximum OFF — fit viewport but cap at 1200px                     */
/* ================================================================ */
body:not(.maximum):not(.grid-on) .slide-outer.active {
  width: min(100vw, calc(100vh * 16 / 9), 1200px);
}

/* ================================================================ */
/* Maximum ON — fill viewport (aspect-ratio preserved)              */
/* ================================================================ */
body.maximum:not(.grid-on) .slide-outer.active {
  width: min(100vw, calc(100vh * 16 / 9));
}

/* ================================================================ */
/* Grid ON — thumbnail overview                                     */
/* ================================================================ */
body.grid-on {
  overflow: auto;
  height: auto;
  display: block;
  padding: 1.5rem;
  background: #111;
}

body.grid-on .slide-outer {
  position: relative;
  visibility: visible;
  pointer-events: auto;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  cursor: pointer;
  transition: box-shadow 0.15s, outline 0.15s;
  outline: 2px solid transparent;
}

body.grid-on .slide-outer:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  outline-color: var(--color-primary, #2563eb);
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* ================================================================ */
/* Navigation Controls                                              */
/* ================================================================ */
.nav-controls {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.25rem;
  align-items: center;
  background: rgba(0, 0, 0, 0.75);
  padding: 0.375rem;
  border-radius: 2rem;
  color: #fff;
  font-family: system-ui, sans-serif;
  font-size: 0.8rem;
  z-index: 1000;
  user-select: none;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.nav-controls.visible {
  opacity: 1;
  pointer-events: auto;
}

.nav-controls button {
  background: transparent;
  border: none;
  color: #fff;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  position: relative;
}

.nav-controls button:hover {
  background: rgba(255, 255, 255, 0.18);
}

.nav-controls button.active {
  background: rgba(255, 255, 255, 0.22);
}

.nav-controls button svg {
  width: 16px;
  height: 16px;
}

.nav-controls .slide-counter {
  min-width: 3.5rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  opacity: 0.8;
}

.nav-controls .divider {
  width: 1px;
  height: 1.25rem;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 0.125rem;
}

/* -- Home link ---------------------------------------------------- */
.nav-home {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.85rem;
  padding: 0 0.375rem;
  display: flex;
  align-items: center;
}

.nav-home:hover {
  color: #fff;
}

/* -- More menu ---------------------------------------------------- */
.nav-menu {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  right: 0.375rem;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 0.75rem;
  padding: 0.375rem;
  min-width: 10rem;
  display: none;
  flex-direction: column;
  gap: 0.125rem;
}

.nav-menu.open {
  display: flex;
}

.nav-menu button {
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  gap: 0.5rem;
  justify-content: flex-start;
  white-space: nowrap;
}

.nav-menu button svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.nav-menu button .menu-label {
  opacity: 0.9;
}

.nav-menu button .menu-key {
  margin-left: auto;
  opacity: 0.4;
  font-size: 0.7rem;
}

/* ================================================================ */
/* State Badges — visible in grid mode                              */
/* ================================================================ */
.state-badge {
  display: none;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #fff;
  z-index: 10;
  pointer-events: none;
  text-transform: uppercase;
}

body.grid-on .state-badge {
  display: flex;
}

.state-badge[data-badge="generated"] { background: #6b7280; }
.state-badge[data-badge="approved"]  { background: #16a34a; }
.state-badge[data-badge="locked"]    { background: #7c3aed; }
.state-badge[data-badge="derived"]   { background: #3b82f6; }
`;
