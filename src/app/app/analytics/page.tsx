import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, Badge, EmptyState, Sparkline, FeatureLocked } from "@/components/ui";
import { money, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

type Kpi = {
  active_members: number;
  mrr: number;
  overdue_amount: number;
  open_leads: number;
  checkins_30d: number;
  retention_tasks: number;
};

type FunnelRow = { total_leads: number; qualified: number; trial: number; members: number };
type PkgRow = { name: string; type: string; cnt: number; total: number };
type UtilRow = { name: string; booked: number; capacity: number; sessions: number };
type CheckinDay = { d: string; cnt: number };
type CohortRow = { ym: string; cnt: number };
type CampaignRow = {
  id: string;
  name: string;
  channel: string;
  budget: number | null;
  spend: number | null;
  leads: number;
  conversions: number;
  status: string;
};

export default async function AnalyticsPage() {
  const user = await guard({ feature: "analytics", cap: "analytics.read" });
  if (!user.ok) return <FeatureLocked feature="Analytics" pack="enterprise" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;

  const [kpiRows, funnelRows, pkgRows, arpuRows, utilRows, checkinRows, cohortRows, campaignRows] = await Promise.all([
    query<Kpi>(
      `SELECT
         COALESCE((SELECT count(*)::int FROM members WHERE tenant_id=$1 AND status='active'),0) AS active_members,
         COALESCE((SELECT sum(price)::float FROM memberships WHERE tenant_id=$1 AND status='active'),0) AS mrr,
         COALESCE((SELECT sum(amount)::float FROM invoices WHERE tenant_id=$1 AND status IN ('overdue','partial')),0) AS overdue_amount,
         COALESCE((SELECT count(*)::int FROM leads WHERE tenant_id=$1 AND status NOT IN ('won','lost')),0) AS open_leads,
         COALESCE((SELECT count(*)::int FROM attendance WHERE tenant_id=$1 AND session_date >= CURRENT_DATE - INTERVAL '30 days'),0) AS checkins_30d,
         COALESCE((SELECT count(*)::int FROM retention_tasks WHERE tenant_id=$1 AND status IN ('open','in_progress')),0) AS retention_tasks`,
      [t]
    ),
    query<FunnelRow>(
      `SELECT
         (SELECT count(*)::int FROM leads WHERE tenant_id=$1) AS total_leads,
         (SELECT count(*)::int FROM leads WHERE tenant_id=$1 AND status IN ('trial_attended','offer','won')) AS qualified,
         (SELECT count(*)::int FROM members WHERE tenant_id=$1 AND status IN ('trial','active')) AS trial,
         (SELECT count(*)::int FROM members WHERE tenant_id=$1 AND status='active') AS members`,
      [t]
    ),
    query<PkgRow>(
      `SELECT p.name, p.type, count(*)::int AS cnt, COALESCE(sum(ms.price),0)::float AS total
         FROM memberships ms
         JOIN packages p ON p.id = ms.package_id AND p.tenant_id=$1
        WHERE ms.tenant_id=$1 AND ms.status='active'
        GROUP BY p.name, p.type
        ORDER BY total DESC`,
      [t]
    ),
    query<{ arpu: number }>(
      `SELECT COALESCE(avg(price),0)::float AS arpu FROM memberships WHERE tenant_id=$1 AND status='active'`,
      [t]
    ),
    query<UtilRow>(
      `SELECT ct.name,
              COALESCE(sum(bk.booked),0)::int AS booked,
              COALESCE(sum(c.capacity),0)::int AS capacity,
              count(DISTINCT c.id)::int AS sessions
         FROM classes c
         JOIN class_types ct ON ct.id = c.class_type_id AND ct.tenant_id=$1
         LEFT JOIN LATERAL (
           SELECT count(*)::int AS booked FROM bookings b
            WHERE b.class_id = c.id AND b.tenant_id=$1 AND b.status IN ('booked','attended')
         ) bk ON true
        WHERE c.tenant_id=$1 AND c.active
        GROUP BY ct.name
        ORDER BY booked DESC`,
      [t]
    ),
    query<CheckinDay>(
      `SELECT to_char(session_date,'YYYY-MM-DD') AS d, count(*)::int AS cnt
         FROM attendance
        WHERE tenant_id=$1 AND session_date >= CURRENT_DATE - INTERVAL '20 days'
        GROUP BY d ORDER BY d`,
      [t]
    ),
    query<CohortRow>(
      `SELECT to_char(join_date,'YYYY-MM') AS ym, count(*)::int AS cnt
         FROM members
        WHERE tenant_id=$1 AND join_date IS NOT NULL
          AND join_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY ym ORDER BY ym`,
      [t]
    ),
    query<CampaignRow>(
      `SELECT id, name, channel, budget::float AS budget, spend::float AS spend,
              COALESCE(leads,0)::int AS leads, COALESCE(conversions,0)::int AS conversions, status
         FROM campaigns
        WHERE tenant_id=$1
        ORDER BY start_date DESC NULLS LAST
        LIMIT 8`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { active_members: 0, mrr: 0, overdue_amount: 0, open_leads: 0, checkins_30d: 0, retention_tasks: 0 };
  const f = funnelRows[0] ?? { total_leads: 0, qualified: 0, trial: 0, members: 0 };
  const arpu = arpuRows[0]?.arpu ?? 0;

  const funnelStages = [
    { label: "Leads", value: f.total_leads, tone: "indigo" },
    { label: "Gekwalificeerd / trial", value: f.qualified, tone: "amber" },
    { label: "Lid (trial + actief)", value: f.trial, tone: "blue" },
    { label: "Actief behouden", value: f.members, tone: "green" },
  ] as const;
  const funnelMax = Math.max(1, ...funnelStages.map((s) => s.value));
  const leadToMember = f.total_leads > 0 ? Math.round((f.members / f.total_leads) * 100) : 0;

  // 21-day check-in series aligned by day.
  const days: string[] = [];
  const now = new Date();
  for (let i = 20; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }
  const checkinMap = new Map(checkinRows.map((r) => [r.d, r.cnt]));
  const checkinSeries = days.map((d) => checkinMap.get(d) ?? 0);

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const cohortMap = new Map(cohortRows.map((r) => [r.ym, r.cnt]));
  const cohortSeries = months.map((m) => ({ ym: m, cnt: cohortMap.get(m) ?? 0 }));
  const cohortMax = Math.max(1, ...cohortSeries.map((c) => c.cnt));

  const pkgMax = Math.max(1, ...pkgRows.map((p) => p.cnt));

  return (
    <>
      <PageHeader title="Analytics" subtitle="Executive BI — groei, retentie en marketing in één beeld" icon="chart" />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Actieve leden" value={k.active_members} icon="users" tone="green" />
        <StatCard label="MRR" value={money(k.mrr, cur)} icon="coins" tone="brand" sub={`ARPU ${money(arpu, cur)}`} />
        <StatCard label="Achterstallig" value={money(k.overdue_amount, cur)} icon="alert" tone={k.overdue_amount > 0 ? "red" : "slate"} />
        <StatCard label="Open leads" value={k.open_leads} icon="funnel" tone="indigo" />
        <StatCard label="Check-ins 30d" value={k.checkins_30d} icon="scan" tone="blue" />
        <StatCard label="Retentietaken" value={k.retention_tasks} icon="heart" tone={k.retention_tasks > 0 ? "amber" : "slate"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Section title="Sales funnel">
          <Card>
            <div className="space-y-3">
              {funnelStages.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span style={{ color: "var(--text)" }}>{s.label}</span>
                    <span className="tabular-nums font-medium">{s.value}</span>
                  </div>
                  <div className="bar">
                    <span
                      style={{
                        width: `${Math.round((s.value / funnelMax) * 100)}%`,
                        background: `var(--brand)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm">
              <Badge tone="green">Lead → lid {leadToMember}%</Badge>
              <span className="faint text-xs">conversie over alle tijd</span>
            </div>
          </Card>
        </Section>

        <Section title="Retentie — cohorten per instroommaand">
          {cohortSeries.every((c) => c.cnt === 0) ? (
            <EmptyState icon="users" title="Nog geen instroomdata" />
          ) : (
            <Card>
              <div className="space-y-3">
                {cohortSeries.map((c) => (
                  <div key={c.ym}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="tabular-nums" style={{ color: "var(--text)" }}>{c.ym}</span>
                      <span className="tabular-nums font-medium">{c.cnt} leden</span>
                    </div>
                    <div className="bar">
                      <span style={{ width: `${Math.round((c.cnt / cohortMax) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Section title="Pakketmix (actieve lidmaatschappen)">
          {pkgRows.length === 0 ? (
            <EmptyState icon="tag" title="Geen actieve lidmaatschappen" />
          ) : (
            <Card>
              <DataTable
                head={
                  <>
                    <th>Pakket</th>
                    <th>Type</th>
                    <th className="text-right">Leden</th>
                    <th className="text-right">MRR</th>
                    <th></th>
                  </>
                }
              >
                {pkgRows.map((p) => (
                  <tr key={p.name}>
                    <td className="font-medium" style={{ color: "var(--text)" }}>{p.name}</td>
                    <td><Badge tone="slate">{titleCase(p.type)}</Badge></td>
                    <td className="text-right tabular-nums">{p.cnt}</td>
                    <td className="text-right tabular-nums font-medium">{money(p.total, cur)}</td>
                    <td style={{ width: 90 }}>
                      <div className="bar">
                        <span style={{ width: `${Math.round((p.cnt / pkgMax) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
            </Card>
          )}
        </Section>

        <Section title="Bezetting per lestype">
          {utilRows.length === 0 ? (
            <EmptyState icon="calendar" title="Nog geen lessen" />
          ) : (
            <Card>
              <DataTable
                head={
                  <>
                    <th>Lestype</th>
                    <th className="text-right">Sessies</th>
                    <th className="text-right">Geboekt</th>
                    <th className="text-right">Capaciteit</th>
                    <th className="text-right">Bezetting</th>
                  </>
                }
              >
                {utilRows.map((u) => {
                  const util = u.capacity > 0 ? Math.round((u.booked / u.capacity) * 100) : 0;
                  const tone = util >= 80 ? "green" : util >= 50 ? "amber" : "slate";
                  return (
                    <tr key={u.name}>
                      <td className="font-medium" style={{ color: "var(--text)" }}>{u.name}</td>
                      <td className="text-right tabular-nums">{u.sessions}</td>
                      <td className="text-right tabular-nums">{u.booked}</td>
                      <td className="text-right tabular-nums muted">{u.capacity}</td>
                      <td className="text-right"><Badge tone={tone as "green" | "amber" | "slate"}>{util}%</Badge></td>
                    </tr>
                  );
                })}
              </DataTable>
            </Card>
          )}
        </Section>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Section title="Check-in trend (21 dagen)">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs faint uppercase tracking-wide">Dagelijkse check-ins</div>
                <div className="text-lg font-semibold tabular-nums">{checkinSeries.reduce((s, n) => s + n, 0)}</div>
              </div>
              <Sparkline points={checkinSeries} width={180} height={44} color="var(--brand)" />
            </div>
            <div className="text-xs faint">
              Gem. {(checkinSeries.reduce((s, n) => s + n, 0) / 21).toFixed(1)} per dag · piek {Math.max(...checkinSeries, 0)}
            </div>
          </Card>
        </Section>

        <div className="lg:col-span-2">
          <Section title="Marketing — campagnes">
            {campaignRows.length === 0 ? (
              <EmptyState icon="megaphone" title="Geen campagnes" />
            ) : (
              <DataTable
                head={
                  <>
                    <th>Campagne</th>
                    <th>Kanaal</th>
                    <th>Status</th>
                    <th className="text-right">Budget</th>
                    <th className="text-right">Besteed</th>
                    <th className="text-right">Leads</th>
                    <th className="text-right">Conv.</th>
                    <th className="text-right">CPL</th>
                  </>
                }
              >
                {campaignRows.map((c) => {
                  const cpl = c.leads > 0 && c.spend != null ? c.spend / c.leads : null;
                  return (
                    <tr key={c.id}>
                      <td className="font-medium" style={{ color: "var(--text)" }}>{c.name}</td>
                      <td><Badge tone="indigo">{titleCase(c.channel)}</Badge></td>
                      <td className="muted">{titleCase(c.status)}</td>
                      <td className="text-right tabular-nums muted">{c.budget != null ? money(c.budget, cur) : "—"}</td>
                      <td className="text-right tabular-nums">{c.spend != null ? money(c.spend, cur) : "—"}</td>
                      <td className="text-right tabular-nums">{c.leads}</td>
                      <td className="text-right tabular-nums font-medium">{c.conversions}</td>
                      <td className="text-right tabular-nums muted">{cpl != null ? money(cpl, cur) : "—"}</td>
                    </tr>
                  );
                })}
              </DataTable>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
