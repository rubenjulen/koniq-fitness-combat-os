import Link from "next/link";
import { requireMember } from "@/lib/portal-auth";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { memberLogoutAction } from "../../(auth)/portal-actions";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/portal", label: "Home", icon: "dashboard" },
  { href: "/portal/training", label: "Training", icon: "dumbbell" },
  { href: "/portal/progress", label: "Progress", icon: "trend" },
  { href: "/portal/payments", label: "Betalen", icon: "coins" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const m = await requireMember();
  const brand = m.brand as { primary?: string; accent?: string };
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", ["--tenant-primary" as string]: brand?.primary, ["--tenant-accent" as string]: brand?.accent }}>
      <header className="sticky top-0 z-10 h-14 border-b flex items-center gap-3 px-4 max-w-lg mx-auto" style={{ background: "var(--bg-elevated)" }}>
        <LogoMark size={30} primary={brand?.primary} accent={brand?.accent} />
        <span className="font-bold truncate flex-1">{m.tenantName}</span>
        <ThemeToggle />
        <form action={memberLogoutAction}><button className="btn btn-ghost btn-sm" title="Uitloggen"><Icon name="logout" size={16} /></button></form>
      </header>
      <main className="max-w-lg mx-auto p-4 pb-24">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 border-t" style={{ background: "var(--bg-elevated)" }}>
        <div className="max-w-lg mx-auto grid grid-cols-4">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className="flex flex-col items-center gap-0.5 py-2.5 text-xs muted">
              <Icon name={t.icon} size={20} /> {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
