"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface CommandItem {
  /** Unique across the whole tree. Also used to remember recent commands. */
  id: string;
  label: string;
  /** Section heading on the page this item lives on. */
  group?: string;
  /** Muted second line. Also searched, with a lower weight. */
  description?: string;
  /** Extra words that should find this item. */
  keywords?: string[];
  icon?: ReactNode;
  /** One key chord, such as ["alt", "C"]. Shown on the right and, with globalShortcuts, runs the command. "mod" is ⌘ on Mac and Ctrl elsewhere. */
  shortcut?: string[];
  disabled?: boolean;
  /** Nested commands. Selecting the item opens them as a new page. */
  items?: CommandItem[];
  /** Search placeholder on this item's nested page. */
  placeholder?: string;
  /** Keep the palette open after running this command. */
  keepOpen?: boolean;
  onSelect?: () => void;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  /** Controlled open state. Leave undefined to let the palette manage it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Global shortcut that toggles the palette, like "mod+k" or "shift+/". Pass false to turn it off. */
  hotkey?: string | false;
  placeholder?: string;
  emptyMessage?: ReactNode;
  /** localStorage key for recently used commands. Pass false to turn it off. */
  recentKey?: string | false;
  maxRecent?: number;
  /** Accessible name for the dialog. */
  label?: string;
  /** Shows key hints along the bottom. */
  showFooter?: boolean;
  /** Runs commands from their shortcut while the palette is closed. */
  globalShortcuts?: boolean;
  /** Classes for the panel. */
  className?: string;
}

interface Entry {
  item: CommandItem;
  /** Labels of the parent items, relative to the current page. */
  path: string[];
}

interface Result extends Entry {
  score: number;
  indices: number[];
}

interface Section {
  key: string;
  heading: string;
  entries: Result[];
}

/* ---------- Fuzzy matching ---------- */

const boundary = /[\s\-_/.:›]/;

/** Scores how well `query` matches `text`. Returns null when it doesn't match, plus the matched character indices. */
export function fuzzyMatch(query: string, text: string): { score: number; indices: number[] } | null {
  const q = query.toLowerCase().replace(/\s+/g, " ").trim();
  const t = text.toLowerCase();
  if (!q) return { score: 0, indices: [] };

  const start = t.indexOf(q);
  if (start !== -1) {
    const atWord = start === 0 || boundary.test(t[start - 1]);
    return {
      score: 100 + (start === 0 ? 40 : atWord ? 20 : 0) - start * 0.5 - (t.length - q.length) * 0.1,
      indices: Array.from({ length: q.length }, (_, i) => start + i),
    };
  }

  const indices: number[] = [];
  let score = 0;
  let from = 0;
  let prev = -2;
  for (const ch of q) {
    if (ch === " ") continue;
    // Prefer the next word start that has this letter, else the next occurrence.
    let found = -1;
    for (let i = from; i < t.length; i++) {
      if (t[i] !== ch) continue;
      if (i === prev + 1 || i === 0 || boundary.test(t[i - 1])) {
        found = i;
        break;
      }
      if (found === -1) found = i;
    }
    if (found === -1) return null;
    const atWord = found === 0 || boundary.test(t[found - 1]);
    score += 1 + (found === prev + 1 ? 6 : 0) + (atWord ? 8 : 0);
    indices.push(found);
    prev = found;
    from = found + 1;
  }
  return { score: score - indices[0] * 0.3 - t.length * 0.05, indices };
}

function matchEntry(query: string, { item, path }: Entry): { score: number; indices: number[] } | null {
  const own = fuzzyMatch(query, item.label);
  if (own) return own;

  // "accent violet" should find Violet inside the Accent color page. Only highlight the label part.
  if (path.length) {
    const prefix = path.join(" ") + " ";
    const full = fuzzyMatch(query, prefix + item.label);
    if (full) {
      return {
        score: full.score * 0.8,
        indices: full.indices.filter((i) => i >= prefix.length).map((i) => i - prefix.length),
      };
    }
  }

  const extra = [item.description, ...(item.keywords ?? [])].filter(Boolean).join(" ");
  const other = extra ? fuzzyMatch(query, extra) : null;
  return other ? { score: other.score * 0.5, indices: [] } : null;
}

