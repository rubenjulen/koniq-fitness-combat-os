import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { dateNL, timeAgo, fullName, titleCase } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type TaskRow = {
  id: string;
  type: string;
  reason: string | null;
  status: string;
  due_date: string | null;
  note: string | null;
  created_at: string;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  owner_name: string | null;
};

type Kpi = {
  open_tasks: number;
  at_risk: number;
  freeze_recovery: number;
  winback: number;
};

const TYPE_LABEL: Record<string, string> = {
  at_risk: "At-risk",
  winback: "Win-back",
  check_in: "Check-in",
  freeze_recovery: "Freeze recovery",
};

const TYPE_TONE: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  at_risk: "red",
  winback: "amber",
  check_in: "blue",
  freeze_recovery: "indigo",
};

export default async function RetentionPage() {
  const user = await guard({ feature: "retention", cap: "retention.read" });
  if (!user.ok) return <FeatureLocked feature="Retentie" pack="pro" />;
  const t = user.tenantId;

  const [tasks, kpiRows, byReason, churn] = await Promise.all([
    query<TaskRow>(
      `SELECT rt.id, rt.type, rt.reason, rt.status, rt.due_date, rt.note, rt.created_at,
              m.id AS member_id, m.first_name, m.last_name, m.photo_url,
              u.name AS owner_name
         FROM retention_tasks rt
         LEFT JOIN members m ON m.id = rt.member_id AND m.tenant_id = $1
         LEFT JOIN users u ON u.id = rt.owner_id AND u.tenant_id = $1
        WHERE rt.tenant_id = $1
        ORDER BY (rt.status = 'done'), rt.due_date NULLS LAST, rt.created_at DESC`,
      [t]
    ),
    query<Kpi>(
      `SELECT count(*) FILTER (WHERE status <> 'done')::int AS open_tasks,
              count(*) FILTER (WHERE type = 'at_risk' AND status <> 'done')::int AS at_risk,
              count(*) FILTER (WHERE type = 'freeze_recovery' AND status <> 'done')::int AS freeze_recovery,
              count(*) FILTER (WHERE type = 'winback' AND status <> 'done')::int AS winback
         FROM retention_tasks WHERE tenant_id = $1`,
      [t]
    ),
    query<{ reason: string | null; n: number }>(
      `SELECT reason, count(*)::int AS n
         FROM retention_tasks
        WHERE tenant_id = $1 AND type = 'at_risk'
        GROUP BY reason ORDER BY n DESC`,
      [t]
    ),
    query<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      photo_url: string | null;
      status: string;
      created_at: string;
      cancel_reason: string | null;
    }>(
      `SELECT m.id, m.first_name, m.last_name, m.photo_url, m.status, m.created_at,
              (SELECT ms.cancel_reason FROM memberships ms
                 WHERE ms.member_id = m.id AND ms.tenant_id = $1 AND ms.cancel_reason IS NOT NULL
                 ORDER BY ms.created_at DESC LIMIT 1) AS cancel_reason
         FROM members m
        WHERE m.tenant_id = $1 AND m.status IN ('cancelled', 'alumni')
        ORDER BY m.created_at DESC LIMIT 20`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { open_tasks: 0, at_risk: 0, freeze_recovery: 0, winback: 0 };

  return (
    <>
      <PageHeader title="Retentie" subtitle="Behoud leden: at-risk signalen, freeze recovery en win-back" icon="heart" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open retentietaken" value={k.open_tasks} icon="clipboard" tone="brand" sub="te behandelen" />
        <StatCard label="At-risk leden" value={k.at_risk} icon="alert" tone={k.at_risk > 0 ? "red" : "slate"} />
        <StatCard label="Freeze recovery" value={k.freeze_recovery} icon="clock" tone="indigo" sub="bevroren → heractiveren" />
        <StatCard label="Win-back" value={k.winback} icon="target" tone="amber" sub="opgezegd terugwinnen" />
      </div>

      <Section title="Retentietaken">
        {tasks.length === 0 ? (
          <EmptyState icon="heart" title="Geen retentietaken" subtitle="Zodra leden risico lopen of bevriezen, verschijnen hier taken om ze te behouden." />
        ) : (
          <DataTable
            head={
              <>
                <th>Lid</th>
                <th>Type</th>
                <th>Reden</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Eigenaar</th>
              </>
            }
          >
            {tasks.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.member_id ? (
                    <Link href={`/app/members/${row.member_id}`} className="flex items-center gap-2.5 group">
                      <Avatar name={fullName(row)} url={row.photo_url} size={30} />
                      <span className="font-medium group-hover:underline">{fullName(row)}</span>
                    </Link>
                  ) : (
                    <span className="faint">—</span>
                  )}
                </td>
                <td><Badge tone={TYPE_TONE[row.type] ?? "slate"}>{TYPE_LABEL[row.type] ?? titleCase(row.type)}</Badge></td>
                <td className="muted max-w-xs">
                  <span className="text-sm">{row.reason ?? "—"}</span>
                  {row.note && <span className="text-xs faint block truncate">{row.note}</span>}
                </td>
                <td><StatusBadge status={row.status} /></td>
                <td className="muted text-sm">{dateNL(row.due_date)}</td>
                <td className="muted text-sm">{row.owner_name ?? <span className="faint">Niet toegewezen</span>}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="At-risk redenen">
          {byReason.length === 0 ? (
            <Card><p className="text-sm muted">Geen at-risk taken.</p></Card>
          ) : (
            <DataTable head={<><th>Reden</th><th className="text-right">Aantal</th></>}>
              {byReason.map((r, i) => (
                <tr key={i}>
                  <td>{r.reason ? titleCase(r.reason) : <span className="faint">Onbekend</span>}</td>
                  <td className="text-right font-semibold tabular-nums">{r.n}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>

        <Section title="Save-offer">
          <Card>
            <p className="text-sm muted">
              Zet at-risk en win-back leden een gericht behoudsaanbod voor: een bevriezing in plaats van opzegging,
              een tijdelijke korting of een gratis PT-sessie. Log het contactmoment en de uitkomst op de taak, zodat
              de opvolging meetbaar blijft.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="green">Freeze i.p.v. opzeggen</Badge>
              <Badge tone="amber">Tijdelijke korting</Badge>
              <Badge tone="indigo">Gratis PT-sessie</Badge>
              <Badge tone="blue">Persoonlijke check-in</Badge>
            </div>
          </Card>
        </Section>
      </div>

      <Section title="Recent verloop (churn)">
        {churn.length === 0 ? (
          <Card><p className="text-sm muted">Geen opgezegde of alumni-leden.</p></Card>
        ) : (
          <DataTable head={<><th>Lid</th><th>Status</th><th>Opzegreden</th><th className="text-right">Sinds</th></>}>
            {churn.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/app/members/${c.id}`} className="flex items-center gap-2.5 group">
                    <Avatar name={fullName(c)} url={c.photo_url} size={30} />
                    <span className="font-medium group-hover:underline">{fullName(c)}</span>
                  </Link>
                </td>
                <td><StatusBadge status={c.status} /></td>
                <td className="muted text-sm">{c.cancel_reason ? titleCase(c.cancel_reason) : <span className="faint">Niet vastgelegd</span>}</td>
                <td className="text-right faint text-sm">{timeAgo(c.created_at)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
