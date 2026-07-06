/**
 * 依存ライブラリなしの寛容な RSS 2.0 / RSS 1.0 (RDF) / Atom パーサー。
 * ニュースフィードの title / link / 概要 / 日付 が取れれば十分なので、
 * 完全な XML パースはせず正規表現ベースで抽出する。
 */

export interface ParsedFeedItem {
  title: string;
  link: string;
  summary: string;
  publishedAt: Date | null;
}

/** <![CDATA[...]]> を剥がす */
function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

/** HTMLタグを除去して素のテキストにする */
function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ");
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  copy: "©",
  trade: "™",
  reg: "®",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

function normalizeText(raw: string): string {
  return decodeEntities(stripTags(stripCdata(raw))).replace(/\s+/g, " ").trim();
}

/** 最初にマッチしたタグの中身を返す(名前空間プレフィックスも許容) */
function firstTag(block: string, names: string[]): string | null {
  for (const name of names) {
    // <name ...>content</name>(自己終了タグは対象外)
    const re = new RegExp(
      `<(?:[a-zA-Z0-9_-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-zA-Z0-9_-]+:)?${name}>`,
      "i"
    );
    const m = block.match(re);
    if (m && m[1].trim()) return m[1];
  }
  return null;
}

/** Atom の <link href="..."/> からURLを取る(rel="alternate" を優先) */
function atomLink(block: string): string | null {
  const linkTags = block.match(/<(?:[a-zA-Z0-9_-]+:)?link\b[^>]*>/gi) ?? [];
  let fallback: string | null = null;
  for (const tag of linkTags) {
    // XML属性値は & が &amp; 等にエスケープされているのでデコードして返す
    const rawHref = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1] ?? null;
    const href = rawHref ? decodeEntities(rawHref) : null;
    if (!href) continue;
    const rel = tag.match(/rel\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!rel || rel === "alternate") return href;
    if (!fallback) fallback = href;
  }
  return fallback;
}

function parseDate(block: string): Date | null {
  const raw = firstTag(block, ["pubDate", "published", "updated", "date", "issued"]);
  if (!raw) return null;
  const d = new Date(normalizeText(raw));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * フィード文字列をパースして記事一覧を返す。
 * RSS 2.0 / RSS 1.0 の <item>、Atom の <entry> の両方を拾う。
 */
export function parseFeed(xml: string): ParsedFeedItem[] {
  const blocks: string[] = [];
  const itemRe = /<(?:[a-zA-Z0-9_-]+:)?(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:[a-zA-Z0-9_-]+:)?\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    blocks.push(m[2]);
  }

  const items: ParsedFeedItem[] = [];
  for (const block of blocks) {
    const titleRaw = firstTag(block, ["title"]);
    if (!titleRaw) continue;
    const title = normalizeText(titleRaw);

    // RSS: <link>URL</link> / Atom: <link href="..."/>
    let link = "";
    const linkText = firstTag(block, ["link"]);
    if (linkText && normalizeText(linkText).startsWith("http")) {
      link = normalizeText(linkText);
    } else {
      link = atomLink(block) ?? "";
    }
    if (!title || !link) continue;

    const summaryRaw =
      firstTag(block, ["description", "summary"]) ??
      firstTag(block, ["content", "encoded"]) ??
      "";
    const summary = normalizeText(summaryRaw).slice(0, 300);

    items.push({ title, link, summary, publishedAt: parseDate(block) });
  }
  return items;
}
