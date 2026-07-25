import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, Badge, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { money, titleCase } from "@/lib/format";
import { can } from "@/lib/rbac";
import { NewPackageModal } from "./NewPackageModal";

export const dynamic = "force-dynamic";

type Pkg = {
  id: string;
  name: string;
  type: string;
  billing_period: string | null;
  price: number;
  classes_per_week: number | null;
  credits: number | null;
  discipline: string | null;
  age_group: string | null;
  is_public: boolean;
  active: boolean;
  sort: number | null;
  active_members: number;
  mrr: number;
};

const TYPE_LABELS: Record<string, string> = {
  membership: "Abonnementen",
  class_pack: "Rittenkaarten",
  drop_in: "Losse lessen",
  family: "Gezinspakketten",
  youth: "Jeugd",
  private: "Privé / PT",
  competition: "Competitie",
};

const TYPE_ORDER = ["membership", "class_pack", "drop_in", "family", "youth", "private", "competition"];

export default async function PackagesPage() {
  const user = await guard({ feature: "packages", cap: "package.read" });
  if (!user.ok) return <FeatureLocked feature="Packages & memberships" pack="starter" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;
  const canWrite = can(user, "package.write");

  const [packages, totals] = await Promise.all([
    query<Pkg>(
      `SELECT p.id, p.name, p.type, p.billing_period, p.price::float AS price, p.classes_per_week,
              p.credits, p.discipline, p.age_group, p.is_public, p.active, p.sort,
              (SELECT count(*)::int FROM memberships ms
                 WHERE ms.package_id = p.id AND ms.tenant_id = $1 AND ms.status = 'active') AS active_members,
              (SELECT COALESCE(sum(ms.price), 0)::float FROM memberships ms
                 WHERE ms.package_id = p.id AND ms.tenant_id = $1 AND ms.status = 'active') AS mrr
         FROM packages p
        WHERE p.tenant_id = $1
        ORDER BY p.sort NULLS LAST, p.name`,
      [t]
    ),
    query<{ total_packages: number; active_memberships: number; avg_price: number; total_mrr: number }>(
      `SELECT (SELECT count(*)::int FROM packages WHERE tenant_id = $1 AND active) AS total_packages,
              (SELECT count(*)::int FROM memberships WHERE tenant_id = $1 AND status = 'active') AS active_memberships,
              (SELECT COALESCE(avg(price), 0)::float FROM packages WHERE tenant_id = $1 AND active) AS avg_price,
              (SELECT COALESCE(sum(price), 0)::float FROM memberships WHERE tenant_id = $1 AND status = 'active') AS total_mrr`,
      [t]
    ),
  ]);

  const kpi = totals[0] ?? { total_packages: 0, active_memberships: 0, avg_price: 0, total_mrr: 0 };

  const grouped = TYPE_ORDER
    .map((type) => ({ type, items: packages.filter((p) => p.type === type) }))
    .filter((g) => g.items.length > 0);

  // ranked for MRR table
  const ranked = [...packages].sort((a, b) => b.mrr - a.mrr);

  return (
    <>
      <PageHeader title="Pakketten & lidmaatschappen" subtitle="Abonnementen, rittenkaarten en prijsstelling" icon="tag" actions={canWrite ? <NewPackageModal /> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Actieve pakketten" value={kpi.total_packages} icon="tag" tone="brand" />
        <StatCard label="Actieve lidmaatschappen" value={kpi.active_memberships} icon="users" tone="green" />
        <StatCard label="Gemiddelde prijs" value={money(kpi.avg_price, cur)} icon="coins" tone="indigo" />
        <StatCard label="Terugkerende omzet" value={money(kpi.total_mrr, cur)} icon="chart" tone="purple" sub="uit actieve leden" />
      </div>

      {packages.length === 0 ? (
        <EmptyState icon="tag" title="Nog geen pakketten" subtitle="Maak abonnementen, rittenkaarten of privépakketten aan." />
      ) : (
        <>
          {grouped.map((g) => (
            <Section key={g.type} title={TYPE_LABELS[g.type] ?? titleCase(g.type)}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {g.items.map((p) => (
                  <Card key={p.id} className={p.active ? "" : "opacity-60"}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate" style={{ color: "var(--text)" }}>{p.name}</p>
                        <p className="text-xs faint">
                          {[p.discipline && titleCase(p.discipline), p.age_group && titleCase(p.age_group)].filter(Boolean).join(" · ") || TYPE_LABELS[p.type] || titleCase(p.type)}
                        </p>
                      </div>
                      {p.is_public ? <Badge tone="green">publiek</Badge> : <Badge tone="slate">intern</Badge>}
                    </div>
                    <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                      {money(p.price, cur)}
                      {p.billing_period && p.billing_period !== "one_off" && (
                        <span className="text-sm faint font-normal"> / {p.billing_period === "month" ? "maand" : p.billing_period === "quarter" ? "kwartaal" : "jaar"}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      {p.classes_per_week != null && p.classes_per_week > 0 && (
                        <span className="inline-flex items-center gap-1 muted"><Icon name="calendar" size={13} />{p.classes_per_week}× / week</span>
                      )}
                      {p.credits != null && p.credits > 0 && (
                        <span className="inline-flex items-center gap-1 muted"><Icon name="layers" size={13} />{p.credits} credits</span>
                      )}
                      {!p.active && <Badge tone="red">inactief</Badge>}
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                      <span className="text-xs faint">Actieve leden</span>
                      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{p.active_members}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          ))}

          <Section title="Omzetbijdrage per pakket">
            <DataTable
              head={
                <>
                  <th>Pakket</th>
                  <th>Type</th>
                  <th className="text-right">Prijs</th>
                  <th className="text-right">Actieve leden</th>
                  <th className="text-right">Omzetbijdrage</th>
                </>
              }
            >
              {ranked.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium" style={{ color: "var(--text)" }}>{p.name}</td>
                  <td className="muted">{TYPE_LABELS[p.type] ?? titleCase(p.type)}</td>
                  <td className="text-right tabular-nums">{money(p.price, cur)}</td>
                  <td className="text-right tabular-nums">{p.active_members}</td>
                  <td className="text-right tabular-nums font-semibold" style={{ color: "var(--text)" }}>{money(p.mrr, cur)}</td>
                </tr>
              ))}
              <tr>
                <td className="font-semibold" style={{ color: "var(--text)" }}>Totaal</td>
                <td />
                <td />
                <td className="text-right tabular-nums font-semibold">{kpi.active_memberships}</td>
                <td className="text-right tabular-nums font-bold" style={{ color: "var(--text)" }}>{money(kpi.total_mrr, cur)}</td>
              </tr>
            </DataTable>
          </Section>
        </>
      )}
    </>
  );
}
