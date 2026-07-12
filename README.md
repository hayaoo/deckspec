# DeckSpec

**AI-generated, schema-driven, human-approved.**

Programmable presentation platform. Write YAML, validate with Zod, render with React SSR.

DeckSpec is a **design harness for slides** — it surrounds an AI agent with the constraints, context, verification, and evaluation it needs to produce on-brand decks that stay consistent as they grow. AI generates the content, schemas enforce structure, the linter evaluates the design, and humans approve the result.

## The Design Harness

A design harness is the environment that keeps an AI on-spec: not a prompt, but machine-readable rules plus automated checks. DeckSpec implements four layers:

| Layer | Role | Where it lives | Enforced by |
|-------|------|----------------|-------------|
| **Constraints** | What is structurally allowed | Zod pattern schemas + theme tokens (`tokens.json`) | Type/shape validation |
| **Context** | When to reach for each pattern | `design.md` + `harness.json` (`whenToUse`) + `examples.yaml` | AI few-shot / catalog |
| **Verification** | Is the deck structurally valid | `deckspec validate` | Zod |
| **Evaluation** | Does it follow the design rules | `deckspec lint` | `harness.json` rules |

The loop:

```
AI generates → schema validates → lint evaluates → human approves
```

`harness.json` (per theme) makes the design system's forbidden colors, allowed font weights, minimum font size, shadow limits, character budgets, and per-pattern usage machine-readable — so `deckspec lint` can catch design drift (the "AI-generated look", inconsistency that creeps in as slide count grows) that prose guidelines and Zod schemas miss.

## Theme-Bundled Image Skills

Design consistency extends to imagery. A theme declares its image language in the same `harness.json`: which **provider** generates images (the subscription **codex CLI** or the **Gemini API**) and two machine-readable **style recipes** — `photo` (clean, minimal product-style photography) and `diagram` (flat thin-line illustration). Theme-bundled skills (`deckspec-image-photo`, `deckspec-image-diagram`, copied into `.claude/skills/` on `init`) read this section and enforce the visual language, so images stay on-brand as a deck grows.

```jsonc
// themes/<theme>/harness.json
"images": {
  "provider": "codex",                     // or "gemini"
  "outputDir": "decks/{deck}/assets",
  "noTextInImages": true,                  // text lives in slide vars, never baked into pixels
  "styles": {
    "photo":   { "stylePrompt": "…", "negativePrompt": "…", "background": "#f5f5f7" },
    "diagram": { "stylePrompt": "…", "negativePrompt": "…", "background": "#ffffff" }
  }
}
```

The skills carry no theme-specific values — they always read `harness.json` and follow it. So a theme author defines their own image language by **swapping the `styles` recipes** (and the provider) in `harness.json`; the skills need no edits.

## How It Works

```
deck.yaml (YAML DSL)
  → @deckspec/dsl (parse + resolve)
    → Zod validation (pattern schema)
      → React SSR (pattern component)
        → standalone HTML with viewer
```

**The 2-Layer Model:**

| Layer | Role | Contents | Who Touches It |
|-------|------|----------|----------------|
| **Theme** | Design system | Colors, fonts, CSS, patterns (.tsx + Zod) | Theme developers |
| **Deck** | Presentation content | deck.yaml (reference patterns with vars) | Presentation authors (or AI agents) |

Patterns encapsulate all HTML/React/Zod complexity. Deck authoring is YAML-only.

## Quick Start

```bash
# Install
npm install -g @deckspec/cli

# Initialize a project with a theme
deckspec init --theme noir-display

# Start the dev server
deckspec dev

# Open http://localhost:3002
```

## YAML DSL

```yaml
meta:
  title: "Q4 Sales Review"
  theme: noir-display
slides:
  - file: title-center
    vars:
      title: "Q4 2025 Sales Review"
      subtitle: "Exceeding targets"
  - file: feature-metrics
    vars:
      headline: "Revenue Growth"
      metrics:
        - label: Revenue
          value: "$12.4M"
        - label: Growth
          value: "+34%"
  - file: three-pillars
    vars:
      heading: "Strategic Priorities"
      pillars:
        - title: "Expand"
          description: "Enter 3 new markets"
        - title: "Optimize"
          description: "Reduce CAC by 20%"
        - title: "Retain"
          description: "95% renewal rate"
```

## Patterns

Patterns are reusable slide layouts defined as React components with Zod schemas.

Each pattern lives in `themes/<theme>/patterns/<name>/`:

| File | Required | Purpose |
|------|----------|---------|
| `index.tsx` | Yes | React component + `export const schema` (Zod) |
| `style.css` | No | Pattern-specific styles |
| `examples.yaml` | No | Usage examples (AI few-shot / catalog) |

