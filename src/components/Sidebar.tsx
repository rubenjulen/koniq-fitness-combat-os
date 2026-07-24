"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./icons";
import { LogoMark } from "./Logo";
import type { NavGroup } from "@/lib/nav";

export function Sidebar({ nav, tenantName, tagline, primary, accent, edition }: { nav: NavGroup[]; tenantName: string; tagline?: string; primary?: string; accent?: string; edition?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  return (
    <>
      <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b" style={{ background: "var(--bg-elevated)" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(!open)} aria-label="Menu"><Icon name="layers" size={20} /></button>
        <span className="font-bold truncate">{tenantName}</span>
        <span style={{ width: 32 }} />
      </div>

      <aside className={`${open ? "block" : "hidden"} lg:block fixed lg:static z-30 inset-y-0 left-0 w-64 shrink-0 border-r overflow-y-auto`} style={{ background: "var(--bg-elevated)" }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/app" className="flex items-center gap-2.5">
            <span className="shrink-0"><LogoMark size={36} primary={primary} accent={accent} /></span>
            <span className="min-w-0">
              <span className="block font-bold leading-tight truncate">{tenantName}</span>
              <span className="block text-[11px] faint truncate">{tagline ?? "KoniQ Fitness & Combat OS"}</span>
            </span>
          </Link>
          {edition && (
            <div className="mt-2.5">
              <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand)", borderColor: "transparent" }}>
                <Icon name="belt" size={12} /> {edition} editie
              </span>
            </div>
          )}
        </div>

        <nav className="px-2 py-3">
          {nav.map((g) => (
            <div key={g.group} className="mb-3">
              <p className="px-2.5 mb-1 text-[10px] font-bold uppercase tracking-wider faint">{g.group}</p>
              {g.items.map((it) => {
                const active = isActive(it.href);
                return (
                  <Link key={it.href} href={it.href} onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors"
                    style={active ? { background: "var(--brand-soft)", color: "var(--brand)" } : { color: "var(--text-muted)" }}>
                    <Icon name={it.icon} size={17} />
                    <span className="truncate">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      {open && <div className="lg:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setOpen(false)} />}
    </>
  );
}
