import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Задачі та відповіді",
  description: "Завдання з відповідями — зручно з телефона",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <header className="sticky top-0 z-10 bg-indigo-600 text-white shadow">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              📚 Задачі
            </Link>
            <Link
              href="/add"
              className="rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium active:bg-white/30"
            >
              + Додати
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-4 pb-16">{children}</main>
      </body>
    </html>
  );
}
