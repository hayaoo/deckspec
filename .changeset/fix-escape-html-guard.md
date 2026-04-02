---
"@deckspec/renderer": patch
"@deckspec/cli": patch
---

fix: escapeHtml の undefined 防御 + dev サーバーのスタックトレース出力改善

- tokens.json に displayName がないテーマがあるとダッシュボードが 500 エラーでクラッシュする問題を修正
- dev サーバーのエラーハンドラーでスタックトレースが出力されるよう改善
