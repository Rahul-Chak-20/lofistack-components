"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CommandPalette, Kbd, type CommandItem } from "@/components/ui/command-palette";
import { components } from "@/lib/registry";
import { site } from "@/lib/site";

const icons: Record<string, string> = {
  button: "◉",
  input: "⌨",
  table: "▦",
  "card game": "🃏",
  "command palette": "⌘",
};

const SiteSearchContext = createContext<(() => void) | null>(null);

/** Site-wide Ctrl+K / ⌘K palette for jumping between gallery pages. */
export function SiteSearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = useMemo<CommandItem[]>(() => {
    const toItem = (c: (typeof components)[number], idPrefix: string): CommandItem => ({
      id: `${idPrefix}${c.slug}`,
      label: c.name,
      group: "Components",
      description: `Week ${c.week} · ${c.type}`,
      keywords: [c.type, c.slug],
      icon: icons[c.type] ?? "◇",
      onSelect: () => router.push(`/components/${c.slug}`),
    });
    const weeks = [...new Set(components.map((c) => c.week))].sort((a, b) => a - b);

    return [
      ...components.map((c) => toItem(c, "site-")),
      {
        id: "site-weeks",
        label: "Browse by week",
        group: "Gallery",
        keywords: ["week", "challenge"],
        icon: "▤",
        placeholder: "Pick a week…",
        items: weeks.map((w) => {
          const inWeek = components.filter((c) => c.week === w);
          return {
            id: `site-week-${w}`,
            label: `Week ${w}`,
            description: `${inWeek.length} ${inWeek.length === 1 ? "component" : "components"}`,
            icon: String(w),
            items: inWeek.map((c) => ({ ...toItem(c, `site-w${w}-`), group: undefined })),
          };
        }),
      },
      {
        id: "site-home",
        label: "Gallery home",
        group: "Gallery",
        keywords: ["index", "all"],
        icon: "⌂",
        onSelect: () => router.push("/"),
      },
      {
        id: "site-repo",
        label: "Source on GitHub",
        group: "Gallery",
        keywords: ["repo", "code", "git"],
        icon: "↗",
        onSelect: () => window.open(site.repo, "_blank", "noopener,noreferrer"),
      },
    ];
  }, [router]);

  // The Command Palette page has its own demo palette on Ctrl+K, so step aside there.
  const onDemoPage = pathname === "/components/command-palette";

  return (
    <SiteSearchContext.Provider value={() => setOpen(true)}>
      {children}
      <CommandPalette
        items={items}
        open={open}
        onOpenChange={setOpen}
        hotkey={onDemoPage ? false : "mod+k"}
        placeholder="Search components…"
        recentKey="lofistack-site-search"
        label="Search components"
      />
    </SiteSearchContext.Provider>
  );
}

/** A search-bar style button that opens the site palette. */
export function SiteSearchTrigger({ className = "" }: { className?: string }) {
  const openSearch = useContext(SiteSearchContext);
  return (
    <button
      type="button"
      onClick={() => openSearch?.()}
      aria-haspopup="dialog"
      className={`group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-zinc-400 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.35)] backdrop-blur transition hover:border-violet-400/30 hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${className}`}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4 shrink-0" aria-hidden="true">
        <circle cx="9" cy="9" r="6" />
        <path d="m17 17-3.5-3.5" strokeLinecap="round" />
      </svg>
      <span className="flex-1">Search components…</span>
      <Kbd keys={["mod", "K"]} />
    </button>
  );
}
