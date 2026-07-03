"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { DiagnosisResult } from "@/lib/types";

interface ProductSummary {
  product_id: number;
  brand_name: string;
  product_name: string;
  price_band: string | null;
  life_stages: string | null;
  potential_allergens: string | null;
}

const LEVEL_STYLES: Record<string, string> = {
  Good: "bg-green-100 text-green-800 border-green-300",
  Caution: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Avoid: "bg-red-100 text-red-800 border-red-300",
};

const LEVEL_LABELS: Record<string, string> = {
  Good: "良い",
  Caution: "注意",
  Avoid: "避ける",
};

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-1 list-disc pl-5 text-sm">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-gray-500">該当データなし</p>
      )}
    </div>
  );
}

export default function DiagnosisPage() {
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [dogName, setDogName] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [breed, setBreed] = useState("");
  const [lifeStage, setLifeStage] = useState<"puppy" | "adult" | "senior">("adult");
  const [allergies, setAllergies] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSummary[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);
  const [searching, setSearching] = useState(false);

  const [barcodeText, setBarcodeText] = useState("");
  const [imageName, setImageName] = useState("");
  const [manualIngredients, setManualIngredients] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      setCheckedAuth(true);
    });
  }, []);

  async function search() {
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "検索に失敗しました。");
      setSearchResults(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : "検索に失敗しました。");
    } finally {
      setSearching(false);
    }
  }

  async function submit() {
    setError("");
    setResult(null);
    if (!dogName.trim()) {
      setError("犬の名前を入力してください。");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("ログインが必要です。");
        return;
      }
      const res = await fetch("/api/diagnosis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dog: {
            name: dogName,
            ageYears: ageYears ? Number(ageYears) : null,
            weightKg: weightKg ? Number(weightKg) : null,
            breed,
            lifeStage,
            allergies,
          },
          productId: selectedProduct?.product_id ?? null,
          barcodeText,
          manualIngredients,
          hasImage: imageName !== "",
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "診断に失敗しました。");
      setResult(body.result);
      if (!body.saved) {
        setError(`診断は完了しましたが履歴の保存に失敗しました: ${body.saveError ?? "不明なエラー"}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "診断に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (!checkedAuth) {
    return <p className="text-sm">読み込み中...</p>;
  }
  if (!loggedIn) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow">
        <p className="text-sm">診断にはログインが必要です。</p>
        <Link
          href="/login"
          className="mt-4 block rounded-xl bg-amber-600 px-4 py-3 text-center font-bold text-white"
        >
          ログインへ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-lg font-bold">フード診断</h1>

        <h2 className="mt-4 border-b pb-1 text-sm font-bold text-amber-700">1. 愛犬のプロフィール</h2>
        <div className="mt-3 space-y-3 text-sm">
          <label className="block">
            名前 <span className="text-red-500">*</span>
            <input
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              年齢(歳)
              <input
                type="number"
                min="0"
                step="0.5"
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
            <label className="block">
              体重(kg)
              <input
                type="number"
                min="0"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              />
            </label>
          </div>
          <label className="block">
            犬種
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="例: トイプードル"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <div>
            ライフステージ
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(
                [
                  ["puppy", "子犬"],
                  ["adult", "成犬"],
                  ["senior", "高齢犬"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLifeStage(value)}
                  className={`rounded-lg border px-2 py-2 ${
                    lifeStage === value
                      ? "border-amber-600 bg-amber-600 font-bold text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            アレルギー(「、」区切りで入力)
            <input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="例: 鶏、小麦"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>

        <h2 className="mt-6 border-b pb-1 text-sm font-bold text-amber-700">2. フードの情報</h2>
        <div className="mt-3 space-y-3 text-sm">
          <label className="block">
            商品検索(データベースから)
            <div className="mt-1 flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="商品名・ブランド名"
                className="w-full rounded-lg border px-3 py-2"
              />
              <button
                type="button"
                onClick={search}
                disabled={searching}
                className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 font-bold text-white disabled:opacity-50"
              >
                検索
              </button>
            </div>
          </label>
          {searchResults.length > 0 && (
            <ul className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-2">
              {searchResults.map((p) => (
                <li key={p.product_id}>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full rounded-lg border px-3 py-2 text-left ${
                      selectedProduct?.product_id === p.product_id
                        ? "border-amber-600 bg-amber-100"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="block font-bold">{p.brand_name}</span>
                    <span className="block">{p.product_name}</span>
                    {p.potential_allergens && (
                      <span className="block text-xs text-gray-500">
                        含有可能性アレルゲン: {p.potential_allergens}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedProduct && (
            <p className="rounded-lg bg-amber-100 px-3 py-2">
              選択中: {selectedProduct.brand_name} {selectedProduct.product_name}{" "}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="ml-2 text-xs text-amber-700 underline"
              >
                解除
              </button>
            </p>
          )}
          <label className="block">
            バーコード(数字を手入力・将来は自動照合予定)
            <input
              value={barcodeText}
              onChange={(e) => setBarcodeText(e.target.value)}
              placeholder="例: 4902112000000"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block">
            パッケージ画像(プレースホルダ・現在は解析されません)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageName(e.target.files?.[0]?.name ?? "")}
              className="mt-1 w-full text-xs"
            />
          </label>
          <label className="block">
            原材料の手入力
            <textarea
              value={manualIngredients}
              onChange={(e) => setManualIngredients(e.target.value)}
              rows={3}
              placeholder="パッケージの原材料表示をそのまま入力"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-amber-600 px-4 py-3 font-bold text-white shadow hover:bg-amber-700 disabled:opacity-50"
        >
          {submitting ? "診断中..." : "診断する"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>

      {result && (
        <section className="rounded-2xl bg-white p-5 shadow">
          <div
            className={`rounded-xl border px-4 py-3 text-center ${LEVEL_STYLES[result.level] ?? ""}`}
          >
            <p className="text-3xl font-bold">{result.score}点</p>
            <p className="font-bold">
              {LEVEL_LABELS[result.level] ?? result.level}({result.level})
            </p>
          </div>
          <p className="mt-4 text-sm leading-relaxed">{result.summary}</p>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold">主な原材料</h3>
              <p className="mt-1 text-sm">{result.mainIngredientsSummary}</p>
            </div>
            <ListSection title="アレルギーに関する注意" items={result.allergyWarnings} />
            <ListSection title="注意したい原材料" items={result.riskIngredients} />
            <ListSection title="良い原材料" items={result.positiveIngredients} />
            <ListSection title="おすすめのライフステージ" items={result.recommendedLifeStages} />
            <ListSection title="おすすめの犬種・サイズ" items={result.recommendedBreeds} />
            <ListSection title="避けたほうがよい犬種" items={result.avoidBreeds} />
            <ListSection title="似た価格帯のフード" items={result.similarPriceFoods} />
            <ListSection title="似た原材料のフード" items={result.similarIngredientFoods} />
            <ListSection title="同じメーカーのフード" items={result.sameManufacturerFoods} />
            <div>
              <h3 className="text-sm font-bold">給与メモ</h3>
              <p className="mt-1 text-sm">{result.feedingNote}</p>
            </div>
          </div>
          <p className="mt-5 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600">
            {result.disclaimer}
          </p>
        </section>
      )}
    </div>
  );
}
