# AI News Hub

AI関連のニュースを**勝手に集めてくる**社内向けニュースアプリです。
自分やチームメンバーが日々のニュースを眺めるだけで自然とAIに詳しくなれることを目的にしています。

## できること

- **自動収集**: 国内外のAI専門メディア・企業公式ブログ・コミュニティ(計13ソース)のRSS/Atomフィードを自動取得
  - サーバー側で15分キャッシュ、画面も15分ごとに自動更新。「今すぐ更新」ボタンで即時再取得も可能
  - 総合ニュースサイト(GIGAZINE・Publickey)はAI関連キーワードにマッチした記事だけを抽出
  - 重複記事の排除、日付順ソート、取得失敗ソースの通知つき
- **カテゴリ・検索**: 国内メディア / 海外メディア / 企業公式 / コミュニティのタブ切り替え、ソース絞り込み、キーワード検索
- **あとで読む**: ☆ボタンで記事をブラウザに保存(localStorage)
- **共有用コピー**: タイトル+URLをワンクリックでコピー(Slack等への共有用)
- **AI用語集**: ニュースを読むのに必要な用語をレベル別にかんたん解説(`/glossary`)

## セットアップ

Node.js 18.17 以上(推奨: 20+)が必要です。データベースやAPIキーは**不要**です。

```bash
cd ai-news
npm install
npm run dev
```

http://localhost:3100 を開きます。

本番運用する場合:

```bash
npm run build
npm start
```

Vercel にそのままデプロイもできます(Root Directory に `ai-news` を指定)。

## ニュースソースの追加・変更

[`lib/sources.ts`](lib/sources.ts) の `FEED_SOURCES` 配列にRSS/AtomフィードのURLを1件追加するだけです。

```ts
{
  id: "my-source",            // 一意なID
  name: "表示名",
  url: "https://example.com/feed.xml",
  siteUrl: "https://example.com/",
  category: "domestic",       // domestic | global | official | community
  lang: "ja",                 // ja | en
  keywordFilter: true,        // AI関連記事だけに絞る場合(総合ニュースサイト向け)
},
```

取得に失敗したソースは自動的にスキップされ、画面上部に通知されます(アプリ全体は止まりません)。

キーワードフィルタの語彙は同ファイルの `AI_KEYWORDS` で調整できます。

## 仕組み

```
ブラウザ ──(15分ごと自動fetch)──> /api/news
                                     │  15分TTLのメモリキャッシュ
                                     ▼
                          13のRSS/Atomフィードを並列取得
                          (タイムアウト10秒・失敗はスキップ)
                                     │
                          パース → キーワード抽出 → 重複排除 → 日付順
```

- RSS 2.0 / RSS 1.0 (RDF) / Atom に対応した自前パーサー(依存ライブラリなし): [`lib/rss.ts`](lib/rss.ts)
- パーサーのテスト: `npm run test:rss`

## 注意事項

- 表示するのは各記事のタイトル・リンク・冒頭の概要のみです。記事の著作権は各配信元に帰属します。
- 「あとで読む」はブラウザごとの保存(localStorage)です。端末をまたいだ同期はありません。
