import Link from "next/link";
import type { ReactNode } from "react";
import { sources } from "@/generated/sources";
import { getComponent } from "@/lib/registry";
import { site } from "@/lib/site";
import { CodeBlock } from "./code-block";

export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  description: string;
}

interface ComponentPageProps {
  slug: string;
  preview: ReactNode;
  usage: string;
  props: PropDoc[];
}

export function ComponentPage({ slug, preview, usage, props }: ComponentPageProps) {
  const entry = getComponent(slug);
  const source = sources[entry.file] ?? "";
  const sourcePath = `src/components/ui/${entry.file}.tsx`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="text-sm text-zinc-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded"
      >
        ← All components
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-violet-300">{entry.type}</span>
          <span className="rounded-full bg-white/5 px-2.5 py-1 text-zinc-400">Week {entry.week}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{entry.name}</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">{entry.description}</p>
      </header>

      <section aria-labelledby="preview-heading" className="mt-10">
        <h2 id="preview-heading" className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Live preview
        </h2>
        <div className="rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.12),transparent_60%)] p-6 sm:p-10">
          {preview}
        </div>
      </section>

      <section aria-labelledby="usage-heading" className="mt-10">
        <h2 id="usage-heading" className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Usage
        </h2>
        <CodeBlock title="example.tsx" code={usage} />
      </section>

      <section aria-labelledby="props-heading" className="mt-10">
        <h2 id="props-heading" className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
          Props
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-white/[0.03] text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Prop</th>
                <th scope="col" className="px-4 py-3 font-medium">Type</th>
                <th scope="col" className="px-4 py-3 font-medium">Default</th>
                <th scope="col" className="px-4 py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {props.map((p) => (
                <tr key={p.name}>
                  <td className="px-4 py-3 font-mono text-violet-300">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-300">{p.type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.default ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="source-heading" className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="source-heading" className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Source
          </h2>
          <a
            href={`${site.repo}/blob/main/${sourcePath}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-violet-300 transition hover:text-violet-200"
          >
            View on GitHub ↗
          </a>
        </div>
        <CodeBlock title={sourcePath} code={source} />
      </section>
    </main>
  );
}
