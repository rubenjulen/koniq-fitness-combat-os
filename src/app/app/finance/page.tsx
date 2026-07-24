import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, InfoRow, Sparkline, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { money, dateNL, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

type Kpi = {
  omzet_month: number;
  omzet_ytd: number;
  outstanding: number;
  outstanding_count: number;
};

type CatRow = { category: string; cnt: number; total: number };
type AgingRow = { bucket: string; cnt: number; total: number };
type MethodRow = { method: string; cnt: number; total: number };
type TrendRow = { ym: string; total: number };
type CoachRow = {
  id: string;
  name: string;
  role: string;
  employment: string | null;
  comp_type: string | null;
  comp_rate: number | null;
};

const CAT_LABELS: Record<string, string> = {
  membership: "Lidmaatschap",
  private: "Privéles / PT",
  event: "Evenementen",
  retail: "Winkel / retail",
  competition: "Wedstrijd",
  other: "Overig",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Contant",
  bank_transfer: "Bankoverschrijving",
  wallet: "Wallet",
  card: "Kaart / pin",
  online: "Online",
};

export default async function FinancePage() {
  const user = await guard({ feature: "finance", cap: "finance.read" });
  if (!user.ok) return <FeatureLocked feature="Financiën" pack="pro" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;

  const [kpiRows, catRows, agingRows, methodRows, trendRows, coachRows, coachCost] = await Promise.all([
    query<Kpi>(
      `SELECT
         COALESCE((SELECT sum(amount)::float FROM invoices
             WHERE tenant_id=$1 AND status='paid'
               AND date_trunc('month', issued_at) = date_trunc('month', CURRENT_DATE)), 0) AS omzet_month,
         COALESCE((SELECT sum(amount)::float FROM invoices
             WHERE tenant_id=$1 AND status='paid'
               AND date_part('year', issued_at) = date_part('year', CURRENT_DATE)), 0) AS omzet_ytd,
         COALESCE((SELECT sum(amount)::float FROM invoices
             WHERE tenant_id=$1 AND status IN ('due','overdue','partial')), 0) AS outstanding,
         COALESCE((SELECT count(*)::int FROM invoices
             WHERE tenant_id=$1 AND status IN ('due','overdue','partial')), 0) AS outstanding_count`,
      [t]
    ),
    query<CatRow>(
      `SELECT category, count(*)::int AS cnt, sum(amount)::float AS total
         FROM invoices
        WHERE tenant_id=$1 AND status='paid'
        GROUP BY category
        ORDER BY total DESC`,
      [t]
    ),
    query<AgingRow>(
      `SELECT CASE
                WHEN CURRENT_DATE - due_date <= 30 THEN '0-30'
                WHEN CURRENT_DATE - due_date <= 60 THEN '30-60'
                ELSE '60+'
              END AS bucket,
              count(*)::int AS cnt, sum(amount)::float AS total
         FROM invoices
        WHERE tenant_id=$1 AND status='overdue'
        GROUP BY bucket`,
      [t]
    ),
    query<MethodRow>(
      `SELECT method, count(*)::int AS cnt, sum(amount)::float AS total
         FROM payments
        WHERE tenant_id=$1 AND status='confirmed'
        GROUP BY method
        ORDER BY total DESC`,
      [t]
    ),
    query<TrendRow>(
      `SELECT to_char(received_at,'YYYY-MM') AS ym, sum(amount)::float AS total
         FROM payments
        WHERE tenant_id=$1 AND status='confirmed'
          AND received_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY ym
        ORDER BY ym`,
      [t]
    ),
    query<CoachRow>(
      `SELECT id, name, role, employment, comp_type, comp_rate::float AS comp_rate
         FROM coaches
        WHERE tenant_id=$1 AND active
        ORDER BY (comp_type='fixed') DESC, comp_rate DESC NULLS LAST`,
      [t]
    ),
    query<{ total: number }>(
      `SELECT COALESCE(sum(comp_rate),0)::float AS total
         FROM coaches
        WHERE tenant_id=$1 AND active AND comp_type='fixed'`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { omzet_month: 0, omzet_ytd: 0, outstanding: 0, outstanding_count: 0 };
  const coachFixed = coachCost[0]?.total ?? 0;

  const catMax = Math.max(1, ...catRows.map((c) => c.total));
  const buckets = ["0-30", "30-60", "60+"].map((b) => agingRows.find((r) => r.bucket === b) ?? { bucket: b, cnt: 0, total: 0 });
  const agingTotal = buckets.reduce((s, b) => s + b.total, 0);
  const cashRow = methodRows.find((m) => m.method === "cash");

  // Build a 6-month trend series aligned to the last 6 months.
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const trendMap = new Map(trendRows.map((r) => [r.ym, r.total]));
  const trendSeries = months.map((m) => trendMap.get(m) ?? 0);

  return (
    <>
      <PageHeader title="Financiën" subtitle="Management accounting — omzet, debiteuren en kasstroom" icon="coins" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Omzet deze maand" value={money(k.omzet_month, cur)} icon="coins" tone="green" />
        <StatCard label="Omzet YTD" value={money(k.omzet_ytd, cur)} icon="chart" tone="brand" sub={`Boekjaar ${new Date().getFullYear()}`} />
        <StatCard
          label="Openstaand"
          value={money(k.outstanding, cur)}
          icon="alert"
          tone={k.outstanding > 0 ? "amber" : "slate"}
          sub={`${k.outstanding_count} factu${k.outstanding_count === 1 ? "ur" : "ren"}`}
        />
        <StatCard label="Coach-kosten (vast/mnd)" value={money(coachFixed, cur)} icon="whistle" tone="indigo" sub="benadering vaste vergoeding" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Section title="Omzet per categorie">
          {catRows.length === 0 ? (
            <EmptyState icon="coins" title="Nog geen betaalde facturen" subtitle="Zodra facturen betaald zijn verschijnt hier de omzetverdeling." />
          ) : (
            <Card>
              <div className="space-y-3">
                {catRows.map((c) => (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span style={{ color: "var(--text)" }}>{CAT_LABELS[c.category] ?? titleCase(c.category)}</span>
                      <span className="tabular-nums font-medium">
                        {money(c.total, cur)} <span className="faint">· {c.cnt}</span>
                      </span>
                    </div>
                    <div className="bar">
                      <span style={{ width: `${Math.round((c.total / catMax) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>

        <Section title="Debiteurenveroudering (achterstallig)">
          <Card>
            <DataTable
              head={
                <>
                  <th>Bucket</th>
                  <th className="text-right">Facturen</th>
                  <th className="text-right">Bedrag</th>
                  <th className="text-right">Aandeel</th>
                </>
              }
            >
              {buckets.map((b) => {
                const tone = b.bucket === "0-30" ? "amber" : "red";
                return (
                  <tr key={b.bucket}>
                    <td>
                      <Badge tone={tone as "amber" | "red"}>{b.bucket} dagen</Badge>
                    </td>
                    <td className="text-right tabular-nums">{b.cnt}</td>
                    <td className="text-right tabular-nums font-medium">{money(b.total, cur)}</td>
                    <td className="text-right tabular-nums muted">{agingTotal > 0 ? Math.round((b.total / agingTotal) * 100) : 0}%</td>
                  </tr>
                );
              })}
              <tr>
                <td className="font-semibold">Totaal</td>
                <td className="text-right tabular-nums font-semibold">{buckets.reduce((s, b) => s + b.cnt, 0)}</td>
                <td className="text-right tabular-nums font-semibold">{money(agingTotal, cur)}</td>
                <td className="text-right muted">100%</td>
              </tr>
            </DataTable>
          </Card>
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Section title="Kasstroom-afstemming (per methode)">
          {methodRows.length === 0 ? (
            <EmptyState icon="coins" title="Nog geen betalingen" />
          ) : (
            <Card>
              <DataTable
                head={
                  <>
                    <th>Methode</th>
                    <th className="text-right">Aantal</th>
                    <th className="text-right">Bedrag</th>
                    <th></th>
                  </>
                }
              >
                {methodRows.map((m) => (
                  <tr key={m.method}>
                    <td>{METHOD_LABELS[m.method] ?? titleCase(m.method)}</td>
                    <td className="text-right tabular-nums">{m.cnt}</td>
                    <td className="text-right tabular-nums font-medium">{money(m.total, cur)}</td>
                    <td className="text-right">{m.method === "cash" && <Badge tone="amber">kas-telling</Badge>}</td>
                  </tr>
                ))}
              </DataTable>
              {cashRow && (
                <div className="flex items-center gap-2 mt-3 text-xs faint">
                  <Icon name="alert" size={14} />
                  Contant ontvangen ({money(cashRow.total, cur)}) vereist afstemming bij shift-afsluiting.
                </div>
              )}
            </Card>
          )}
        </Section>

        <Section title="Omzettrend (6 maanden)">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs faint uppercase tracking-wide">Ontvangen betalingen</div>
                <div className="text-lg font-semibold tabular-nums">{money(trendSeries.reduce((s, n) => s + n, 0), cur)}</div>
              </div>
              <Sparkline points={trendSeries} width={160} height={40} />
            </div>
            <DataTable
              head={
                <>
                  <th>Maand</th>
                  <th className="text-right">Ontvangen</th>
                </>
              }
            >
              {months.map((m, i) => (
                <tr key={m}>
                  <td className="tabular-nums">{m}</td>
                  <td className="text-right tabular-nums font-medium">{money(trendSeries[i], cur)}</td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </Section>
      </div>

      <Section title="Coach-uitbetaling (voorbeeld)">
        {coachRows.length === 0 ? (
          <EmptyState icon="whistle" title="Geen actieve coaches" />
        ) : (
          <DataTable
            head={
              <>
                <th>Coach</th>
                <th>Rol</th>
                <th>Dienstverband</th>
                <th>Vergoeding</th>
                <th className="text-right">Tarief</th>
              </>
            }
          >
            {coachRows.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size={32} />
                    <span className="font-medium" style={{ color: "var(--text)" }}>{c.name}</span>
                  </div>
                </td>
                <td className="muted">{titleCase(c.role)}</td>
                <td className="muted">{c.employment ? titleCase(c.employment) : "—"}</td>
                <td>{c.comp_type ? <Badge tone="slate">{titleCase(c.comp_type)}</Badge> : <span className="faint">—</span>}</td>
                <td className="text-right tabular-nums font-medium">
                  {c.comp_rate != null ? money(c.comp_rate, cur) : "—"}
                  {c.comp_type === "per_class" && <span className="faint text-xs"> /les</span>}
                  {c.comp_type === "pt_split" && <span className="faint text-xs"> split</span>}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <div className="mt-6">
        <Card>
          <InfoRow label="Grondslag">
            <span className="muted text-sm">
              Omzet o.b.v. betaalde facturen (kasstelsel); coach-kosten benaderd als vaste maandvergoeding. Wedstrijd-, PT-split- en per-les-vergoedingen variëren met activiteit.
            </span>
          </InfoRow>
        </Card>
      </div>
    </>
  );
}
