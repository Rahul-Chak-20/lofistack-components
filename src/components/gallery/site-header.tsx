"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";

export function GitHubIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const onComponents = pathname.startsWith("/components");

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090f]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#09090f]/60">
      <nav
        className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
        aria-label="Main"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <span
            className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm text-white shadow-[0_0_20px_-4px_rgba(167,139,250,0.7)]"
            aria-hidden="true"
          >
            ◐
          </span>
          <span>
            LofiStack<span className="hidden text-zinc-400 sm:inline"> Components</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 text-sm">
          <Link
            href="/#components"
            aria-current={onComponents ? "page" : undefined}
            className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 aria-[current=page]:text-white"
          >
            Components
          </Link>
          <a
            href={site.repo}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <GitHubIcon />
            <span className="hidden sm:inline">GitHub</span>
            <span className="sr-only sm:hidden">GitHub (opens in a new tab)</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
