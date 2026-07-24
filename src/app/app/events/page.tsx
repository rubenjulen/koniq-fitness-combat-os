import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, Progress, FeatureLocked } from "@/components/ui";
import { money, dateNL, timeAgo, fullName, titleCase, pct } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  name: string;
  type: string;
  start_date: string | null;
  capacity: number | null;
  member_price: number | null;
  nonmember_price: number | null;
  status: string;
  reg_count: number;
  paid_count: number;
};

type RegRow = {
  id: string;
  name: string | null;
  status: string;
  paid: boolean;
  checked_in: boolean;
  created_at: string;
  event_name: string | null;
  event_type: string | null;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

const TYPE_TONE: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  seminar: "blue",
  camp: "indigo",
  grading: "purple",
  fight: "red",
  open_day: "green",
  social: "amber",
};

export default async function EventsPage() {
  const user = await guard({ feature: "events", cap: "event.read" });
  if (!user.ok) return <FeatureLocked feature="Events" pack="pro" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;

  const [events, regs, kpiRows] = await Promise.all([
    query<EventRow>(
      `SELECT e.id, e.name, e.type, e.start_date, e.capacity,
              e.member_price::float AS member_price, e.nonmember_price::float AS nonmember_price, e.status,
              (SELECT count(*)::int FROM event_registrations r
                 WHERE r.event_id = e.id AND r.tenant_id = $1 AND r.status <> 'cancelled') AS reg_count,
              (SELECT count(*)::int FROM event_registrations r
                 WHERE r.event_id = e.id AND r.tenant_id = $1 AND r.paid) AS paid_count
         FROM events e
        WHERE e.tenant_id = $1
        ORDER BY e.start_date DESC NULLS LAST`,
      [t]
    ),
    query<RegRow>(
      `SELECT r.id, r.name, r.status, r.paid, r.checked_in, r.created_at,
              e.name AS event_name, e.type AS event_type,
              m.id AS member_id, m.first_name, m.last_name, m.photo_url
         FROM event_registrations r
         LEFT JOIN events e ON e.id = r.event_id AND e.tenant_id = $1
         LEFT JOIN members m ON m.id = r.member_id AND m.tenant_id = $1
        WHERE r.tenant_id = $1
        ORDER BY r.created_at DESC LIMIT 20`,
      [t]
    ),
    query<{ upcoming: number; regs: number }>(
      `SELECT
         (SELECT count(*) FILTER (WHERE start_date >= CURRENT_DATE AND status IN ('planning','published'))::int
            FROM events WHERE tenant_id = $1) AS upcoming,
         (SELECT count(*)::int FROM event_registrations WHERE tenant_id = $1 AND status <> 'cancelled') AS regs`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { upcoming: 0, regs: 0 };
  const revenue = events.reduce((sum, e) => sum + e.paid_count * (e.member_price ?? 0), 0);
  const withCap = events.filter((e) => (e.capacity ?? 0) > 0);
  const avgFill = withCap.length
    ? withCap.reduce((sum, e) => sum + Math.min(100, (e.reg_count / (e.capacity ?? 1)) * 100), 0) / withCap.length
    : 0;

  return (
    <>
      <PageHeader title="Events" subtitle="Seminars, kampen, gradings en fight nights" icon="calendar" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Aankomende events" value={k.upcoming} icon="calendar" tone="brand" />
        <StatCard label="Registraties" value={k.regs} icon="users" tone="indigo" sub="totaal actief" />
        <StatCard label="Event-omzet" value={money(revenue, cur)} icon="coins" tone="green" sub="betaalde inschrijvingen" />
        <StatCard label="Gem. bezetting" value={pct(avgFill)} icon="chart" tone="amber" sub={`${withCap.length} events met capaciteit`} />
      </div>

      <Section title="Alle events">
        {events.length === 0 ? (
          <EmptyState icon="calendar" title="Nog geen events" subtitle="Plan een seminar, kamp of grading om inschrijvingen te openen." />
        ) : (
          <DataTable
            head={
              <>
                <th>Event</th>
                <th>Type</th>
                <th>Datum</th>
                <th>Prijs (lid / niet-lid)</th>
                <th>Status</th>
                <th>Bezetting</th>
                <th className="text-right">Betaald</th>
              </>
            }
          >
            {events.map((e) => {
              const fill = (e.capacity ?? 0) > 0 ? (e.reg_count / (e.capacity ?? 1)) * 100 : 0;
              return (
                <tr key={e.id}>
                  <td className="font-medium">{e.name}</td>
                  <td><Badge tone={TYPE_TONE[e.type] ?? "slate"}>{titleCase(e.type)}</Badge></td>
                  <td className="muted text-sm">{dateNL(e.start_date)}</td>
                  <td className="text-sm">
                    <span>{money(e.member_price, cur)}</span>
                    <span className="faint"> / {money(e.nonmember_price, cur)}</span>
                  </td>
                  <td><StatusBadge status={e.status} /></td>
                  <td className="min-w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><Progress value={fill} tone={fill >= 90 ? "red" : fill >= 60 ? "amber" : "green"} /></div>
                      <span className="text-xs tabular-nums faint shrink-0">{e.reg_count}/{e.capacity ?? "—"}</span>
                    </div>
                  </td>
                  <td className="text-right tabular-nums font-semibold">{e.paid_count}</td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>

      <Section title="Recente inschrijvingen">
        {regs.length === 0 ? (
          <Card><p className="text-sm muted">Nog geen inschrijvingen.</p></Card>
        ) : (
          <DataTable head={<><th>Deelnemer</th><th>Event</th><th>Status</th><th>Betaald</th><th className="text-right">Ingeschreven</th></>}>
            {regs.map((r) => {
              const name = r.member_id ? fullName(r) : (r.name ?? "Niet-lid");
              return (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={name} url={r.photo_url} size={30} />
                      {r.member_id ? (
                        <Link href={`/app/members/${r.member_id}`} className="font-medium hover:underline">{name}</Link>
                      ) : (
                        <span className="font-medium">{name} <span className="text-xs faint">(niet-lid)</span></span>
                      )}
                    </div>
                  </td>
                  <td className="text-sm">{r.event_name ?? <span className="faint">—</span>}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.paid ? <Badge tone="green">betaald</Badge> : <Badge tone="amber">open</Badge>}</td>
                  <td className="text-right faint text-sm">{timeAgo(r.created_at)}</td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>
    </>
  );
}
