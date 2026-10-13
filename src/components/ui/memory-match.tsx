"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface MemoryCardFace {
  /** Unique id for this face. Two cards are dealt per face. */
  id: string;
  /** Accessible name, read out when the card is face up. */
  label: string;
  /** What is drawn on the face. Defaults to the label. */
  content?: ReactNode;
}

export interface MemoryMatchResult {
  moves: number;
  seconds: number;
  /** True when this beats the stored best score for this board size. */
  isBest: boolean;
}

export interface MemoryMatchProps {
  /** Faces to deal from. When there are more faces than pairs, a random set is used each game. */
  deck?: MemoryCardFace[];
  /** Number of pairs on the board. Clamped between 2 and the deck size. */
  pairs?: number;
  /** Grid columns. Defaults to the most square layout for the card count. */
  columns?: number;
  /** How long a wrong pair stays face up, in ms. */
  flipBackDelay?: number;
  /** localStorage key prefix for best scores (one per board size). Pass false to turn it off. */
  storageKey?: string | false;
  /** Shows moves, timer, pairs found and best score above the board. */
  showStats?: boolean;
  /** Drawn on the back of every card. */
  cardBack?: ReactNode;
  /** Accessible name for the board. */
  label?: string;
  onMatch?: (face: MemoryCardFace) => void;
  onWin?: (result: MemoryMatchResult) => void;
  className?: string;
}

interface Card {
  face: MemoryCardFace;
}

interface BestScore {
  moves: number;
  seconds: number;
}

export const defaultMemoryDeck: MemoryCardFace[] = [
  { id: "pizza", label: "Pizza", content: "🍕" },
  { id: "rocket", label: "Rocket", content: "🚀" },
  { id: "cactus", label: "Cactus", content: "🌵" },
  { id: "octopus", label: "Octopus", content: "🐙" },
  { id: "guitar", label: "Guitar", content: "🎸" },
  { id: "rainbow", label: "Rainbow", content: "🌈" },
  { id: "donut", label: "Donut", content: "🍩" },
  { id: "dice", label: "Dice", content: "🎲" },
  { id: "fox", label: "Fox", content: "🦊" },
  { id: "planet", label: "Planet", content: "🪐" },
  { id: "headphones", label: "Headphones", content: "🎧" },
  { id: "mushroom", label: "Mushroom", content: "🍄" },
];

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function toCards(faces: MemoryCardFace[]): Card[] {
  return faces.flatMap((face) => [{ face }, { face }]);
}

/** Unshuffled board. Face-down cards all look the same, so this renders identically on the server. */
function stack(deck: MemoryCardFace[], pairs: number): Card[] {
  return toCards(deck.slice(0, pairs));
}

/** Random faces in random order. Only called from event handlers. */
function deal(deck: MemoryCardFace[], pairs: number): Card[] {
  return shuffle(toCards(shuffle(deck).slice(0, pairs)));
}

/** Most square column count that divides the card count evenly. */
function autoColumns(count: number): number {
  for (let c = Math.ceil(Math.sqrt(count)); c <= count; c++) if (count % c === 0) return c;
  return count;
}

/** Read in event handlers only. */
const timestamp = () => Date.now();

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function isBetter(a: BestScore, b: BestScore | null): boolean {
  return !b || a.moves < b.moves || (a.moves === b.moves && a.seconds < b.seconds);
}

// Best scores live in localStorage; this tiny store lets components re-render when one is saved.
const storeListeners = new Set<() => void>();

function subscribeStore(listener: () => void) {
  storeListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    storeListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStore(key: string | null): string | null {
  if (!key) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: BestScore) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; the game still works without it.
  }
  storeListeners.forEach((listener) => listener());
}

function parseBest(raw: string | null): BestScore | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as BestScore;
    return typeof value.moves === "number" && typeof value.seconds === "number" ? value : null;
  } catch {
    return null;
  }
}

const confettiColors = ["#a78bfa", "#f472b6", "#38bdf8", "#34d399", "#fbbf24"];

