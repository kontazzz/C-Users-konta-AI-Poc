import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pet Food Checker",
  description: "愛犬に合うドッグフードかを診断するアプリ(MVP)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-amber-50 text-gray-800">
        <header className="bg-amber-600 text-white">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              🐶 Pet Food Checker
            </Link>
            <nav className="flex gap-3 text-sm">
              <Link href="/diagnosis" className="hover:underline">
                診断
              </Link>
              <Link href="/history" className="hover:underline">
                履歴
              </Link>
              <Link href="/login" className="hover:underline">
                ログイン
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-md px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
