import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI News Hub",
  description: "AI関連ニュースを自動で集めてくる社内向けニュースアプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                AI News Hub
              </span>
              <span className="hidden text-xs text-slate-400 sm:inline">
                AIニュース自動収集
              </span>
            </Link>
            <nav className="flex gap-4 text-sm text-slate-300">
              <Link href="/" className="hover:text-white">
                ニュース
              </Link>
              <Link href="/glossary" className="hover:text-white">
                AI用語集
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-500">
          記事の著作権は各配信元に帰属します。タイトル・リンク・冒頭の概要のみを表示しています。
        </footer>
      </body>
    </html>
  );
}
