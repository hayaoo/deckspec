export {
  loadThemeTokens,
  loadThemeCSS,
  resolveThemePatternsDir,
  resolveThemePatternsSrcDir,
  extractThemeName,
  type ThemeTokens,
} from "./theme.js";
export { renderSlide, type RenderSlideContext } from "./render-slide.js";
export {
  resolveAssets,
  sanitizeSvg,
  type AssetFieldSpec,
} from "./resolve-assets.js";
export { renderDeck } from "./render-deck.js";
export {
  renderDashboard,
  type DeckWithPreviews,
  type SlidePreview,
  type ThemeSummary,
} from "./render-dashboard.js";
export { renderThemeDetail } from "./render-theme-detail.js";
export {
  compileTsx,
  compileTsxCached,
  clearCompileCache,
} from "./compile-tsx.js";
