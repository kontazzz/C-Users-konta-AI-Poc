# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Pet Food Checker(MVP): 日本市場のドライドッグフードDBを使った、愛犬向けフード診断アプリ。Next.js 15(App Router)+ React 19 + TypeScript + Tailwind CSS。UI・データ・コメントはすべて日本語。

## コマンド

```bash
npm install                # 依存インストール
python build_database.py   # フードDB(dog_food_jp.sqlite)を生成 ※dev前に必須
cp .env.example .env.local # 環境変数(Supabase URL / anon key を設定)
npm run dev                # 開発サーバー http://localhost:3000
npm run build              # 本番ビルド(型チェックを兼ねる)
npm start                  # 本番起動
```

- lint / test は未設定。型チェックは `npm run build` か `npx tsc --noEmit` で行う。
- `dog_food_jp.sqlite` が無いと API ルートが起動時に失敗する(`fileMustExist: true`)。`build_database.py` は Python 3 標準ライブラリのみで動き、`schema.sql` → `seed_reference.sql` を流してプロジェクト直下に生成する(パスは `FOOD_DB_PATH` で変更可)。
- Supabase 側は、プロジェクトの SQL Editor で `supabase_app_schema.sql` を一度実行しておく必要がある(`dogs` / `diagnoses` テーブル + RLS)。

## アーキテクチャ

データストアが2系統あり、役割が明確に分かれている:

1. **フードDB(SQLite・読み取り専用)** — `schema.sql` / `seed_reference.sql` から生成。アプリからは `lib/foodDb.ts` 経由でのみアクセスし、**アプリ側からDB構造・データを変更しない**。商品検索・原材料・アレルゲン・類似フード取得はすべてここ。ビュー `v_in_scope_products`(アプリ対象商品)と `v_product_price_summary`(`price_band` 算出)が主な入口。類似フード3クエリ(価格帯・原材料 Jaccard・同一メーカー)は `similarity_queries.sql` の内容をそのまま移植したもので、変更時は両方を同期させる。
2. **Supabase(PostgreSQL)** — 認証、犬プロフィール(`dogs`、`user_id + name` で upsert)、診断履歴(`diagnoses`)。RLS で本人の行のみ読み書き可。

### 診断フロー(中核パス)

`app/diagnosis/page.tsx`(client)→ `POST /api/diagnosis`(Bearer トークン必須)→ SQLite から事実(商品・原材料・アレルゲン・類似フード)を収集 → `lib/ai.ts` の `diagnose()`:

- `AI_API_KEY` と `AI_API_BASE_URL` が設定されていれば OpenAI 互換 API(chat/completions, JSON mode)で診断。未設定・失敗時は `buildRuleBasedResult()`(DB事実のみのルールベース)にフォールバック。
- **AI の回答でも、類似フード3項目は必ずDB結果で上書きし、`DISCLAIMER`(`lib/types.ts`)とスコア範囲 0-100 を強制する。** AI に商品事実を捏造させない設計を維持すること。
- 診断後、犬プロフィールと診断履歴を Supabase に保存(ユーザーのトークンを付けた `createUserClient()` を使う。RLS 前提なので service role キーは使わない)。

### 認証パターン

クライアントは `lib/supabaseClient.ts` の `supabase`(localStorage セッション)でログインし、API 呼び出し時に access token を `Authorization: Bearer` で渡す。API ルート側は `createUserClient(token)` で RLS の効いたクライアントを作る。

### 設定上の注意

- API ルートは `export const runtime = "nodejs"` 必須(better-sqlite3 のため)。`next.config.mjs` の `serverExternalPackages: ["better-sqlite3"]` も同じ理由。
- パスエイリアス `@/*` はリポジトリルート直下を指す(`lib/`, `app/` が直下にある)。

## ドメイン上の制約

- 対象は日本市場(JP)の非・動物病院専売ドライフードのみ。療法食・ウェット・おやつ・サプリは対象外。
- アレルゲン表示は「表示(メーカー明記)」「推定(原材料から)」「未確認」を区別する(`product_allergen_assertions.assertion` / `assertion_source`)。
- 診断は情報提供のみ。免責文(獣医師の診断や治療の代わりではない)を結果から外さない。
- 商品(product)と SKU を区別する。容量違いは別 SKU、価格比較は `price_per_kg` で行う。

## 未実装(MVP の制限)

OCR・バーコード照合・画像解析は未実装(UI はプレースホルダのみ)。シードデータは4商品のみ。
