---
"@deckspec/cli": patch
"@deckspec/dsl": patch
"@deckspec/schema": patch
"@deckspec/renderer": patch
"@deckspec/theme-noir-display": patch
---

`deckspec init` で生成される `package.json` のテンプレートを修正:

- `@deckspec/cli` の semver range を `^0.1.0` → `^0.2.0` に更新 (^0.1.0 では現行 0.2.x が解決できなかった)
- `lucide-react` の semver range を `^0.469.0` → `^1.7.0` に更新し、テーマパッケージの依存と整合
