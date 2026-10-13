import type { Metadata } from "next";
import { ComponentPage, type PropDoc } from "@/components/gallery/component-page";
import { MemoryMatchDemo } from "./demo";

export const metadata: Metadata = { title: "Memory Match" };

const usage = `import { MemoryMatch, type MemoryCardFace } from "@/components/ui/memory-match";

const deck: MemoryCardFace[] = [
  { id: "pizza", label: "Pizza", content: "🍕" },
  { id: "rocket", label: "Rocket", content: "🚀" },
  { id: "cactus", label: "Cactus", content: "🌵" },
  { id: "octopus", label: "Octopus", content: "🐙" },
  { id: "guitar", label: "Guitar", content: "🎸" },
  { id: "rainbow", label: "Rainbow", content: "🌈" },
];

export function Example() {
  return (
    <MemoryMatch
      deck={deck}
      pairs={6}
      columns={4}
      flipBackDelay={900}
      storageKey="my-game"
      onMatch={(face) => console.log("Matched", face.label)}
      onWin={({ moves, seconds, isBest }) => {
        console.log(\`Won in \${moves} moves and \${seconds}s\`, isBest ? "(new best)" : "");
      }}
    />
  );
}`;

const props: PropDoc[] = [
  { name: "deck", type: "MemoryCardFace[]", default: "defaultMemoryDeck", description: "Faces to deal from: id, label (read out to screen readers) and optional content. A random set is used each game when there are more faces than pairs." },
  { name: "pairs", type: "number", default: "8", description: "Pairs on the board, clamped between 2 and the deck size. Changing it re-deals." },
  { name: "columns", type: "number", description: "Grid columns. Defaults to the most square layout that fits the card count evenly." },
  { name: "flipBackDelay", type: "number", default: "900", description: "How long a wrong pair stays face up, in ms. Clicking another card turns them back at once." },
  { name: "storageKey", type: "string | false", default: '"memory-match"', description: "localStorage prefix for the best score, kept per board size. Fewer moves wins, then the faster time. Pass false to turn it off." },
  { name: "showStats", type: "boolean", default: "true", description: "Shows moves, timer, pairs found, best score and a Restart button." },
  { name: "cardBack", type: "ReactNode", description: "Drawn on the back of every card. Defaults to a sparkle." },
  { name: "label", type: "string", default: '"Memory match"', description: "Accessible name for the card grid." },
  { name: "onMatch", type: "(face: MemoryCardFace) => void", description: "Called each time a pair is found." },
  { name: "onWin", type: "(result: MemoryMatchResult) => void", description: "Called once every pair is found, with moves, seconds and isBest." },
  { name: "className", type: "string", description: "Classes for the outer wrapper." },
];

export default function Page() {
  return <ComponentPage slug="memory-match" preview={<MemoryMatchDemo />} usage={usage} props={props} />;
}
