/** Shared formatting helpers. */

export function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

const CURRENCY_SYMBOL: Record<string, string> = { SRD: "SRD ", USD: "$", EUR: "€" };

export function money(amount: number | string | null | undefined, currency = "SRD"): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  const sym = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  return `${sym}${(n || 0).toLocaleString("nl-SR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function dateNL(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export function dateShort(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit" });
}

export function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  const s = Math.floor((Date.now() - dt.getTime()) / 1000);
  if (s < 60) return "zojuist";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min geleden`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} uur geleden`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} dag${days > 1 ? "en" : ""} geleden`;
  return dateNL(dt);
}

export function age(dob?: string | Date | null): number | null {
  if (!dob) return null;
  const b = typeof dob === "string" ? new Date(dob) : dob;
  if (isNaN(b.getTime())) return null;
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export const WEEKDAYS = ["", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
export const WEEKDAYS_SHORT = ["", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export function fullName(m: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  if (!m) return "—";
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || "—";
}

export function pct(n: number | null | undefined): string {
  return `${Math.round(n ?? 0)}%`;
}

export function titleCase(s?: string | null): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
