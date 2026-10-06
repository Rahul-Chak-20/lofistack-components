import type { Metadata } from "next";
import { ComponentPage, type PropDoc } from "@/components/gallery/component-page";
import { MagneticButtonDemo } from "./demo";

export const metadata: Metadata = { title: "Magnetic Glow Button" };

const usage = `import { useState } from "react";
import { MagneticGlowButton } from "@/components/ui/magnetic-glow-button";

export function Example() {
  const [saving, setSaving] = useState(false);

  return (
    <MagneticGlowButton
      variant="primary"
      size="md"
      glowColor="#a78bfa"
      magneticStrength={0.35}
      loading={saving}
      loadingText="Saving…"
      onClick={() => setSaving(true)}
    >
      Save changes
    </MagneticGlowButton>
  );
}`;

const props: PropDoc[] = [
  { name: "children", type: "ReactNode", description: "Button label or content." },
  { name: "variant", type: '"primary" | "outline" | "ghost"', default: '"primary"', description: "Visual style." },
  { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Height, padding and text size." },
  { name: "glowColor", type: "string", default: '"#a78bfa"', description: "Any CSS color for the spotlight, hover shadow and focus ring." },
  { name: "magneticStrength", type: "number", default: "0.35", description: "Pull toward the cursor from 0 (off) to 1." },
  { name: "maxOffset", type: "number", default: "12", description: "Maximum travel in px." },
  { name: "glowSize", type: "number", default: "140", description: "Spotlight diameter in px." },
  { name: "loading", type: "boolean", default: "false", description: "Shows a spinner, sets aria-busy and blocks clicks without losing focus." },
  { name: "loadingText", type: "string", description: "Label shown while loading." },
  { name: "leftIcon / rightIcon", type: "ReactNode", description: "Icons around the label." },
  { name: "fullWidth", type: "boolean", default: "false", description: "Stretch to the container width." },
  { name: "...rest", type: "ButtonHTMLAttributes", description: "All native button props, including ref, disabled and onClick." },
];

export default function Page() {
  return <ComponentPage slug="magnetic-button" preview={<MagneticButtonDemo />} usage={usage} props={props} />;
}
