export type SourceCategory = "domestic" | "global" | "official" | "community";

export interface FeedSource {
  /** 一意なID(フィルタ用) */
  id: string;
  /** 表示名 */
  name: string;
  /** RSS/AtomフィードのURL */
  url: string;
  /** サイトのトップURL */
  siteUrl: string;
  category: SourceCategory;
  /** 言語(表示バッジ用) */
  lang: "ja" | "en";
  /**
   * true の場合、AI関連キーワードにマッチする記事だけを残す
   * (総合ニュースサイトのフィードに使う)
   */
  keywordFilter?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string; // ISO 8601
  sourceId: string;
  sourceName: string;
  category: SourceCategory;
  lang: "ja" | "en";
}

export interface SourceStatus {
  id: string;
  name: string;
  ok: boolean;
  itemCount: number;
  error?: string;
}

export interface NewsResponse {
  items: NewsItem[];
  sources: SourceStatus[];
  fetchedAt: string; // ISO 8601
  /** キャッシュから返した場合 true */
  cached: boolean;
}
