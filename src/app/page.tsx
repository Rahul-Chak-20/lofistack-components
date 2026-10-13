import Link from "next/link";
import { ComponentThumb } from "@/components/gallery/component-thumb";
import { GitHubIcon } from "@/components/gallery/site-header";
import { components } from "@/lib/registry";
import { site } from "@/lib/site";

const highlights = ["Fully typed", "Keyboard accessible", "Reduced-motion aware", "Copy-paste ready"];

export default function Home() {
  const weeks = new Set(components.map((c) => c.week)).size;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div
          className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-80 w-[40rem] max-w-full -translate-x-1/2 -translate-y-1/3 rounded-full bg-violet-600/25 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pb-24 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
            <span className="size-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_2px_rgba(167,139,250,0.7)]" aria-hidden="true" />
            90 Day Build Challenge · Week {Math.max(...components.map((c) => c.week))}
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Components that feel{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent">
              alive
            </span>
            , built in public.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-zinc-400 sm:text-lg">{site.description}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#components"
              className="w-full rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090f] sm:w-auto"
            >
              Browse components
            </Link>
            <a
              href={site.repo}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:w-auto"
            >
              <GitHubIcon />
              Star on GitHub
            </a>
          </div>

          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-1.5">
                <span className="text-violet-400" aria-hidden="true">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="components" aria-labelledby="components-heading" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="components-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Components
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {components.length} components across {weeks} {weeks === 1 ? "week" : "weeks"}. Each one ships with a live
              demo, props docs and its full source.
            </p>
          </div>
        </div>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/components/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_20px_50px_-20px_rgba(139,92,246,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 motion-reduce:hover:translate-y-0"
              >
                <div
                  className="bg-grid relative grid h-44 place-items-center border-b border-white/[0.06] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.10),transparent_70%)]"
                  aria-hidden="true"
                >
                  <ComponentThumb type={c.type} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 font-medium capitalize text-violet-300">
                      {c.type}
                    </span>
                    <span className="text-zinc-500">Week {c.week}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-white">{c.name}</h3>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-zinc-400">{c.description}</p>
                  <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-medium text-violet-300">
                    View component
                    <span className="transition group-hover:translate-x-1" aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
