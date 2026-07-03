"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedInEmail(data.session?.user.email ?? null);
    });
  }, []);

  async function signIn() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage(`ログインに失敗しました: ${error.message}`);
    } else {
      router.push("/diagnosis");
    }
  }

  async function signUp() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage(`登録に失敗しました: ${error.message}`);
    } else {
      setMessage("登録しました。確認メールが届いた場合はメール内のリンクを開いてからログインしてください。");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setLoggedInEmail(null);
    setMessage("ログアウトしました。");
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h1 className="text-lg font-bold">ログイン / 新規登録</h1>
      {loggedInEmail ? (
        <div className="mt-4 space-y-3 text-sm">
          <p>{loggedInEmail} でログイン中です。</p>
          <button
            onClick={signOut}
            className="w-full rounded-xl border border-amber-600 px-4 py-3 font-bold text-amber-700 hover:bg-amber-100"
          >
            ログアウト
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            メールアドレス
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            パスワード
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              autoComplete="current-password"
            />
          </label>
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full rounded-xl bg-amber-600 px-4 py-3 font-bold text-white shadow hover:bg-amber-700 disabled:opacity-50"
          >
            ログイン
          </button>
          <button
            onClick={signUp}
            disabled={loading}
            className="w-full rounded-xl border border-amber-600 px-4 py-3 font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
          >
            新規登録
          </button>
        </div>
      )}
      {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
    </div>
  );
}
