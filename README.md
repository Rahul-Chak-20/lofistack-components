# LofiStack Components

A growing gallery of accessible, typed React components built for the LofiStack 90 Day Build Challenge.
Every component has its own page at `/components/<slug>` with a live preview, usage example, props table and full source.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel.

## Components

| Week | Component | Type | Route |
|---|---|---|---|
| 1 | Magnetic Glow Button | button | `/components/magnetic-button` |
| 1 | Floating Label Input | input | `/components/floating-label-input` |

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Adding a component

1. Put the component in `src/components/ui/<name>.tsx` with a typed props interface.
2. Add an entry to `src/lib/registry.ts`.
3. Create `src/app/components/<slug>/page.tsx` and a `demo.tsx` using `ComponentPage`.

`npm run gen` (run automatically before `dev` and `build`) copies each UI file's source into `src/generated/sources.ts` so pages show the real code.
