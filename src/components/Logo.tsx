import * as React from "react";

/** KoniQ Fitness & Combat mark — a stylized fist/shield in tenant colors. */
export function LogoMark({ size = 34, primary, accent }: { size?: number; primary?: string; accent?: string }) {
  const p = primary || "#e11d48";
  const a = accent || "#f59e0b";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="37" height="37" rx="10" fill={p} />
      <path d="M20 6 8 11v8c0 8 6 12.5 12 15 6-2.5 12-7 12-15v-8L20 6Z" fill="rgba(255,255,255,0.14)" />
      {/* fist */}
      <path d="M14 17c0-1 .8-1.8 1.8-1.8h7c1.6 0 2.9 1.3 2.9 2.9v4.5c0 2.9-2.4 5.3-5.3 5.3h-1.2c-2.9 0-5.2-2.4-5.2-5.3V17Z" fill="#fff" />
      <path d="M14 18.5h-1.4c-.9 0-1.6.7-1.6 1.6s.7 1.6 1.6 1.6H14" fill="#fff" />
      <rect x="16.5" y="13.5" width="7.5" height="3.2" rx="1.6" fill={a} />
    </svg>
  );
}

export function LogoFull({ size = 30, primary, accent, subtitle = "Fitness & Combat OS" }: { size?: number; primary?: string; accent?: string; subtitle?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size + 6} primary={primary} accent={accent} />
      <span className="leading-tight">
        <span className="block font-extrabold tracking-tight" style={{ fontSize: size * 0.62 }}>KoniQ</span>
        <span className="block text-[10px] font-semibold uppercase tracking-wider faint">{subtitle}</span>
      </span>
    </span>
  );
}
