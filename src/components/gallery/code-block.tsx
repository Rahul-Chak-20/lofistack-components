import { CopyButton } from "./copy-button";

export function CodeBlock({ title, code }: { title: string; code: string }) {
  const lines = code.split("\n").length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden shrink-0 gap-1.5 sm:flex" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
          </span>
          <span className="truncate font-mono text-xs text-zinc-400">{title}</span>
          <span className="hidden shrink-0 text-xs text-zinc-600 sm:inline">{lines} lines</span>
        </div>
        <CopyButton text={code} />
      </div>
      <pre className="max-h-[32rem] overflow-auto p-4 text-[13px] leading-relaxed text-zinc-200">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
