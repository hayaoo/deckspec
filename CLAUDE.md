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
decks/        — ユーザーデッキ (.gitignore、`deckspec init` で生成)
```

## 開発コマンド

```bash
pnpm install        # 依存インストール
pnpm build          # 全パッケージビルド (turbo)
pnpm typecheck      # 型チェック
pnpm test           # テスト実行
pnpm dev            # 開発サーバー
```

## リリースフロー

1. changeset ファイルを `.changeset/` に作成
2. main にマージ → GitHub Actions が Version PR を自動作成
3. Version PR マージ → `pnpm -r publish --provenance` で npm 公開

固定グループ: cli, dsl, schema, renderer, theme-noir-display は同時リリース。

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
- npm provenance を有効化済み
