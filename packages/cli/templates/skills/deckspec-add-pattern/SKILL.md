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

### 1. Read the theme's design system
- Read `themes/<theme>/design.md` for design philosophy and rules
- Read `themes/<theme>/tokens.json` for colors, fonts, spacing
- Read `themes/<theme>/globals.css` for available semantic classes
- Look at existing patterns for conventions

### 2. Create the pattern

Create `themes/<theme>/patterns/<name>/index.tsx`:

```tsx
import { z } from "zod";
import React from "react";

export const schema = z.object({
  // Define vars with .describe() for clarity
  heading: z.string().describe("Main heading text"),
  items: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).describe("List of items to display"),
});

type Props = z.infer<typeof schema>;

export default function PatternName(props: Props) {
  return (
    <div className="slide-pad slide-stack">
      <h1>{props.heading}</h1>
      {/* Layout using semantic classes */}
    </div>
  );
}
```

### 3. Create examples.yaml

Create `themes/<theme>/patterns/<name>/examples.yaml`:

```yaml
- name: "Basic example"
  vars:
    heading: "Example Heading"
    items:
      - label: "Item 1"
        value: "Value 1"
```

### 4. Validate and preview

Create a test deck referencing the new pattern, validate it, and preview with `npx deckspec dev`.

## Design Rules
- Use semantic CSS classes (`.slide-pad`, `.card`, `.list`, etc.)
- Colors via CSS custom properties (`var(--color-primary)`) — never hardcode hex
- Minimum font size: 16px
- No serif fonts
- No Tailwind CSS
- Export both `schema` (Zod) and `default` (React component)
- Use `.describe()` on Zod fields for AI-friendly documentation
