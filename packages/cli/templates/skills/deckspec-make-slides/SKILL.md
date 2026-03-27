---
name: deckspec-make-slides
description: "Use this skill when the user asks to create a presentation, make slides, build a deck, or write deck.yaml. Triggers on: 'make slides', 'create presentation', 'build a deck', 'プレゼン作って', 'スライド作って', 'デッキ作って'."
---

# Make Slides Skill

Create a DeckSpec presentation from a user request.

## Workflow

### 1. Understand the request
- What is the presentation about?
- How many slides?
- What tone? (business, technical, casual)

### 2. Check available patterns
Run: `npx deckspec patterns --examples`
Read: `themes/*/design.md` for design philosophy and pattern catalog.

### 3. Create deck.yaml

Create `decks/<deck-name>/deck.yaml`:

```yaml
meta:
  title: "Presentation Title"
  theme: noir-display
slides:
  - file: <pattern-name>
    vars:
      # ... content
```

**Pattern selection guide:**
- Opening: `title-center` or `hero-statement`
- Data/metrics: `feature-metrics`, `big-number`, `chart-bar`
- Comparison: `comparison-columns`, `pricing-tiers`
- Process/flow: `flow-diagram`, `three-pillars`
- Content: `bullet-list`, `icon-grid`
- Closing: `thank-you`

### 4. Validate
```bash
npx deckspec validate decks/<deck-name>/deck.yaml
```
Fix any schema errors.

### 5. Preview
```bash
npx deckspec dev
```
Open http://localhost:3002 and navigate to the deck.

### 6. Iterate
Ask the user for feedback and adjust slides accordingly.

## If no existing pattern fits

Create a deck-local pattern at `decks/<deck-name>/patterns/<name>/index.tsx`:
- Export `schema` (Zod) and `default` (React component)
- Use semantic CSS classes from the theme's `globals.css`
- Do NOT hardcode colors — use CSS custom properties
- The pattern is compiled on-the-fly with esbuild, no build step needed

## Rules
- Always validate before presenting to the user
- Use pattern `examples.yaml` as reference for vars structure
- Minimum font size: 16px, no serif fonts
- Colors via CSS custom properties only
