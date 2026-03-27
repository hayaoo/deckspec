# Pristine Display — Design System

Apple.com のプロダクトページにインスパイアされたライト・プレゼンテーションテーマ。
キャンバスグレー (`#f5f5f7`) の上に白カードを浮かせ、ディスプレイタイポグラフィとドラマティックな余白で視覚的ヒエラルキーを構築する。

## インスピレーション

Apple.com（https://www.apple.com/jp/）のプロダクトページをベースに設計。
- ページ背景は純白ではなく `#f5f5f7`（キャンバスグレー）
- カードやコンテンツ面は `#ffffff`（白）
- テキストは `#1d1d1f`（ニアブラック） — 純黒は使わない
- サブテキストは `#6e6e73`（ミューテッドグレー） — 色のコントラストで階層を作る
- セクションごとにグレーと白を交互に配置してリズムを生む

## デザインの原則

### 1. キャンバスグレー + 白カード
スライド背景は `#f5f5f7`。情報を載せるカードは `#ffffff` で浮かせる。白 on 白ではなく、グレー on 白のレイヤー感が Apple らしさの核。一部のスライド（タイトル、ヒーロー、メトリクス、クロージング）は全面白でインパクトを出す。

### 2. 2ウェイト制
semibold 600（見出し・ラベル）と regular 400（本文・説明）の 2 種類のみ。bold 700 や light 300 は使わない。ウェイトの差を最小にすることで、Apple のクリーンな印象を保つ。

### 3. タイトなレタースペーシング
大きいフォントほど負のレタースペーシング。これが Apple のディスプレイタイポグラフィの最大の特徴。

| フォントサイズ | letter-spacing |
|--------------|---------------|
| 80px+        | -0.015em      |
| 48px         | -0.003em      |
| 40px         | -0.009em      |
| 17px (body)  | -0.022em      |
| 14px (caption) | -0.016em    |

### 4. 極端なホワイトスペース
要素間に大きな gap（32-48px）。情報密度より「呼吸」を優先。1スライド1メッセージが基本。スライドの 40-60% は空白であるべき。

### 5. セクション背景の交替
スライドを通して見たとき、グレーキャンバス(`#f5f5f7`) と 白面(`#ffffff`) が交互に現れることで Apple.com のスクロール体験に近いリズムが生まれる。

| スライドタイプ | 背景 |
|--------------|------|
| タイトル / ヒーロー / メトリクス / クロージング | `#ffffff` |
| カード系（pillars / comparison / pricing） | `#f5f5f7`（カードは白） |
| リスト系（bullet-list / photo-split） | `#ffffff` |
| グラフ / アイコングリッド | `#ffffff` |
| フロー図 | `#ffffff`（ステップカードは `#f5f5f7`） |

### 6. 控えめなシャドウ
カードには `4px 4px 12px rgba(0,0,0,0.06)` の極めて subtle な影。ボーダーは基本不要 — 白カードとグレーキャンバスのコントラストだけで十分。ハイライトカードのみ `1.5px solid #0071e3` のボーダー。

### 7. 光学的センタリング
中央揃えスライドでは、コンテンツグループに `marginBottom: 32px` 程度を追加して視覚的な中心を数学的な中心より少し上にずらす。これは Apple のキーノートで使われるテクニック。

## カラーパレット

| Token | 値 | 用途 |
|-------|-----|------|
| background | `#f5f5f7` | スライド背景（キャンバスグレー） |
| foreground | `#1d1d1f` | 見出し・本文（ニアブラック） |
| primary | `#0071e3` | CTA、ピルボタン、ハイライトボーダー |
| accent | `#0066cc` | アイブロウラベル、リンク色 |
| muted-foreground | `#6e6e73` | サブテキスト、キャプション、番号 |
| border | `rgba(0,0,0,0.08)` | 境界線（ほぼ不可視） |
| card-background | `#ffffff` | カード面 |
| muted | `#e8e8ed` | 非活性面、チップ背景 |

### 使ってはいけない色
- 純黒 `#000000` をテキストに使わない（`#1d1d1f` を使う）
- 純白 `#ffffff` をスライド背景全体に使わない（`#f5f5f7` を使う。コンテンツ面だけ白）
- primary `#0071e3` を大面積の背景に使わない（テキスト・ボーダー・ボタンのみ）
- 赤・緑・黄色などの強い色は避ける。アクセントは青のみ

## タイポグラフィ

### フォントスタック
```
heading: SF Pro JP → SF Pro Display → Hiragino Sans → Helvetica Neue → Noto Sans JP → sans-serif
body:    SF Pro JP → SF Pro Text    → Hiragino Sans → Helvetica Neue → Noto Sans JP → sans-serif
```