function flatten(items: CommandItem[], path: string[] = []): Entry[] {
  return items.flatMap((item) => [
    { item, path },
    ...(item.items ? flatten(item.items, [...path, item.label]) : []),
  ]);
}

/* ---------- Platform and storage ---------- */

const noopSubscribe = () => () => {};

export function useIsMac(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}

const recentListeners = new Set<() => void>();

function subscribeRecent(callback: () => void) {
  recentListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    recentListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function readRecent(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeRecent(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Storage can be blocked. Recents are a nice to have, so carry on.
  }
  recentListeners.forEach((l) => l());
}

function parseIds(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function matchesHotkey(e: KeyboardEvent, hotkey: string): boolean {
  const parts = hotkey.toLowerCase().split("+");
  const key = parts.pop();
  const mods = new Set(parts);
  const wantsMod = mods.has("mod");
  const metaOk = wantsMod ? true : e.metaKey === mods.has("meta");
  const ctrlOk = wantsMod ? true : e.ctrlKey === mods.has("ctrl");
  const modOk = !wantsMod || e.metaKey || e.ctrlKey;
  // e.code keeps Alt+letter working on Mac, where e.key becomes a special character.
  const keyOk = e.key.toLowerCase() === key || (!!key && /^[a-z]$/.test(key) && e.code === `Key${key.toUpperCase()}`);
  return (
    keyOk &&
    metaOk &&
    ctrlOk &&
    modOk &&
    e.shiftKey === mods.has("shift") &&
    e.altKey === mods.has("alt")
  );
}

/* ---------- Small pieces ---------- */

const keyNames: Record<string, [mac: string, other: string]> = {
  mod: ["⌘", "Ctrl"],
  meta: ["⌘", "Win"],
  ctrl: ["⌃", "Ctrl"],
  shift: ["⇧", "Shift"],
  alt: ["⌥", "Alt"],
  enter: ["↵", "Enter"],
  esc: ["Esc", "Esc"],
  escape: ["Esc", "Esc"],
  backspace: ["⌫", "Backspace"],
  up: ["↑", "↑"],
  down: ["↓", "↓"],
  left: ["←", "←"],
  right: ["→", "→"],
};

export function formatKey(key: string, isMac: boolean): string {
  const named = keyNames[key.toLowerCase()];
  if (named) return isMac ? named[0] : named[1];
  return key.length === 1 ? key.toUpperCase() : key;
}

/** Renders keys as keycaps. "mod" becomes ⌘ on Mac and Ctrl elsewhere. */
export function Kbd({ keys, className = "" }: { keys: string[]; className?: string }) {
  const isMac = useIsMac();
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] px-1.5 font-sans text-[10px] font-medium text-zinc-400 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]"
        >
          {formatKey(k, isMac)}
        </kbd>
      ))}
    </span>
  );
}

