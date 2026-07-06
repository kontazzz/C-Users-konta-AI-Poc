import type { FeedSource } from "./types";

/**
 * 収集対象のニュースソース。
 * フィードを追加したいときはここに1行足すだけでよい。
 * 取得に失敗したソースは自動的にスキップされる(画面のステータスに表示)。
 */
export const FEED_SOURCES: FeedSource[] = [
  // ── 国内メディア ─────────────────────────────
  {
    id: "itmedia-aiplus",
    name: "ITmedia AI+",
    url: "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml",
    siteUrl: "https://www.itmedia.co.jp/aiplus/",
    category: "domestic",
    lang: "ja",
  },
  {
    id: "ainow",
    name: "AINOW",
    url: "https://ainow.ai/feed/",
    siteUrl: "https://ainow.ai/",
    category: "domestic",
    lang: "ja",
  },
  {
    id: "ledge-ai",
    name: "Ledge.ai",
    url: "https://ledge.ai/feed/",
    siteUrl: "https://ledge.ai/",
    category: "domestic",
    lang: "ja",
  },
  {
    id: "publickey",
    name: "Publickey",
    url: "https://www.publickey1.jp/atom.xml",
    siteUrl: "https://www.publickey1.jp/",
    category: "domestic",
    lang: "ja",
    keywordFilter: true,
  },
  {
    id: "gigazine",
    name: "GIGAZINE",
    url: "https://gigazine.net/news/rss_2.0/",
    siteUrl: "https://gigazine.net/",
    category: "domestic",
    lang: "ja",
    keywordFilter: true,
  },

  // ── 海外メディア ─────────────────────────────
  {
    id: "mit-tech-review-ai",
    name: "MIT Technology Review (AI)",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed",
    siteUrl: "https://www.technologyreview.com/topic/artificial-intelligence/",
    category: "global",
    lang: "en",
  },
  {
    id: "theverge-ai",
    name: "The Verge (AI)",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    siteUrl: "https://www.theverge.com/ai-artificial-intelligence",
    category: "global",
    lang: "en",
  },
  {
    id: "venturebeat-ai",
    name: "VentureBeat (AI)",
    url: "https://venturebeat.com/category/ai/feed/",
    siteUrl: "https://venturebeat.com/category/ai/",
    category: "global",
    lang: "en",
  },

  // ── 企業公式ブログ ───────────────────────────
  {
    id: "openai-blog",
    name: "OpenAI Blog",
    url: "https://openai.com/blog/rss.xml",
    siteUrl: "https://openai.com/blog/",
    category: "official",
    lang: "en",
  },
  {
    id: "google-ai-blog",
    name: "Google AI Blog",
    url: "https://blog.google/technology/ai/rss/",
    siteUrl: "https://blog.google/technology/ai/",
    category: "official",
    lang: "en",
  },
  {
    id: "aws-ml-blog",
    name: "AWS Machine Learning Blog",
    url: "https://aws.amazon.com/blogs/machine-learning/feed/",
    siteUrl: "https://aws.amazon.com/blogs/machine-learning/",
    category: "official",
    lang: "en",
  },
  {
    id: "huggingface-blog",
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog/feed.xml",
    siteUrl: "https://huggingface.co/blog",
    category: "official",
    lang: "en",
  },

  // ── コミュニティ ─────────────────────────────
  {
    id: "hackernews-ai",
    name: "Hacker News (AI)",
    url: "https://hnrss.org/newest?q=AI+OR+LLM&points=100",
    siteUrl: "https://news.ycombinator.com/",
    category: "community",
    lang: "en",
  },
];

/**
 * keywordFilter が有効なソースで使う AI 関連キーワード。
 * タイトルまたは概要にいずれかが含まれる記事だけを残す。
 */
export const AI_KEYWORDS: string[] = [
  // 日本語
  "AI",
  "人工知能",
  "生成AI",
  "機械学習",
  "深層学習",
  "ディープラーニング",
  "大規模言語モデル",
  "チャットボット",
  "画像生成",
  "音声認識",
  "自動運転",
  // 英語・製品名
  "LLM",
  "ChatGPT",
  "GPT-",
  "OpenAI",
  "Claude",
  "Anthropic",
  "Gemini",
  "Copilot",
  "Stable Diffusion",
  "Midjourney",
  "DeepSeek",
  "Llama",
  "Mistral",
  "Hugging Face",
  "machine learning",
  "deep learning",
  "neural network",
  "artificial intelligence",
  "transformer",
];

export const CATEGORY_LABELS: Record<string, string> = {
  domestic: "国内メディア",
  global: "海外メディア",
  official: "企業公式",
  community: "コミュニティ",
};
