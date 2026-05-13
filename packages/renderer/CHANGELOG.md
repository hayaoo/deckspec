# @deckspec/renderer

## 0.2.1

### Patch Changes

- [#48](https://github.com/hayaoo/deckspec/pull/48) [`0746726`](https://github.com/hayaoo/deckspec/commit/0746726e9750a97f18620dc6f0bfe6a3b7f31109) Thanks [@hayaoo](https://github.com/hayaoo)! - `deckspec init` で生成される `package.json` のテンプレートを修正:

  - `@deckspec/cli` の semver range を `^0.1.0` → `^0.2.0` に更新 (^0.1.0 では現行 0.2.x が解決できなかった)
  - `lucide-react` の semver range を `^0.469.0` → `^1.7.0` に更新し、テーマパッケージの依存と整合

- Updated dependencies [[`0746726`](https://github.com/hayaoo/deckspec/commit/0746726e9750a97f18620dc6f0bfe6a3b7f31109)]:
  - @deckspec/dsl@0.2.1
  - @deckspec/schema@0.2.1

## 0.2.0

### Patch Changes

- Updated dependencies []:
  - @deckspec/dsl@0.2.0
  - @deckspec/schema@0.2.0

## 0.1.13

### Patch Changes

- [`4948ef3`](https://github.com/hayaoo/deckspec/commit/4948ef369fea5694032518083f722e8f88f27cf5) Thanks [@hayaoo](https://github.com/hayaoo)! - fix: escapeHtml の undefined 防御 + dev サーバーのスタックトレース出力改善

  - tokens.json に displayName がないテーマがあるとダッシュボードが 500 エラーでクラッシュする問題を修正
  - dev サーバーのエラーハンドラーでスタックトレースが出力されるよう改善

- Updated dependencies []:
  - @deckspec/dsl@0.1.13
  - @deckspec/schema@0.1.13
