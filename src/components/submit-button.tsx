"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "./ui";

export function SubmitButton({
  label,
  pendingLabel,
  className = buttonClass,
  confirmMessage,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? (pendingLabel ?? `${label}...`) : label}
    </button>
  );
}
