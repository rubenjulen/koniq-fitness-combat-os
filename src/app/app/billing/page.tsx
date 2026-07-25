import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, Progress, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { money, dateNL, fullName, titleCase, pct } from "@/lib/format";
import { can } from "@/lib/rbac";
import { RecordPaymentModal } from "./RecordPaymentModal";
import Link from "next/link";

export const dynamic = "force-dynamic";

type OpenInvoice = {
  id: string;
  number: string | null;
  amount: number;
  status: string;
  due_date: string | null;
  category: string;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type RecentPayment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  received_at: string | null;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type Kpi = { outstanding: number; overdue_count: number; paid_total: number; paid_month: number };
type Aging = { b0: number; s0: number; b1: number; s1: number; b2: number; s2: number };
type MethodRow = { method: string; cnt: number; total: number };

export default async function BillingPage() {
  const user = await guard({ feature: "billing", cap: "billing.read" });
  if (!user.ok) return <FeatureLocked feature="Betalingen & facturatie" pack="starter" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;
  const canWrite = can(user, "billing.write");

  const [kpiRows, openInvoices, payments, agingRows, methods] = await Promise.all([
    query<Kpi>(
      `SELECT
         COALESCE(sum(i.amount) FILTER (WHERE i.status IN ('due','overdue','partial')), 0)::float AS outstanding,
         count(*) FILTER (WHERE i.status = 'overdue')::int AS overdue_count,
         COALESCE(sum(i.amount) FILTER (WHERE i.status = 'paid'), 0)::float AS paid_total,
         (SELECT COALESCE(sum(p.amount), 0)::float FROM payments p
            WHERE p.tenant_id = $1 AND p.status = 'confirmed'
              AND p.received_at >= date_trunc('month', CURRENT_DATE)) AS paid_month
       FROM invoices i WHERE i.tenant_id = $1`,
      [t]
    ),
    query<OpenInvoice>(
      `SELECT i.id, i.number, i.amount::float AS amount, i.status, i.due_date, i.category,
              m.id AS member_id, m.first_name, m.last_name, m.photo_url
         FROM invoices i
         LEFT JOIN members m ON m.id = i.member_id AND m.tenant_id = $1
        WHERE i.tenant_id = $1 AND i.status IN ('due','overdue','partial')
        ORDER BY i.due_date ASC NULLS LAST
        LIMIT 40`,
      [t]
    ),
    query<RecentPayment>(
      `SELECT p.id, p.amount::float AS amount, p.method, p.status, p.reference, p.received_at,
              m.id AS member_id, m.first_name, m.last_name, m.photo_url
         FROM payments p
         LEFT JOIN members m ON m.id = p.member_id AND m.tenant_id = $1
        WHERE p.tenant_id = $1
        ORDER BY p.received_at DESC NULLS LAST
        LIMIT 15`,
      [t]
    ),
    query<Aging>(
      `SELECT
         count(*) FILTER (WHERE (CURRENT_DATE - due_date) <= 30)::int AS b0,
         COALESCE(sum(amount) FILTER (WHERE (CURRENT_DATE - due_date) <= 30), 0)::float AS s0,
         count(*) FILTER (WHERE (CURRENT_DATE - due_date) > 30 AND (CURRENT_DATE - due_date) <= 60)::int AS b1,
         COALESCE(sum(amount) FILTER (WHERE (CURRENT_DATE - due_date) > 30 AND (CURRENT_DATE - due_date) <= 60), 0)::float AS s1,
         count(*) FILTER (WHERE (CURRENT_DATE - due_date) > 60)::int AS b2,
         COALESCE(sum(amount) FILTER (WHERE (CURRENT_DATE - due_date) > 60), 0)::float AS s2
       FROM invoices
       WHERE tenant_id = $1 AND status IN ('due','overdue','partial') AND due_date IS NOT NULL`,
      [t]
    ),
    query<MethodRow>(
      `SELECT method, count(*)::int AS cnt, COALESCE(sum(amount), 0)::float AS total
         FROM payments WHERE tenant_id = $1 AND status = 'confirmed'
        GROUP BY method ORDER BY total DESC`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { outstanding: 0, overdue_count: 0, paid_total: 0, paid_month: 0 };
  const aging = agingRows[0] ?? { b0: 0, s0: 0, b1: 0, s1: 0, b2: 0, s2: 0 };
  const collectionRate = k.paid_total + k.outstanding > 0 ? (k.paid_total / (k.paid_total + k.outstanding)) * 100 : 0;
  const methodTotal = methods.reduce((s, m) => s + m.total, 0);

  const buckets = [
    { label: "0–30 dagen", count: aging.b0, sum: aging.s0, tone: "amber" as const },
    { label: "30–60 dagen", count: aging.b1, sum: aging.s1, tone: "red" as const },
    { label: "60+ dagen", count: aging.b2, sum: aging.s2, tone: "red" as const },
  ];

  const METHOD_TONE: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
    cash: "green", bank_transfer: "blue", wallet: "indigo", card: "purple", online: "amber",
  };

  return (
    <>
      <PageHeader title="Facturatie & betalingen" subtitle="Openstaande posten, incasso en betaalstromen" icon="coins" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Openstaand totaal" value={money(k.outstanding, cur)} icon="alert" tone={k.outstanding > 0 ? "amber" : "slate"} sub={`${openInvoices.length} facturen`} />
        <StatCard label="Betaald deze maand" value={money(k.paid_month, cur)} icon="coins" tone="green" />
        <StatCard label="Achterstallig" value={k.overdue_count} icon="clock" tone={k.overdue_count > 0 ? "red" : "slate"} sub="facturen te laat" />
        <StatCard label="Incassoratio" value={pct(collectionRate)} icon="chart" tone="brand" sub="betaald / gefactureerd" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <h3 className="font-semibold mb-3">Ouderdomsanalyse openstaand</h3>
          <div className="space-y-3">
            {buckets.map((b) => {
              const share = k.outstanding > 0 ? (b.sum / k.outstanding) * 100 : 0;
              return (
                <div key={b.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="muted">{b.label} <span className="faint">({b.count})</span></span>
                    <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>{money(b.sum, cur)}</span>
                  </div>
                  <Progress value={share} tone={b.tone} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Betaalmethoden</h3>
          {methods.length === 0 ? (
            <p className="text-sm muted">Nog geen bevestigde betalingen.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {methods.map((m) => {
                const share = methodTotal > 0 ? (m.total / methodTotal) * 100 : 0;
                return (
                  <div key={m.method}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="inline-flex items-center gap-2">
                        <Badge tone={METHOD_TONE[m.method] ?? "slate"}>{titleCase(m.method)}</Badge>
                        <span className="faint text-xs">{m.cnt}×</span>
                      </span>
                      <span className="font-semibold tabular-nums" style={{ color: "var(--text)" }}>{money(m.total, cur)}</span>
                    </div>
                    <Progress value={share} tone="brand" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Section title="Openstaande facturen">
        {openInvoices.length === 0 ? (
          <EmptyState icon="check" title="Alles betaald" subtitle="Er staan geen facturen open. 💪" />
        ) : (
          <DataTable
            head={
              <>
                <th>Lid</th>
                <th>Factuur</th>
                <th>Categorie</th>
                <th>Vervaldatum</th>
                <th>Status</th>
                <th className="text-right">Bedrag</th>
                {canWrite && <th className="text-right">Actie</th>}
              </>
            }
          >
            {openInvoices.map((inv) => {
              const overdue = inv.due_date != null && new Date(inv.due_date) < new Date();
              return (
                <tr key={inv.id}>
                  <td>
                    {inv.member_id ? (
                      <Link href={`/app/members/${inv.member_id}`} className="flex items-center gap-3 group">
                        <Avatar name={fullName(inv)} url={inv.photo_url} size={30} />
                        <span className="font-medium group-hover:underline truncate" style={{ color: "var(--text)" }}>{fullName(inv)}</span>
                      </Link>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="tabular-nums muted">{inv.number ?? "—"}</td>
                  <td className="muted">{titleCase(inv.category)}</td>
                  <td className="tabular-nums" style={{ color: overdue ? "#dc2626" : "var(--text-muted)" }}>{dateNL(inv.due_date)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className="text-right tabular-nums font-semibold" style={{ color: "var(--text)" }}>{money(inv.amount, cur)}</td>
                  {canWrite && (
                    <td className="text-right">
                      <div className="flex justify-end">
                        <RecordPaymentModal invoiceId={inv.id} amount={inv.amount} memberName={fullName(inv)} />
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>

      <Section title="Recente betalingen">
        {payments.length === 0 ? (
          <EmptyState icon="coins" title="Nog geen betalingen" />
        ) : (
          <DataTable
            head={
              <>
                <th>Lid</th>
                <th>Methode</th>
                <th>Referentie</th>
                <th>Ontvangen</th>
                <th>Status</th>
                <th className="text-right">Bedrag</th>
              </>
            }
          >
            {payments.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.member_id ? (
                    <Link href={`/app/members/${p.member_id}`} className="flex items-center gap-3 group">
                      <Avatar name={fullName(p)} url={p.photo_url} size={30} />
                      <span className="font-medium group-hover:underline truncate" style={{ color: "var(--text)" }}>{fullName(p)}</span>
                    </Link>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td><Badge tone={METHOD_TONE[p.method] ?? "slate"}>{titleCase(p.method)}</Badge></td>
                <td className="muted truncate">{p.reference ?? "—"}</td>
                <td className="tabular-nums muted">{dateNL(p.received_at)}</td>
                <td><StatusBadge status={p.status} /></td>
                <td className="text-right tabular-nums font-semibold" style={{ color: "var(--text)" }}>{money(p.amount, cur)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
