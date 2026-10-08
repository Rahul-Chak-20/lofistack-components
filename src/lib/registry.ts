export interface ComponentEntry {
  slug: string;
  name: string;
  /** Plain label used in challenge submissions: button, input, card, ... */
  type: string;
  week: number;
  description: string;
  /** File name in src/components/ui without extension. */
  file: string;
}

export const components: ComponentEntry[] = [
  {
    slug: "magnetic-button",
    name: "Magnetic Glow Button",
    type: "button",
    week: 1,
    description:
      "A button that leans toward the cursor and paints a soft spotlight wherever the pointer is. Includes variants, sizes, icons, loading and disabled states, and respects reduced motion.",
    file: "magnetic-glow-button",
  },
  {
    slug: "floating-label-input",
    name: "Floating Label Input",
    type: "input",
    week: 1,
    description:
      "A text field whose label floats out of the way on focus, with built-in validation, error and success states, helper text, a character counter and a password reveal toggle.",
    file: "floating-label-input",
  },
  {
    slug: "data-table",
    name: "Data Table",
    type: "table",
    week: 2,
    description:
      "A typed, generic table with sortable columns, search, pagination and row selection. Includes loading skeletons, empty and no-match states, compact density and full keyboard and screen reader support.",
    file: "data-table",
  },
];

export function getComponent(slug: string): ComponentEntry {
  const entry = components.find((c) => c.slug === slug);
  if (!entry) throw new Error(`Unknown component: ${slug}`);
  return entry;
}
