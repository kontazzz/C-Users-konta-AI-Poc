import assert from "node:assert";
import { FEED_SOURCES } from "../lib/sources";
import { aggregateNews, getNews } from "../lib/aggregate";

// グローバル fetch をスタブして、ネットワークなしで集約ロジックを検証する
const now = new Date("2026-07-03T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toUTCString();

const rssFor: Record<string, string> = {
  // AI専門ソース: フィルタなしで全件入る
  "itmedia-aiplus": `<rss><channel>
    <item><title>生成AIの業務活用が加速</title><link>https://itmedia.example/1</link>
      <description>企業での導入事例。</description><pubDate>${hoursAgo(1)}</pubDate></item>
    <item><title>重複するタイトルの記事</title><link>https://itmedia.example/2</link>
      <pubDate>${hoursAgo(2)}</pubDate></item>
  </channel></rss>`,
  // キーワードフィルタあり: AI関連だけ残る。"email" の AI 誤検知もチェック
  gigazine: `<rss><channel>
    <item><title>ChatGPTの新機能が公開</title><link>https://gigazine.example/1</link><pubDate>${hoursAgo(3)}</pubDate></item>
    <item><title>新しいemailクライアントのレビュー</title><link>https://gigazine.example/2</link><pubDate>${hoursAgo(4)}</pubDate></item>
    <item><title>人工知能と著作権の行方</title><link>https://gigazine.example/3</link><pubDate>${hoursAgo(5)}</pubDate></item>
    <item><title>AirPods Pro 3を空港(airport)で試す</title><link>https://gigazine.example/4</link><pubDate>${hoursAgo(6)}</pubDate></item>
    <item><title>AIが変える製造業の現場</title><link>https://gigazine.example/5</link><pubDate>${hoursAgo(7)}</pubDate></item>
    <item><title>GPT-5.5の性能検証</title><link>https://gigazine.example/6</link><pubDate>${hoursAgo(8)}</pubDate></item>
  </channel></rss>`,
  // 別ソースの同タイトル記事: 重複排除される
  ainow: `<rss><channel>
    <item><title>重複するタイトルの記事</title><link>https://ainow.example/1</link><pubDate>${hoursAgo(6)}</pubDate></item>
    <item><title>31日前の古い記事</title><link>https://ainow.example/2</link>
      <pubDate>${new Date(now.getTime() - 31 * 86400_000).toUTCString()}</pubDate></item>
  </channel></rss>`,
};

let fetchCount = 0;
globalThis.fetch = (async (input: any) => {
  fetchCount++;
  const url = String(input);
  const source = FEED_SOURCES.find((s) => s.url === url);
  const body = source ? rssFor[source.id] : undefined;
  if (!body) {
    return new Response("not found", { status: 404 });
  }
  return new Response(body, { status: 200 });
}) as typeof fetch;

async function main() {
  const data = await aggregateNews();

  // キーワードフィルタ: gigazine は AI 関連の記事のみ
  // ("email" / "AirPods" / "airport" のような AI を含むだけの単語は除外、
  //  "AIが〜" のように日本語が続くものと "GPT-5.5" は通す)
  const gigazine = data.items.filter((i) => i.sourceId === "gigazine");
  assert.deepEqual(
    gigazine.map((i) => i.title).sort(),
    ["AIが変える製造業の現場", "ChatGPTの新機能が公開", "GPT-5.5の性能検証", "人工知能と著作権の行方"]
  );

  // 重複排除: 同タイトルは新しい方(itmedia)だけ残る
  const dups = data.items.filter((i) => i.title === "重複するタイトルの記事");
  assert.equal(dups.length, 1);
  assert.equal(dups[0].sourceId, "itmedia-aiplus");

  // 30日より古い記事は除外
  assert.ok(!data.items.some((i) => i.title === "31日前の古い記事"));

  // 新しい順にソートされている
  const times = data.items.map((i) => i.publishedAt);
  assert.deepEqual([...times].sort().reverse(), times);

  // 失敗ソースはステータスに ok:false で載り、例外にならない
  const failed = data.sources.filter((s) => !s.ok);
  assert.equal(failed.length, FEED_SOURCES.length - 3);
  assert.ok(data.sources.find((s) => s.id === "gigazine")?.ok);

  // キャッシュ: 2回目の getNews はネットワークを叩かない
  await getNews();
  const countAfterFirst = fetchCount;
  const second = await getNews();
  assert.equal(fetchCount, countAfterFirst);
  assert.equal(second.cached, true);

  // forceRefresh で再取得する
  await getNews(true);
  assert.ok(fetchCount > countAfterFirst);

  console.log("✅ all aggregate tests passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