function Highlight({ text, indices }: { text: string; indices: number[] }) {
  if (!indices.length) return <>{text}</>;
  const marked = new Set(indices);
  const runs: { text: string; on: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const on = marked.has(i);
    const last = runs[runs.length - 1];
    if (last && last.on === on) last.text += text[i];
    else runs.push({ text: text[i], on });
  }
  return (
    <>
      {runs.map((r, i) =>
        r.on ? (
          <mark key={i} className="bg-transparent font-semibold text-violet-300">
            {r.text}
          </mark>
        ) : (
          <span key={i}>{r.text}</span>
        ),
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5 shrink-0 text-zinc-500" aria-hidden="true">
      <circle cx="9" cy="9" r="6" />
      <path d="m17 17-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Palette ---------- */

/**
 * A ⌘K / Ctrl+K command menu with fuzzy search, nested pages, recent commands and full keyboard support.
 * Follows the WAI-ARIA combobox pattern inside a modal dialog.
 */
export function CommandPalette({
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  hotkey = "mod+k",
  placeholder = "Type a command or search…",
  emptyMessage = "No results found.",
  recentKey = "command-palette",
  maxRecent = 4,
  label = "Command palette",
  showFooter = true,
  globalShortcuts = true,
  className = "",
}: CommandPaletteProps) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : innerOpen;
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInnerOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || !matchesHotkey(e, hotkey)) return;
      e.preventDefault();
      setOpen(!isOpen);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, isOpen, setOpen]);

  useEffect(() => {
    if (!globalShortcuts || isOpen) return;
    const withShortcut = flatten(items).filter((e) => e.item.shortcut?.length && !e.item.disabled && !e.item.items);
    if (!withShortcut.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      const typing = !!target?.closest("input, textarea, select, [contenteditable='true']");
      const hit = withShortcut.find(({ item }) => matchesHotkey(e, item.shortcut!.join("+")));
      if (!hit || (typing && !e.ctrlKey && !e.metaKey && !e.altKey)) return;
      e.preventDefault();
      if (recentKey) {
        const ids = parseIds(readRecent(recentKey));
        writeRecent(recentKey, [hit.item.id, ...ids.filter((id) => id !== hit.item.id)].slice(0, 20));
      }
      hit.item.onSelect?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [globalShortcuts, isOpen, items, recentKey]);

  if (!isOpen || !mounted) return null;

  // The panel mounts fresh on every open, so query, pages and selection always start clean.
  return createPortal(
    <Palette
      items={items}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      recentKey={recentKey}
      maxRecent={maxRecent}
      label={label}
      showFooter={showFooter}
      className={className}
      onClose={() => setOpen(false)}
    />,
    document.body,
  );
}

interface PaletteProps
  extends Required<Omit<CommandPaletteProps, "open" | "defaultOpen" | "onOpenChange" | "hotkey" | "globalShortcuts">> {
  onClose: () => void;
}

function Palette({
  items,
  placeholder,
  emptyMessage,
  recentKey,
  maxRecent,
  label,
  showFooter,
  className,
  onClose,
}: PaletteProps) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<CommandItem[]>([]);
  const [active, setActive] = useState(0);

  const recentRaw = useSyncExternalStore(
    subscribeRecent,
    () => (recentKey ? readRecent(recentKey) : ""),
    () => "",
  );
  const recentIds = useMemo(() => parseIds(recentRaw), [recentRaw]);
  const byId = useMemo(() => new Map(flatten(items).map((e) => [e.item.id, e])), [items]);

  const page = pages[pages.length - 1];
  const scope = useMemo(() => (page ? (page.items ?? []) : items), [page, items]);
  const searching = query.trim().length > 0;

  const sections = useMemo<Section[]>(() => {
    if (!searching) {
      const out: Section[] = [];
      if (!page && recentKey) {
        const recent = recentIds
          .map((id) => byId.get(id))
          .filter((e): e is Entry => !!e && !e.item.disabled && !e.item.items)
          .slice(0, maxRecent)
          .map((e) => ({ ...e, score: 0, indices: [] }));
        if (recent.length) out.push({ key: "recent", heading: "Recent", entries: recent });
      }
      const groups = new Map<string, Result[]>();
      for (const item of scope) {
        const heading = item.group ?? "";
        if (!groups.has(heading)) groups.set(heading, []);
        groups.get(heading)!.push({ item, path: [], score: 0, indices: [] });
      }
      groups.forEach((entries, heading) => out.push({ key: `g:${heading}`, heading, entries }));
      return out;
    }

    const results = flatten(scope)
      .map((e) => {
        const m = matchEntry(query, e);
        return m ? { ...e, ...m } : null;
      })
      .filter((r): r is Result => r !== null)
      .sort((a, b) => b.score - a.score);

    // Groups keep the order of their best match, so the top hit is always first.
    const groups = new Map<string, Result[]>();
    for (const r of results) {
      const heading = r.path.length ? r.path.join(" › ") : (r.item.group ?? "Results");
      if (!groups.has(heading)) groups.set(heading, []);
      groups.get(heading)!.push(r);
    }
    return [...groups].map(([heading, entries]) => ({ key: `s:${heading}`, heading, entries }));
  }, [searching, page, recentKey, recentIds, byId, maxRecent, scope, query]);

  const flat = useMemo(() => sections.flatMap((s) => s.entries), [sections]);

  const step = useCallback(
    (from: number, dir: 1 | -1, wrap = true): number => {
      const n = flat.length;
      for (let k = 1; k <= n; k++) {
        const raw = from + dir * k;
        if (!wrap && (raw < 0 || raw >= n)) break;
        const i = ((raw % n) + n) % n;
        if (!flat[i].item.disabled) return i;
      }
      return from;
    },
    [flat],
  );

  let activeIndex = -1;
  if (flat.length) {
    const clamped = Math.min(active, flat.length - 1);
    activeIndex = flat[clamped].item.disabled ? step(clamped, 1) : clamped;
    if (flat[activeIndex].item.disabled) activeIndex = -1;
  }

  // Focus the search box, lock page scroll and animate in. Undo it all on close.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      panelRef.current?.animate(
        [
          { opacity: 0, transform: "translateY(-6px) scale(0.98)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 160, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    }
    return () => {
      root.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    if (activeIndex >= 0) document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
    // optionId only depends on baseId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, baseId]);

  function goTo(depth: number) {
    setPages((p) => p.slice(0, depth));
    setQuery("");
    setActive(0);
    inputRef.current?.focus();
  }

  function run(entry: Entry) {
    const { item } = entry;
    if (item.disabled) return;
    if (item.items) {
      setPages((p) => [...p, item]);
      setQuery("");
      setActive(0);
      return;
    }
    if (recentKey) {
      writeRecent(recentKey, [item.id, ...recentIds.filter((id) => id !== item.id)].slice(0, 20));
    }
    if (!item.keepOpen) onClose();
    item.onSelect?.();
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    const ctrlOnly = e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
    if (e.key === "ArrowDown" || (ctrlOnly && e.key.toLowerCase() === "n")) {
      e.preventDefault();
      if (flat.length) setActive(step(activeIndex, 1));
    } else if (e.key === "ArrowUp" || (ctrlOnly && e.key.toLowerCase() === "p")) {
      e.preventDefault();
      if (flat.length) setActive(step(activeIndex < 0 ? 0 : activeIndex, -1));
    } else if (e.key === "PageDown" || e.key === "PageUp") {
      e.preventDefault();
      if (!flat.length) return;
      const dir = e.key === "PageDown" ? 1 : -1;
      let i = activeIndex;
      for (let k = 0; k < 5; k++) i = step(i, dir, false);
      setActive(i);
    } else if ((e.key === "Home" || e.key === "End") && e.ctrlKey) {
      e.preventDefault();
      if (flat.length) setActive(e.key === "Home" ? step(-1, 1, false) : step(flat.length, -1, false));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) run(flat[activeIndex]);
    } else if (e.key === "Backspace" && !query && pages.length) {
      e.preventDefault();
      goTo(pages.length - 1);
    }
  }

  function onDialogKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (query) {
        setQuery("");
        setActive(0);
      } else if (pages.length) goTo(pages.length - 1);
      else onClose();
    } else if (e.key === "Tab") {
      // Keep focus inside the dialog.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>("input, button:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  const status = searching
    ? flat.length
      ? `${flat.length} ${flat.length === 1 ? "result" : "results"}`
      : "No results"
    : page
      ? `${page.label}, ${flat.length} ${flat.length === 1 ? "command" : "commands"}`
      : "";

  let index = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[10vh] sm:px-4 sm:pt-[14vh]" onKeyDown={onDialogKeyDown}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" onMouseDown={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`relative flex max-h-[min(34rem,80vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 text-zinc-200 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(139,92,246,0.08)] backdrop-blur-xl ${className}`}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
          <SearchIcon />
          {pages.length > 0 && (
            <nav aria-label="Command pages" className="flex shrink-0 items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => goTo(0)}
                className="rounded-md px-1.5 py-0.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Home
              </button>
              {pages.map((p, i) => (
                <span key={p.id} className="flex items-center gap-1">
                  <span className="text-zinc-600" aria-hidden="true">
                    /
                  </span>
                  <button
                    type="button"
                    onClick={() => goTo(i + 1)}
                    aria-current={i === pages.length - 1 ? "page" : undefined}
                    className="max-w-28 truncate rounded-md bg-violet-500/15 px-1.5 py-0.5 text-violet-200 transition hover:bg-violet-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  >
                    {p.label}
                  </button>
                </span>
              ))}
            </nav>
          )}
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
            aria-label={page ? `Search ${page.label}` : "Search commands"}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={page?.placeholder ?? placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={onClose}
            className="hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:block"
            aria-label="Close command palette"
          >
            <Kbd keys={["esc"]} />
          </button>
        </div>

        <div id={listId} role="listbox" aria-label={page ? page.label : "Commands"} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 scrollbar-none">
          {flat.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-zinc-500" role="presentation">
              {emptyMessage}
            </div>
          )}

          {sections.map((section) => {
            const headingId = `${baseId}-${section.key}`;
            return (
              <div key={section.key} role="group" aria-labelledby={section.heading ? headingId : undefined} className="mb-1 last:mb-0">
                {section.heading && (
                  <div id={headingId} role="presentation" className="px-3 pb-1.5 pt-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    {section.heading}
                  </div>
                )}
                {section.entries.map((entry) => {
                  index += 1;
                  const i = index;
                  const { item } = entry;
                  const selected = i === activeIndex;
                  return (
                    <div
                      key={`${section.key}:${item.id}`}
                      id={optionId(i)}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={item.disabled || undefined}
                      onMouseMove={() => !item.disabled && i !== activeIndex && setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => run(entry)}
                      className={`group/option relative flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        item.disabled ? "cursor-not-allowed opacity-40" : selected ? "bg-white/[0.07] text-white" : "text-zinc-300"
                      }`}
                    >
                      {selected && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-violet-400" aria-hidden="true" />}
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg border text-base transition-colors ${
                          selected ? "border-violet-400/30 bg-violet-500/15 text-violet-200" : "border-white/[0.07] bg-white/[0.03] text-zinc-400"
                        }`}
                        aria-hidden="true"
                      >
                        {item.icon ?? "•"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">
                          <Highlight text={item.label} indices={entry.indices} />
                        </span>
                        {item.description && <span className="block truncate text-xs text-zinc-500">{item.description}</span>}
                      </span>
                      {item.shortcut && <Kbd keys={item.shortcut} className="hidden shrink-0 sm:inline-flex" />}
                      {item.items && (
                        <span className="shrink-0 text-zinc-500" aria-hidden="true">
                          ›
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {showFooter && (
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-[11px] text-zinc-500">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Kbd keys={["up"]} />
                <Kbd keys={["down"]} />
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd keys={["enter"]} />
                {activeIndex >= 0 && flat[activeIndex].item.items ? "open" : "run"}
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Kbd keys={[pages.length && !query ? "backspace" : "esc"]} />
                {pages.length ? "back" : "close"}
              </span>
            </span>
            <span className="tabular-nums">{flat.length} {flat.length === 1 ? "item" : "items"}</span>
          </div>
        )}

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {status}
        </div>
      </div>
    </div>
  );
}
