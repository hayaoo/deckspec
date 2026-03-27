# Contributing to DeckSpec

Thank you for your interest in contributing to DeckSpec!

## Development Setup

```bash
git clone https://github.com/hayaoo/deckspec
cd deckspec
pnpm install
pnpm build
pnpm test
```

### Dev Server

```bash
pnpm dev
# Open http://localhost:3002
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Run tests (`pnpm test`) and type check (`pnpm typecheck`)
5. Commit with a descriptive message
6. Push to your fork and open a PR

## Creating a Pattern

Patterns live in `themes/<theme>/patterns/<name>/`:

```
themes/noir-display/patterns/my-pattern/
  index.tsx          # React component + Zod schema
  examples.yaml      # Usage examples (optional)
  style.css          # Pattern-specific styles (optional)
```

### Pattern Structure

```tsx
import { z } from "zod";
import React from "react";

export const schema = z.object({
  heading: z.string(),
  items: z.array(z.string()),
});

type Props = z.infer<typeof schema>;

export default function MyPattern(props: Props) {
  return (
    <div className="slide-pad slide-stack">
      <h1>{props.heading}</h1>
      <ul className="list">
        {props.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Rules

- Use semantic CSS classes (`.slide-pad`, `.card`, etc.) — no Tailwind
- Colors via CSS custom properties — no hardcoded hex values
- Minimum font size: 16px
- No serif fonts
- Export both `schema` (Zod) and `default` (React component)

## Code Style

- TypeScript strict mode
- ESM modules
- 2-space indent for YAML
- Tests colocated: `*.test.ts`

## License

By contributing, you agree that your contributions will be licensed under Apache-2.0.
