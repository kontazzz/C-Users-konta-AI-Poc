"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { DiagnosisResult } from "@/lib/types";

interface DiagnosisRow {
  id: string;
  dog_name: string | null;
  product_name: string | null;
  result: DiagnosisResult;
  created_at: string;
}

const LEVEL_STYLES: Record<string, string> = {
  Good: "bg-green-100 text-green-800",
  Caution: "bg-yellow-100 text-yellow-800",
  Avoid: "bg-red-100 text-red-800",
};

export default function HistoryPage() {
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [rows, setRows] = useState<DiagnosisRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      setLoggedIn(!!session);
      setCheckedAuth(true);
      if (!session) {
        setLoading(false);
        return;
      }
      const { data: diagnoses, error: fetchError } = await supabase
        .from("diagnoses")
        .select("id, dog_name, product_name, result, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (fetchError) {
        setError(`履歴の取得に失敗しました: ${fetchError.message}`);
      } else {
        setRows((diagnoses ?? []) as DiagnosisRow[]);
      }
      setLoading(false);
    })();
  }, []);

  if (!checkedAuth || loading) {
    return <p className="text-sm">読み込み中...</p>;
  }
  if (!loggedIn) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow">
        <p className="text-sm">履歴の閲覧にはログインが必要です。</p>
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
    <div className="space-y-4">
      <h1 className="text-lg font-bold">診断履歴</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {rows.length === 0 && !error && (
        <div className="rounded-2xl bg-white p-6 text-sm shadow">
          <p>まだ診断履歴がありません。</p>
          <Link
            href="/diagnosis"
            className="mt-4 block rounded-xl bg-amber-600 px-4 py-3 text-center font-bold text-white"
          >
            診断をはじめる
          </Link>
        </div>
      )}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl bg-white p-4 shadow">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">
                {row.dog_name ?? "名前未登録"} × {row.product_name ?? "商品選択なし"}
              </p>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  LEVEL_STYLES[row.result?.level] ?? "bg-gray-100"
                }`}
              >
                {row.result?.score}点 {row.result?.level}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{row.result?.summary}</p>
            <p className="mt-2 text-xs text-gray-400">
              {new Date(row.created_at).toLocaleString("ja-JP")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
