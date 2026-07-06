# Pet Food Checker(MVP)

犬フードデータベース(dog_food_db)を利用した、愛犬向けドッグフード診断アプリのMVPです。

- フードDB: 既存の `schema.sql` / `seed_reference.sql` から生成した SQLite(`dog_food_jp.sqlite`)を読み取り専用で使用
- 認証・犬プロフィール・診断履歴: Supabase(`supabase_app_schema.sql`)
- AI診断: OpenAI互換API(未設定時はDB事実のみのルールベース診断)

## セットアップ

1. 依存パッケージをインストール

   ```bash
   npm install
   ```

2. フードDB(SQLite)を生成(Python 3 標準ライブラリのみ使用)

   ```bash
   python build_database.py
   ```

   プロジェクト直下に `dog_food_jp.sqlite` ができます。

3. Supabase プロジェクトを作成し、SQL Editor で `supabase_app_schema.sql` を実行

   (開発中はダッシュボードの Authentication > Providers > Email で
   「Confirm email」をオフにするとメール確認なしでログインできます)

4. 環境変数を設定

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` に Supabase の URL と anon キーを設定します。
   AI診断を使う場合は `AI_API_KEY` も設定します(未設定でも動作します)。

## セットアップ診断

どこまで準備できているか分からなくなったら、いつでも以下で確認できます:

```bash
npm run check
```

## ローカル起動

```bash
npm run dev
```

http://localhost:3000 を開きます。

## ページ

- `/` トップ
- `/login` ログイン / 新規登録(Supabase)
- `/diagnosis` 診断(犬プロフィール + 商品検索 + バーコード文字列 + 画像プレースホルダ + 原材料手入力)
- `/history` 診断履歴

## MVPの制限

- OCR・バーコードAPI照合は未実装(入力欄はプレースホルダ)
- 画像はアップロード・解析されません
- フードDBは少量のサンプルデータのみ(4商品)
- 類似フード提案は `similarity_queries.sql` と同じロジックでDB内から検索(DBにデータが無い場合は空)
- 診断は情報提供のみ。この診断は獣医師の診断や治療の代わりではありません。
