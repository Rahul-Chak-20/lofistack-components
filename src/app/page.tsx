import Link from "next/link";
import { components } from "@/lib/registry";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      <p className="text-sm font-medium text-violet-300">90 Day Build Challenge</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{site.name}</h1>
      <p className="mt-4 max-w-2xl text-lg text-zinc-400">{site.description}</p>

      <h2 className="mt-14 text-sm font-medium uppercase tracking-wider text-zinc-500">
        {components.length} components
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {components.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/components/${c.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-violet-400/40 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-300">{c.type}</span>
                <span className="text-zinc-500">Week {c.week}</span>
              </div>
              <h3 className="mt-3 font-medium text-white">{c.name}</h3>
              <p className="mt-1.5 line-clamp-3 text-sm text-zinc-400">{c.description}</p>
              <span className="mt-auto pt-4 text-sm text-violet-300 transition group-hover:translate-x-0.5">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
