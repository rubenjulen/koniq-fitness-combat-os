import { requirePlatformAdmin } from "@/lib/auth";
import { LogoFull } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformAdmin();
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-10 h-14 border-b flex items-center gap-3 px-4 lg:px-6" style={{ background: "var(--bg-elevated)" }}>
        <LogoFull size={24} subtitle="Platform-beheer" />
        <span className="badge ml-1" style={{ background: "var(--brand-soft)", color: "var(--brand)", borderColor: "transparent" }}>
          <Icon name="shield" size={12} /> KoniQ admin
        </span>
        <div className="flex-1" />
        <ThemeToggle />
        <UserMenu name={admin.name} email={admin.email} role="Platform-admin" />
      </header>
      <main className="p-4 lg:p-6 max-w-[1200px] w-full mx-auto">{children}</main>
    </div>
  );
}
