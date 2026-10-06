"use client";

import { useState } from "react";
import { MagneticGlowButton } from "@/components/ui/magnetic-glow-button";

const Arrow = () => (
  <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 10h12m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function MagneticButtonDemo() {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  function save() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCount((c) => c + 1);
    }, 1600);
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <MagneticGlowButton rightIcon={<Arrow />}>Get started</MagneticGlowButton>
        <MagneticGlowButton variant="outline" glowColor="#f59e0b">
          Outline amber
        </MagneticGlowButton>
        <MagneticGlowButton variant="ghost" glowColor="#22d3ee">
          Ghost cyan
        </MagneticGlowButton>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <MagneticGlowButton size="sm">Small</MagneticGlowButton>
        <MagneticGlowButton size="md">Medium</MagneticGlowButton>
        <MagneticGlowButton size="lg" magneticStrength={0.6} glowColor="#f472b6">
          Large, extra pull
        </MagneticGlowButton>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <MagneticGlowButton loading={loading} loadingText="Saving…" onClick={save}>
          {count > 0 ? `Saved ${count}×` : "Save changes"}
        </MagneticGlowButton>
        <MagneticGlowButton disabled>Disabled</MagneticGlowButton>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <MagneticGlowButton fullWidth size="lg" glowColor="#34d399">
          Full width on any screen
        </MagneticGlowButton>
      </div>
    </div>
  );
}