### File Resolution

| Priority | `file:` value | Resolves to |
|----------|--------------|-------------|
| 1 | `my-pattern` | `decks/{deck}/patterns/my-pattern/index.tsx` (deck-local) |
| 2 | `title-center` | `themes/{theme}/patterns/title-center/` (theme pattern) |

Deck-local patterns (.tsx) are compiled on-the-fly with esbuild. No build step needed.

## Themes

A theme is a design system: colors, fonts, CSS, and patterns.

```
themes/noir-display/
  tokens.json       — Colors, fonts, spacing
  globals.css       — Semantic CSS classes
  design.md         — Design philosophy (AI context)
  harness.json      — Machine-readable design rules (deckspec lint)
  skills/           — Theme-bundled skills (image generation, etc.)
  components/       — Shared UI parts
  patterns/         — Reusable slide layouts
```

After `deckspec init`, the theme is copied locally. You own it — customize colors, fonts, and patterns freely.

## CLI Commands

```bash
deckspec init [dir] --theme <name>   # Scaffold a new project
deckspec validate <deck.yaml>        # Validate with Zod
deckspec lint <deck.yaml>            # Evaluate composition + patterns vs design rules
deckspec render <deck.yaml> -o out   # Render to HTML
deckspec dev [dir]                   # Dev server with live preview
deckspec patterns [--theme <name>]   # List available patterns
deckspec approve <deck.yaml> --slide N   # Approve a slide
deckspec lock <deck.yaml> --slide N --name <name>  # Lock as pattern
```

## Slide Approval Workflow

| State | Meaning | Transitions |
|-------|---------|-------------|
| `generated` | AI-generated (default) | → approved |
| `derived` | Derived from approved template | → approved |
| `approved` | Human-approved | → locked |
| `locked` | Patterned (immutable) | — |

## AI Agent Integration

DeckSpec is designed to be used by AI agents (Claude Code, etc.):

1. AI reads `CLAUDE.md`, `themes/<theme>/design.md`, and `harness.json` for context
2. AI writes `deck.yaml` using available patterns and vars
3. AI runs `deckspec validate` (structure) and `deckspec lint` (design) and fixes issues
4. Human previews with `deckspec dev` and approves slides
5. Approved patterns are locked and reused across decks

### What `deckspec init` generates

`deckspec init` scaffolds everything an AI agent needs:

- **`CLAUDE.md`** — YAML DSL spec, pattern catalog, CLI usage
- **`.claude/skills/`** — ready-to-use Claude Code skills (5 generic + any the theme bundles):

| Skill | Trigger | What it does |
|-------|---------|-------------|
| `deckspec-make-slides` | "make slides", "create presentation" | End-to-end deck creation: YAML authoring → validate → render → preview |
| `deckspec-add-pattern` | "add pattern", "new layout" | Guided creation of reusable theme patterns |
| `deckspec-screenshot` | "screenshot", "capture slides" | Export slides as PNG images via Playwright |
| `deckspec-to-pptx` | "PowerPoint", "pptx" | Convert deck.yaml to .pptx via pptxgenjs |
| `deckspec-promote-pattern` | "promote pattern", "elevate to theme" | Interactive promotion of deck-local patterns to theme patterns |
| `deckspec-image-photo` | "generate a photo", "写真を生成" | *Theme-bundled.* Photographic images following the theme's `harness.json` image language |
| `deckspec-image-diagram` | "generate a diagram", "図解画像を作って" | *Theme-bundled.* Flat thin-line diagrams following the theme's `harness.json` image language |

Just run `deckspec init`, open Claude Code, and say "make slides about X" — the AI knows the DSL, the available patterns, and the full workflow.

## Technology Stack

- TypeScript (strict), Zod, js-yaml
- React + react-dom (pattern SSR only)
- esbuild (on-the-fly .tsx compilation)
- CSS custom properties + semantic classes
- pnpm + Turborepo

## Development

```bash
git clone https://github.com/hayaoo/deckspec
cd deckspec
pnpm install
pnpm build
pnpm test
pnpm dev   # http://localhost:3002
```

## Packages

| Package | Description |
|---------|-------------|
| `@deckspec/cli` | CLI: init, validate, render, dev, approve, lock, patterns |
| `@deckspec/dsl` | YAML parser + validator + file resolution |
| `@deckspec/schema` | Base Zod schemas + utilities |
| `@deckspec/renderer` | Pattern SSR + viewer generation + esbuild compilation |
| `@deckspec/theme-noir-display` | Default theme — dark, minimal, Apple-inspired |

## License

Apache-2.0. See [LICENSE](./LICENSE).
