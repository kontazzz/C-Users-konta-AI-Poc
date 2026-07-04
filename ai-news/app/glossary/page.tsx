import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI用語集 | AI News Hub",
  description: "ニュースを読むために最低限おさえておきたいAI用語のかんたん解説",
};

interface Term {
  term: string;
  reading?: string;
  description: string;
}

interface TermGroup {
  level: string;
  note: string;
  terms: Term[];
}

const GROUPS: TermGroup[] = [
  {
    level: "まずはここから(基礎)",
    note: "ニュースの見出しに毎日のように出てくる言葉です。",
    terms: [
      {
        term: "生成AI",
        reading: "せいせいエーアイ",
        description:
          "文章・画像・音声・コードなどを新しく「作り出す」AIの総称。ChatGPTやClaude、画像生成のMidjourneyなどが代表例。",
      },
      {
        term: "LLM(大規模言語モデル)",
        description:
          "大量の文章を学習して、人間のような文章を生成できるAIモデル。ChatGPT(GPTシリーズ)、Claude、Geminiなどの中身がこれ。",
      },
      {
        term: "プロンプト",
        description:
          "AIへの指示文のこと。「良い聞き方」を工夫することをプロンプトエンジニアリングと呼ぶ。",
      },
      {
        term: "ハルシネーション",
        description:
          "AIがもっともらしい嘘(事実と異なる内容)を自信満々に答えてしまう現象。AIの回答は鵜呑みにせず確認が必要、と言われる理由。",
      },
      {
        term: "チャットボット",
        description:
          "対話形式で質問に答えるプログラム。最近のニュースでは、LLMを使った高性能なものを指すことが多い。",
      },
      {
        term: "AGI(汎用人工知能)",
        description:
          "特定のタスクだけでなく、人間のようにあらゆる知的作業をこなせるAI。まだ実現していないが、各社が目指しているゴールとしてニュースによく登場する。",
      },
    ],
  },
  {
    level: "ニュースがもっと分かる(中級)",
    note: "新モデル発表や技術記事を読むときに役立ちます。",
    terms: [
      {
        term: "機械学習 / ディープラーニング",
        description:
          "データからパターンを自動で学ぶ技術が機械学習。その中でも人間の脳を模した多層のニューラルネットワークを使う手法がディープラーニング(深層学習)。",
      },
      {
        term: "トークン",
        description:
          "LLMが文章を処理する最小単位(おおよそ単語や文字のかけら)。API利用料金は「トークン数」で課金されることが多い。",
      },
      {
        term: "コンテキストウィンドウ",
        description:
          "AIが一度に読める文章量の上限。「100万トークン対応」などの発表は、より長い資料をまとめて扱えるようになったという意味。",
      },
      {
        term: "ファインチューニング",
        description:
          "学習済みのAIモデルを、自社データなどで追加学習させて特定用途に合わせること。",
      },
      {
        term: "RAG(検索拡張生成)",
        description:
          "AIが回答する前に社内文書などを検索し、その内容を根拠にして答える仕組み。ハルシネーション対策や社内AI導入の文脈で頻出。",
      },
      {
        term: "マルチモーダル",
        description:
          "テキストだけでなく画像・音声・動画もまとめて理解・生成できること。最近の主要モデルはほぼマルチモーダル対応。",
      },
      {
        term: "推論(インファレンス)",
        description:
          "学習済みモデルを実際に動かして回答を得ること。「推論コスト」はAIを動かすための計算費用の話。",
      },
      {
        term: "オープンソースモデル / オープンウェイト",
        description:
          "モデルの中身(重み)が公開されていて、誰でもダウンロードして使えるAIモデル。LlamaやDeepSeekなどが有名。",
      },
    ],
  },
  {
    level: "一歩先へ(応用・トレンド)",
    note: "最新の動向を追うためのキーワードです。",
    terms: [
      {
        term: "AIエージェント",
        description:
          "指示を受けて、自分で調べ物をしたりツールを操作したりしながらタスクを最後までこなすAI。2025年以降の最大のトレンドワードの一つ。",
      },
      {
        term: "MCP(Model Context Protocol)",
        description:
          "AIと外部ツール・データをつなぐための共通規格。AIエージェントが社内システムなどと連携する際の標準として普及が進んでいる。",
      },
      {
        term: "GPU / AI半導体",
        description:
          "AIの学習・推論に必要な計算チップ。NVIDIAが最大手で、AI業界の設備投資ニュースはほぼGPUの話。",
      },
      {
        term: "AI規制 / AI法",
        description:
          "EUのAI法(AI Act)をはじめ、各国で進むAIの利用ルール作り。企業のAI活用に直結するため要チェック。",
      },
      {
        term: "著作権と学習データ",
        description:
          "AIの学習に使われたデータの権利をめぐる議論・訴訟。クリエイターや報道機関とAI企業の間で世界的に係争が続いている。",
      },
      {
        term: "スケーリング則",
        description:
          "モデルやデータ、計算量を大きくするほどAIの性能が上がるという経験則。「もっと大きなモデルを作る」競争の背景にある考え方。",
      },
      {
        term: "アライメント / AI安全性",
        description:
          "AIが人間の意図や価値観に沿って動くようにする研究分野。AIが強力になるほど重要性が増すテーマ。",
      },
    ],
  },
];

export default function GlossaryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">AI用語集</h1>
        <p className="mt-1 text-sm text-slate-400">
          ニュースを読むために最低限おさえておきたい用語を、かんたんな言葉でまとめました。
          まずは「基礎」の6つだけ覚えれば、だいたいの記事は読めるようになります。
        </p>
      </div>

      {GROUPS.map((group) => (
        <section key={group.level}>
          <h2 className="mb-1 text-lg font-semibold text-white">{group.level}</h2>
          <p className="mb-3 text-xs text-slate-500">{group.note}</p>
          <dl className="space-y-3">
            {group.terms.map((t) => (
              <div
                key={t.term}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <dt className="font-semibold text-sky-300">
                  {t.term}
                  {t.reading && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {t.reading}
                    </span>
                  )}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-300">
                  {t.description}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
