import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { timeAgo, titleCase, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

type Lead = {
  id: string;
  name: string;
  source: string | null;
  discipline: string | null;
  status: string;
  lost_reason: string | null;
  created_at: string;
};

const STATUSES = ["new", "contacted", "trial_booked", "trial_attended", "offer", "won", "lost"] as const;
const STATUS_LABEL: Record<string, string> = {
  new: "Nieuw",
  contacted: "Gecontacteerd",
  trial_booked: "Trial geboekt",
  trial_attended: "Trial gevolgd",
  offer: "Aanbod",
  won: "Gewonnen",
  lost: "Verloren",
};

export default async function LeadsPage() {
  const user = await guard({ feature: "crm", cap: "lead.read" });
  if (!user.ok) return <FeatureLocked feature="CRM & leads" pack="starter" />;
  const t = user.tenantId;

  const [leads, lostReasons, sources, kpi] = await Promise.all([
    query<Lead>(
      `SELECT id, name, source, discipline, status, lost_reason, created_at
       FROM leads WHERE tenant_id=$1 ORDER BY created_at DESC`,
      [t]
    ),
    query<{ lost_reason: string | null; n: number }>(
      `SELECT lost_reason, COUNT(*)::int AS n FROM leads
       WHERE tenant_id=$1 AND status='lost'
       GROUP BY lost_reason ORDER BY n DESC`,
      [t]
    ),
    query<{ source: string | null; n: number }>(
      `SELECT source, COUNT(*)::int AS n FROM leads
       WHERE tenant_id=$1 GROUP BY source ORDER BY n DESC`,
      [t]
    ),
    query<{
      open_leads: number;
      trials_week: number;
      won: number;
      non_open: number;
      lost_month: number;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('new','contacted','trial_booked','trial_attended','offer'))::int AS open_leads,
         COUNT(*) FILTER (WHERE status='trial_booked' AND created_at >= date_trunc('week', now()))::int AS trials_week,
         COUNT(*) FILTER (WHERE status='won')::int AS won,
         COUNT(*) FILTER (WHERE status IN ('won','lost'))::int AS non_open,
         COUNT(*) FILTER (WHERE status='lost' AND created_at >= date_trunc('month', now()))::int AS lost_month
       FROM leads WHERE tenant_id=$1`,
      [t]
    ),
  ]);

  const k = kpi[0] ?? { open_leads: 0, trials_week: 0, won: 0, non_open: 0, lost_month: 0 };
  const conversion = k.non_open > 0 ? (k.won / k.non_open) * 100 : 0;

  const byStatus: Record<string, Lead[]> = {};
  for (const s of STATUSES) byStatus[s] = [];
  for (const l of leads) (byStatus[l.status] ??= []).push(l);

  const cardTone: Record<string, string> = {
    new: "#6366f1",
    contacted: "#3b82f6",
    trial_booked: "#f59e0b",
    trial_attended: "#a855f7",
    offer: "#f59e0b",
    won: "#10b981",
    lost: "#ef4444",
  };

  return (
    <>
      <PageHeader title="Leads & pipeline" subtitle="Van eerste contact tot ingeschreven lid" icon="funnel" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open leads" value={k.open_leads} icon="funnel" tone="indigo" sub="in pipeline" />
        <StatCard label="Trials deze week" value={k.trials_week} icon="calendar" tone="amber" sub="geboekt" />
        <StatCard label="Conversie" value={pct(conversion)} icon="target" tone="green" sub={`${k.won} van ${k.non_open} afgerond`} />
        <StatCard label="Verloren deze maand" value={k.lost_month} icon="arrowDown" tone="red" />
      </div>

      <Section title="Pipeline">
        {leads.length === 0 ? (
          <EmptyState icon="funnel" title="Nog geen leads" subtitle="Zodra er leads binnenkomen, verschijnen ze hier in de pipeline." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {STATUSES.map((s) => {
              const col = byStatus[s] ?? [];
              return (
                <div key={s} className="card p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cardTone[s] }} />
                      <span className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>{STATUS_LABEL[s]}</span>
                    </div>
                    <span className="text-xs font-bold faint tabular-nums">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.length === 0 ? (
                      <p className="text-xs faint py-2">Leeg</p>
                    ) : (
                      col.map((l) => (
                        <div key={l.id} className="rounded-lg p-2.5" style={{ background: "var(--bg-subtle)" }}>
                          <div className="flex items-center gap-2">
                            <Avatar name={l.name} size={26} />
                            <p className="text-sm font-medium truncate flex-1 min-w-0">{l.name}</p>
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {l.source && <Badge tone="slate">{titleCase(l.source)}</Badge>}
                            {l.discipline && <span className="text-xs faint capitalize">{l.discipline.replace(/_/g, " ")}</span>}
                          </div>
                          <p className="text-xs faint mt-1">{timeAgo(l.created_at)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Lost redenen">
          {lostReasons.length === 0 ? (
            <Card><p className="text-sm muted">Geen verloren leads.</p></Card>
          ) : (
            <DataTable head={<><th>Reden</th><th className="text-right">Aantal</th></>}>
              {lostReasons.map((r, i) => (
                <tr key={i}>
                  <td>{r.lost_reason ? titleCase(r.lost_reason) : <span className="faint">Onbekend</span>}</td>
                  <td className="text-right font-semibold tabular-nums">{r.n}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>

        <Section title="Bronnen">
          {sources.length === 0 ? (
            <Card><p className="text-sm muted">Geen bronnen.</p></Card>
          ) : (
            <DataTable head={<><th>Bron</th><th className="text-right">Leads</th></>}>
              {sources.map((r, i) => (
                <tr key={i}>
                  <td>{r.source ? titleCase(r.source) : <span className="faint">Onbekend</span>}</td>
                  <td className="text-right font-semibold tabular-nums">{r.n}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>
      </div>

      <Section title="Alle leads">
        {leads.length === 0 ? (
          <EmptyState icon="funnel" title="Geen leads" />
        ) : (
          <DataTable head={<><th>Lead</th><th>Bron</th><th>Discipline</th><th>Status</th><th className="text-right">Aangemaakt</th></>}>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={l.name} size={30} />
                    <span className="font-medium">{l.name}</span>
                  </div>
                </td>
                <td>{l.source ? <Badge tone="slate">{titleCase(l.source)}</Badge> : <span className="faint">—</span>}</td>
                <td className="capitalize">{l.discipline?.replace(/_/g, " ") ?? "—"}</td>
                <td><StatusBadge status={l.status} /></td>
                <td className="text-right faint text-sm">{timeAgo(l.created_at)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
