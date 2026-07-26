import { requirePlatformAdmin } from "@/lib/auth";
import { query, queryOne } from "@/db/client";
import { PageHeader, StatCard, DataTable, StatusBadge, EmptyState } from "@/components/ui";
import { dateNL } from "@/lib/format";
import { edition } from "@/lib/editions";
import { NewCustomerModal } from "./NewCustomerModal";
import { EditionSelect, CustomerActions } from "./PlatformRowActions";

export const dynamic = "force-dynamic";

type Row = {
  id: string; name: string; slug: string; plan_key: string | null; status: string; created_at: string;
  members: number; users: number; active_members: number;
};

export default async function PlatformPage() {
  await requirePlatformAdmin();

  const [tenants, kpi] = await Promise.all([
    query<Row>(
      `SELECT t.id, t.name, t.slug, t.plan_key, t.status, t.created_at,
              (SELECT count(*) FROM members m WHERE m.tenant_id=t.id)::int AS members,
              (SELECT count(*) FROM members m WHERE m.tenant_id=t.id AND m.status='active')::int AS active_members,
              (SELECT count(*) FROM users u WHERE u.tenant_id=t.id)::int AS users
         FROM tenants t ORDER BY t.created_at`,
    ),
    queryOne<{ total: number; active: number; suspended: number; members: number }>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE status='active')::int AS active,
              count(*) FILTER (WHERE status='suspended')::int AS suspended,
              (SELECT count(*) FROM members)::int AS members
         FROM tenants`,
    ),
  ]);
  const k = kpi ?? { total: 0, active: 0, suspended: 0, members: 0 };

  return (
    <>
      <PageHeader
        title="Klanten"
        subtitle="Alle sportscholen op het KoniQ-platform — aanmaken, editie beheren, openen"
        icon="building"
        actions={<NewCustomerModal />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Klanten" value={k.total} icon="building" tone="brand" />
        <StatCard label="Actief" value={k.active} icon="check" tone="green" />
        <StatCard label="Geschorst" value={k.suspended} icon="lock" tone={k.suspended > 0 ? "red" : "slate"} />
        <StatCard label="Leden totaal" value={k.members} icon="users" tone="indigo" sub="over alle klanten" />
      </div>

      {tenants.length === 0 ? (
        <EmptyState icon="building" title="Nog geen klanten" subtitle="Maak je eerste sportschool aan met 'Nieuwe klant'." />
      ) : (
        <DataTable head={<><th>Sportschool</th><th>Editie</th><th>Leden</th><th>Gebruikers</th><th>Status</th><th>Aangemaakt</th><th className="text-right">Acties</th></>}>
          {tenants.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="font-medium" style={{ color: "var(--text)" }}>{t.name}</div>
                <div className="text-xs faint font-mono">{t.slug}</div>
              </td>
              <td><EditionSelect tenantId={t.id} edition={edition(t.plan_key).key} /></td>
              <td className="tabular-nums">{t.active_members}<span className="faint"> / {t.members}</span></td>
              <td className="tabular-nums">{t.users}</td>
              <td><StatusBadge status={t.status} /></td>
              <td className="tabular-nums muted">{dateNL(t.created_at)}</td>
              <td><CustomerActions tenantId={t.id} status={t.status} /></td>
            </tr>
          ))}
        </DataTable>
      )}

      <p className="text-xs faint mt-4">
        Tip: klik <b>Open</b> om een klant te bekijken zoals de eigenaar hem ziet (je kunt daarna terug naar dit platform).
      </p>
    </>
  );
}
