import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, EmptyState, FeatureLocked } from "@/components/ui";
import { dateNL, timeAgo, titleCase } from "@/lib/format";
import { Icon } from "@/components/icons";
import { can } from "@/lib/rbac";
import { SubmitButton } from "@/components/FormControls";
import { NewEquipmentModal } from "./NewEquipmentModal";
import { resolveTicket } from "./actions";

export const dynamic = "force-dynamic";

type LocationRow = {
  id: string;
  name: string;
  address: string | null;
  district: string | null;
  capacity: number | null;
  is_headquarters: boolean;
};

type EquipmentRow = {
  id: string;
  name: string;
  category: string;
  status: string;
  last_inspection: string | null;
  location_name: string | null;
};

type TicketRow = {
  id: string;
  title: string;
  priority: string | null;
  status: string;
  resolved_at: string | null;
  created_at: string;
  equipment_name: string | null;
};

const PRIORITY_TONE: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  low: "slate",
  medium: "amber",
  high: "red",
  urgent: "red",
};

function inspectionStale(d: string | null): boolean {
  if (!d) return false;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return false;
  return Date.now() - dt.getTime() > 90 * 24 * 3600 * 1000;
}

export default async function FacilityPage() {
  const user = await guard({ feature: "facility", cap: "facility.read" });
  if (!user.ok) return <FeatureLocked feature="Faciliteiten" pack="starter" />;
  const t = user.tenantId;
  const canWrite = can(user, "facility.write");

  const [locations, equipment, tickets, kpiRows] = await Promise.all([
    query<LocationRow>(
      `SELECT id, name, address, district, capacity, is_headquarters
         FROM locations WHERE tenant_id = $1
        ORDER BY is_headquarters DESC, name`,
      [t]
    ),
    query<EquipmentRow>(
      `SELECT e.id, e.name, e.category, e.status, e.last_inspection,
              l.name AS location_name
         FROM equipment e
         LEFT JOIN locations l ON l.id = e.location_id AND l.tenant_id = $1
        WHERE e.tenant_id = $1
        ORDER BY (e.status IN ('maintenance','defect')) DESC, e.name`,
      [t]
    ),
    query<TicketRow>(
      `SELECT mt.id, mt.title, mt.priority, mt.status, mt.resolved_at, mt.created_at,
              e.name AS equipment_name
         FROM maintenance_tickets mt
         LEFT JOIN equipment e ON e.id = mt.equipment_id AND e.tenant_id = $1
        WHERE mt.tenant_id = $1
        ORDER BY (mt.status = 'resolved'), mt.created_at DESC`,
      [t]
    ),
    query<{ locations: number; equipment: number; open_maint: number; down: number }>(
      `SELECT
         (SELECT count(*)::int FROM locations WHERE tenant_id = $1) AS locations,
         (SELECT count(*)::int FROM equipment WHERE tenant_id = $1 AND status <> 'retired') AS equipment,
         (SELECT count(*)::int FROM maintenance_tickets WHERE tenant_id = $1 AND status <> 'resolved') AS open_maint,
         (SELECT count(*)::int FROM equipment WHERE tenant_id = $1 AND status IN ('maintenance','defect')) AS down`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { locations: 0, equipment: 0, open_maint: 0, down: 0 };

  return (
    <>
      <PageHeader title="Faciliteiten" subtitle="Locaties, materiaal en onderhoud" icon="building"
        actions={canWrite ? <NewEquipmentModal locations={locations} /> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Locaties" value={k.locations} icon="mapPin" tone="brand" />
        <StatCard label="Materiaal" value={k.equipment} icon="dumbbell" tone="indigo" sub="actief in gebruik" />
        <StatCard label="Open onderhoud" value={k.open_maint} icon="wrench" tone={k.open_maint > 0 ? "amber" : "slate"} />
        <StatCard label="In onderhoud / defect" value={k.down} icon="alert" tone={k.down > 0 ? "red" : "slate"} />
      </div>

      <Section title="Locaties">
        {locations.length === 0 ? (
          <EmptyState icon="building" title="Geen locaties" subtitle="Voeg een locatie toe om materiaal en onderhoud te beheren." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {locations.map((l) => (
              <Card key={l.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                      <Icon name="mapPin" size={17} />
                    </span>
                    <p className="font-semibold truncate" style={{ color: "var(--text)" }}>{l.name}</p>
                  </div>
                  {l.is_headquarters && <Badge tone="indigo">HQ</Badge>}
                </div>
                <div className="mt-3 space-y-1 text-sm muted">
                  {l.address && <p className="truncate">{l.address}</p>}
                  <p>{[l.district, l.capacity != null ? `capaciteit ${l.capacity}` : null].filter(Boolean).join(" · ") || "—"}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Materiaal">
        {equipment.length === 0 ? (
          <Card><p className="text-sm muted">Nog geen materiaal geregistreerd.</p></Card>
        ) : (
          <DataTable head={<><th>Materiaal</th><th>Categorie</th><th>Locatie</th><th>Status</th><th>Laatste keuring</th></>}>
            {equipment.map((e) => {
              const stale = inspectionStale(e.last_inspection);
              return (
                <tr key={e.id}>
                  <td className="font-medium">{e.name}</td>
                  <td><Badge tone="slate">{titleCase(e.category)}</Badge></td>
                  <td className="muted text-sm">{e.location_name ?? <span className="faint">—</span>}</td>
                  <td><StatusBadge status={e.status} /></td>
                  <td className="text-sm" style={{ color: stale ? "#b45309" : "var(--text-muted)" }}>
                    {dateNL(e.last_inspection)}{stale && <span className="text-xs"> · &gt;90d</span>}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>

      <Section title="Onderhoudsmeldingen">
        {tickets.length === 0 ? (
          <Card><p className="text-sm muted">Geen onderhoudsmeldingen.</p></Card>
        ) : (
          <DataTable head={<><th>Melding</th><th>Prioriteit</th><th>Status</th><th>Materiaal</th><th className="text-right">Aangemaakt</th>{canWrite && <th className="text-right">Actie</th>}</>}>
            {tickets.map((mt) => (
              <tr key={mt.id}>
                <td className="font-medium">{mt.title}</td>
                <td>{mt.priority ? <Badge tone={PRIORITY_TONE[mt.priority] ?? "slate"}>{titleCase(mt.priority)}</Badge> : <span className="faint">—</span>}</td>
                <td><StatusBadge status={mt.status} /></td>
                <td className="muted text-sm">{mt.equipment_name ?? <span className="faint">—</span>}</td>
                <td className="text-right faint text-sm">
                  {mt.resolved_at ? `opgelost ${dateNL(mt.resolved_at)}` : timeAgo(mt.created_at)}
                </td>
                {canWrite && (
                  <td className="text-right">
                    {mt.status !== "resolved" && (
                      <form action={resolveTicket} className="inline-flex justify-end">
                        <input type="hidden" name="ticketId" value={mt.id} />
                        <SubmitButton icon="check" variant="secondary" className="btn-sm">Sluiten</SubmitButton>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
