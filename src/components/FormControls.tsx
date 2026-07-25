"use client";
import * as React from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "./icons";

/** Submit button that shows a pending state while the server action runs. */
export function SubmitButton({ children, icon, variant = "primary", className = "", pendingLabel }: { children: React.ReactNode; icon?: string; variant?: "primary" | "secondary" | "danger" | "ghost"; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`btn btn-${variant} ${className}`}>
      {pending ? (
        <><Icon name="clock" size={15} /> {pendingLabel ?? "Bezig…"}</>
      ) : (
        <>{icon && <Icon name={icon} size={15} />} {children}</>
      )}
    </button>
  );
}

/** A single-purpose form that submits one action on click (e.g. a row-level "check in"). */
export function ActionRowButton({ action, hidden, children, icon, variant = "ghost", title }: { action: (formData: FormData) => void; hidden: Record<string, string>; children?: React.ReactNode; icon?: string; variant?: "primary" | "secondary" | "danger" | "ghost"; title?: string }) {
  return (
    <form action={action} title={title}>
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <SubmitButton icon={icon} variant={variant} className="btn-sm">{children}</SubmitButton>
    </form>
  );
}
