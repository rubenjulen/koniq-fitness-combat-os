import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { NAV } from "@/lib/nav";
import { loadFeatures } from "@/lib/entitlements";
import { edition } from "@/lib/editions";
import { Sidebar } from "@/components/Sidebar";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  const features = await loadFeatures(user.tenantId, user.tenant.planKey);

  const nav = NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => can(user, it.cap) && (!it.feature || features.has(it.feature))),
  })).filter((g) => g.items.length > 0);

  const brand = user.tenant.brand as { tagline?: string; primary?: string; accent?: string };
  const ed = edition(user.tenant.planKey);

  return (
    <div className="min-h-screen lg:flex" style={{ ["--tenant-primary" as string]: brand?.primary, ["--tenant-accent" as string]: brand?.accent }}>
      <Sidebar nav={nav} tenantName={user.tenant.name} tagline={brand?.tagline} primary={brand?.primary} accent={brand?.accent} edition={ed.name} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 h-14 border-b flex items-center gap-3 px-4 lg:px-6" style={{ background: "color-mix(in srgb, var(--bg-elevated) 88%, transparent)", backdropFilter: "blur(8px)" }}>
          <div className="flex-1 flex items-center gap-2 text-sm muted">
            <Icon name="mapPin" size={15} /> <span className="hidden sm:inline">{user.tenant.name}</span>
          </div>
          <Link href="/app/checkin" className="btn btn-secondary btn-sm"><Icon name="qr" size={15} /> <span className="hidden sm:inline">Check-in</span></Link>
          <ThemeToggle />
          <UserMenu name={user.name} email={user.email} role={user.roleName} />
        </header>
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
