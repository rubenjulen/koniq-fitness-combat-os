import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, RiskBadge, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { dateNL, timeAgo, fullName, titleCase } from "@/lib/format";
import { Icon } from "@/components/icons";
import { can } from "@/lib/rbac";
import { LogIncidentModal } from "./LogIncidentModal";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ScreeningRow = {
  id: string;
  risk_flag: string;
  cleared_at: string | null;
  note: string | null;
  created_at: string;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type FlagRow = {
  id: string;
  type: string;
  description: string | null;
  restriction: string | null;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type IncidentRow = {
  id: string;
  type: string | null;
  severity: string | null;
  description: string | null;
  status: string;
  occurred_at: string | null;
};

const SEVERITY_TONE: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  low: "slate",
  medium: "amber",
  high: "red",
};

export default async function HealthPage() {
  const user = await guard({ feature: "health_safety", cap: "health.read" });
  if (!user.ok) return <FeatureLocked feature="Gezondheid & veiligheid" pack="starter" />;
  const t = user.tenantId;
  const canWrite = can(user, "health.write");

  const [screenings, flags, incidents, kpiRows, locations, members] = await Promise.all([
    query<ScreeningRow>(
      `SELECT hs.id, hs.risk_flag, hs.cleared_at, hs.note, hs.created_at,
              m.id AS member_id, m.first_name, m.last_name, m.photo_url
         FROM health_screenings hs
         LEFT JOIN members m ON m.id = hs.member_id AND m.tenant_id = $1
        WHERE hs.tenant_id = $1
        ORDER BY (hs.risk_flag = 'red') DESC, hs.created_at DESC LIMIT 25`,
      [t]
    ),
    query<FlagRow>(
      `SELECT mf.id, mf.type, mf.description, mf.restriction,
              m.id AS member_id, m.first_name, m.last_name, m.photo_url
         FROM medical_flags mf
         LEFT JOIN members m ON m.id = mf.member_id AND m.tenant_id = $1
        WHERE mf.tenant_id = $1 AND mf.active
        ORDER BY mf.created_at DESC`,
      [t]
    ),
    query<IncidentRow>(
      `SELECT id, type, severity, description, status, occurred_at
         FROM incidents WHERE tenant_id = $1
        ORDER BY (status <> 'resolved') DESC, occurred_at DESC NULLS LAST LIMIT 25`,
      [t]
    ),
    query<{ screenings: number; red_flags: number; medical: number; open_incidents: number }>(
      `SELECT
         (SELECT count(*)::int FROM health_screenings WHERE tenant_id = $1) AS screenings,
         (SELECT count(*)::int FROM health_screenings WHERE tenant_id = $1 AND risk_flag = 'red') AS red_flags,
         (SELECT count(*)::int FROM medical_flags WHERE tenant_id = $1 AND active) AS medical,
         (SELECT count(*)::int FROM incidents WHERE tenant_id = $1 AND status <> 'resolved') AS open_incidents`,
      [t]
    ),
    query<{ id: string; name: string }>(
      `SELECT id, name FROM locations WHERE tenant_id = $1 ORDER BY name`,
      [t]
    ),
    query<{ id: string; first_name: string | null; last_name: string | null }>(
      `SELECT id, first_name, last_name FROM members WHERE tenant_id = $1 ORDER BY first_name, last_name`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { screenings: 0, red_flags: 0, medical: 0, open_incidents: 0 };

  return (
    <>
      <PageHeader title="Gezondheid & veiligheid" subtitle="Screening, medische aandachtspunten en incidenten" icon="shield"
        actions={canWrite ? <LogIncidentModal locations={locations} members={members} /> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Screenings" value={k.screenings} icon="scan" tone="brand" />
        <StatCard label="Rode vlaggen" value={k.red_flags} icon="alert" tone={k.red_flags > 0 ? "red" : "slate"} sub="medische review nodig" />
        <StatCard label="Actieve medische flags" value={k.medical} icon="heart" tone="amber" />
        <StatCard label="Open incidenten" value={k.open_incidents} icon="clipboard" tone={k.open_incidents > 0 ? "red" : "slate"} />
      </div>

      <Card className="mb-6" >
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: "rgba(239,68,68,.12)", color: "#dc2626" }}>
            <Icon name="alert" size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Noodprocedures &amp; escalatie</p>
            <p className="text-sm muted mt-0.5">
              Rode vlaggen bij intake worden doorgezet naar een medische review vóór deelname aan sparring of intensieve
              training. Zorg dat het EAP (Emergency Action Plan) en de noodcontacten per locatie zichtbaar zijn en dat
              coaches weten wanneer ze 112 bellen.
            </p>
          </div>
        </div>
      </Card>

      <Section title="Recente screenings">
        {screenings.length === 0 ? (
          <EmptyState icon="scan" title="Geen screenings" subtitle="Nieuwe leden vullen een PAR-Q gezondheidsvragenlijst in bij intake." />
        ) : (
          <DataTable head={<><th>Lid</th><th>Risico</th><th>Vrijgegeven</th><th>Notitie</th><th className="text-right">Datum</th></>}>
            {screenings.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.member_id ? (
                    <Link href={`/app/members/${s.member_id}`} className="flex items-center gap-2.5 group">
                      <Avatar name={fullName(s)} url={s.photo_url} size={30} />
                      <span className="font-medium group-hover:underline">{fullName(s)}</span>
                    </Link>
                  ) : <span className="faint">—</span>}
                </td>
                <td><RiskBadge risk={s.risk_flag} /></td>
                <td>{s.cleared_at ? <Badge tone="green">vrijgegeven</Badge> : <Badge tone="amber">in afwachting</Badge>}</td>
                <td className="muted text-sm max-w-xs truncate">{s.note ?? "—"}</td>
                <td className="text-right faint text-sm">{timeAgo(s.created_at)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <Section title="Actieve medische aandachtspunten">
        {flags.length === 0 ? (
          <Card><p className="text-sm muted">Geen actieve medische flags.</p></Card>
        ) : (
          <DataTable head={<><th>Lid</th><th>Type</th><th>Omschrijving</th><th>Beperking</th></>}>
            {flags.map((f) => (
              <tr key={f.id}>
                <td>
                  {f.member_id ? (
                    <Link href={`/app/members/${f.member_id}`} className="flex items-center gap-2.5 group">
                      <Avatar name={fullName(f)} url={f.photo_url} size={30} />
                      <span className="font-medium group-hover:underline">{fullName(f)}</span>
                    </Link>
                  ) : <span className="faint">—</span>}
                </td>
                <td><Badge tone="amber">{titleCase(f.type)}</Badge></td>
                <td className="muted text-sm max-w-xs">{f.description ?? "—"}</td>
                <td className="muted text-sm">{f.restriction ?? <span className="faint">geen</span>}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <Section title="Incidenten">
        {incidents.length === 0 ? (
          <Card><p className="text-sm muted">Geen incidenten geregistreerd.</p></Card>
        ) : (
          <DataTable head={<><th>Type</th><th>Ernst</th><th>Omschrijving</th><th>Status</th><th className="text-right">Voorgevallen</th></>}>
            {incidents.map((i) => (
              <tr key={i.id}>
                <td className="font-medium">{i.type ? titleCase(i.type) : "—"}</td>
                <td>{i.severity ? <Badge tone={SEVERITY_TONE[i.severity] ?? "slate"}>{titleCase(i.severity)}</Badge> : <span className="faint">—</span>}</td>
                <td className="muted text-sm max-w-xs truncate">{i.description ?? "—"}</td>
                <td><StatusBadge status={i.status} /></td>
                <td className="text-right faint text-sm">{dateNL(i.occurred_at)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
