import type { Metadata } from "next";
import { ComponentPage, type PropDoc } from "@/components/gallery/component-page";
import { CommandPaletteDemo } from "./demo";

export const metadata: Metadata = { title: "Command Palette" };

const usage = `import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette, type CommandItem } from "@/components/ui/command-palette";

export function Example() {
  const router = useRouter();
  const [theme, setTheme] = useState("dark");

  const items: CommandItem[] = [
    { id: "home", label: "Go home", group: "Navigation", icon: "⌂", onSelect: () => router.push("/") },
    { id: "settings", label: "Settings", group: "Navigation", shortcut: ["alt", "S"], onSelect: () => router.push("/settings") },
    {
      id: "theme",
      label: "Change theme",
      group: "Appearance",
      keywords: ["color", "mode"],
      items: [
        { id: "theme-dark", label: "Dark", onSelect: () => setTheme("dark") },
        { id: "theme-light", label: "Light", onSelect: () => setTheme("light") },
      ],
    },
  ];

  // Ctrl+K / ⌘K opens it. Pass open and onOpenChange to control it yourself.
  return <CommandPalette items={items} placeholder={\`Search… (theme: \${theme})\`} />;
}`;

const props: PropDoc[] = [
  { name: "items", type: "CommandItem[]", description: "Commands: id, label, group, description, keywords, icon, shortcut, disabled, keepOpen, onSelect. Give an item its own items to turn it into a nested page." },
  { name: "open", type: "boolean", description: "Controlled open state. Leave it out and the palette manages itself." },
  { name: "defaultOpen", type: "boolean", default: "false", description: "Starting state when uncontrolled." },
  { name: "onOpenChange", type: "(open: boolean) => void", description: "Called whenever the palette wants to open or close." },
  { name: "hotkey", type: "string | false", default: '"mod+k"', description: "Global shortcut that toggles the palette. mod is ⌘ on Mac and Ctrl elsewhere. Pass false to turn it off." },
  { name: "placeholder", type: "string", default: '"Type a command or search…"', description: "Search placeholder on the root page. Nested pages can set their own." },
  { name: "emptyMessage", type: "ReactNode", default: '"No results found."', description: "Shown when nothing matches." },
  { name: "recentKey", type: "string | false", default: '"command-palette"', description: "localStorage key for recently run commands, shown in a Recent group. Pass false to turn it off." },
  { name: "maxRecent", type: "number", default: "4", description: "How many recent commands to show." },
  { name: "label", type: "string", default: '"Command palette"', description: "Accessible name for the dialog." },
  { name: "showFooter", type: "boolean", default: "true", description: "Shows the key hints and item count along the bottom." },
  { name: "globalShortcuts", type: "boolean", default: "true", description: "Runs a command from its shortcut chord while the palette is closed. Chords without a modifier are ignored while typing in a field." },
  { name: "className", type: "string", description: "Classes for the panel." },
];

export default function Page() {
  return <ComponentPage slug="command-palette" preview={<CommandPaletteDemo />} usage={usage} props={props} />;
}
