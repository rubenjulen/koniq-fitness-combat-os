import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, EmptyState, FeatureLocked } from "@/components/ui";
import { money, dateNL, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  objective: string | null;
  budget: number | null;
  spend: number | null;
  leads: number | null;
  conversions: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

const CHANNEL_TONE: Record<string, "blue" | "green" | "indigo" | "amber" | "purple"> = {
  meta: "blue",
  whatsapp: "green",
  email: "indigo",
  referral: "purple",
};
const CHANNEL_LABEL: Record<string, string> = {
  meta: "Meta",
  whatsapp: "WhatsApp",
  email: "E-mail",
  referral: "Referral",
};

export default async function MarketingPage() {
  const user = await guard({ feature: "marketing", cap: "marketing.read" });
  if (!user.ok) return <FeatureLocked feature="Marketing & social" pack="pro" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;

  const [campaigns, byChannel, totals] = await Promise.all([
    query<Campaign>(
      `SELECT id, name, channel, objective, budget, spend, leads, conversions, status, start_date, end_date
       FROM campaigns WHERE tenant_id=$1 ORDER BY start_date DESC NULLS LAST, created_at DESC`,
      [t]
    ),
    query<{ channel: string; spend: number; leads: number; conversions: number; n: number }>(
      `SELECT channel,
         COALESCE(SUM(spend),0)::float AS spend,
         COALESCE(SUM(leads),0)::int AS leads,
         COALESCE(SUM(conversions),0)::int AS conversions,
         COUNT(*)::int AS n
       FROM campaigns WHERE tenant_id=$1
       GROUP BY channel ORDER BY spend DESC`,
      [t]
    ),
    query<{ spend: number; budget: number; leads: number; conversions: number }>(
      `SELECT
         COALESCE(SUM(spend),0)::float AS spend,
         COALESCE(SUM(budget),0)::float AS budget,
         COALESCE(SUM(leads),0)::int AS leads,
         COALESCE(SUM(conversions),0)::int AS conversions
       FROM campaigns WHERE tenant_id=$1`,
      [t]
    ),
  ]);

  const tot = totals[0] ?? { spend: 0, budget: 0, leads: 0, conversions: 0 };
  const cac = tot.conversions > 0 ? tot.spend / tot.conversions : 0;
  const referralConv = byChannel.find((c) => c.channel === "referral")?.conversions ?? 0;

  return (
    <>
      <PageHeader title="Marketing & ROI" subtitle="Campagnes, kosten per acquisitie en kanaalrendement" icon="megaphone" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Totale spend" value={money(tot.spend, cur)} icon="coins" tone="brand" sub={`budget ${money(tot.budget, cur)}`} />
        <StatCard label="Leads gegenereerd" value={tot.leads} icon="funnel" tone="indigo" />
        <StatCard label="Conversies" value={tot.conversions} icon="handshake" tone="green" />
        <StatCard label="Blended CAC" value={money(cac, cur)} icon="target" tone="amber" sub="spend / conversie" />
      </div>

      <Section title="Campagnes">
        {campaigns.length === 0 ? (
          <EmptyState icon="megaphone" title="Geen campagnes" subtitle="Start een campagne om acquisitie en ROI hier te volgen." />
        ) : (
          <DataTable head={<><th>Campagne</th><th>Kanaal</th><th className="text-right">Budget</th><th className="text-right">Spend</th><th className="text-right">Leads</th><th className="text-right">Conv.</th><th className="text-right">Conv.%</th><th>Status</th><th>Periode</th></>}>
            {campaigns.map((c) => {
              const convPct = (c.leads ?? 0) > 0 ? ((c.conversions ?? 0) / (c.leads ?? 1)) * 100 : 0;
              return (
                <tr key={c.id}>
                  <td>
                    <span className="font-medium">{c.name}</span>
                    {c.objective && <span className="block text-xs faint">{c.objective}</span>}
                  </td>
                  <td><Badge tone={CHANNEL_TONE[c.channel] ?? "slate"}>{CHANNEL_LABEL[c.channel] ?? c.channel}</Badge></td>
                  <td className="text-right tabular-nums">{money(c.budget ?? 0, cur)}</td>
                  <td className="text-right tabular-nums font-semibold">{money(c.spend ?? 0, cur)}</td>
                  <td className="text-right tabular-nums">{c.leads ?? 0}</td>
                  <td className="text-right tabular-nums">{c.conversions ?? 0}</td>
                  <td className="text-right tabular-nums">{pct(convPct)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="text-sm faint whitespace-nowrap">{dateNL(c.start_date)}{c.end_date ? ` – ${dateNL(c.end_date)}` : ""}</td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>

      <Section title="Kanaal-ROI">
        {byChannel.length === 0 ? (
          <Card><p className="text-sm muted">Nog geen kanaaldata.</p></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {byChannel.map((c) => {
              const chCac = c.conversions > 0 ? c.spend / c.conversions : 0;
              const chConvPct = c.leads > 0 ? (c.conversions / c.leads) * 100 : 0;
              return (
                <Card key={c.channel}>
                  <div className="flex items-center justify-between mb-3">
                    <Badge tone={CHANNEL_TONE[c.channel] ?? "slate"}>{CHANNEL_LABEL[c.channel] ?? c.channel}</Badge>
                    <span className="text-xs faint">{c.n} campagne{c.n === 1 ? "" : "s"}</span>
                  </div>
                  <p className="text-2xl font-bold">{money(c.spend, cur)}</p>
                  <p className="text-xs muted mb-3">spend</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-semibold tabular-nums">{c.leads}</p>
                      <p className="text-xs faint">leads</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold tabular-nums">{c.conversions}</p>
                      <p className="text-xs faint">conv.</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold tabular-nums">{pct(chConvPct)}</p>
                      <p className="text-xs faint">rate</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                    <span className="text-xs muted">CAC</span>
                    <span className="text-sm font-semibold">{money(chCac, cur)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Referral & attributie">
        <Card>
          <p className="text-sm muted">
            Referral-campagnes leverden <span className="font-semibold" style={{ color: "var(--text)" }}>{referralConv}</span> conversie{referralConv === 1 ? "" : "s"} op.
            Attributie is last-touch op basis van het kanaal van de campagne; UTM-parameters op leads (kolom <code>utm</code>) verfijnen de bron.
            Blended CAC ({money(cac, cur)}) telt alle betaalde kanalen; referral drukt deze doorgaans omdat de acquisitiekosten laag zijn.
          </p>
        </Card>
      </Section>
    </>
  );
}
