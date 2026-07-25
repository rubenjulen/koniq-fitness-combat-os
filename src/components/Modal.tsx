"use client";
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Icon } from "./icons";

/**
 * Lightweight dialog: a trigger button opens a centered modal.
 * Wrap a form inside; after a successful server action the form can call the
 * passed `close` via a hidden submit that navigates — simplest is to let the
 * page revalidate and close on submit. We auto-close when the form submits.
 */
export function Modal({ trigger, title, children, wide }: { trigger: { label: string; icon?: string; variant?: "primary" | "secondary" | "ghost" }; title: string; children: React.ReactNode | ((close: () => void) => React.ReactNode); wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button className={`btn btn-${trigger.variant ?? "primary"}`} onClick={() => setOpen(true)}>
        {trigger.icon && <Icon name={trigger.icon} size={16} />} {trigger.label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.5)" }} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div ref={ref} className={`card w-full ${wide ? "max-w-2xl" : "max-w-md"} my-8`} style={{ padding: 0 }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold">{title}</h3>
              <button className="btn btn-ghost btn-sm" onClick={close} aria-label="Sluiten"><Icon name="x" size={18} /></button>
            </div>
            <div className="p-5" onSubmitCapture={() => setTimeout(close, 50)}>
              {typeof children === "function" ? children(close) : children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
