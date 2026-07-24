import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, DataTable, StatusBadge, Badge, Avatar, EmptyState, LinkButton, FeatureLocked } from "@/components/ui";
import { money, dateNL, fullName, age, titleCase } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type MemberRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  member_no: string | null;
  status: string;
  dob: string | null;
  is_minor: boolean;
  photo_url: string | null;
  join_date: string | null;
  experience: string | null;
  goal: string | null;
  package_name: string | null;
  package_price: number | null;
  att30: number;
};

type Kpi = {
  total: number;
  active: number;
  trial: number;
  overdue: number;
  frozen: number;
  prospect: number;
  minors: number;
};

export default async function MembersPage() {
  const user = await guard({ feature: "members", cap: "member.read" });
  if (!user.ok) return <FeatureLocked feature="Members" pack="starter" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;

  const [members, kpiRows] = await Promise.all([
    query<MemberRow>(
      `SELECT m.id, m.first_name, m.last_name, m.member_no, m.status, m.dob, m.is_minor,
              m.photo_url, m.join_date, m.experience, m.goal,
              (SELECT p.name FROM memberships ms JOIN packages p ON p.id = ms.package_id
                 WHERE ms.member_id = m.id AND ms.tenant_id = $1 AND ms.status = 'active'
                 ORDER BY ms.start_date DESC NULLS LAST LIMIT 1) AS package_name,
              (SELECT ms.price FROM memberships ms
                 WHERE ms.member_id = m.id AND ms.tenant_id = $1 AND ms.status = 'active'
                 ORDER BY ms.start_date DESC NULLS LAST LIMIT 1)::float AS package_price,
              (SELECT count(*)::int FROM attendance a
                 WHERE a.member_id = m.id AND a.tenant_id = $1
                   AND a.session_date >= CURRENT_DATE - INTERVAL '30 days') AS att30
         FROM members m
        WHERE m.tenant_id = $1
        ORDER BY m.created_at DESC`,
      [t]
    ),
    query<Kpi>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE status = 'active')::int AS active,
              count(*) FILTER (WHERE status = 'trial')::int AS trial,
              count(*) FILTER (WHERE status = 'overdue')::int AS overdue,
              count(*) FILTER (WHERE status = 'frozen')::int AS frozen,
              count(*) FILTER (WHERE status = 'prospect')::int AS prospect,
              count(*) FILTER (WHERE is_minor)::int AS minors
         FROM members WHERE tenant_id = $1`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { total: 0, active: 0, trial: 0, overdue: 0, frozen: 0, prospect: 0, minors: 0 };

  const segments: { label: string; count: number; tone: Parameters<typeof Badge>[0]["tone"] }[] = [
    { label: `Actief ${k.active}`, count: k.active, tone: "green" },
    { label: `Trial ${k.trial}`, count: k.trial, tone: "amber" },
    { label: `Achterstallig ${k.overdue}`, count: k.overdue, tone: "red" },
    { label: `Bevroren ${k.frozen}`, count: k.frozen, tone: "blue" },
    { label: `Prospect ${k.prospect}`, count: k.prospect, tone: "slate" },
    { label: `Jeugd ${k.minors}`, count: k.minors, tone: "purple" },
  ];

  return (
    <>
      <PageHeader
        title="Leden"
        subtitle="Ledenadministratie, statussen en betrokkenheid"
        icon="users"
        actions={<LinkButton href="/app/leads" icon="funnel" variant="secondary">Leads</LinkButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Totaal leden" value={k.total} icon="users" tone="brand" />
        <StatCard label="Actief" value={k.active} icon="check" tone="green" sub={`${k.trial} in trial`} />
        <StatCard label="Trial" value={k.trial} icon="sparkles" tone="amber" />
        <StatCard label="Achterstallig" value={k.overdue} icon="alert" tone={k.overdue > 0 ? "red" : "slate"} />
        <StatCard label="Jeugdleden" value={k.minors} icon="heart" tone="purple" sub="minderjarig" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {segments.map((s) => (
          <Badge key={s.label} tone={s.tone}>{s.label}</Badge>
        ))}
      </div>

      {members.length === 0 ? (
        <EmptyState icon="users" title="Nog geen leden" subtitle="Voeg leden toe of converteer leads naar leden." />
      ) : (
        <DataTable
          head={
            <>
              <th>Lid</th>
              <th>Nr.</th>
              <th>Status</th>
              <th>Pakket</th>
              <th>Leeftijd</th>
              <th>Niveau</th>
              <th>Ingeschreven</th>
              <th className="text-right">Bezoek 30d</th>
            </>
          }
        >
          {members.map((m) => {
            const a = age(m.dob);
            return (
              <tr key={m.id}>
                <td>
                  <Link href={`/app/members/${m.id}`} className="flex items-center gap-3 group">
                    <Avatar name={fullName(m)} url={m.photo_url} size={34} />
                    <div className="min-w-0">
                      <span className="font-medium group-hover:underline block truncate" style={{ color: "var(--text)" }}>
                        {fullName(m)}
                      </span>
                      {m.goal && <span className="text-xs faint block truncate">{m.goal}</span>}
                    </div>
                  </Link>
                </td>
                <td className="tabular-nums muted">{m.member_no ?? "—"}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={m.status} />
                    {m.is_minor && <Badge tone="purple">jeugd</Badge>}
                  </div>
                </td>
                <td>
                  {m.package_name ? (
                    <div>
                      <span className="text-sm">{m.package_name}</span>
                      {m.package_price != null && <span className="text-xs faint block">{money(m.package_price, cur)}</span>}
                    </div>
                  ) : (
                    <span className="faint">—</span>
                  )}
                </td>
                <td className="tabular-nums">{a != null ? `${a} jr` : "—"}</td>
                <td className="muted">{m.experience ? titleCase(m.experience) : "—"}</td>
                <td className="muted">{dateNL(m.join_date)}</td>
                <td className="text-right tabular-nums font-semibold">{m.att30}</td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </>
  );
}
