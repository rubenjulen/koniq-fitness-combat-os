import * as React from "react";
import Link from "next/link";
import { Icon } from "./icons";
import { initials } from "@/lib/format";
import { PACK_META, type PackKey } from "@/lib/editions";

export function PageHeader({ title, subtitle, actions, icon }: { title: string; subtitle?: string; actions?: React.ReactNode; icon?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
            <Icon name={icon} size={20} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>{title}</h1>
          {subtitle && <p className="text-sm muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", padding = true }: { children: React.ReactNode; className?: string; padding?: boolean }) {
  return <div className={`card ${padding ? "p-5" : ""} ${className}`}>{children}</div>;
}

type Tone = "brand" | "green" | "amber" | "red" | "slate" | "indigo" | "blue" | "purple";

export function StatCard({ label, value, sub, icon, trend, tone = "brand" }: { label: string; value: React.ReactNode; sub?: string; icon?: string; trend?: { dir: "up" | "down"; value: string }; tone?: Tone }) {
  const tones: Record<string, string> = {
    brand: "var(--brand)", green: "#10b981", amber: "#f59e0b", red: "#ef4444", slate: "var(--text-muted)",
    indigo: "#6366f1", blue: "#3b82f6", purple: "#a855f7",
  };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide faint">{label}</span>
        {icon && <span style={{ color: tones[tone] }}><Icon name={icon} size={18} /></span>}
      </div>
      <div className="mt-2 text-2xl font-bold" style={{ color: "var(--text)" }}>{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold" style={{ color: trend.dir === "up" ? "#10b981" : "#ef4444" }}>
            <Icon name={trend.dir === "up" ? "arrowUp" : "arrowDown"} size={13} />{trend.value}
          </span>
        )}
        {sub && <span className="text-xs muted">{sub}</span>}
      </div>
    </div>
  );
}

const TONE_STYLES: Record<string, { bg: string; fg: string; bd: string }> = {
  green: { bg: "rgba(16,185,129,.12)", fg: "#059669", bd: "rgba(16,185,129,.3)" },
  blue: { bg: "rgba(59,130,246,.12)", fg: "#2563eb", bd: "rgba(59,130,246,.3)" },
  indigo: { bg: "rgba(99,102,241,.14)", fg: "#4f46e5", bd: "rgba(99,102,241,.3)" },
  amber: { bg: "rgba(245,158,11,.14)", fg: "#b45309", bd: "rgba(245,158,11,.35)" },
  red: { bg: "rgba(239,68,68,.12)", fg: "#dc2626", bd: "rgba(239,68,68,.3)" },
  slate: { bg: "var(--bg-subtle)", fg: "var(--text-muted)", bd: "var(--border)" },
  purple: { bg: "rgba(168,85,247,.14)", fg: "#9333ea", bd: "rgba(168,85,247,.3)" },
  rose: { bg: "rgba(225,29,72,.12)", fg: "#e11d48", bd: "rgba(225,29,72,.3)" },
};

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: keyof typeof TONE_STYLES }) {
  const t = TONE_STYLES[tone] ?? TONE_STYLES.slate;
  return <span className="badge" style={{ background: t.bg, color: t.fg, borderColor: t.bd }}>{children}</span>;
}

/** Map a domain status string to a colored badge. */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label?: string; tone: keyof typeof TONE_STYLES }> = {
    // members
    active: { tone: "green" }, prospect: { tone: "slate" }, trial: { tone: "amber" },
    frozen: { tone: "blue", label: "bevroren" }, overdue: { tone: "red", label: "achterstallig" },
    cancelled: { tone: "slate", label: "opgezegd" }, alumni: { tone: "slate" }, expired: { tone: "red", label: "verlopen" },
    pending: { tone: "amber", label: "in afwachting" },
    // leads
    new: { tone: "indigo", label: "nieuw" }, contacted: { tone: "blue", label: "gecontacteerd" },
    trial_booked: { tone: "amber", label: "trial geboekt" }, trial_attended: { tone: "purple", label: "trial gevolgd" },
    offer: { tone: "amber", label: "aanbod" }, won: { tone: "green", label: "gewonnen" }, lost: { tone: "red", label: "verloren" },
    // payments
    paid: { tone: "green", label: "betaald" }, due: { tone: "amber", label: "openstaand" },
    partial: { tone: "amber", label: "deels betaald" }, failed: { tone: "red", label: "mislukt" },
    waived: { tone: "slate", label: "kwijtgescholden" }, written_off: { tone: "slate", label: "afgeboekt" },
    confirmed: { tone: "green", label: "bevestigd" },
    // attendance / bookings
    booked: { tone: "blue", label: "geboekt" }, waitlist: { tone: "amber", label: "wachtlijst" },
    attended: { tone: "green", label: "aanwezig" }, no_show: { tone: "red", label: "no-show" },
    // generic
    open: { tone: "indigo" }, in_progress: { tone: "amber", label: "in behandeling" }, done: { tone: "green", label: "gereed" },
    resolved: { tone: "green", label: "opgelost" }, scheduled: { tone: "blue", label: "gepland" },
    registered: { tone: "blue", label: "aangemeld" }, published: { tone: "green", label: "gepubliceerd" },
    planning: { tone: "amber" }, completed: { tone: "green", label: "afgerond" }, draft: { tone: "slate", label: "concept" },
    blocked: { tone: "red", label: "geblokkeerd" }, escalated: { tone: "red", label: "geëscaleerd" },
    connected: { tone: "green", label: "verbonden" }, disconnected: { tone: "slate", label: "niet verbonden" }, error: { tone: "red" },
    // health
    green: { tone: "green", label: "laag risico" }, amber: { tone: "amber", label: "let op" }, red: { tone: "red", label: "hoog risico" },
    ok: { tone: "green" }, maintenance: { tone: "amber", label: "onderhoud" }, defect: { tone: "red" }, retired: { tone: "slate" },
    // skills
    learning: { tone: "amber", label: "in ontwikkeling" }, competent: { tone: "blue" }, mastered: { tone: "green", label: "beheerst" },
    approved: { tone: "green", label: "goedgekeurd" }, win: { tone: "green", label: "winst" }, loss: { tone: "red", label: "verlies" }, draw: { tone: "slate", label: "gelijk" },
    achieved: { tone: "green", label: "behaald" },
  };
  const s = map[status] ?? { tone: "slate" as const };
  return <Badge tone={s.tone}>{s.label ?? status.replace(/_/g, " ")}</Badge>;
}

