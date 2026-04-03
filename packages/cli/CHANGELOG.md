# @deckspec/cli

## 0.1.13

### Patch Changes

- [`4948ef3`](https://github.com/hayaoo/deckspec/commit/4948ef369fea5694032518083f722e8f88f27cf5) Thanks [@hayaoo](https://github.com/hayaoo)! - fix: escapeHtml の undefined 防御 + dev サーバーのスタックトレース出力改善

  - tokens.json に displayName がないテーマがあるとダッシュボードが 500 エラーでクラッシュする問題を修正
  - dev サーバーのエラーハンドラーでスタックトレースが出力されるよう改善

- Updated dependencies [[`4948ef3`](https://github.com/hayaoo/deckspec/commit/4948ef369fea5694032518083f722e8f88f27cf5)]:
  - @deckspec/renderer@0.1.13
  - @deckspec/dsl@0.1.13
  - @deckspec/schema@0.1.13
