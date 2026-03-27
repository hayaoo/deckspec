---
name: deckspec-to-pptx
description: "Use this skill when the user asks to convert a DeckSpec deck to PowerPoint (.pptx). Triggers on: 'PowerPoint', 'pptx', 'convert to pptx', 'export to PowerPoint', 'パワポ', 'パワーポイント'."
---

# Deck to PowerPoint Skill

Convert a DeckSpec deck.yaml to a PowerPoint (.pptx) file.

## How It Works

The conversion script (`deck-to-pptx.mjs`) reads `deck.yaml`, looks up each slide's `file:` pattern name in a `renderers` registry, and calls the matching renderer function to build the slide using pptxgenjs.

**Patterns without a registered renderer produce blank slides with a warning.** When you encounter this, you need to add a renderer function for that pattern.

## Prerequisites

- pptxgenjs installed: `npm install -D pptxgenjs`

## Workflow

### 1. Run the conversion

```bash
node .claude/skills/deckspec-to-pptx/deck-to-pptx.mjs decks/<deck-name>/deck.yaml -o output/<deck-name>.pptx
```

### 2. Check for warnings

```
⚠ No pptx renderer for pattern "my-pattern" — blank slide
```

If you see this, add a renderer for that pattern (see "Adding a Renderer" below).

### 3. Open and verify

Open the .pptx in PowerPoint, Keynote, or Google Slides to verify.

## Adding a Renderer

When a pattern has no pptx renderer, you need to add one in `deck-to-pptx.mjs`.

### Step 1: Read the pattern's React source

Look at `themes/<theme>/patterns/<name>/index.tsx` to understand:
- The Zod schema (what `vars` are available)
- The layout structure (CSS classes, grid, cards, etc.)
- What content goes where

### Step 2: Write the renderer function

Add a function in the `// ─── Slide renderers ───` section of `deck-to-pptx.mjs`:

```javascript
function renderMyPattern(slide, vars) {
  const padX = px(64);  // horizontal padding
  const padY = px(48);  // vertical padding

  // Label (small uppercase text at top)
  if (vars.label) {
    slide.addText(vars.label.toUpperCase(), {
      x: padX, y: padY, w: W - 2 * padX, h: 0.2,
      fontSize: 9, fontFace: FONT_B, bold: true,
      color: C.primary, charSpacing: 1.5, margin: 0,
    });
  }

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY + 0.25, w: W - 2 * padX, h: 0.35,
    fontSize: 18, fontFace: FONT_H, bold: true,
    color: C.fg, margin: 0,
  });

  // ... add more elements
}
```

### Step 3: Register the renderer

Add it to the `renderers` object at the bottom of the file:

```javascript
const renderers = {
  // ... existing renderers
  "my-pattern": renderMyPattern,
};
```

### Step 4: Re-run and verify

```bash
node .claude/skills/deckspec-to-pptx/deck-to-pptx.mjs decks/<deck>/deck.yaml -o output/<deck>.pptx
```

## PptxGenJS API Reference

### Available Constants

