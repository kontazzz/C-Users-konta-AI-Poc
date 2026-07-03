import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

// ブラウザ用クライアント(セッションは localStorage に保持)。
export const supabase = createClient(url, anonKey);

// APIルート用: リクエストの Bearer トークンを付けたクライアント。
// RLS により本人の行しか読み書きできない。
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
