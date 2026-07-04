import { parseFeed } from "./rss";
import { AI_KEYWORDS, FEED_SOURCES } from "./sources";
import type { FeedSource, NewsItem, NewsResponse, SourceStatus } from "./types";

/** フィード取得のタイムアウト(ミリ秒) */
const FETCH_TIMEOUT_MS = 10_000;
/** キャッシュの有効期間(ミリ秒)。この間隔で自動的に再取得される */
const CACHE_TTL_MS = 15 * 60 * 1000;
/** 1ソースあたりの最大記事数 */
const MAX_ITEMS_PER_SOURCE = 30;
/** 全体の最大記事数 */
const MAX_TOTAL_ITEMS = 300;
/** 古すぎる記事は落とす(30日) */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function matchesAiKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return AI_KEYWORDS.some((kw) => {
    if (/^[\x20-\x7e]+$/.test(kw)) {
      // 英数字キーワードは単語境界っぽくマッチさせる("AI" が "email" 等に反応しないように)
      const re = new RegExp(`(^|[^a-z0-9])${kw.toLowerCase().replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")}`, "i");
      return re.test(lower);
    }
    return text.includes(kw);
  });
}

async function fetchSource(
  source: FeedSource
): Promise<{ items: NewsItem[]; status: SourceStatus }> {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "user-agent": "ai-news-hub/0.1 (+internal news aggregator)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      // Next.js の fetch キャッシュは使わず、自前の TTL キャッシュで制御する
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const xml = await res.text();
    const parsed = parseFeed(xml);

    const now = Date.now();
    const items: NewsItem[] = parsed
      .filter((it) => {
        if (source.keywordFilter && !matchesAiKeywords(`${it.title} ${it.summary}`)) {
          return false;
        }
        if (it.publishedAt && now - it.publishedAt.getTime() > MAX_AGE_MS) {
          return false;
        }
        return true;
      })
      .slice(0, MAX_ITEMS_PER_SOURCE)
      .map((it) => ({
        id: `${source.id}:${it.link}`,
        title: it.title,
        link: it.link,
        summary: it.summary,
        publishedAt: (it.publishedAt ?? new Date()).toISOString(),
        sourceId: source.id,
        sourceName: source.name,
        category: source.category,
        lang: source.lang,
      }));

    return {
      items,
      status: { id: source.id, name: source.name, ok: true, itemCount: items.length },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      items: [],
      status: { id: source.id, name: source.name, ok: false, itemCount: 0, error: message },
    };
  }
}

/** タイトルの表記ゆれを吸収した重複排除キー */
function dedupeKey(item: NewsItem): string {
  return item.title.toLowerCase().replace(/\s+/g, "").slice(0, 80);
}

export async function aggregateNews(): Promise<Omit<NewsResponse, "cached">> {
  const results = await Promise.all(FEED_SOURCES.map((s) => fetchSource(s)));

  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const r of results) {
    for (const item of r.items) {
      const key = dedupeKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return {
    items: items.slice(0, MAX_TOTAL_ITEMS),
    sources: results.map((r) => r.status),
    fetchedAt: new Date().toISOString(),
  };
}

// ── モジュールスコープの TTL キャッシュ ──────────────
// サーバープロセス内で共有され、TTL が切れたリクエストが再取得を行う。
let cache: Omit<NewsResponse, "cached"> | null = null;
let cacheAt = 0;
let inflight: Promise<Omit<NewsResponse, "cached">> | null = null;

export async function getNews(forceRefresh = false): Promise<NewsResponse> {
  const fresh = cache !== null && Date.now() - cacheAt < CACHE_TTL_MS;
  if (cache && fresh && !forceRefresh) {
    return { ...cache, cached: true };
  }
  // 同時リクエストで多重取得しない
  if (!inflight) {
    inflight = aggregateNews().finally(() => {
      inflight = null;
    });
    inflight.then((data) => {
      // 全ソース失敗時は古いキャッシュを残す
      if (data.items.length > 0 || !cache) {
        cache = data;
        cacheAt = Date.now();
      }
    });
  }
  try {
    const data = await inflight;
    if (data.items.length === 0 && cache && cache.items.length > 0) {
      return { ...cache, cached: true };
    }
    return { ...data, cached: false };
  } catch {
    if (cache) return { ...cache, cached: true };
    throw new Error("ニュースの取得に失敗しました");
  }
}