/** Health risk flag chip. */
export function RiskBadge({ risk }: { risk: string }) {
  return <StatusBadge status={risk} />;
}

/** Edition/pack chip — shows which package a feature belongs to. */
export function PackBadge({ pack }: { pack: PackKey }) {
  const m = PACK_META[pack];
  return <span className="badge" style={{ background: `${m.color}1f`, color: m.color, borderColor: `${m.color}55` }}>{m.label}</span>;
}

export function Avatar({ name, url, size = 32 }: { name?: string | null; url?: string | null; size?: number }) {
  if (url) return <img src={url} alt={name ?? ""} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <span className="rounded-full grid place-items-center font-semibold shrink-0" style={{ width: size, height: size, fontSize: size * 0.38, background: "var(--brand-soft)", color: "var(--brand)" }}>
      {initials(name)}
    </span>
  );
}

export function EmptyState({ title, subtitle, icon = "inbox", action }: { title: string; subtitle?: string; icon?: string; action?: React.ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full grid place-items-center mb-3" style={{ background: "var(--bg-subtle)", color: "var(--text-faint)" }}>
        <Icon name={icon} size={24} />
      </div>
      <p className="font-semibold" style={{ color: "var(--text)" }}>{title}</p>
      {subtitle && <p className="text-sm muted mt-1 max-w-md mx-auto">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 mb-4">{children}</div>;
}

export function LinkButton({ href, children, variant = "primary", icon }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; icon?: string }) {
  return (
    <Link href={href} className={`btn btn-${variant}`}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </Link>
  );
}

export function Section({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide faint">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function DataTable({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead><tr>{head}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "green" | "amber" | "red" }) {
  const colors: Record<string, string> = { brand: "var(--brand)", green: "#10b981", amber: "#f59e0b", red: "#ef4444" };
  return (
    <div className="h-2 rounded-full w-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: colors[tone] }} />
    </div>
  );
}

/** Simple inline SVG sparkline for trends. */
export function Sparkline({ points, color = "var(--brand)", width = 120, height = 34 }: { points: number[]; color?: string; width?: number; height?: number }) {
  if (!points.length) return null;
  const max = Math.max(...points, 1), min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = width / (points.length - 1 || 1);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(height - ((p - min) / range) * (height - 4) - 2).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
      <span className="text-sm muted shrink-0">{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: "var(--text)" }}>{children}</span>
    </div>
  );
}

/** Locked feature notice (shown when an edition doesn't include a feature). */
export function FeatureLocked({ feature, pack }: { feature: string; pack?: PackKey }) {
  return (
    <div className="card p-10 text-center max-w-lg mx-auto mt-10">
      <div className="mx-auto w-12 h-12 rounded-full grid place-items-center mb-3" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
        <Icon name="lock" size={24} />
      </div>
      <p className="font-semibold text-lg" style={{ color: "var(--text)" }}>{feature} is niet inbegrepen</p>
      <p className="text-sm muted mt-1">
        Deze module hoort bij {pack ? <PackBadge pack={pack} /> : "een hoger pakket"}. Activeer het via Instellingen &rsaquo; Edities & pakketten.
      </p>
      <div className="mt-4"><LinkButton href="/app/settings" icon="settings" variant="secondary">Naar instellingen</LinkButton></div>
    </div>
  );
}
