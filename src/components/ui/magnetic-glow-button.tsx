"use client";

import {
  useRef,
  type ComponentPropsWithRef,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

export type MagneticGlowButtonVariant = "primary" | "outline" | "ghost";
export type MagneticGlowButtonSize = "sm" | "md" | "lg";

export interface MagneticGlowButtonProps
  extends Omit<ComponentPropsWithRef<"button">, "children"> {
  /** Button label or content. */
  children: ReactNode;
  /** Visual style. Defaults to "primary". */
  variant?: MagneticGlowButtonVariant;
  /** Size preset. Defaults to "md". */
  size?: MagneticGlowButtonSize;
  /** Any CSS color used for the cursor-follow glow. */
  glowColor?: string;
  /** How strongly the button is pulled toward the cursor, 0 to 1. Defaults to 0.35. */
  magneticStrength?: number;
  /** Maximum distance in px the button can travel. Defaults to 12. */
  maxOffset?: number;
  /** Diameter in px of the glow spotlight. Defaults to 140. */
  glowSize?: number;
  /** Shows a spinner, sets aria-busy and blocks clicks while keeping focus. */
  loading?: boolean;
  /** Text shown while loading. Falls back to children. */
  loadingText?: string;
  /** Icon rendered before the label. */
  leftIcon?: ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: ReactNode;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
}

const variantClasses: Record<MagneticGlowButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white border border-white/10 hover:border-white/25 dark:bg-white/[0.06]",
  outline:
    "bg-transparent text-zinc-100 border border-(--glow-color)/60 hover:border-(--glow-color)",
  ghost: "bg-transparent text-zinc-200 border border-transparent hover:bg-white/5",
};

const sizeClasses: Record<MagneticGlowButtonSize, string> = {
  sm: "h-9 px-4 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-6 text-sm gap-2 rounded-xl",
  lg: "h-14 px-8 text-base gap-2.5 rounded-2xl",
};

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MagneticGlowButton({
  children,
  variant = "primary",
  size = "md",
  glowColor = "#a78bfa",
  magneticStrength = 0.35,
  maxOffset = 12,
  glowSize = 140,
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = "",
  style,
  type = "button",
  onClick,
  onPointerMove,
  onPointerLeave,
  ...rest
}: MagneticGlowButtonProps) {
  // Current translation, kept so the hit area math ignores our own movement.
  const offset = useRef({ x: 0, y: 0 });
  const inactive = disabled || loading;
  const strength = Math.min(Math.max(magneticStrength, 0), 1);

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    onPointerMove?.(event);
    if (inactive || event.pointerType === "touch") return;

    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const left = rect.left - offset.current.x;
    const top = rect.top - offset.current.y;
    const x = event.clientX - left;
    const y = event.clientY - top;

    el.style.setProperty("--glow-x", `${x}px`);
    el.style.setProperty("--glow-y", `${y}px`);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || strength === 0) return;

    const dx = ((x - rect.width / 2) / (rect.width / 2)) * maxOffset * strength;
    const dy = ((y - rect.height / 2) / (rect.height / 2)) * maxOffset * strength;
    offset.current = { x: dx, y: dy };
    el.style.translate = `${dx}px ${dy}px`;
  }

  function handlePointerLeave(event: PointerEvent<HTMLButtonElement>) {
    onPointerLeave?.(event);
    offset.current = { x: 0, y: 0 };
    event.currentTarget.style.translate = "0px 0px";
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={
        {
          "--glow-color": glowColor,
          "--glow-size": `${glowSize}px`,
          ...style,
        } as CSSProperties
      }
      className={[
        "group relative isolate inline-flex select-none items-center justify-center overflow-hidden font-medium",
        "transition-[translate,scale,box-shadow,border-color,background-color] duration-200 ease-out",
        "hover:shadow-[0_0_28px_-6px_var(--glow-color)] active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--glow-color) focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:active:scale-100",
        "aria-busy:cursor-progress aria-busy:active:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-60 group-disabled:hidden"
        style={{
          background:
            "radial-gradient(var(--glow-size) circle at var(--glow-x, 50%) var(--glow-y, 50%), color-mix(in srgb, var(--glow-color) 45%, transparent), transparent 70%)",
        }}
      />
      {loading ? <Spinner /> : leftIcon}
      <span>{loading && loadingText ? loadingText : children}</span>
      {!loading && rightIcon}
    </button>
  );
}

export default MagneticGlowButton;
