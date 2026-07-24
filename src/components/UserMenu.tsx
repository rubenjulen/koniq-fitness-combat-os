"use client";
import { useState, useRef, useEffect } from "react";
import { Icon } from "./icons";
import { Avatar } from "./ui";
import { logoutAction } from "@/app/(auth)/actions";

export function UserMenu({ name, email, role }: { name: string; email: string; role?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-[var(--bg-subtle)] transition-colors">
        <Avatar name={name} size={30} />
        <span className="hidden sm:block text-left leading-tight">
          <span className="block text-sm font-semibold truncate max-w-[140px]">{name}</span>
          <span className="block text-[11px] faint truncate max-w-[140px]">{role ?? email}</span>
        </span>
        <Icon name="chevronDown" size={15} className="faint" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 card p-1.5 z-40">
          <div className="px-2.5 py-2 border-b mb-1" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs faint truncate">{email}</p>
          </div>
          <a href="/app/settings" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm hover:bg-[var(--bg-subtle)]">
            <Icon name="settings" size={15} /> Instellingen
          </a>
          <form action={logoutAction}>
            <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm hover:bg-[var(--bg-subtle)]" style={{ color: "#dc2626" }}>
              <Icon name="logout" size={15} /> Uitloggen
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
