import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-bold">愛犬に合うフードか、かんたん診断</h1>
        <p className="mt-3 text-sm leading-relaxed">
          日本市場のドライドッグフードのデータベースをもとに、愛犬のプロフィールと商品情報から適合度を診断します。
        </p>
        <ul className="mt-4 space-y-1 text-sm">
          <li>・商品検索または原材料の手入力で診断</li>
          <li>・アレルギーの注意点を表示</li>
          <li>・似た価格帯・似た原材料・同じメーカーのフードを提案</li>
          <li>・診断履歴を保存</li>
        </ul>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/diagnosis"
            className="rounded-xl bg-amber-600 px-4 py-3 text-center font-bold text-white shadow hover:bg-amber-700"
          >
            診断をはじめる
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-amber-600 px-4 py-3 text-center font-bold text-amber-700 hover:bg-amber-100"
          >
            ログイン / 新規登録
          </Link>
        </div>
      </section>
      <p className="text-xs text-gray-500">
        この診断は獣医師の診断や治療の代わりではありません。療法食・動物病院専売品は対象外です。
      </p>
    </div>
  );
}