/** Bursts a handful of dots out from the center using the Web Animations API. */
function burst(node: HTMLDivElement | null) {
  if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const dot of Array.from(node.children) as HTMLElement[]) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * 160;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance - 40;
    dot.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
        { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`, opacity: 1, offset: 0.7 },
        { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + 60}px)) scale(0.6)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" },
    );
  }
}

function CardBack() {
  return (
    <svg viewBox="0 0 24 24" className="size-1/3 text-white/80" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
    </svg>
  );
}

export function MemoryMatch({
  deck = defaultMemoryDeck,
  pairs = 8,
  columns,
  flipBackDelay = 900,
  storageKey = "memory-match",
  showStats = true,
  cardBack,
  label = "Memory match",
  onMatch,
  onWin,
  className = "",
}: MemoryMatchProps) {
  const pairCount = Math.max(2, Math.min(pairs, deck.length));
  const signature = `${pairCount}|${deck.map((f) => f.id).join(",")}`;
  const cols = Math.max(1, columns ?? autoColumns(pairCount * 2));
  const bestKey = storageKey ? `${storageKey}:${pairCount}` : null;
  const statusId = useId();

  const [cards, setCards] = useState<Card[]>(() => stack(deck, pairCount));
  const [dealtFor, setDealtFor] = useState(signature);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<MemoryMatchResult | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const flipBackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playAgainRef = useRef<HTMLButtonElement | null>(null);

  const bestRaw = useSyncExternalStore(
    subscribeStore,
    () => readStore(bestKey),
    () => null,
  );
  const best = parseBest(bestRaw);

  // The real shuffle happens on the first flip of each game, inside the click handler.
  function reset() {
    setCards(stack(deck, pairCount));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setStartedAt(null);
    setNow(0);
    setResult(null);
    setFocusIndex(0);
  }

  // Re-deal when the deck or board size changes.
  if (dealtFor !== signature) {
    setDealtFor(signature);
    reset();
  }

  const playing = startedAt !== null && !result;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => () => {
    if (flipBackTimer.current) clearTimeout(flipBackTimer.current);
  }, []);

  useEffect(() => {
    if (result) playAgainRef.current?.focus();
  }, [result]);

  const seconds = result ? result.seconds : startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const mismatch = flipped.length === 2 && cards[flipped[0]].face.id !== cards[flipped[1]].face.id;

  function restart() {
    if (flipBackTimer.current) clearTimeout(flipBackTimer.current);
    flipBackTimer.current = null;
    reset();
    setAnnouncement("New game. Cards shuffled.");
    cardRefs.current[0]?.focus();
  }

  function flip(index: number) {
    if (result || matched.includes(cards[index].face.id) || flipped.includes(index)) return;

    const start = startedAt ?? timestamp();
    let board = cards;
    if (startedAt === null) {
      board = deal(deck, pairCount);
      setCards(board);
      setStartedAt(start);
      setNow(start);
    }
    const card = board[index];

    // A third click while a wrong pair is showing turns that pair back over straight away.
    const open = flipped.length === 2 ? [] : flipped;
    if (flipBackTimer.current) {
      clearTimeout(flipBackTimer.current);
      flipBackTimer.current = null;
    }

    if (open.length === 0) {
      setFlipped([index]);
      setAnnouncement(`${card.face.label}.`);
      return;
    }

    const first = board[open[0]];
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setFlipped([open[0], index]);

    if (first.face.id !== card.face.id) {
      setAnnouncement(`${card.face.label}. No match with ${first.face.label}.`);
      flipBackTimer.current = setTimeout(() => {
        setFlipped([]);
        flipBackTimer.current = null;
      }, flipBackDelay);
      return;
    }

    const nextMatched = [...matched, card.face.id];
    setMatched(nextMatched);
    setFlipped([]);
    onMatch?.(card.face);

    if (nextMatched.length < pairCount) {
      setAnnouncement(`${card.face.label}. Match! ${nextMatched.length} of ${pairCount} pairs found.`);
      return;
    }

    const score = { moves: nextMoves, seconds: Math.max(0, Math.floor((timestamp() - start) / 1000)) };
    const isBest = Boolean(bestKey) && isBetter(score, best);
    if (bestKey && isBest) writeStore(bestKey, score);
    const won = { ...score, isBest };
    setResult(won);
    setAnnouncement(
      `You won in ${score.moves} moves and ${formatTime(score.seconds)}.${isBest ? " New best score!" : ""}`,
    );
    onWin?.(won);
  }

  function onCardKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = cards.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: Math.min(last, index + 1),
      ArrowLeft: Math.max(0, index - 1),
      ArrowDown: index + cols <= last ? index + cols : index,
      ArrowUp: index - cols >= 0 ? index - cols : index,
      Home: event.ctrlKey ? 0 : index - (index % cols),
      End: event.ctrlKey ? last : Math.min(last, index - (index % cols) + cols - 1),
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = targets[event.key];
    setFocusIndex(next);
    cardRefs.current[next]?.focus();
  }

  const stats = [
    { label: "Moves", value: String(moves) },
    { label: "Time", value: formatTime(seconds) },
    { label: "Pairs", value: `${matched.length}/${pairCount}` },
    { label: "Best", value: best ? `${best.moves} · ${formatTime(best.seconds)}` : "—" },
  ];

  return (
    <div className={`w-full ${className}`}>
      {showStats && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <dl className="grid flex-1 grid-cols-4 gap-2 text-center sm:flex sm:flex-none sm:gap-5 sm:text-left">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="text-[11px] uppercase tracking-wider text-zinc-500">{s.label}</dt>
                <dd className="mt-0.5 truncate font-mono text-sm tabular-nums text-zinc-100">{s.value}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={restart}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:w-auto"
          >
            Restart
          </button>
        </div>
      )}

      <div className="relative">
        <div
          role="group"
          aria-label={`${label}, ${cards.length} cards in ${cols} columns`}
          className="grid gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {cards.map((card, index) => {
            const isMatched = matched.includes(card.face.id);
            const isUp = isMatched || flipped.includes(index);
            const isWrong = mismatch && flipped.includes(index);
            const name = `Card ${index + 1}, ${isUp ? card.face.label : "face down"}${isMatched ? ", matched" : ""}`;

            return (
              <button
                // Keyed by position so reshuffling never moves the focused button.
                key={index}
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                type="button"
                aria-label={name}
                aria-disabled={isMatched || Boolean(result) || undefined}
                tabIndex={index === focusIndex ? 0 : -1}
                onClick={() => flip(index)}
                onFocus={() => setFocusIndex(index)}
                onKeyDown={(event) => onCardKeyDown(event, index)}
                className="group aspect-square rounded-xl perspective-[800px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <span
                  className={`relative block size-full transition-transform duration-500 ease-[cubic-bezier(.3,1.4,.5,1)] transform-3d motion-reduce:transition-none ${
                    isUp ? "rotate-y-180" : "group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 grid place-items-center overflow-hidden rounded-xl border border-violet-300/20 bg-gradient-to-br from-violet-500 via-violet-600 to-fuchsia-700 shadow-[0_6px_20px_-8px_rgba(139,92,246,0.8)] backface-hidden"
                  >
                    <span className="absolute inset-1.5 rounded-lg border border-white/15" />
                    {cardBack ?? <CardBack />}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`absolute inset-0 grid rotate-y-180 place-items-center rounded-xl border bg-zinc-900 text-[clamp(1.25rem,6vw,2.5rem)] leading-none backface-hidden transition-[border-color,box-shadow] duration-300 ${
                      isMatched
                        ? "border-emerald-400/60 shadow-[0_0_22px_-4px_rgba(52,211,153,0.6)]"
                        : isWrong
                          ? "border-rose-400/70 shadow-[0_0_22px_-4px_rgba(251,113,133,0.6)]"
                          : "border-white/15"
                    }`}
                  >
                    {/* Faces stay out of the DOM until shown, so the layout can't be read ahead of time. */}
                    {isUp && (card.face.content ?? <span className="px-1 text-center text-sm">{card.face.label}</span>)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {result && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-zinc-950/70 p-4 backdrop-blur-sm">
            <div ref={burst} className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
              {Array.from({ length: 28 }, (_, i) => (
                <span
                  key={i}
                  className="absolute left-0 top-0 size-2 rounded-sm opacity-0"
                  style={{ backgroundColor: confettiColors[i % confettiColors.length] }}
                />
              ))}
            </div>
            <div className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-center shadow-2xl">
              <p className="text-3xl" aria-hidden="true">🎉</p>
              <p className="mt-2 text-lg font-semibold text-white">You matched them all!</p>
              <p className="mt-1 text-sm text-zinc-400">
                {result.moves} moves · {formatTime(result.seconds)}
              </p>
              {result.isBest && (
                <p className="mt-3 inline-block rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  New best score
                </p>
              )}
              <button
                ref={playAgainRef}
                type="button"
                onClick={restart}
                className="mt-5 w-full rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              >
                Play again
              </button>
            </div>
          </div>
        )}
      </div>

      <p id={statusId} role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
