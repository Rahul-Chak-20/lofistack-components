import Link from "next/link";
import type { ReactNode } from "react";
import { sources } from "@/generated/sources";
import { components, getComponent } from "@/lib/registry";
import { site } from "@/lib/site";
import { CodeBlock } from "./code-block";
import { PreviewTabs } from "./preview-tabs";

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

const sections = [
  { id: "preview", label: "Preview" },
  { id: "props", label: "Props" },
  { id: "source", label: "Source" },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400";

export function ComponentPage({ slug, preview, usage, props }: ComponentPageProps) {
  const entry = getComponent(slug);
  const source = sources[entry.file] ?? "";
  const sourcePath = `src/components/ui/${entry.file}.tsx`;
  const index = components.findIndex((c) => c.slug === slug);
  const prev = components[index - 1];
  const next = components[index + 1];

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 sm:px-6">
      <aside className="hidden w-52 shrink-0 lg:block">
        <nav aria-label="Components" className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-10">
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Components</p>
          <ul className="space-y-0.5">
            {components.map((c) => {
              const current = c.slug === slug;
              return (
                <li key={c.slug}>
                  <Link
                    href={`/components/${c.slug}`}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition ${focusRing} ${
                      current ? "bg-violet-500/10 font-medium text-violet-200" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {c.name}
                    <span className="text-[10px] text-zinc-600">W{c.week}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mb-3 mt-8 px-3 text-xs font-medium uppercase tracking-wider text-zinc-500">On this page</p>
          <ul className="space-y-0.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`block rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition hover:text-white ${focusRing}`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 py-8 sm:py-10">
        {/* Component switcher for small screens, where the sidebar is hidden. */}
        <nav aria-label="Components" className="-mx-4 mb-6 lg:hidden">
          <ul className="scrollbar-none flex gap-2 overflow-x-auto px-4">
            {components.map((c) => {
              const current = c.slug === slug;
              return (
                <li key={c.slug} className="shrink-0">
                  <Link
                    href={`/components/${c.slug}`}
                    aria-current={current ? "page" : undefined}
                    className={`block rounded-full border px-3 py-1.5 text-xs transition ${focusRing} ${
                      current
                        ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                        : "border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className={`rounded transition hover:text-white ${focusRing}`}>
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/#components" className={`rounded transition hover:text-white ${focusRing}`}>
                Components
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="truncate text-zinc-300">
              {entry.name}
            </li>
          </ol>
        </nav>

        <header className="mt-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-violet-500/15 px-2.5 py-1 font-medium capitalize text-violet-300">{entry.type}</span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-zinc-400">Week {entry.week}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{entry.name}</h1>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-zinc-400">{entry.description}</p>
        </header>

        <section id="preview" aria-labelledby="preview-heading" className="mt-10">
          <h2 id="preview-heading" className="sr-only">
            Preview
          </h2>
          <PreviewTabs
            label={`${entry.name} preview and code`}
            tabs={[
              {
                id: "preview",
                label: "Preview",
                content: (
                  <div className="bg-grid relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/40">
                    <div
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.14),transparent_60%)]"
                      aria-hidden="true"
                    />
                    <div className="relative p-4 sm:p-10">{preview}</div>
                  </div>
                ),
              },
              { id: "code", label: "Code", content: <CodeBlock title="example.tsx" code={usage} /> },
            ]}
          />
        </section>

        <section id="props" aria-labelledby="props-heading" className="mt-14">
          <h2 id="props-heading" className="text-xl font-semibold tracking-tight text-white">
            Props
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{props.length} props</p>

          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Prop</th>
                  <th scope="col" className="px-4 py-3 font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 font-medium">Default</th>
                  <th scope="col" className="px-4 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {props.map((p) => (
                  <tr key={p.name} className="align-top transition hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-violet-300">{p.name}</td>
                    <td className="px-4 py-3">
                      <code className="break-words rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-xs text-zinc-300">{p.type}</code>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-500">{p.default ?? "—"}</td>
                    <td className="px-4 py-3 leading-relaxed text-zinc-400">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mt-4 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 md:hidden">
            {props.map((p) => (
              <div key={p.name} className="p-4">
                <dt className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-sm text-violet-300">{p.name}</span>
                  {p.default && <span className="font-mono text-xs text-zinc-500">= {p.default}</span>}
                </dt>
                <dd className="mt-2">
                  <code className="break-words rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-xs text-zinc-300">{p.type}</code>
                </dd>
                <dd className="mt-2 text-sm leading-relaxed text-zinc-400">{p.description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="source" aria-labelledby="source-heading" className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="source-heading" className="text-xl font-semibold tracking-tight text-white">
                Source
              </h2>
              <p className="mt-1 text-sm text-zinc-500">Copy this file into your project. No extra dependencies.</p>
            </div>
            <a
              href={`${site.repo}/blob/main/${sourcePath}`}
              target="_blank"
              rel="noreferrer"
              className={`rounded text-sm text-violet-300 transition hover:text-violet-200 ${focusRing}`}
            >
              View on GitHub ↗
            </a>
          </div>
          <div className="mt-4">
            <CodeBlock title={sourcePath} code={source} />
          </div>
        </section>

        <nav aria-label="More components" className="mt-16 grid gap-3 border-t border-white/[0.06] pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/components/${prev.slug}`}
              className={`group rounded-2xl border border-white/10 p-4 transition hover:border-violet-400/40 hover:bg-white/[0.02] ${focusRing}`}
            >
              <span className="text-xs text-zinc-500">← Previous</span>
              <span className="mt-1 block font-medium text-white">{prev.name}</span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {next && (
            <Link
              href={`/components/${next.slug}`}
              className={`group rounded-2xl border border-white/10 p-4 text-right transition hover:border-violet-400/40 hover:bg-white/[0.02] ${focusRing}`}
            >
              <span className="text-xs text-zinc-500">Next →</span>
              <span className="mt-1 block font-medium text-white">{next.name}</span>
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}
