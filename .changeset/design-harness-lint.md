---
"@deckspec/cli": minor
"@deckspec/dsl": minor
"@deckspec/schema": minor
"@deckspec/renderer": minor
"@deckspec/theme-noir-display": minor
---

デザインハーネスレイヤーを追加。制約・文脈・検証に加え「評価」層を導入する。

- **`deckspec lint <deck.yaml>`**: デッキ構成とデッキローカルパターン(.tsx)を、テーマの機械可読ルール (`harness.json`) で評価する新コマンド。連続パターン・文字量超過・vars への色/生HTML混入を検出し、パターンソースの禁止色・font-weight・影・最小フォントサイズ・禁止フォントを静的検査する。`--theme` でテーマ自身のパターンをセルフチェック、`--strict` (CI 用)、`--json` (エージェント向け) に対応。harness.json が無いテーマではスキップして後方互換を保つ。
- **`@deckspec/schema`**: `harnessSchema` と型を追加（全フィールド optional の寛容なスキーマ）。
- **`@deckspec/theme-noir-display`**: `harness.json`（機械可読デザインルール）と、全17パターンの `examples.yaml`（AI few-shot カタログ）を追加。
- `deckspec init` テンプレートに harness.json / examples.yaml を同期。make-slides / add-pattern スキルに lint ステップを追加。