| Constant | Description |
|----------|-------------|
| `C.primary` | Primary color (hex without #) |
| `C.fg` | Foreground/text color |
| `C.bg` | Background color |
| `C.muted` | Muted text color |
| `C.border` | Border color |
| `C.card` | Card background color |
| `FONT_H` | Heading font (Noto Sans JP) |
| `FONT_B` | Body font (Noto Sans JP) |
| `W` | Slide width in inches (10) |
| `H` | Slide height in inches (5.625) |
| `px(v)` | Convert CSS pixels to inches (1200px = 10in) |

### Core Methods

```javascript
// Text
slide.addText("Hello", {
  x: px(64), y: px(48), w: 5, h: 0.4,
  fontSize: 18, fontFace: FONT_H, bold: true,
  color: C.fg, align: "center", valign: "middle",
  margin: 0,
});

// Rich text (multiple styles in one box)
slide.addText([
  { text: "Bold part", options: { bold: true, fontSize: 14, color: C.fg } },
  { text: " normal part", options: { fontSize: 12, color: C.muted } },
], { x: 1, y: 1, w: 8, h: 0.5, margin: 0 });

// Shape
slide.addShape(pres.shapes.RECTANGLE, {
  x: 1, y: 1, w: 3, h: 2,
  fill: { color: C.card },
  line: { color: C.border, width: 1 },
});

// Line
slide.addShape(pres.shapes.LINE, {
  x: 1, y: 1, w: 5, h: 0,  // horizontal line (h=0)
  line: { color: C.border, width: 0.5 },
});

// Circle/Oval
slide.addShape(pres.shapes.OVAL, {
  x: 1, y: 1, w: 1, h: 1,
  fill: { color: C.bg },
  line: { color: C.fg, width: 1.5 },
});

// Table
slide.addTable(rows, {
  x: px(64), y: 1, w: W - 2 * px(64),
  colW: [1.5, 3, 3],
  border: { type: "solid", pt: 0.5, color: C.border },
  rowH: [0.4, 0.35, 0.35],
  margin: [4, 8, 4, 8],
  autoPage: false,
});

// Image (base64)
slide.addImage({
  data: "image/png;base64,...",
  x: 1, y: 1, w: 4, h: 3,
});
```

### Important Rules

1. **Colors are 6-char hex WITHOUT `#`** — `"E5001F"` not `"#E5001F"`
2. **Use `charSpacing` not `letterSpacing`** — pptxgenjs uses its own property name
3. **Always set `margin: 0`** on text boxes for precise alignment
4. **Never reuse option objects** between `addText`/`addShape` calls — pptxgenjs mutates them
5. **`breakLine: true`** in rich text options to force line break after that segment
6. **`strike: true`** for strikethrough text (useful for "before" prices)
7. **`highlight: "FF0000"`** to add text highlight/background color on rich text segments

### Common Layout Patterns

**Label + Heading + Content** (most common):
```javascript
// Top: small label
// Below: large heading
// Rest: content area
const padX = px(64);
const padY = px(48);
const contentTop = padY + 0.85;  // below heading
const contentBot = H - padY;
```

**Card Grid**:
```javascript
const items = vars.items;
const gap = px(1);
const cardW = (W - 2 * padX - gap * (items.length - 1)) / items.length;

items.forEach((item, i) => {
  const cx = padX + i * (cardW + gap);
  slide.addShape(pres.shapes.RECTANGLE, {
    x: cx, y: cardTop, w: cardW, h: cardH,
    fill: { color: C.card },
  });
  // Add text inside card...
});
```

**Two-Column Layout**:
```javascript
const leftW = (W - 2 * padX) * 0.5;
const rightX = padX + leftW + px(48);
const rightW = W - rightX - padX;
```

### Helper Functions

```javascript
// resolveImage(filename) — converts local file to base64 data URI
const imgData = resolveImage(vars.image);
if (imgData) {
  slide.addImage({ data: imgData, x: 1, y: 1, w: 4, h: 3 });
}

// getImageSize(filename) — returns { w, h } in pixels (macOS sips)
const size = getImageSize(vars.image);

// containImage(imgW, imgH, boxW, boxH) — fit preserving aspect ratio
const fit = containImage(size.w, size.h, boxW, boxH);
slide.addImage({
  data: imgData,
  x: boxX + fit.offX, y: boxY + fit.offY,
  w: fit.w, h: fit.h,
});
```

## Registered Renderers

The following patterns have pptx renderers pre-built:

| Pattern | Layout |
|---------|--------|
| `price-before-after` | Before→After price comparison cards |
| `comparison-table` | Multi-column table with icon indicators |
| `image-full` | Header + full-width image |
| `conclusion-summary` | Logo + heading + summary points |
| `closing-triad` | Two-column: message + triangle diagram |

All other patterns will produce blank slides until you add a renderer.