- macOS: SF Pro JP または Hiragino Sans が適用される
- Windows: Noto Sans JP にフォールバック
- 明朝体は使わない
- `-webkit-font-smoothing: antialiased` 必須

### タイプスケール

| 役割 | サイズ | ウェイト | line-height | letter-spacing |
|------|--------|---------|-------------|---------------|
| ヒーロー見出し | 80px | 600 | 1.05 | -0.015em |
| タイトル / クロージング | 72px | 600 | 1.05 | -0.015em |
| 巨大数値 | 120px | 600 | 1.0 | -0.025em |
| セクション見出し | 44-48px | 600 | 1.08 | -0.003em |
| カード見出し / サブ見出し | 40px | 600 | 1.1 | -0.009em |
| アイテムタイトル | 17-21px | 600 | 1.24-1.37 | 0.011em〜-0.022em |
| 本文 | 17px | 400 | 1.47 | -0.022em |
| アイブロウラベル | 17px | 600 | — | -0.022em |
| キャプション / 説明 | 14px | 400 | 1.29-1.43 | -0.016em |

## レイアウト

- スライドサイズ: 1200×675 (16:9)
- パディング: 48-60px（上下）, 60-80px（左右）
- セクション間 gap: 40-48px
- アイテム間 gap: 20-24px
- カード角丸: 18px（大型タイル）, 12px（標準）, 16px（フローステップ）
- ボタン角丸: 980px（完全ピル）

## パターンカタログ

### title-center
**用途**: オープニング・タイトルスライド
**背景**: 白 (`#ffffff`)
**レイアウト**: 中央揃え、72px ディスプレイ見出し + ミューテッド字幕
**vars:**
- `title` (string, max 40): ディスプレイ見出し
- `subtitle` (string, max 80): 字幕

### hero-statement
**用途**: インパクト文、ビジョンステートメント
**背景**: 白
**レイアウト**: 青アイブロウ + 80px 巨大見出し + ミューテッド本文、全て中央揃え
**vars:**
- `eyebrow` (string, max 30): 青アクセントラベル
- `headline` (string, max 60): 巨大見出し（`\n` で改行可）
- `body` (string, max 200): 本文

### feature-metrics
**用途**: KPI、数値ハイライト
**背景**: 白
**レイアウト**: 中央見出し + 横並びの巨大数値（56px）
**vars:**
- `headline` (string, max 60): セクション見出し
- `description` (string, optional): 補足テキスト
- `metrics` (array, 2-4): `{ label, value }`

### bullet-list
**用途**: 特徴一覧、ステップ
**背景**: 白
**レイアウト**: 左カラム（アイブロウ + 見出し）+ 右カラム（番号付きリスト）
**vars:**
- `label` (string, optional): 青アイブロウ
- `heading` (string, max 80): 見出し
- `items` (array, 2-6): `{ title, description? }`

### three-pillars
**用途**: 3つの柱、特徴カード
**背景**: キャンバスグレー（カードは白）
**レイアウト**: 中央見出し + 2-3カラム白カード（subtle shadow）
**vars:**
- `label` (string, optional): 青アイブロウ
- `heading` (string, max 60): 見出し
- `pillars` (array, 2-3): `{ title, description, value? }`

### big-number
**用途**: 単一数値のインパクト
**背景**: 白
**レイアウト**: 中央に 120px 巨大数値 + 見出し + 本文
**vars:**
- `label` (string, optional): 青アイブロウ
- `value` (string, max 20): 巨大数値
- `unit` (string, optional): 単位
- `headline` (string, max 60): 見出し
- `description` (string, optional): 本文

### icon-grid
**用途**: 機能一覧、エコシステム紹介
**背景**: 白
**レイアウト**: 中央見出し + 3x2 アイコングリッド（`#f5f5f7` バッジ + 青アイコン）
**vars:**
- `label` (string, optional): 青アイブロウ
- `heading` (string, max 60): 見出し
- `items` (array, 3-6): `{ icon, title, description? }`
**アイコン**: lucide-react の名前を使用（例: `file-code-2`, `shield-check`）

### chart-bar
**用途**: 棒グラフ、定量比較
**背景**: 白
**レイアウト**: 左寄せ見出し + 凡例 + Recharts 棒グラフ（固定幅 1020px）
**vars:**
- `label` (string, optional): 青アイブロウ
- `heading` (string, max 60): チャート見出し
- `data` (array, 2-8): `{ label, value, value2? }`
- `series1Name` (string, optional): 第1系列名
- `series2Name` (string, optional): 第2系列名
**注意**: SSR のため `ResponsiveContainer` は使わず固定サイズ

