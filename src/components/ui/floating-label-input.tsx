"use client";

import {
  useId,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type FocusEvent,
  type ReactNode,
} from "react";

export type FloatingLabelInputSize = "md" | "lg";
export type ValidateOn = "blur" | "change";

export interface FloatingLabelInputProps
  extends Omit<ComponentPropsWithRef<"input">, "size" | "placeholder"> {
  /** Label that sits inside the field and floats up on focus or when filled. */
  label: string;
  /** Neutral hint shown under the field when there is no error or success message. */
  helperText?: string;
  /** External error message. Takes priority over the result of `validate`. */
  error?: string;
  /** Message shown once the field is valid. Turns the field green. */
  successMessage?: string;
  /** Returns an error message for an invalid value, or undefined when valid. */
  validate?: (value: string) => string | undefined;
  /** When `validate` runs. Defaults to "blur"; after the first blur it also runs on change. */
  validateOn?: ValidateOn;
  /** Size preset. Defaults to "md". */
  size?: FloatingLabelInputSize;
  /** Icon rendered inside the field on the left. */
  leftIcon?: ReactNode;
  /** Shows a "12/40" counter when `maxLength` is set. */
  showCount?: boolean;
  /** Classes for the outer wrapper. */
  containerClassName?: string;
}

const sizeClasses: Record<FloatingLabelInputSize, { input: string; label: string }> = {
  md: { input: "h-14 pt-5 text-sm", label: "text-sm" },
  lg: { input: "h-16 pt-6 text-base", label: "text-base" },
};

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M3 3l18 18" />}
    </svg>
  );
}

export function FloatingLabelInput({
  label,
  helperText,
  error,
  successMessage,
  validate,
  validateOn = "blur",
  size = "md",
  leftIcon,
  showCount = false,
  containerClassName = "",
  className = "",
  id,
  type = "text",
  value,
  defaultValue,
  maxLength,
  disabled,
  required,
  onChange,
  onBlur,
  ...rest
}: FloatingLabelInputProps) {
  const autoId = useId();
  const inputId = id ?? `fli-${autoId}`;
  const messageId = `${inputId}-message`;

  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState(String(defaultValue ?? ""));
  const currentValue = isControlled ? String(value) : innerValue;

  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [revealed, setRevealed] = useState(false);

  const runValidation = (next: string) => setValidationError(validate?.(next));

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) setInnerValue(event.target.value);
    if (validateOn === "change" || touched) runValidation(event.target.value);
    onChange?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setTouched(true);
    runValidation(event.target.value);
    onBlur?.(event);
  }

  const shownError = error ?? validationError;
  const validated = touched || validateOn === "change";
  const isSuccess =
    !shownError && !!successMessage && validated && currentValue.length > 0;
  const status = shownError ? "error" : isSuccess ? "success" : "idle";
  const message = shownError ?? (isSuccess ? successMessage : helperText);
  const isPassword = type === "password";

  const tone = {
    idle: "border-white/15 focus:border-violet-400 focus:ring-violet-400/30",
    error: "border-rose-500/80 focus:border-rose-400 focus:ring-rose-400/30",
    success: "border-emerald-500/80 focus:border-emerald-400 focus:ring-emerald-400/30",
  }[status];

  const labelTone = {
    idle: "text-zinc-400 peer-focus:text-violet-300",
    error: "text-rose-300",
    success: "text-emerald-300",
  }[status];

  const messageTone = {
    idle: "text-zinc-400",
    error: "text-rose-300",
    success: "text-emerald-300",
  }[status];

  return (
    <div className={`w-full ${containerClassName}`}>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          {...rest}
          id={inputId}
          type={isPassword && revealed ? "text" : type}
          value={currentValue}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          placeholder=" "
          aria-invalid={status === "error" || undefined}
          aria-describedby={message ? messageId : undefined}
          onChange={handleChange}
          onBlur={handleBlur}
          className={[
            "peer block w-full rounded-xl border bg-white/[0.03] pb-2 text-zinc-100 outline-none",
            "transition-[border-color,box-shadow,background-color] duration-200",
            "hover:bg-white/[0.05] focus:ring-4",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/[0.03]",
            leftIcon ? "pl-10" : "pl-4",
            isPassword ? "pr-11" : "pr-4",
            sizeClasses[size].input,
            tone,
            className,
          ].join(" ")}
        />
        <label
          htmlFor={inputId}
          className={[
            "pointer-events-none absolute top-1/2 origin-left -translate-y-[1.15rem] scale-[0.8] transition-all duration-200",
            "peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100",
            "peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.8]",
            "peer-disabled:opacity-50",
            leftIcon ? "left-10" : "left-4",
            sizeClasses[size].label,
            labelTone,
          ].join(" ")}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-rose-300" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            disabled={disabled}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            aria-controls={inputId}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none"
          >
            <EyeIcon open={revealed} />
          </button>
        )}
      </div>
      {(message || (showCount && maxLength)) && (
        <div className="mt-1.5 flex items-start justify-between gap-3 px-1 text-xs">
          <p
            id={messageId}
            role={status === "error" ? "alert" : undefined}
            aria-live={status === "error" ? undefined : "polite"}
            className={`flex items-center gap-1 ${messageTone}`}
          >
            {status === "error" && <span aria-hidden="true">✕</span>}
            {status === "success" && <span aria-hidden="true">✓</span>}
            {message}
          </p>
          {showCount && maxLength && (
            <span className="shrink-0 tabular-nums text-zinc-500" aria-hidden="true">
              {currentValue.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default FloatingLabelInput;
