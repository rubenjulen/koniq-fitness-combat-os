import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, Badge, StatusBadge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { money, dateNL, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

type CoachRow = {
  id: string;
  name: string;
  role: string | null;
  specialties: string | null;
  email: string | null;
  phone: string | null;
  employment: string | null;
  comp_type: string | null;
  comp_rate: string | null;
  is_public: boolean;
  active: boolean;
  photo_url: string | null;
};

type QualRow = { id: string; coach_id: string; name: string; issued_at: string | null; expires_at: string | null };
type CountRow = { coach_id: string | null; n: number };

export default async function CoachesPage() {
  const user = await guard({ feature: "coaches", cap: "coach.read" });
  if (!user.ok) return <FeatureLocked feature="Coaches & staff" pack="starter" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;

  const [coaches, quals, classCounts, confirmed] = await Promise.all([
    query<CoachRow>(
      `SELECT id, name, role, specialties, email, phone, employment, comp_type, comp_rate, is_public, active, photo_url
         FROM coaches
        WHERE tenant_id = $1
        ORDER BY active DESC, name`,
      [t]
    ),
    query<QualRow>(
      `SELECT id, coach_id, name, issued_at::text AS issued_at, expires_at::text AS expires_at
         FROM coach_qualifications
        WHERE tenant_id = $1
        ORDER BY expires_at NULLS LAST`,
      [t]
    ),
    query<CountRow>(
      `SELECT coach_id, count(*)::int AS n
         FROM classes
        WHERE tenant_id = $1 AND active = true AND coach_id IS NOT NULL
        GROUP BY coach_id`,
      [t]
    ),
    query<CountRow>(
      `SELECT cl.coach_id, count(a.id)::int AS n
         FROM attendance a
         JOIN classes cl ON cl.id = a.class_id AND cl.tenant_id = a.tenant_id
        WHERE a.tenant_id = $1 AND a.coach_confirmed = true AND cl.coach_id IS NOT NULL
        GROUP BY cl.coach_id`,
      [t]
    ),
  ]);

  const today = new Date();
  const isExpired = (d: string | null) => !!d && new Date(d) < today;

  const qualsByCoach = new Map<string, QualRow[]>();
  for (const q of quals) {
    const arr = qualsByCoach.get(q.coach_id) ?? [];
    arr.push(q);
    qualsByCoach.set(q.coach_id, arr);
  }
  const classMap = new Map(classCounts.map((c) => [c.coach_id ?? "", c.n]));
  const confirmMap = new Map(confirmed.map((c) => [c.coach_id ?? "", c.n]));

  const totalCoaches = coaches.length;
  const activeCoaches = coaches.filter((c) => c.active).length;
  const expiredCerts = quals.filter((q) => isExpired(q.expires_at)).length;
  const classesAssigned = classCounts.reduce((s, c) => s + c.n, 0);

  const empTone = (e: string | null): "green" | "blue" | "amber" | "slate" =>
    e === "employee" ? "green" : e === "contractor" ? "blue" : e === "volunteer" ? "amber" : "slate";

  return (
    <>
      <PageHeader title="Coaches & staff" subtitle="Roster, kwalificaties en inzet" icon="whistle" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Totaal coaches" value={totalCoaches} icon="whistle" tone="brand" />
        <StatCard label="Actief" value={activeCoaches} icon="check" tone="green" sub={`${totalCoaches - activeCoaches} inactief`} />
        <StatCard label="Verlopen certificaten" value={expiredCerts} icon="alert" tone={expiredCerts > 0 ? "red" : "slate"} />
        <StatCard label="Lessen toegewezen" value={classesAssigned} icon="calendar" tone="indigo" />
      </div>

      <Section title="Coach roster">
        {coaches.length === 0 ? (
          <EmptyState icon="whistle" title="Nog geen coaches" subtitle="Voeg coaches toe om lessen toe te wijzen." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map((c) => {
              const cq = qualsByCoach.get(c.id) ?? [];
              return (
                <Card key={c.id}>
                  <div className="flex items-start gap-3">
                    <Avatar name={c.name} url={c.photo_url} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate" style={{ color: "var(--text)" }}>{c.name}</p>
                        {!c.active && <Badge tone="slate">inactief</Badge>}
                      </div>
                      <p className="text-xs muted">{titleCase(c.role) || "Coach"}</p>
                      {c.specialties && <p className="text-xs faint mt-0.5 truncate">{c.specialties}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {c.employment && <Badge tone={empTone(c.employment)}>{titleCase(c.employment)}</Badge>}
                    {c.is_public && <Badge tone="blue">op website</Badge>}
                    <StatusBadge status={c.active ? "active" : "cancelled"} />
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm" style={{ borderColor: "var(--border)" }}>
                    <span className="muted">{c.comp_type ? titleCase(c.comp_type) : "Vergoeding"}</span>
                    <span className="font-semibold">{c.comp_rate != null ? money(c.comp_rate, cur) : "—"}</span>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold faint uppercase tracking-wide mb-1.5">Kwalificaties</p>
                    {cq.length === 0 ? (
                      <p className="text-xs faint">Geen kwalificaties geregistreerd</p>
                    ) : (
                      <div className="space-y-1.5">
                        {cq.map((q) => {
                          const exp = isExpired(q.expires_at);
                          return (
                            <div key={q.id} className="flex items-center justify-between gap-2">
                              <span className="text-xs truncate flex items-center gap-1" style={{ color: "var(--text)" }}>
                                <Icon name="shield" size={12} className="faint" />{titleCase(q.name)}
                              </span>
                              {exp ? (
                                <Badge tone="red">verlopen</Badge>
                              ) : (
                                <span className="text-[11px] faint whitespace-nowrap">{q.expires_at ? `t/m ${dateNL(q.expires_at)}` : "geen einddatum"}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Inzet per coach">
        {coaches.length === 0 ? (
          <EmptyState icon="calendar" title="Geen data" />
        ) : (
          <DataTable head={<><th>Coach</th><th>Rol</th><th className="text-right">Lessen</th><th className="text-right">Bevestigde sessies</th></>}>
            {coaches.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} url={c.photo_url} size={30} />
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="text-sm muted">{titleCase(c.role) || "—"}</td>
                <td className="text-right tabular-nums font-semibold">{classMap.get(c.id) ?? 0}</td>
                <td className="text-right tabular-nums">{confirmMap.get(c.id) ?? 0}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
