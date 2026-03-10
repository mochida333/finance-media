# finance-media

Astro + microCMS で構築している記事メディアです。

## セットアップ

```sh
npm install
```

## 環境変数（microCMS）

プロジェクトルートに `.env` を作成し、以下を設定してください。

```env
MICROCMS_SERVICE_DOMAIN=xxxxxx
MICROCMS_API_KEY=xxxxxxxxxxxxxxxx
MICROCMS_MANAGEMENT_API_KEY=xxxxxxxxxxxxxxxx
```

本番（Cloudflare Pages）では、以下も設定すると sitemap/RSS のURLが正しくなります。

```env
SITE_URL=https://your-domain.example
```

> 補足: `MICROCMS_SERVICE_DOMAIN` / `MICROCMS_API_KEY` が未設定でも `npm run build` は通ります（一覧などは空表示になります）。

## microCMS 側の想定（最低限）

### エンドポイント
- **記事**（デフォルト: `blogs`）
- **カテゴリ**（デフォルト: `categories`）
- **タグ**（任意。デフォルト: `tags`）
- **固定ページ**（任意。デフォルト: `pages`）

### 記事の主なフィールド（デフォルト名）
- **`title`**: テキスト
- **`content`**: リッチエディタ（HTMLとして表示）
- **`eyecatch`**: 画像（`{ url, width, height }` を想定）
- **`publishedAt`**: 公開日時（microCMS標準）
- **`category`**: コンテンツ参照（参照先: カテゴリ）
  - 単数/複数どちらでも表示できるようにしています
- **タグ**（どちらの形でも吸収します）
  - 文字列配列: `tags`
  - 参照（コンテンツ参照）: `tag`（単数/複数どちらでもOK）

## ルーティング

- **トップ**: `/`
  - 最新記事（microCMS）を表示（ページネーションなし）
- **ブログ一覧**: `/blog/`
  - ページネーションあり（microCMS）
- **ブログ一覧（2ページ目以降）**: `/blog/page/[page]/`
- **記事詳細**: `/:id/`
  - `content` 内の `h2` から目次を生成し、自動で `id` を付与します
- **固定ページ**: `/page/:id/`
  - 固定ページエンドポイントのコンテンツIDで表示します（未作成でもビルドは壊れません）
- **カテゴリ別一覧**: `/category/[id]/`
- **カテゴリ別一覧（2ページ目以降）**: `/category/[id]/page/[page]/`
- **タグ別一覧**: `/tag/[id]/`
- **タグ別一覧（2ページ目以降）**: `/tag/[id]/page/[page]/`

## エンドポイント/スキーマ変更に強くするための仕組み

このプロジェクトは、microCMS の **エンドポイント名・フィールド名**を直接ページに散らさず、
以下に集約しています。

- **マッピング（設定）**: `src/library/cms-config.ts`
  - エンドポイント名・フィールド名のデフォルト値
  - さらに環境変数で上書き可能
- **正規化（normalize）**: `src/library/cms.ts`
  - microCMS の返却形（参照/配列/文字列など）を吸収して、UIが扱う形を固定化

### エンドポイント名を変えたい
`src/library/cms-config.ts` の `endpoints` を編集するか、環境変数で上書きします。

```env
MICROCMS_ENDPOINT_POSTS=blogs
MICROCMS_ENDPOINT_CATEGORIES=categories
MICROCMS_ENDPOINT_TAGS=tags
MICROCMS_ENDPOINT_PAGES=pages
```

### フィールド名を変えたい
同様に `src/library/cms-config.ts` か、環境変数で上書きします（例）。

```env
MICROCMS_FIELD_POST_TITLE=title
MICROCMS_FIELD_POST_CONTENT=content
MICROCMS_FIELD_POST_EYECATCH=eyecatch
MICROCMS_FIELD_POST_PUBLISHED_AT=publishedAt
MICROCMS_FIELD_POST_CATEGORY=category
MICROCMS_FIELD_POST_TAGS=tags
MICROCMS_FIELD_POST_TAG=tag
```

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバ起動（`http://localhost:4321/`） |
| `npm run build` | 本番ビルド（`./dist/`） |
| `npm run preview` | ビルド結果のプレビュー |

## Cloudflare Pages（SSG）にデプロイ

Cloudflare Pages のプロジェクト設定で以下を指定します。

- **Build command**: `npm run build`
- **Build output directory**: `dist`

Environment variables に以下を登録してください。

- `MICROCMS_SERVICE_DOMAIN`
- `MICROCMS_API_KEY`
- `SITE_URL`（任意だが推奨）

## 実装メモ

- **参照フィールドの展開**: カテゴリ/タグを表示するため、取得時に `depth: 1` を使っています（`src/library/cms.ts`）。
- **タグ/カテゴリのリンク**: 一覧カード内でリンクをネストできないため、記事リンク（カード本体）とカテゴリ/タグリンクは分離しています。
- **タグページの静的生成**: `/tag/[id]/` は全記事からタグ一覧を収集して `getStaticPaths()` を作るため、記事数が多い場合は生成コストが増えます。
- **ページネーションの共通化**: `src/components/Pagination.astro` に切り出して、`basePath` と `currentPage/totalPages` を渡して使い回しています。
- **記事カードの共通化**: 一覧のカードUIは `src/components/PostCard.astro` にまとめています。
- **目次（Table of Contents）**: `src/components/TableOfContents.astro` を利用して、記事本文の `h2` を元に目次を表示します。

## WordPress からのインポート（XML）

WordPress のエクスポートXML（WXR）を microCMS に取り込むために、簡易スクリプトを用意しています。

### 1) WordPress 側
管理画面の「ツール → エクスポート」で投稿をXML出力します。

### 2) まずは変換のプレビュー（dry-run）

```sh
node scripts/wp-import.mjs --xml "/path/to/export.xml" --out "scripts/wp-import.preview.json"
```

`scripts/wp-import.preview.json` に、抽出した投稿・カテゴリ・タグなどがJSONで出力されます。

### 3) microCMS に投入（PUT）

microCMS の APIキーで **PUT権限** を有効にした上で、以下を実行します。

```sh
node scripts/wp-import.mjs --xml "/path/to/export.xml" --apply --create-categories --create-tags
```

> 注意: WordPress側の画像URL（アイキャッチなど）は、そのままだと microCMS の画像フィールドに入れられません。
> 画像を microCMS にアップロードしてから付け替える運用にするか、本文内の `img src` を WordPress のまま残す方針にしてください。

### 4) 画像も含めて完全移行する（推奨）

Management API の権限で **「メディアのアップロード」** を有効にしたAPIキー（`MICROCMS_MANAGEMENT_API_KEY`）を用意して、以下を実行します。

```sh
node scripts/wp-import.mjs --xml "/path/to/export.xml" --apply --create-categories --create-tags --upload-media
```

デフォルトでは `wp-content/uploads` 配下っぽいURLだけをアップロードします。外部画像も含めて全てアップロードしたい場合は `--upload-all-remote-images` を付けてください。
