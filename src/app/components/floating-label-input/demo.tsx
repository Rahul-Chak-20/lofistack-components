"use client";

import { useState } from "react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";

const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const validateEmail = (v: string) =>
  !v ? "Email is required." : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : "Enter a valid email address.";

const validatePassword = (v: string) =>
  v.length < 8 ? "Use at least 8 characters." : /\d/.test(v) ? undefined : "Add at least one number.";

export function FloatingLabelInputDemo() {
  const [username, setUsername] = useState("");

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <FloatingLabelInput
        label="Email"
        type="email"
        required
        autoComplete="email"
        leftIcon={<MailIcon />}
        validate={validateEmail}
        helperText="We'll never share it."
        successMessage="Looks good."
      />
      <FloatingLabelInput
        label="Password"
        type="password"
        required
        autoComplete="new-password"
        validate={validatePassword}
        validateOn="change"
        helperText="8+ characters with a number."
        successMessage="Strong enough."
      />
      <FloatingLabelInput
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
        maxLength={20}
        showCount
        error={username === "admin" ? "That username is taken." : undefined}
        helperText='Controlled field. Try "admin".'
      />
      <FloatingLabelInput label="Company" defaultValue="LofiStack" disabled helperText="Disabled state." />
      <FloatingLabelInput
        label="Large field"
        size="lg"
        containerClassName="sm:col-span-2"
        helperText="The lg size preset."
      />
    </div>
  );
}
