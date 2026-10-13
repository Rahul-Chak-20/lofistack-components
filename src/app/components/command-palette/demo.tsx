"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette, Kbd, type CommandItem } from "@/components/ui/command-palette";
import { components } from "@/lib/registry";
import { site } from "@/lib/site";

const accents = {
  violet: { label: "Violet", swatch: "bg-violet-400", ring: "border-violet-400/40", glow: "shadow-[0_0_40px_-10px_rgba(167,139,250,0.7)]", text: "text-violet-200" },
  emerald: { label: "Emerald", swatch: "bg-emerald-400", ring: "border-emerald-400/40", glow: "shadow-[0_0_40px_-10px_rgba(52,211,153,0.7)]", text: "text-emerald-200" },
  sky: { label: "Sky", swatch: "bg-sky-400", ring: "border-sky-400/40", glow: "shadow-[0_0_40px_-10px_rgba(56,189,248,0.7)]", text: "text-sky-200" },
  rose: { label: "Rose", swatch: "bg-rose-400", ring: "border-rose-400/40", glow: "shadow-[0_0_40px_-10px_rgba(251,113,133,0.7)]", text: "text-rose-200" },
  amber: { label: "Amber", swatch: "bg-amber-400", ring: "border-amber-400/40", glow: "shadow-[0_0_40px_-10px_rgba(251,191,36,0.7)]", text: "text-amber-200" },
} as const;

type Accent = keyof typeof accents;

const icons: Record<string, string> = {
  button: "◉",
  input: "⌨",
  table: "▦",
  "card game": "🃏",
  "command palette": "⌘",
};

export function CommandPaletteDemo() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState<Accent>("violet");
  const [compact, setCompact] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const items = useMemo<CommandItem[]>(() => {
    const log = (text: string) => setLastRun(text);
    return [
      ...components.map<CommandItem>((c) => ({
        id: `go-${c.slug}`,
        label: c.name,
        group: "Components",
        description: `Week ${c.week} · ${c.type}`,
        keywords: [c.type, c.slug],
        icon: icons[c.type] ?? "◇",
        onSelect: () => router.push(`/components/${c.slug}`),
      })),
      {
        id: "go-home",
        label: "Gallery home",
        group: "Components",
        keywords: ["index", "all"],
        icon: "⌂",
        onSelect: () => router.push("/"),
      },
      {
        id: "accent",
        label: "Change accent color",
        group: "Appearance",
        description: "Opens a page of colors",
        keywords: ["theme", "color", "brand"],
        icon: "◐",
        placeholder: "Pick an accent…",
        items: (Object.keys(accents) as Accent[]).map((key) => ({
          id: `accent-${key}`,
          label: accents[key].label,
          icon: <span className={`size-3 rounded-full ${accents[key].swatch}`} />,
          onSelect: () => {
            setAccent(key);
            log(`Accent set to ${accents[key].label}`);
          },
        })),
      },
      {
        id: "density",
        label: "Toggle compact card",
        group: "Appearance",
        keywords: ["density", "size", "spacing"],
        icon: "↕",
        shortcut: ["alt", "C"],
        keepOpen: true,
        onSelect: () => {
          setCompact((c) => !c);
          log("Toggled compact card");
        },
      },
      {
        id: "copy-link",
        label: "Copy link to this page",
        group: "Actions",
        keywords: ["share", "url", "clipboard"],
        icon: "⧉",
        shortcut: ["alt", "L"],
        onSelect: () => {
          navigator.clipboard?.writeText(window.location.href).then(
            () => log("Copied page link"),
            () => log("Clipboard was blocked"),
          );
        },
      },
      {
        id: "open-repo",
        label: "Open repository on GitHub",
        group: "Actions",
        keywords: ["source", "code", "git"],
        icon: "↗",
        onSelect: () => {
          window.open(site.repo, "_blank", "noopener,noreferrer");
          log("Opened the repository");
        },
      },
      {
        id: "deploy",
        label: "Deploy to production",
        group: "Actions",
        description: "Disabled in this demo",
        icon: "▲",
        disabled: true,
      },
      {
        id: "help",
        label: "Help",
        group: "Help",
        icon: "?",
        items: [
          { id: "help-keys", label: "Arrow keys move, Enter runs", icon: "↵", keepOpen: true, onSelect: () => log("Arrow keys move, Enter runs") },
          { id: "help-back", label: "Backspace or Esc goes back a page", icon: "⌫", keepOpen: true, onSelect: () => log("Backspace goes back") },
          { id: "help-fuzzy", label: "Search is fuzzy, so partial words work", icon: "✱", keepOpen: true, onSelect: () => log("Search is fuzzy") },
        ],
      },
    ];
  }, [router]);

  const a = accents[accent];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4" aria-hidden="true">
          <circle cx="9" cy="9" r="6" />
          <path d="m17 17-3.5-3.5" strokeLinecap="round" />
        </svg>
        <span className="flex-1">Search commands…</span>
        <Kbd keys={["mod", "K"]} />
      </button>

      <div className={`w-full rounded-2xl border bg-zinc-950/70 transition-all duration-300 ${a.ring} ${a.glow} ${compact ? "p-4" : "p-6"}`}>
        <div className="flex items-center gap-3">
          <span className={`size-2.5 rounded-full ${a.swatch}`} aria-hidden="true" />
          <span className={`text-sm font-medium ${a.text}`}>{a.label} accent</span>
          <span className="ml-auto text-xs text-zinc-500">{compact ? "Compact" : "Comfortable"}</span>
        </div>
        <p className={`text-sm text-zinc-400 ${compact ? "mt-2" : "mt-4"}`}>
          This card reacts to the palette. Change the accent from the nested color page or toggle density without closing.
        </p>
      </div>

      <p className="text-center text-xs text-zinc-500" aria-live="polite">
        {lastRun ? `Last command: ${lastRun}` : "Press Ctrl+K (⌘K on Mac) anywhere on this page, or click the search bar."}
      </p>

      <CommandPalette items={items} open={open} onOpenChange={setOpen} recentKey="lofistack-command-palette" />
    </div>
  );
}
