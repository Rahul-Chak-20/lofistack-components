"use client";

import { useState } from "react";
import { MemoryMatch, defaultMemoryDeck, type MemoryCardFace, type MemoryMatchResult } from "@/components/ui/memory-match";

const levels = [
  { id: "easy", label: "Easy", pairs: 6 },
  { id: "medium", label: "Medium", pairs: 8 },
  { id: "hard", label: "Hard", pairs: 12 },
] as const;

const codeTokens: [string, string][] = [
  ["</>", "Tag"], ["{ }", "Braces"], ["=>", "Arrow function"], ["&&", "Logical and"], ["[ ]", "Array"], ["λ", "Lambda"],
  ["#", "Hash"], ["::", "Scope"], ["$", "Dollar"], ["??", "Nullish"], ["++", "Increment"], ["TS", "TypeScript"],
];

const codeDeck: MemoryCardFace[] = codeTokens.map(([token, label]) => ({
  id: label.toLowerCase().replace(/\s+/g, "-"),
  label,
  content: (
    <span className="bg-gradient-to-br from-violet-300 to-sky-300 bg-clip-text font-mono text-[0.7em] font-semibold text-transparent">
      {token}
    </span>
  ),
}));

const decks = [
  { id: "emoji", label: "Emoji", deck: defaultMemoryDeck },
  { id: "code", label: "Code", deck: codeDeck },
] as const;

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">{label}</legend>
      <span className="text-xs text-zinc-500" aria-hidden="true">
        {label}
      </span>
      <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
        {options.map((o) => (
          <label
            key={o.id}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-400 ${
              value === o.id ? "bg-violet-500/20 text-violet-100" : "text-zinc-400 hover:text-white"
            }`}
          >
            <input
              type="radio"
              name={label}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function MemoryMatchDemo() {
  const [level, setLevel] = useState<(typeof levels)[number]["id"]>("medium");
  const [deckId, setDeckId] = useState<(typeof decks)[number]["id"]>("emoji");
  const [lastWin, setLastWin] = useState<MemoryMatchResult | null>(null);

  const pairs = levels.find((l) => l.id === level)!.pairs;
  const deck = decks.find((d) => d.id === deckId)!.deck;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        <Segmented label="Difficulty" options={levels} value={level} onChange={setLevel} />
        <Segmented label="Deck" options={decks} value={deckId} onChange={setDeckId} />
      </div>

      <MemoryMatch deck={deck} pairs={pairs} onWin={setLastWin} />

      <p className="text-center text-xs text-zinc-500">
        {lastWin
          ? `Last win: ${lastWin.moves} moves in ${lastWin.seconds}s${lastWin.isBest ? ", a new best." : "."}`
          : "Flip two cards to find a pair. Arrow keys move between cards, Enter or Space flips."}
      </p>
    </div>
  );
}
