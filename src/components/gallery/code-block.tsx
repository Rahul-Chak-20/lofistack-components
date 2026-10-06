import { CopyButton } from "./copy-button";

export function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="font-mono text-xs text-zinc-400">{title}</span>
        <CopyButton text={code} />
      </div>
      <pre className="max-h-[32rem] overflow-auto p-4 text-[13px] leading-relaxed text-zinc-200">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
