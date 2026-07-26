import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, Badge, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { titleCase, WEEKDAYS, WEEKDAYS_SHORT } from "@/lib/format";
import { can } from "@/lib/rbac";
import { NewClassModal, NewClassTypeModal } from "./ScheduleActions";

export const dynamic = "force-dynamic";

type ClassRow = {
  id: string;
  title: string;
  weekday: number;
  start_time: string;
  end_time: string;
  capacity: number;
  resource: string | null;
  is_sparring: boolean;
  type_name: string | null;
  discipline: string | null;
  level: string | null;
  intensity: string | null;
  color: string | null;
  coach_name: string | null;
};

type TypeRow = {
  id: string;
  name: string;
  discipline: string | null;
  age_group: string | null;
  level: string | null;
  intensity: string | null;
  color: string | null;
  class_count: number;
};

export default async function SchedulePage() {
  const user = await guard({ feature: "schedule", cap: "schedule.read" });
  if (!user.ok) return <FeatureLocked feature="Agenda & lessen" pack="starter" />;
  const t = user.tenantId;
  const canWrite = can(user, "schedule.write");

  const [classes, types, coaches, locations] = await Promise.all([
    query<ClassRow>(
      `SELECT c.id, c.title, c.weekday, c.start_time, c.end_time, c.capacity, c.resource, c.is_sparring,
              ct.name AS type_name, ct.discipline, ct.level, ct.intensity, ct.color,
              co.name AS coach_name
         FROM classes c
         LEFT JOIN class_types ct ON ct.id = c.class_type_id AND ct.tenant_id = c.tenant_id
         LEFT JOIN coaches co ON co.id = c.coach_id AND co.tenant_id = c.tenant_id
        WHERE c.tenant_id = $1 AND c.active = true
        ORDER BY c.weekday, c.start_time`,
      [t]
    ),
    query<TypeRow>(
      `SELECT ct.id, ct.name, ct.discipline, ct.age_group, ct.level, ct.intensity, ct.color,
              (SELECT count(*)::int FROM classes c WHERE c.class_type_id = ct.id AND c.tenant_id = ct.tenant_id AND c.active = true) AS class_count
         FROM class_types ct
        WHERE ct.tenant_id = $1
        ORDER BY ct.discipline NULLS LAST, ct.name`,
      [t]
    ),
    query<{ id: string; name: string }>(
      `SELECT id, name FROM coaches WHERE tenant_id = $1 AND active = true ORDER BY name`,
      [t]
    ),
    query<{ id: string; name: string }>(
      `SELECT id, name FROM locations WHERE tenant_id = $1 ORDER BY name`,
      [t]
    ),
  ]);

  const totalClasses = classes.length;
  const disciplines = new Set(classes.map((c) => c.discipline).filter(Boolean)).size;
  const sparringCount = classes.filter((c) => c.is_sparring).length;
  const avgCapacity = totalClasses ? Math.round(classes.reduce((s, c) => s + (c.capacity ?? 0), 0) / totalClasses) : 0;

  const byDay = (wd: number) => classes.filter((c) => c.weekday === wd);

  const intensityTone = (i: string | null): "green" | "amber" | "red" | "slate" =>
    i === "high" ? "red" : i === "medium" ? "amber" : i === "low" ? "green" : "slate";

  return (
    <>
      <PageHeader title="Weekrooster" subtitle="Alle terugkerende lessen per weekdag" icon="calendar"
        actions={canWrite ? <div className="flex items-center gap-2"><NewClassTypeModal /><NewClassModal classTypes={types} coaches={coaches} locations={locations} /></div> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Lessen per week" value={totalClasses} icon="calendar" tone="brand" />
        <StatCard label="Disciplines" value={disciplines} icon="belt" tone="indigo" />
        <StatCard label="Sparring-sessies" value={sparringCount} icon="fire" tone="red" />
        <StatCard label="Gem. capaciteit" value={avgCapacity} icon="users" tone="green" sub="plaatsen per les" />
      </div>

      {totalClasses === 0 ? (
        <EmptyState icon="calendar" title="Nog geen lessen" subtitle="Er zijn nog geen actieve lessen ingepland." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6, 7].map((wd) => {
            const dayClasses = byDay(wd);
            return (
              <Card key={wd} padding={false} className="p-2">
                <div className="flex items-center justify-between px-1 pb-2 mb-1 border-b" style={{ borderColor: "var(--border)" }}>
                  <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>{WEEKDAYS_SHORT[wd]}</h3>
                  <span className="text-xs faint">{dayClasses.length}</span>
                </div>
                <div className="space-y-1.5">
                  {dayClasses.length === 0 ? (
                    <p className="text-xs faint px-1 py-2">—</p>
                  ) : (
                    dayClasses.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg p-2 border-l-[3px]"
                        style={{ background: "var(--bg-subtle)", borderColor: c.color ?? "var(--brand)" }}
                      >
                        <p className="text-xs font-semibold leading-tight truncate" style={{ color: "var(--text)" }}>{c.title}</p>
                        <p className="text-[11px] tabular-nums mt-0.5" style={{ color: "var(--text-muted)" }}>{c.start_time}–{c.end_time}</p>
                        <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{c.coach_name ?? "—"}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="inline-flex items-center gap-0.5 text-[10px] faint">
                            <Icon name="users" size={10} />{c.capacity}
                          </span>
                          {c.resource && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] faint">
                              <Icon name="mapPin" size={10} />{c.resource}
                            </span>
                          )}
                          {c.is_sparring && <Badge tone="red">sparring</Badge>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Section title="Lesvormen (class types)">
        {types.length === 0 ? (
          <EmptyState icon="belt" title="Geen lesvormen" subtitle="Definieer lesvormen om lessen te categoriseren." />
        ) : (
          <DataTable head={<><th>Lesvorm</th><th>Discipline</th><th>Doelgroep</th><th>Niveau</th><th>Intensiteit</th><th className="text-right">Lessen</th></>}>
            {types.map((ty) => (
              <tr key={ty.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: ty.color ?? "var(--brand)" }} />
                    <span className="font-medium">{ty.name}</span>
                  </div>
                </td>
                <td className="capitalize">{ty.discipline ? ty.discipline.replace(/_/g, " ") : "—"}</td>
                <td className="capitalize">{ty.age_group ?? "—"}</td>
                <td className="capitalize">{ty.level ?? "—"}</td>
                <td>{ty.intensity ? <Badge tone={intensityTone(ty.intensity)}>{titleCase(ty.intensity)}</Badge> : "—"}</td>
                <td className="text-right tabular-nums">{ty.class_count}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <p className="text-xs faint mt-4">Weekdagen: {WEEKDAYS.slice(1).join(" · ")}</p>
    </>
  );
}
