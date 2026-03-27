---
name: deckspec-promote-pattern
description: "Use this skill when the user asks to promote, elevate, or graduate a deck-local pattern to a theme pattern. Triggers on: 'promote pattern', 'elevate to theme', 'make it reusable', 'add to theme', 'graduate pattern', 'パターン昇格', 'テーマに昇格', or any request to move a deck-local pattern into the theme."
---

# Promote Pattern Skill

Promote a deck-local pattern to a theme pattern. Abstract hardcoded values into vars, making it a reusable, generic pattern.

## Arguments

```
/promote-pattern <deck-pattern-path> [--theme <theme-name>]
```

| Argument | Default | Description |
|----------|---------|-------------|
| `deck-pattern-path` | (required) | Path to the deck-local pattern (e.g., `decks/my-project/patterns/product-comparison`) |
| `--theme` | `noir-display` | Target theme name |

## Workflow

This skill proceeds **interactively**. Each step asks for user confirmation before moving on.

### Phase 1: Analysis

1. Read the specified deck-local pattern's `index.tsx`
2. Analyze the source code to identify:
   - **Hardcoded values**: text strings, numbers, currency symbols, proper nouns, industry terms
   - **Domain-specific variable names**: names tied to a particular domain (e.g., `products` → `items`, `competitors` → `columns`)
   - **Domain-specific logic**: fixed format functions (e.g., hardcoded currency locale)
   - **Values already in vars**: can be kept as-is
3. Present the analysis to the user

### Phase 2: Interactive design decisions

**All design decisions use `AskUserQuestion` with `options`.** Let the user click choices rather than type free text.

#### 2a. Pattern name

`AskUserQuestion` with candidates:
- header: "Pattern name"
- options: suggested names (mark recommended with `(Recommended)`) + 2-3 alternatives
- e.g., `["product-comparison (Recommended)", "feature-grid", "data-table"]`

#### 2b. Hardcoded value → vars decisions

For each detected hardcoded value, use `AskUserQuestion`:
- header: "Hardcoded value"
- question: `"Total" (table footer label) — what should we do?`
- options:
  - `Add to vars: footerLabel (string, optional)` — recommended
  - `Keep hardcoded`
  - `Remove`

For many values, use `multiSelect: true` for batch selection:
- question: `Which hardcoded values should become vars?`
- options: list each value

#### 2c. Variable renaming

`AskUserQuestion`:
- header: "Rename vars"
- options:
  - `Apply suggested renames (Recommended)` — description lists the rename map
  - `Keep current names`

#### 2d. Extra options

`AskUserQuestion` with `multiSelect: true`:
- header: "Extra options"
- question: `Select additional options to add`
- options: each candidate option with description

### Phase 3: Implementation

Based on user answers:

1. **Create pattern file**: `themes/{theme}/patterns/{new-name}/index.tsx`
   - Replace hardcoded values with vars
   - Rename variables as agreed
   - Implement extra options
   - Add `.describe()` to all Zod schema fields

2. **Create examples.yaml**: `themes/{theme}/patterns/{new-name}/examples.yaml`
   - First example: the original deck's vars (proof it works as-is)
   - Second example: usage in a different domain (proof of generality)
   - Third example (optional): demonstrate optional features

3. **Update index.ts**: Add re-export to `themes/{theme}/patterns/index.ts`

4. **Update design.md**: Add the pattern to the catalog section with vars spec

### Phase 4: Verification

1. Run `pnpm build` to confirm the theme builds
2. Create a test deck with examples.yaml vars, run `npx deckspec validate` + `npx deckspec render`
3. Take screenshots and present to user
4. Fix issues based on user feedback

### Phase 5: Old pattern disposition

`AskUserQuestion`:
- header: "Old pattern"
- question: `What should we do with the original deck-local pattern?`
- options:
  - `Keep it (Recommended)` — description: maintains backward compatibility
  - `Delete and update deck.yaml` — description: replace with new theme pattern name

## Analysis hints

### Detecting hardcoded values
- String literals in the target language (any natural language text)
- Currency/unit symbols (`"$"`, `"%"`, `"EUR"`, etc.)
- Fixed locale strings (e.g., `"en-US"` in `.toLocaleString()`)
- Hardcoded CSS colors (`"#xxx"` — anything not using `var()`)
- Fixed number formatting

### Naming conventions
- Pattern names: kebab-case, replace domain terms with generic ones (e.g., `product-comparison` → `comparison-table`)
- Var names: camelCase, use `.describe()` in Zod schema
- Array names: plural (`rows`, `columns`, `items`)

### examples.yaml best practices
- Example 1: original deck's real data (proof of migration)
- Example 2: different domain usage (proof of generality)
- Example 3: optional feature showcase (e.g., `showTotal: false`)

## Important notes

- Read the target theme's `design.md` first to understand design rules
- Keep var naming consistent with existing patterns (`label`, `heading`, etc.)
- If the pattern uses theme utilities like `_lib/icon.tsx`, verify they exist in the target theme
