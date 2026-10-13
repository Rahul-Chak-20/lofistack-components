/** Small static mockups used on the home page cards. Decorative only. */
export function ComponentThumb({ type }: { type: string }) {
  if (type === "button") {
    return (
      <div className="relative">
        <div className="absolute -inset-6 rounded-full bg-violet-500/25 blur-2xl transition group-hover:bg-violet-500/40" />
        <div className="relative rounded-xl bg-gradient-to-b from-violet-400 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_-6px_rgba(139,92,246,0.8)] transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1">
          Get started →
        </div>
      </div>
    );
  }

  if (type === "input") {
    return (
      <div className="w-44 space-y-3">
        <div className="relative rounded-xl border border-violet-400/60 bg-zinc-950/80 px-3 pb-2 pt-4 shadow-[0_0_0_3px_rgba(139,92,246,0.15)]">
          <span className="absolute left-3 top-1 text-[10px] text-violet-300">Email</span>
          <span className="text-xs text-zinc-200">rahul@lofi.dev</span>
          <span className="ml-0.5 inline-block h-3 w-px translate-y-0.5 animate-pulse bg-violet-300 motion-reduce:animate-none" />
        </div>
        <div className="rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-3 text-xs text-zinc-500">Password</div>
      </div>
    );
  }

  if (type === "table") {
    const rows = [
      ["w-16", "bg-emerald-400/70"],
      ["w-12", "bg-amber-400/70"],
      ["w-20", "bg-emerald-400/70"],
      ["w-14", "bg-rose-400/70"],
    ];
    return (
      <div className="w-52 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/80 text-[10px]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2 text-zinc-400">
          <span>Customer ↑</span>
          <span>Amount</span>
        </div>
        {rows.map(([w, dot], i) => (
          <div key={i} className="flex items-center justify-between border-b border-white/5 px-3 py-2 last:border-0">
            <span className="flex items-center gap-2">
              <span className={`size-1.5 rounded-full ${dot}`} />
              <span className={`h-1.5 rounded-full bg-zinc-600 ${w}`} />
            </span>
            <span className="h-1.5 w-8 rounded-full bg-zinc-700" />
          </div>
        ))}
      </div>
    );
  }

  return <div className="size-16 rounded-2xl border border-white/10 bg-white/5" />;
}
