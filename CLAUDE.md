# CLAUDE.md

deckspec プロジェクトの Claude Code 向けガイドです。

## プロジェクト概要

スライドデッキを YAML + JSX で定義し、HTML/PPTX にレンダリングする OSS ツール。

## 構造

```
packages/
  cli/        — @deckspec/cli (bin: deckspec)
  dsl/        — @deckspec/dsl (YAML→AST パーサー)
  schema/     — @deckspec/schema (型定義)
  renderer/   — @deckspec/renderer (HTML/PPTX 出力)
themes/
  noir-display/ — @deckspec/theme-noir-display
                  design.md (設計意図) + harness.json (機械可読デザインルール)
                  skills/ (テーマ同梱スキル: 画像生成 photo/diagram 等)
decks/        — ユーザーデッキ (.gitignore、`deckspec init` で生成)
```

`deckspec lint <deck.yaml>` はデッキ構成とデッキローカルパターンを harness.json のルールで評価する（validate=構造検証、lint=デザイン評価）。

## 開発コマンド

```bash
pnpm install        # 依存インストール
pnpm build          # 全パッケージビルド (turbo)
pnpm typecheck      # 型チェック
pnpm test           # テスト実行
pnpm dev            # 開発サーバー
```

## リリースフロー

**npm への公開は廃止した (2026-08-04)。全パッケージが `private: true`。**

1. changeset ファイルを `.changeset/` に作成
2. main にマージ → GitHub Actions が Version PR を自動作成
3. Version PR マージ → バージョン採番 + CHANGELOG 更新 + git タグのみ（publish はしない）

固定グループ: cli, dsl, schema, renderer, theme-noir-display は同時リリース。

配布は GitHub のソースのみ。利用側は clone + `pnpm build`、または `pnpm pack` の
tarball を使う。npm 上の `0.2.1` 以前は残存するが更新されない。

## コーディング規約

- 言語: TypeScript (ESM)
- パッケージマネージャ: pnpm (packageManager フィールドでバージョン固定)
- ビルド: turbo
- テスト: vitest
- コミットメッセージ: `feat:`, `fix:`, `docs:` 等の prefix を使用
- ライセンス: Apache-2.0

## セキュリティ

- `.env` や認証情報をコミットしない
- シークレットは GitHub Secrets 経由で管理
- npm への publish はしない（サプライチェーン攻撃の的になる面積を減らすため）。
  `private: true` を外す変更を提案しないこと
