// Types
export type {
  SlideValidationResult,
  ValidationResult,
} from "./types.js";

// Parser
export {
  parseDeckYaml,
  loadDeckFile,
  resolveSlideFile,
  type ResolvedSlideFile,
} from "./parser.js";

// Validator
export { validateDeck, type ValidationContext } from "./validator.js";

// State mutations
export {
  approveSlide,
  rejectSlide,
  archiveDeck,
  activateDeck,
  lockSlide,
} from "./state.js";

// Scanner
export { scanDecks, type DeckSummary, type SlideSummary } from "./scanner.js";
