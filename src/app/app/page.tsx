import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { dashboardStats, attendanceTrend, todayClasses, recentLeads, upcomingBirthdays, atRiskMembers } from "@/lib/data";
import { PageHeader, StatCard, Card, Section, StatusBadge, Sparkline, Avatar, EmptyState, LinkButton } from "@/components/ui";
import { Icon } from "@/components/icons";
import { money, fullName, timeAgo, age } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireSession();
  const t = user.tenantId;
  const [stats, trend, classes, leads, birthdays, atRisk] = await Promise.all([
    dashboardStats(t), attendanceTrend(t), todayClasses(t), recentLeads(t), upcomingBirthdays(t), atRiskMembers(t),
  ]);
  const cur = user.tenant.currency;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";

  return (
    <>
      <PageHeader
        title={`${greet}, ${user.name.split(" ")[0]}`}
        subtitle="Overzicht van je sportschool vandaag"
        actions={<LinkButton href="/app/members" icon="plus">Nieuw lid</LinkButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Actieve leden" value={stats?.active_members ?? 0} icon="users" tone="green" sub={`${stats?.trials ?? 0} in trial`} />
        <StatCard label="Omzet deze maand" value={money(stats?.mrr ?? 0, cur)} icon="coins" tone="brand" trend={{ dir: "up", value: "8%" }} />
        <StatCard label="Openstaand" value={money(stats?.open_amount ?? 0, cur)} icon="alert" tone={(stats?.open_amount ?? 0) > 0 ? "amber" : "slate"} sub={`${stats?.overdue_members ?? 0} achterstallig`} />
        <StatCard label="Open leads" value={stats?.open_leads ?? 0} icon="funnel" tone="indigo" sub="in pipeline" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Rooster vandaag" actions={<Link href="/app/schedule" className="link text-sm">Volledige agenda →</Link>}>
            {classes.length === 0 ? (
              <EmptyState icon="calendar" title="Geen lessen vandaag" subtitle="Er staan vandaag geen lessen gepland." />
            ) : (
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {classes.map((c) => {
                    const full = c.booked >= c.cap;
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-3">
                        <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: c.color ?? "var(--brand)" }} />
                        <div className="w-16 text-sm font-semibold tabular-nums">{c.start_time}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{c.title}</p>
                          <p className="text-xs muted truncate">{c.coach ?? "—"} · {c.start_time}–{c.end_time}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold" style={{ color: full ? "#dc2626" : "var(--text)" }}>{c.booked}/{c.cap}</p>
                          <p className="text-xs faint">geboekt</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </Section>

          <Section title="Laatste leads" actions={<Link href="/app/leads" className="link text-sm">Alle leads →</Link>}>
            <Card padding={false}>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {leads.map((l) => (
                  <Link href="/app/leads" key={l.id} className="flex items-center gap-3 p-3 hover:bg-[var(--bg-subtle)]">
                    <Avatar name={l.name} size={34} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{l.name}</p>
                      <p className="text-xs muted truncate capitalize">{l.source ?? "—"} · {l.discipline?.replace("_", " ") ?? "—"}</p>
                    </div>
                    <StatusBadge status={l.status} />
                    <span className="text-xs faint hidden sm:block w-24 text-right">{timeAgo(l.created_at)}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </Section>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Check-ins</h3>
              <Icon name="qr" size={16} className="faint" />
            </div>
            <p className="text-3xl font-bold">{stats?.checkins_week ?? 0}</p>
            <p className="text-xs muted mb-3">deze week</p>
            <Sparkline points={trend.map((x) => x.n)} width={230} height={44} />
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">At-risk leden</h3>
              <Link href="/app/retention" className="link text-xs">Retentie →</Link>
            </div>
            {atRisk.length === 0 ? <p className="text-sm muted">Geen risicoleden. 💪</p> : (
              <div className="space-y-2.5">
                {atRisk.map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar name={fullName(m)} size={30} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fullName(m)}</p>
                      <p className="text-xs faint truncate">{m.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Jarig deze week 🎉</h3>
            </div>
            {birthdays.length === 0 ? <p className="text-sm muted">Niemand jarig deze week.</p> : (
              <div className="space-y-2.5">
                {birthdays.map((b) => (
                  <div key={b.id} className="flex items-center gap-2.5">
                    <Avatar name={fullName(b)} size={30} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fullName(b)}</p>
                      <p className="text-xs faint">wordt {(age(b.dob) ?? 0) + 1}</p>
                    </div>
                    <Icon name="whatsapp" size={16} style={{ color: "#25D366" }} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
