import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, Badge, Avatar, EmptyState, Progress, Sparkline, FeatureLocked } from "@/components/ui";
import { fullName, dateShort, timeAgo, titleCase, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

type KpiRow = { d7: number; d30: number; uniq30: number };
type DayRow = { d: string; n: number };
type TypeClassRow = { id: string; name: string; discipline: string | null; color: string | null; class_count: number; cap_sum: number };
type TypeCheckinRow = { ct_id: string | null; checkins: number };
type TopMemberRow = { id: string; first_name: string | null; last_name: string | null; photo_url: string | null; checkins: number; active_days: number; last_seen: string | null };
type AtRiskRow = { id: string; first_name: string | null; last_name: string | null; photo_url: string | null; last_ever: string | null };
type RecentRow = { id: string; checked_in_at: string; session_date: string; method: string; first_name: string | null; last_name: string | null; photo_url: string | null; title: string | null };

export default async function AttendancePage() {
  const user = await guard({ feature: "attendance", cap: "attendance.read" });
  if (!user.ok) return <FeatureLocked feature="Check-in & attendance" pack="starter" />;
  const t = user.tenantId;

  const [kpiRows, days, typeClasses, typeCheckins, topMembers, atRisk, recent] = await Promise.all([
    query<KpiRow>(
      `SELECT
          count(*) FILTER (WHERE session_date >= current_date - interval '7 days')::int AS d7,
          count(*) FILTER (WHERE session_date >= current_date - interval '30 days')::int AS d30,
          count(DISTINCT member_id) FILTER (WHERE session_date >= current_date - interval '30 days')::int AS uniq30
         FROM attendance WHERE tenant_id = $1`,
      [t]
    ),
    query<DayRow>(
      `SELECT session_date::text AS d, count(*)::int AS n
         FROM attendance
        WHERE tenant_id = $1 AND session_date >= current_date - interval '20 days'
        GROUP BY session_date ORDER BY session_date`,
      [t]
    ),
    query<TypeClassRow>(
      `SELECT ct.id, ct.name, ct.discipline, ct.color,
              count(cl.id)::int AS class_count,
              coalesce(sum(cl.capacity), 0)::int AS cap_sum
         FROM class_types ct
         LEFT JOIN classes cl ON cl.class_type_id = ct.id AND cl.tenant_id = ct.tenant_id AND cl.active = true
        WHERE ct.tenant_id = $1
        GROUP BY ct.id, ct.name, ct.discipline, ct.color`,
      [t]
    ),
    query<TypeCheckinRow>(
      `SELECT cl.class_type_id AS ct_id, count(a.id)::int AS checkins
         FROM attendance a
         JOIN classes cl ON cl.id = a.class_id AND cl.tenant_id = a.tenant_id
        WHERE a.tenant_id = $1 AND a.session_date >= current_date - interval '30 days'
        GROUP BY cl.class_type_id`,
      [t]
    ),
    query<TopMemberRow>(
      `SELECT m.id, m.first_name, m.last_name, m.photo_url,
              count(a.id)::int AS checkins,
              count(DISTINCT a.session_date)::int AS active_days,
              max(a.session_date)::text AS last_seen
         FROM attendance a
         JOIN members m ON m.id = a.member_id AND m.tenant_id = a.tenant_id
        WHERE a.tenant_id = $1 AND a.session_date >= current_date - interval '30 days'
        GROUP BY m.id, m.first_name, m.last_name, m.photo_url
        ORDER BY checkins DESC, active_days DESC
        LIMIT 10`,
      [t]
    ),
    query<AtRiskRow>(
      `SELECT m.id, m.first_name, m.last_name, m.photo_url,
              (SELECT max(a2.session_date)::text FROM attendance a2 WHERE a2.member_id = m.id AND a2.tenant_id = m.tenant_id) AS last_ever
         FROM members m
         LEFT JOIN attendance a ON a.member_id = m.id AND a.tenant_id = m.tenant_id
                               AND a.session_date >= current_date - interval '14 days'
        WHERE m.tenant_id = $1 AND m.status = 'active'
        GROUP BY m.id, m.first_name, m.last_name, m.photo_url
        HAVING count(a.id) = 0
        ORDER BY last_ever ASC NULLS FIRST
        LIMIT 15`,
      [t]
    ),
    query<RecentRow>(
      `SELECT a.id, a.checked_in_at, a.session_date::text AS session_date, a.method,
              m.first_name, m.last_name, m.photo_url, cl.title
         FROM attendance a
         JOIN members m ON m.id = a.member_id AND m.tenant_id = a.tenant_id
         LEFT JOIN classes cl ON cl.id = a.class_id AND cl.tenant_id = a.tenant_id
        WHERE a.tenant_id = $1
        ORDER BY a.checked_in_at DESC
        LIMIT 20`,
      [t]
    ),
  ]);

  const kpi = kpiRows[0] ?? { d7: 0, d30: 0, uniq30: 0 };
  const avgPerDay = Math.round((kpi.d30 / 30) * 10) / 10;

  // Fill 21-day sparkline buckets
  const dayMap = new Map(days.map((d) => [d.d.slice(0, 10), d.n]));
  const spark: number[] = [];
  for (let i = 20; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    spark.push(dayMap.get(key) ?? 0);
  }

  // Merge class-type utilization
  const checkinByType = new Map(typeCheckins.map((c) => [c.ct_id ?? "", c.checkins]));
  const typeRows = typeClasses
    .map((ty) => {
      const checkins = checkinByType.get(ty.id) ?? 0;
      // capacity-slots over ~4.3 weeks in a 30d window
      const slots = ty.cap_sum * 4.3;
      const utilization = slots > 0 ? Math.min(100, Math.round((checkins / slots) * 100)) : 0;
      return { ...ty, checkins, utilization };
    })
    .sort((a, b) => b.checkins - a.checkins);

  const utilTone = (u: number): "green" | "amber" | "red" => (u >= 60 ? "green" : u >= 30 ? "amber" : "red");
  const methodTone = (m: string): "green" | "blue" | "amber" | "slate" =>
    m === "kiosk" ? "green" : m === "app" ? "blue" : m === "manual" ? "amber" : "slate";

  return (
    <>
      <PageHeader title="Aanwezigheid & analytics" subtitle="Check-in trends, bezetting en risicoleden" icon="chart" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Check-ins (7d)" value={kpi.d7} icon="check" tone="green" />
        <StatCard label="Check-ins (30d)" value={kpi.d30} icon="qr" tone="brand" />
        <StatCard label="Unieke leden (30d)" value={kpi.uniq30} icon="users" tone="indigo" />
        <StatCard label="Gemiddeld per dag" value={avgPerDay} icon="trend" tone="purple" sub="laatste 30 dagen" />
      </div>

      <Section title="Check-ins per dag (laatste 21 dagen)">
        <Card>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold" style={{ color: "var(--text)" }}>{spark.reduce((s, n) => s + n, 0)}</p>
              <p className="text-xs muted">totaal check-ins in periode</p>
            </div>
            <Sparkline points={spark} width={420} height={56} />
          </div>
        </Card>
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Bezetting per lesvorm (30d)">
          {typeRows.length === 0 ? (
            <EmptyState icon="belt" title="Geen lesvormen" />
          ) : (
            <DataTable head={<><th>Lesvorm</th><th className="text-right">Check-ins</th><th className="w-40">Bezetting</th></>}>
              {typeRows.map((ty) => (
                <tr key={ty.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ background: ty.color ?? "var(--brand)" }} />
                      <div>
                        <p className="font-medium">{ty.name}</p>
                        <p className="text-xs faint capitalize">{ty.discipline ? ty.discipline.replace(/_/g, " ") : "—"} · {ty.class_count} lessen</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right tabular-nums font-semibold">{ty.checkins}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={ty.utilization} tone={utilTone(ty.utilization)} />
                      <span className="text-xs faint w-9 text-right tabular-nums">{pct(ty.utilization)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>

        <Section title="Meest actieve leden (30d)">
          {topMembers.length === 0 ? (
            <EmptyState icon="users" title="Nog geen check-ins" />
          ) : (
            <DataTable head={<><th>Lid</th><th className="text-right">Check-ins</th><th className="text-right">Dagen</th><th className="text-right">Laatst</th></>}>
              {topMembers.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={fullName(m)} url={m.photo_url} size={30} />
                      <span className="font-medium">{fullName(m)}</span>
                    </div>
                  </td>
                  <td className="text-right tabular-nums font-semibold">{m.checkins}</td>
                  <td className="text-right tabular-nums">{m.active_days}</td>
                  <td className="text-right text-xs faint">{m.last_seen ? dateShort(m.last_seen) : "—"}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>
      </div>

      <Section title="Risicoleden — geen bezoek in 14 dagen">
        {atRisk.length === 0 ? (
          <Card><p className="text-sm muted">Geen risicoleden — alle actieve leden waren recent aanwezig. 💪</p></Card>
        ) : (
          <DataTable head={<><th>Lid</th><th>Laatst gezien</th><th className="text-right">Status</th></>}>
            {atRisk.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={fullName(m)} url={m.photo_url} size={30} />
                    <span className="font-medium">{fullName(m)}</span>
                  </div>
                </td>
                <td className="text-sm muted">{m.last_ever ? timeAgo(m.last_ever) : "nooit ingecheckt"}</td>
                <td className="text-right"><Badge tone="red">at-risk</Badge></td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <Section title="Recente check-ins">
        {recent.length === 0 ? (
          <EmptyState icon="qr" title="Nog geen check-ins" />
        ) : (
          <DataTable head={<><th>Lid</th><th>Les</th><th>Methode</th><th>Datum</th><th className="text-right">Ingecheckt</th></>}>
            {recent.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={fullName(r)} url={r.photo_url} size={30} />
                    <span className="font-medium">{fullName(r)}</span>
                  </div>
                </td>
                <td className="text-sm">{r.title ?? "Vrije training"}</td>
                <td><Badge tone={methodTone(r.method)}>{titleCase(r.method)}</Badge></td>
                <td className="text-sm muted">{dateShort(r.session_date)}</td>
                <td className="text-right text-xs faint">{timeAgo(r.checked_in_at)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
