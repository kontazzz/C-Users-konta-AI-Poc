"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/sources";
import type { NewsItem, NewsResponse, SourceCategory } from "@/lib/types";

/** クライアント側の自動更新間隔(サーバーキャッシュのTTLと同じ15分) */
const AUTO_REFRESH_MS = 15 * 60 * 1000;
const BOOKMARK_KEY = "ai-news-hub:bookmarks";

const CATEGORY_ORDER: (SourceCategory | "all" | "bookmark")[] = [
  "all",
  "domestic",
  "global",
  "official",
  "community",
  "bookmark",
];

const CATEGORY_BADGE: Record<SourceCategory, string> = {
  domestic: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  global: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  official: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  community: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(d)) / 86400000);
  if (diffDays <= 0) return "今日";
  if (diffDays === 1) return "昨日";
  return `${d.getMonth() + 1}月${d.getDate()}日(${"日月火水木金土"[d.getDay()]})`;
}

function loadBookmarks(): Record<string, NewsItem> {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARK_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export default function HomePage() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<(typeof CATEGORY_ORDER)[number]>("all");
  const [sourceId, setSourceId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Record<string, NewsItem>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchNews = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news${refresh ? "?refresh=1" : ""}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: NewsResponse = await res.json();
      setData(json);
    } catch {
      setError("ニュースの取得に失敗しました。時間をおいて再読み込みしてください。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setBookmarks(loadBookmarks());
    fetchNews();
    const timer = setInterval(() => fetchNews(), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchNews]);

  const toggleBookmark = (item: NewsItem) => {
    setBookmarks((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item;
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      return next;
    });
  };

  const copyForShare = async (item: NewsItem) => {
    try {
      await navigator.clipboard.writeText(`${item.title}\n${item.link}`);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* クリップボード非対応環境では何もしない */
    }
  };

  const allItems: NewsItem[] = useMemo(() => {
    if (category === "bookmark") {
      return Object.values(bookmarks).sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt)
      );
    }
    return data?.items ?? [];
  }, [data, category, bookmarks]);

  const sources = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of data?.items ?? []) map.set(it.sourceId, it.sourceName);
    return [...map.entries()];
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((it) => {
      if (category !== "all" && category !== "bookmark" && it.category !== category) return false;
      if (sourceId !== "all" && it.sourceId !== sourceId) return false;
      if (q && !`${it.title} ${it.summary} ${it.sourceName}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [allItems, category, sourceId, query]);

  // 日付ごとにグループ化(表示順は維持)
  const grouped = useMemo(() => {
    const groups: { label: string; items: NewsItem[] }[] = [];
    for (const item of filtered) {
      const label = dateLabel(item.publishedAt);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(item);
      else groups.push({ label, items: [item] });
    }
    return groups;
  }, [filtered]);

  const failedSources = (data?.sources ?? []).filter((s) => !s.ok);

  return (
    <div className="space-y-5">
      {/* ステータスバー */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">最新のAIニュース</h1>
          <p className="text-xs text-slate-400">
            国内外のAI関連メディア・企業ブログから自動収集(15分ごとに自動更新)
            {data && (
              <>
                {" ・最終取得 "}
                {formatTime(data.fetchedAt)}
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchNews(true)}
          disabled={loading}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-50"
        >
          {loading ? "取得中…" : "今すぐ更新"}
        </button>
      </div>

      {/* カテゴリタブ */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => {
              setCategory(c);
              setSourceId("all");
            }}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              category === c
                ? "border-white bg-white text-slate-900"
                : "border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            {c === "all"
              ? "すべて"
              : c === "bookmark"
                ? `⭐ あとで読む (${Object.keys(bookmarks).length})`
                : CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* 検索 + ソース絞り込み */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="キーワード検索(例: ChatGPT、生成AI、規制)"
          className="min-w-56 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none"
        />
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-slate-400 focus:outline-none"
        >
          <option value="all">すべてのソース</option>
          {sources.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* 取得失敗ソースの通知 */}
      {failedSources.length > 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          一部のソースが取得できませんでした:{failedSources.map((s) => s.name).join("、")}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && !data && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-900" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <p className="py-12 text-center text-sm text-slate-400">
          {category === "bookmark"
            ? "「あとで読む」に保存した記事はまだありません。記事の ☆ を押すと保存できます。"
            : "条件に合う記事が見つかりませんでした。"}
        </p>
      )}

      {/* 記事一覧 */}
      {grouped.map((group) => (
        <section key={group.label}>
          <h2 className="sticky top-14 z-10 -mx-4 bg-slate-950/90 px-4 py-2 text-sm font-semibold text-slate-400 backdrop-blur">
            {group.label}
            <span className="ml-2 text-xs font-normal text-slate-500">
              {group.items.length}件
            </span>
          </h2>
          <ul className="space-y-3">
            {group.items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-600"
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full border px-2 py-0.5 ${CATEGORY_BADGE[item.category]}`}
                  >
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="font-medium text-slate-300">{item.sourceName}</span>
                  {item.lang === "en" && (
                    <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                      EN
                    </span>
                  )}
                  <span className="text-slate-500">{formatTime(item.publishedAt)}</span>
                </div>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-base font-semibold leading-snug text-slate-100 hover:text-sky-300 hover:underline"
                >
                  {item.title}
                </a>
                {item.summary && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-400 line-clamp-2">
                    {item.summary}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-xs">
                  <button
                    onClick={() => toggleBookmark(item)}
                    className="text-slate-400 hover:text-amber-300"
                    title="あとで読むに保存"
                  >
                    {bookmarks[item.id] ? "⭐ 保存済み" : "☆ あとで読む"}
                  </button>
                  <button
                    onClick={() => copyForShare(item)}
                    className="text-slate-400 hover:text-sky-300"
                    title="タイトルとURLをコピー(Slack共有用)"
                  >
                    {copiedId === item.id ? "✓ コピーしました" : "🔗 共有用にコピー"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