### flow-diagram
**用途**: プロセスフロー、パイプライン図解
**背景**: 白（ステップカードは `#f5f5f7`）
**レイアウト**: 中央見出し + 横並びステップカード + 青矢印
**vars:**
- `label` (string, optional): 青アイブロウ
- `heading` (string, max 60): 見出し
- `steps` (array, 3-5): `{ title, description? }`

### comparison-columns
**用途**: 機能比較、A vs B
**背景**: キャンバスグレー（カードは白）
**レイアウト**: 中央見出し + 2-3カラム白カード（チェックマーク付きリスト）
**vars:**
- `heading` (string, max 60): 見出し
- `columns` (array, 2-3): `{ name, items[], highlighted? }`

### pricing-tiers
**用途**: 料金プラン
**背景**: キャンバスグレー（カードは白）
**レイアウト**: 中央見出し + 2-3カラムプランカード（価格表示 + 機能リスト）
**vars:**
- `heading` (string, max 60): 見出し
- `plans` (array, 2-3): `{ name, price, description?, features[], highlighted? }`

### photo-split
**用途**: ビジュアルストーリーテリング、写真 + テキスト
**背景**: 白
**レイアウト**: 50/50 分割。片側テキスト（アイブロウ + 見出し + 本文）、片側写真
**vars:**
- `label` (string, optional): 青アイブロウ
- `heading` (string, max 60): 見出し
- `body` (string, max 300): 本文
- `image` (string): 画像パス or URL
- `imagePosition` ("left" | "right", optional): 画像の位置（default: right）

### thank-you
**用途**: クロージング
**背景**: 白
**レイアウト**: 72px 見出し + ミューテッド本文 + ピル型CTA + リンク
**vars:**
- `headline` (string, max 40): クロージング見出し
- `body` (string, optional): 本文
- `cta` (string, optional): CTAテキスト（ピルボタン表示）
- `link` (string, optional): URL/連絡先

## コンポーネント

### SlideHeader
`import { SlideHeader } from "@deckspec/theme-noir-display/components"`
- `label?` (string): 青アイブロウ（`var(--color-primary)`）
- `heading` (string): ディスプレイ見出し
- `headingSize?` (number): フォントサイズ（default 40）

### Card
`import { Card } from "@deckspec/theme-noir-display/components"`
- `children` (ReactNode): カード内容
- `highlight?` (boolean): primary ボーダー + 青シャドウ
- `style?` (CSSProperties): 追加スタイル

## デッキ構成ガイド

### 推奨スライド順序
1. **title-center** — タイトル（白面、余白多め）
2. **hero-statement** — ビジョン・メッセージ（白面、巨大テキスト）
3. **big-number** — 数値インパクト（白面）
4. **three-pillars** — アーキテクチャ・柱（グレー面 + 白カード）
5. **bullet-list** or **icon-grid** — 特徴一覧（白面）
6. **feature-metrics** — KPI（白面）
7. **chart-bar** — データ可視化（白面）
8. **flow-diagram** — プロセス図解（白面）
9. **photo-split** — ビジュアル（白面）
10. **comparison-columns** — 比較（グレー面 + 白カード）
11. **pricing-tiers** — 料金（グレー面 + 白カード）
12. **thank-you** — クロージング（白面 + CTA）

### 背景交替のリズム
白 → 白 → 白 → **グレー** → 白 → 白 → 白 → 白 → 白 → **グレー** → **グレー** → 白

カード系スライド（pillars, comparison, pricing）をグレー面に配置し、テキスト中心のスライドを白面に配置すると、Apple.com のスクロール体験に近いリズムが生まれる。

## 禁止事項

- 明朝体の使用
- `font-weight: 700` (bold) の使用 — 600 (semibold) まで
- 純黒 `#000` テキスト — `#1d1d1f` を使う
- primary 青の背景利用 — テキスト・ボーダー・ボタンのみ
- ボーダー線の多用 — 背景色のレイヤーで区切る
- 角丸カードの内部を border や背景色の帯で区切る — カード内のセクション分けはタイポグラフィの階層（サイズ・ウェイト・色・余白）だけで表現する。片側 border も背景色バンドも不要
- 情報の詰め込み — 1スライド1メッセージ
- アニメーション（SSR 出力のため静的）
- 影の濃さ — `rgba(0,0,0,0.06)` を超えない

## 使用ガイド

このテーマは以下に最適:
- プロダクトローンチ、サービス紹介
- 投資家向けピッチデッキ
- テクノロジーカンファレンス
- 社内プレゼン（モダンな印象）

`#f5f5f7` キャンバスグレーと白カードのコントラストで、プロジェクターでもディスプレイでも高い可読性を保ちます。情報密度を low〜medium に抑え、Apple のようなプレミアムな空気感を演出します。
