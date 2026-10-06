import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-violet-500 focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <header className="border-b border-white/5">
          <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6" aria-label="Main">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white">
              <span className="grid size-7 place-items-center rounded-lg bg-violet-500/20 text-violet-300" aria-hidden="true">
                ◐
              </span>
              {site.name}
            </Link>
            <a
              href={site.repo}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              GitHub ↗
            </a>
          </nav>
        </header>
        <div id="content" className="flex flex-1 flex-col">
          {children}
        </div>
        <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-500">
          Built by {site.author} for the LofiStack 90 Day Build Challenge.
        </footer>
      </body>
    </html>
  );
}
