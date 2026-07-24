import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, Badge, EmptyState, FeatureLocked } from "@/components/ui";
import { dateNL, titleCase } from "@/lib/format";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

type DocRow = {
  id: string;
  category: string;
  name: string;
  version: number | null;
  signed_at: string | null;
  expires_at: string | null;
  created_at: string;
  m_first: string | null;
  m_last: string | null;
  coach_name: string | null;
  event_name: string | null;
  f_first: string | null;
  f_last: string | null;
};

const CAT_TONE: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  waiver: "amber",
  contract: "indigo",
  medical: "red",
  certificate: "green",
  id: "blue",
  consent: "purple",
};

function linkedEntity(d: DocRow): { label: string; kind: string } {
  const m = [d.m_first, d.m_last].filter(Boolean).join(" ");
  if (m) return { label: m, kind: "Lid" };
  if (d.coach_name) return { label: d.coach_name, kind: "Coach" };
  if (d.event_name) return { label: d.event_name, kind: "Event" };
  const f = [d.f_first, d.f_last].filter(Boolean).join(" ");
  if (f) return { label: f, kind: "Vechter" };
  return { label: "—", kind: "" };
}

export default async function DocumentsPage() {
  const user = await guard({ feature: "documents", cap: "document.read" });
  if (!user.ok) return <FeatureLocked feature="Documenten" pack="starter" />;
  const t = user.tenantId;

  const [docs, byCategory, kpiRows] = await Promise.all([
    query<DocRow>(
      `SELECT d.id, d.category, d.name, d.version, d.signed_at, d.expires_at, d.created_at,
              m.first_name AS m_first, m.last_name AS m_last,
              c.name AS coach_name,
              e.name AS event_name,
              fm.first_name AS f_first, fm.last_name AS f_last
         FROM documents d
         LEFT JOIN members m ON m.id = d.member_id AND m.tenant_id = $1
         LEFT JOIN coaches c ON c.id = d.coach_id AND c.tenant_id = $1
         LEFT JOIN events e ON e.id = d.event_id AND e.tenant_id = $1
         LEFT JOIN fighters f ON f.id = d.fighter_id AND f.tenant_id = $1
         LEFT JOIN members fm ON fm.id = f.member_id AND fm.tenant_id = $1
        WHERE d.tenant_id = $1
        ORDER BY d.created_at DESC`,
      [t]
    ),
    query<{ category: string; n: number }>(
      `SELECT category, count(*)::int AS n FROM documents WHERE tenant_id = $1 GROUP BY category ORDER BY n DESC`,
      [t]
    ),
    query<{ total: number; signed: number; expired: number; expiring: number }>(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE signed_at IS NOT NULL)::int AS signed,
         count(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < CURRENT_DATE)::int AS expired,
         count(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at >= CURRENT_DATE
                            AND expires_at < CURRENT_DATE + INTERVAL '30 days')::int AS expiring
         FROM documents WHERE tenant_id = $1`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { total: 0, signed: 0, expired: 0, expiring: 0 };
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <>
      <PageHeader title="Documenten" subtitle="Waivers, contracten, medische verklaringen en certificaten" icon="file" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Totaal documenten" value={k.total} icon="file" tone="brand" />
        <StatCard label="Getekend" value={k.signed} icon="check" tone="green" />
        <StatCard label="Verlopen" value={k.expired} icon="alert" tone={k.expired > 0 ? "red" : "slate"} />
        <StatCard label="Verloopt binnenkort" value={k.expiring} icon="clock" tone={k.expiring > 0 ? "amber" : "slate"} sub="binnen 30 dagen" />
      </div>

      {byCategory.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {byCategory.map((row) => (
            <Badge key={row.category} tone={CAT_TONE[row.category] ?? "slate"}>{titleCase(row.category)} {row.n}</Badge>
          ))}
        </div>
      )}

      <Section title="Alle documenten">
        {docs.length === 0 ? (
          <EmptyState icon="file" title="Geen documenten" subtitle="Upload waivers, contracten en verklaringen om ze centraal te beheren." />
        ) : (
          <DataTable
            head={
              <>
                <th>Document</th>
                <th>Categorie</th>
                <th>Gekoppeld aan</th>
                <th>Versie</th>
                <th>Getekend</th>
                <th className="text-right">Vervalt</th>
              </>
            }
          >
            {docs.map((d) => {
              const ent = linkedEntity(d);
              const expired = !!d.expires_at && new Date(d.expires_at) < today;
              return (
                <tr key={d.id}>
                  <td className="font-medium">{d.name}</td>
                  <td><Badge tone={CAT_TONE[d.category] ?? "slate"}>{titleCase(d.category)}</Badge></td>
                  <td className="text-sm">
                    {ent.kind ? (
                      <span>{ent.label} <span className="text-xs faint">({ent.kind})</span></span>
                    ) : <span className="faint">—</span>}
                  </td>
                  <td className="tabular-nums muted">v{d.version ?? 1}</td>
                  <td>{d.signed_at ? <Badge tone="green">getekend</Badge> : <Badge tone="slate">niet getekend</Badge>}</td>
                  <td className="text-right text-sm" style={{ color: expired ? "#dc2626" : "var(--text-muted)" }}>
                    {d.expires_at ? dateNL(d.expires_at) : <span className="faint">n.v.t.</span>}
                    {expired && <span className="text-xs"> · verlopen</span>}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>

      <Card>
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
            <Icon name="lock" size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Beveiligde toegang</p>
            <p className="text-sm muted mt-0.5">
              Gevoelige documenten (medische verklaringen, ID&apos;s, contracten) worden geopend via kortlevende signed URLs.
              Elke weergave en download wordt vastgelegd in de audit-log, zodat inzage herleidbaar blijft.
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}
