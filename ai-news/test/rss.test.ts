import assert from "node:assert";
import { parseFeed } from "../lib/rss";

// ── RSS 2.0(ITmedia等の形式)──────────────────
const rss20 = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
  <title>ITmedia AI+</title>
  <item>
    <title>生成AIの最新動向&amp;まとめ</title>
    <link>https://example.com/news/1</link>
    <description><![CDATA[<p>生成AIに関する<b>最新ニュース</b>のまとめです。]]></description>
    <pubDate>Thu, 02 Jul 2026 10:30:00 +0900</pubDate>
  </item>
  <item>
    <title>タイトルのみの記事</title>
    <link>https://example.com/news/2</link>
    <content:encoded><![CDATA[本文だけがある記事]]></content:encoded>
  </item>
</channel>
</rss>`;

const items1 = parseFeed(rss20);
assert.equal(items1.length, 2);
assert.equal(items1[0].title, "生成AIの最新動向&まとめ");
assert.equal(items1[0].link, "https://example.com/news/1");
assert.ok(items1[0].summary.includes("最新ニュース"));
assert.ok(!items1[0].summary.includes("<b>"));
assert.equal(items1[0].publishedAt?.toISOString(), "2026-07-02T01:30:00.000Z");
assert.equal(items1[1].summary, "本文だけがある記事");
assert.equal(items1[1].publishedAt, null);

// ── Atom(Publickey / The Verge等の形式)────────
const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Publickey</title>
  <entry>
    <title type="html">Anthropic&#x304C;&#26032;&#12514;&#12487;&#12523;&#12434;&#30330;&#34920;</title>
    <link rel="alternate" type="text/html" href="https://example.com/atom/1"/>
    <link rel="enclosure" href="https://example.com/image.png"/>
    <published>2026-07-01T09:00:00Z</published>
    <updated>2026-07-01T12:00:00Z</updated>
    <summary>新モデルの発表内容の概要。</summary>
  </entry>
</feed>`;

const items2 = parseFeed(atom);
assert.equal(items2.length, 1);
assert.equal(items2[0].title, "Anthropicが新モデルを発表");
assert.equal(items2[0].link, "https://example.com/atom/1");
assert.equal(items2[0].summary, "新モデルの発表内容の概要。");
assert.equal(items2[0].publishedAt?.toISOString(), "2026-07-01T09:00:00.000Z");

// ── RSS 1.0 / RDF(CNET Japan等の形式)──────────
const rdf = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns="http://purl.org/rss/1.0/"
         xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel rdf:about="https://example.com/">
    <title>Sample RDF</title>
  </channel>
  <item rdf:about="https://example.com/rdf/1">
    <title>AI規制の最新ニュース</title>
    <link>https://example.com/rdf/1</link>
    <description>各国のAI規制動向。</description>
    <dc:date>2026-06-30T08:00:00+09:00</dc:date>
  </item>
</rdf:RDF>`;

const items3 = parseFeed(rdf);
assert.equal(items3.length, 1);
assert.equal(items3[0].title, "AI規制の最新ニュース");
assert.equal(items3[0].publishedAt?.toISOString(), "2026-06-29T23:00:00.000Z");

// ── 壊れた入力に対して例外を投げない ─────────────
assert.deepEqual(parseFeed(""), []);
assert.deepEqual(parseFeed("<html><body>not a feed</body></html>"), []);
assert.deepEqual(parseFeed("<rss><channel><item><title>リンクなし</title></item></channel></rss>"), []);

console.log("✅ all rss parser tests passed");
