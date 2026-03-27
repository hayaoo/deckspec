---
name: deckspec-screenshot
description: "Use this skill when the user asks to screenshot, capture, or photograph slides from a DeckSpec deck. Triggers on: 'screenshot', 'capture slides', 'save slide images', 'スクリーンショット', 'スライド撮影'."
---

# Screenshot Deck Skill

Capture all slides of a DeckSpec deck as individual PNG images (1200x675, 16:9).

## Prerequisites

- Playwright installed: `npm install -D playwright && npx playwright install chromium`

## Workflow

### 1. Render the deck to HTML

```bash
npx deckspec render decks/<deck-name>/deck.yaml -o output/<deck-name>
```

### 2. Run the screenshot script

```bash
node scripts/screenshot-deck.mjs output/<deck-name>/index.html output/<deck-name>-slides
```

This will:
- Open the HTML in headless Chromium at 1200x675 viewport
- Hide navigation controls
- Screenshot each slide as `slide-01.png`, `slide-02.png`, etc.

### 3. Verify

Read the generated PNG files to visually confirm the output.

## Output

- `output/<deck-name>-slides/slide-01.png`
- `output/<deck-name>-slides/slide-02.png`
- Each image is 1200x675px PNG (16:9)
