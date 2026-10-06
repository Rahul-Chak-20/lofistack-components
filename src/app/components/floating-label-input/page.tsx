import type { Metadata } from "next";
import { ComponentPage, type PropDoc } from "@/components/gallery/component-page";
import { FloatingLabelInputDemo } from "./demo";

export const metadata: Metadata = { title: "Floating Label Input" };

const usage = `import { FloatingLabelInput } from "@/components/ui/floating-label-input";

const validateEmail = (value: string) =>
  /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value) ? undefined : "Enter a valid email address.";

export function Example() {
  return (
    <FloatingLabelInput
      label="Email"
      type="email"
      required
      validate={validateEmail}
      validateOn="blur"
      helperText="We'll never share it."
      successMessage="Looks good."
    />
  );
}`;

const props: PropDoc[] = [
  { name: "label", type: "string", description: "Label that floats up on focus or when the field has a value." },
  { name: "helperText", type: "string", description: "Neutral hint shown when there is no error or success message." },
  { name: "error", type: "string", description: "External error message; overrides validate." },
  { name: "successMessage", type: "string", description: "Shown, with a green border, once the value is valid." },
  { name: "validate", type: "(value: string) => string | undefined", description: "Return an error message, or undefined when valid." },
  { name: "validateOn", type: '"blur" | "change"', default: '"blur"', description: "When validation first runs. After a blur it also runs on change." },
  { name: "size", type: '"md" | "lg"', default: '"md"', description: "Height and text size." },
  { name: "leftIcon", type: "ReactNode", description: "Icon inside the field on the left." },
  { name: "showCount", type: "boolean", default: "false", description: "Shows a character counter when maxLength is set." },
  { name: "containerClassName", type: "string", description: "Classes for the outer wrapper." },
  { name: "...rest", type: "InputHTMLAttributes", description: "All native input props, including ref, value, onChange, disabled and type (password gets a reveal toggle)." },
];

export default function Page() {
  return (
    <ComponentPage slug="floating-label-input" preview={<FloatingLabelInputDemo />} usage={usage} props={props} />
  );
}
