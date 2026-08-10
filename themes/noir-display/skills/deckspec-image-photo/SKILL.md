---
name: deckspec-image-photo
description: "Use this skill when the user asks to generate a photographic image for a slide — clean, minimal product-style photography that matches the theme. Triggers on: 'generate a photo', 'make a product shot', 'hero image', 'photo for this slide', '写真を生成', '写真を作って', '物撮り画像'."
---

# Image Skill — Photo

Generate a **photographic** image whose visual language is defined by the active
theme, so photos stay consistent across every deck. This skill owns none of the
style itself — it reads the theme's `harness.json` and follows it. To change the
look, edit `themes/<theme>/harness.json` → `images.styles.photo`, not this file.

## Workflow

### 1. Read the theme's image rules (MANDATORY)

Read `themes/<theme>/harness.json` and locate the `images` section:

- `images.provider` — which generator to use (`codex` or `gemini`)
- `images.providers` — provider-specific config (notes, model)
- `images.styles.photo` — `stylePrompt`, `negativePrompt`, `background`, `aspectRatios`
- `images.outputDir` — where to write the file (e.g. `decks/{deck}/assets`)
- `images.noTextInImages` — whether generated images must be text-free

If the theme has no `images` section, tell the user this theme does not declare an
image language and stop.

### 2. Build the prompt

Compose the final prompt from the theme's recipe plus the user's subject:

```
<images.styles.photo.stylePrompt> + ", " + <subject described by the user>
```

- Attach the style's `negativePrompt` as the negative / "avoid" prompt.
- If `images.noTextInImages` is true, **always append** `no text, no letters, no typography`
  to the prompt (and keep those terms in the negative prompt).
- Pick an aspect ratio from `images.styles.photo.aspectRatios` — default to the
  first entry (usually `16:9`) unless the slide pattern needs another (e.g. `1:1`).
- Do not restate the theme's colors or mood in your own words — use the
  `stylePrompt` verbatim so the visual language does not drift.

### 3. Generate (provider branch)

Read `images.provider` and use the matching branch.

**provider: codex**

Generate with the codex CLI (subscription, gpt-image family). CLI flags differ
between versions, so **run `codex --help` first and confirm the exact image-output
flag** — do not rely on a hard-coded flag guessed here.

```bash
# Illustrative only — verify flags with `codex --help` before running:
codex exec "Generate an image: <full prompt>. Avoid: <negative prompt>" --output decks/<deck>/assets/<name>.png
```

**provider: gemini**

Use the Gemini API. Require `GEMINI_API_KEY` — if it is unset, stop and tell the
user to export it before retrying. Use the model from
`images.providers.gemini.model` (do not hard-code the model name).

```bash
# Model comes from harness.json → images.providers.gemini.model
curl -s "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{ "parts": [{ "text": "<full prompt>. Avoid: <negative prompt>" }] }],
    "generationConfig": { "responseModalities": ["IMAGE"] }
  }'
# Decode the returned inlineData (base64) and write it to the output path.
```

### 4. Save

Write to the `images.outputDir` convention, e.g. `decks/<deck>/assets/<name>.png`.
Reference it from `deck.yaml` with a **relative** path in the pattern's image var
(e.g. `photo-split`'s `image`).

### 5. Preview and self-correct

Run `npx deckspec dev` and inspect the slide. If the image drifts from the theme
(wrong background color, text baked in, over-saturated), regenerate with the same
prompt recipe — do not loosen the style to accommodate a bad generation.

## Consistency rules

- Never rewrite or paraphrase the theme's `stylePrompt` / `negativePrompt` — pass
  them through unchanged.
- The image background must match `images.styles.photo.background`.
- **No text inside images.** All words belong in the slide's `vars` (rendered with
  the brand font by the pattern), never baked into the pixels. Modern generators
  (gpt-image, Gemini) render text accurately, but baked-in text still can't use the
  theme's fonts/tokens and can't be edited, translated, or linted afterwards.
  (Diffusion-based providers additionally garble text.)
- If a deck mixes photo and diagram images, each keeps its own style's background;
  do not unify them.
