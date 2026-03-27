---
name: deckspec-to-pptx
description: "Use this skill when the user asks to convert a DeckSpec deck to PowerPoint (.pptx). Triggers on: 'PowerPoint', 'pptx', 'convert to pptx', 'export to PowerPoint', 'パワポ', 'パワーポイント'."
---

# Deck to PowerPoint Skill

Convert a DeckSpec deck.yaml to a PowerPoint (.pptx) file.

## Prerequisites

- pptxgenjs installed: `npm install -D pptxgenjs`

## Workflow

### 1. Run the conversion

```bash
node scripts/deck-to-pptx.mjs decks/<deck-name>/deck.yaml -o output/<deck-name>.pptx
```

### 2. Check for warnings

The script warns for unregistered patterns: `⚠ No pptx renderer for pattern "<name>" — blank slide`

To fix, add a renderer function in `scripts/deck-to-pptx.mjs`.

### 3. Open and verify

Open the .pptx in PowerPoint or Google Slides to verify.

## Notes

- Colors and fonts are loaded from `themes/<theme>/tokens.json`
- Local images are embedded as base64
- Not all patterns have pptx renderers yet — unregistered patterns produce blank slides
