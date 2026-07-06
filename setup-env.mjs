// .env.local を対話式で作成するスクリプト。実行: npm run setup
// 依存パッケージなし(Node.js 標準機能のみ)。

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline/promises";

const DEFAULT_URL = "https://kosdoyeaqnwfstrzokii.supabase.co";
const ENV_PATH = ".env.local";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\n===== Pet Food Checker 環境設定 (.env.local 作成) =====\n");

if (existsSync(ENV_PATH)) {
  const overwrite = await rl.question(".env.local は既に存在します。作り直しますか? (y/N): ");
  if (overwrite.trim().toLowerCase() !== "y") {
    console.log("中止しました。既存の .env.local をそのまま使います。\n");
    rl.close();
    process.exit(0);
  }
}

let url = (
  await rl.question(`Supabase の Project URL を入力 (Enterで ${DEFAULT_URL} を使用): `)
).trim();
if (!url) url = DEFAULT_URL;
url = url.replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
  console.log(`\n⚠️ URL の形式が想定と違います (${url})。そのまま保存しますが、動かない場合は見直してください。`);
}

let key = "";
while (!key) {
  key = (
    await rl.question(
      "\nSupabase の anon public キーを貼り付けて Enter\n(ダッシュボード → プロジェクト設定(歯車) → APIキー → anon public をコピー):\n> "
    )
  ).trim();
  if (key.length < 20) {
    console.log("⚠️ 短すぎます。anon キーは長い文字列です(eyJ... または sb_publishable_... で始まります)。もう一度貼り付けてください。");
    key = "";
  }
}
rl.close();

writeFileSync(
  ENV_PATH,
  [
    `NEXT_PUBLIC_SUPABASE_URL=${url}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`,
    "",
    "# OpenAI互換 AI API(任意。未設定ならルールベース診断で動作)",
    "AI_API_BASE_URL=https://api.openai.com/v1",
    "AI_API_KEY=",
    "AI_MODEL=gpt-4o-mini",
    "",
  ].join("\n"),
  "utf-8"
);

console.log(`\n✅ ${ENV_PATH} を作成しました。`);
console.log("次: npm run check で診断 → 全部✅なら npm run dev で起動してください。\n");
