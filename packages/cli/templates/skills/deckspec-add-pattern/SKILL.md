---
name: deckspec-add-pattern
description: "Use this skill when the user asks to create a new pattern, add a layout, or make a reusable slide template. Triggers on: 'add pattern', 'create pattern', 'new layout', 'パターン作って', 'レイアウト追加'."
---

# Add Pattern Skill

Create a new reusable pattern in the theme.

## Arguments

The user should specify:
- Pattern name (kebab-case)
- What the pattern displays (layout description)
- Which theme to add it to

## Workflow

### 1. Read the theme's design system (MANDATORY)

**You MUST read these files before writing any code:**

- Read `themes/<theme>/design.md` for design philosophy, rules, forbidden colors, and typography
- Read `themes/<theme>/tokens.json` for colors, fonts, spacing, **and slide dimensions**
- Read `themes/<theme>/globals.css` for available semantic classes
- Look at existing patterns in `themes/<theme>/patterns/` for conventions

### 2. Understand slide constraints

**All slides are rendered at a fixed size defined in `tokens.json`:**

```json
{
  "slide": {
    "width": 1200,
    "height": 675,
    "aspectRatio": "16 / 9"
  }
}
```

**Critical rules:**
- The slide area is exactly `{slide.width}` x `{slide.height}` pixels — content MUST NOT overflow
- The root element must use `className="slide"` (which sets `width`, `height`, and `overflow: hidden`)
- Use `overflow: hidden` on the root or any scrollable container — never allow scroll
- Design for the fixed viewport: limit text lengths, use `max-height`, truncate if needed
- Test with realistic content lengths — not just short placeholder text
- When using flex layouts, ensure items wrap or truncate rather than pushing content off-screen

### 3. Create the pattern

Create `themes/<theme>/patterns/<name>/index.tsx`:

```tsx
import { z } from "zod";
import React from "react";

export const schema = z.object({
  // Define vars with .describe() for clarity
  // Use .max() to prevent overflow — calibrate to slide dimensions
  heading: z.string().max(60).describe("Main heading text"),
  items: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).max(6).describe("List of items to display"),
});

type Props = z.infer<typeof schema>;

export default function PatternName(props: Props) {
  return (
    <div className="slide" style={{ overflow: "hidden" }}>
      <div className="slide-pad slide-stack">
        <h1>{props.heading}</h1>
        {/* Layout using semantic classes */}
      </div>
    </div>
  );
}
```

### 4. Create examples.yaml

Create `themes/<theme>/patterns/<name>/examples.yaml`:

```yaml
- name: "Basic example"
  vars:
    heading: "Example Heading"
    items:
      - label: "Item 1"
        value: "Value 1"
```

### 5. Validate and preview

Create a test deck referencing the new pattern, validate it, and preview with `npx deckspec dev`.
**Visually verify that content does not overflow the 16:9 slide area.**

## Design Rules

### Layout & Dimensions
- **Fixed slide size**: Read `tokens.json` → `slide.width` x `slide.height` (typically 1200x675, 16:9)
- **No overflow**: All content must fit within the slide boundaries. Use `overflow: hidden` on the root
- **Padding**: Use `slide-pad` class or follow theme spacing tokens (typically 48-60px vertical, 60-80px horizontal)
- **Content budget**: Calculate available space = slide size minus padding. Size all elements to fit

### Styling
- Use semantic CSS classes (`.slide-pad`, `.card`, `.list`, etc.) defined in `globals.css`
- Colors via CSS custom properties with **fallback values**: `var(--color-primary, #0071e3)` — never hardcode hex without fallback
- Follow `design.md` color palette and forbidden color rules strictly
- Minimum font size: 16px
- No serif fonts
- No Tailwind CSS
- No pure black (`#000000`) for text — use `var(--color-foreground, #1d1d1f)`
- No pure white (`#ffffff`) for backgrounds — use `var(--color-background, #f5f5f7)`

### Text with Line Breaks
- YAML strings use `\n` for line breaks: `"Line 1\nLine 2"`
- In the component, split and render with `<br />`:
  ```tsx
  {text.split("\\n").map((line, i) => (
    <span key={i}>{i > 0 && <br />}{line}</span>
  ))}
  ```
- Document `\n` support in the schema `.describe()`: `z.string().describe("Headline (supports \\n for line breaks)")`

### Auto-Injected Props
- `_slideIndex` (0-based) and `_slideTotal` are auto-injected by DeckSpec at render time
- Patterns can use these for page numbers without requiring them in vars/schema
- Access via props: `props._slideIndex + 1` for human-readable page number

### Schema
- Export both `schema` (Zod) and `default` (React component)
- Use `.describe()` on all Zod fields for AI-friendly documentation
- Use `.max()` on strings and arrays to prevent content overflow
- Calibrate max lengths to the available slide space
