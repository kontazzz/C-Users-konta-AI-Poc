// セットアップ状況を診断するスクリプト。実行: npm run check
// 依存パッケージなし(Node.js 標準機能のみ)。

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const results = [];
let nextActions = [];

function ok(label, detail = "") {
  results.push(`  ✅ ${label}${detail ? ` — ${detail}` : ""}`);
}
function ng(label, action) {
  results.push(`  ❌ ${label}`);
  nextActions.push(action);
}
function warn(label, detail = "") {
  results.push(`  ⚠️ ${label}${detail ? ` — ${detail}` : ""}`);
}

// 1. Node.js バージョン
const major = Number(process.versions.node.split(".")[0]);
if (major >= 18) {
  ok(`Node.js v${process.versions.node}`);
} else {
  ng(
    `Node.js のバージョンが古い (v${process.versions.node})`,
    "https://nodejs.org から LTS 版をインストールし直してください。"
  );
}

// 2. node_modules
if (existsSync(path.join(root, "node_modules"))) {
  ok("依存パッケージ (node_modules)");
} else {
  ng("依存パッケージが未インストール", "npm install を実行してください。");
}

// 3. フードDB (SQLite)
const dbPath = process.env.FOOD_DB_PATH ?? path.join(root, "dog_food_jp.sqlite");
if (existsSync(dbPath)) {
  ok("フードDB (dog_food_jp.sqlite)");
} else {
  ng("フードDB (dog_food_jp.sqlite) がない", "python build_database.py を実行してください。");
}

// 4. .env.local
const envPath = path.join(root, ".env.local");
let supabaseUrl = "";
let supabaseKey = "";
if (!existsSync(envPath)) {
  ng(
    ".env.local がない",
    "copy .env.example .env.local を実行し、Supabase の URL と anon キーを設定してください。"
  );
} else {
  const env = Object.fromEntries(
    readFileSync(envPath, "utf-8")
      .split(/\r?\n/)
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
  supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || supabaseUrl.includes("your-project")) {
    ng(
      ".env.local の NEXT_PUBLIC_SUPABASE_URL が未設定",
      "Supabase ダッシュボードのプロジェクト設定で Project URL をコピーして .env.local に設定してください。"
    );
    supabaseUrl = "";
  } else {
    ok(".env.local の Supabase URL", supabaseUrl);
  }
  if (!supabaseKey || supabaseKey.includes("your-anon-key")) {
    ng(
      ".env.local の NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定",
      "Supabase ダッシュボードの「APIキー」で anon public キーをコピーして .env.local に設定してください。"
    );
    supabaseKey = "";
  } else {
    ok(".env.local の anon キー", `${supabaseKey.slice(0, 8)}...`);
  }

  if (env.AI_API_KEY) {
    ok("AI APIキー設定あり(AI診断が有効)");
  } else {
    warn("AI APIキー未設定", "ルールベース診断で動作します(設定は任意)");
  }
}

// 5. Supabase への接続とテーブル確認
if (supabaseUrl && supabaseKey) {
  const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };
  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/diagnoses?select=id&limit=1`, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      ok("Supabase 接続・テーブル (dogs / diagnoses)");
    } else if (res.status === 404) {
      ng(
        "Supabase にテーブルがない (diagnoses が見つからない)",
        "Supabase の SQLエディターで supabase_app_schema.sql の中身を貼り付けて実行してください。"
      );
    } else {
      ng(
        `Supabase 接続エラー (HTTP ${res.status})`,
        "URL と anon キーが正しいか .env.local を確認してください。"
      );
    }
  } catch {
    ng(
      "Supabase に接続できない",
      "①インターネット接続を確認 ②Supabase ダッシュボードでプロジェクトが「Paused(一時停止)」なら Restore ボタンで復元して数分待ってから再実行してください。"
    );
  }
}

console.log("\n===== Pet Food Checker セットアップ診断 =====\n");
console.log(results.join("\n"));
console.log("");
if (nextActions.length === 0) {
  console.log("🎉 準備完了! npm run dev で起動し、http://localhost:3000 を開いてください。\n");
} else {
  console.log("―― 次にやること ――");
  nextActions.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));
  console.log("\n対応後、もう一度 npm run check を実行してください。\n");
  process.exitCode = 1;
}
