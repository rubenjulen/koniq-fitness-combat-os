import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { fullName, titleCase } from "@/lib/format";
import { can } from "@/lib/rbac";
import { NewTrainingPlanModal } from "./NewTrainingPlanModal";
import { NewExerciseModal, ExerciseVideoModal } from "./ExerciseActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ExerciseRow = {
  id: string;
  name: string;
  category: string;
  equipment: string | null;
  level: string | null;
  age_min: number | null;
  safety_notes: string | null;
  video_url: string | null;
  instructions: string | null;
};

type TemplateRow = {
  id: string;
  name: string;
  goal: string | null;
  level: string | null;
  weeks: number | null;
  description: string | null;
};

type PlanRow = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  generated_by: string | null;
  approved_by: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type Kpi = {
  exercises: number;
  templates: number;
  active_plans: number;
  logs_week: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  combat_drill: "Combat drills",
  strength: "Kracht",
  conditioning: "Conditie",
  mobility: "Mobiliteit",
  recovery: "Herstel",
  technique: "Techniek",
};

const CATEGORY_ICON: Record<string, string> = {
  combat_drill: "whistle",
  strength: "dumbbell",
  conditioning: "bolt",
  mobility: "target",
  recovery: "heart",
  technique: "clipboard",
};

const CATEGORY_ORDER = ["combat_drill", "strength", "conditioning", "mobility", "recovery", "technique"];

export default async function TrainingPage() {
  const user = await guard({ feature: "training", cap: "training.read" });
  if (!user.ok) return <FeatureLocked feature="Training" pack="performance" />;
  const t = user.tenantId;
  const canWrite = can(user, "training.write");

  const [exercises, templates, plans, kpiRows, memberOpts] = await Promise.all([
    query<ExerciseRow>(
      `SELECT id, name, category, equipment, level, age_min, safety_notes, video_url, instructions
         FROM exercises WHERE tenant_id = $1
        ORDER BY category, name`,
      [t]
    ),
    query<TemplateRow>(
      `SELECT id, name, goal, level, weeks, description
         FROM program_templates WHERE tenant_id = $1
        ORDER BY name`,
      [t]
    ),
    query<PlanRow>(
      `SELECT tp.id, tp.name, tp.goal, tp.status, tp.generated_by, tp.approved_by,
              m.first_name, m.last_name, m.photo_url
         FROM training_plans tp
         JOIN members m ON m.id = tp.member_id AND m.tenant_id = $1
        WHERE tp.tenant_id = $1
        ORDER BY tp.created_at DESC`,
      [t]
    ),
    query<Kpi>(
      `SELECT
         (SELECT count(*)::int FROM exercises WHERE tenant_id = $1) AS exercises,
         (SELECT count(*)::int FROM program_templates WHERE tenant_id = $1) AS templates,
         (SELECT count(*)::int FROM training_plans WHERE tenant_id = $1 AND status = 'active') AS active_plans,
         (SELECT count(*)::int FROM workout_logs WHERE tenant_id = $1
            AND log_date >= CURRENT_DATE - INTERVAL '7 days') AS logs_week`,
      [t]
    ),
    query<{ id: string; first_name: string; last_name: string }>(
      `SELECT id, first_name, last_name FROM members WHERE tenant_id = $1 ORDER BY first_name, last_name`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { exercises: 0, templates: 0, active_plans: 0, logs_week: 0 };

  const grouped = new Map<string, ExerciseRow[]>();
  for (const ex of exercises) {
    const arr = grouped.get(ex.category) ?? [];
    arr.push(ex);
    grouped.set(ex.category, arr);
  }
  const categories = CATEGORY_ORDER.filter((c) => grouped.has(c)).concat(
    [...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c))
  );

  return (
    <>
      <PageHeader
        title="Training"
        subtitle="Oefeningenbibliotheek, programmasjablonen en actieve trainingsplannen"
        icon="dumbbell"
        actions={canWrite ? <div className="flex items-center gap-2"><NewExerciseModal /><NewTrainingPlanModal members={memberOpts} templates={templates} /></div> : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Oefeningen" value={k.exercises} icon="dumbbell" tone="brand" sub="in bibliotheek" />
        <StatCard label="Programmasjablonen" value={k.templates} icon="layers" tone="indigo" />
        <StatCard label="Actieve plannen" value={k.active_plans} icon="clipboard" tone="green" />
        <StatCard label="Workout logs" value={k.logs_week} icon="check" tone="blue" sub="deze week" />
      </div>

      <Section title="Oefeningenbibliotheek">
        {exercises.length === 0 ? (
          <EmptyState icon="dumbbell" title="Nog geen oefeningen" subtitle="Voeg oefeningen toe aan de bibliotheek." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const list = grouped.get(cat) ?? [];
              return (
                <Card key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name={CATEGORY_ICON[cat] ?? "dumbbell"} size={18} style={{ color: "var(--brand)" }} />
                    <h3 className="font-semibold" style={{ color: "var(--text)" }}>
                      {CATEGORY_LABEL[cat] ?? titleCase(cat)}
                    </h3>
                    <span className="faint text-xs">{list.length}</span>
                  </div>
                  <div className="space-y-2.5">
                    {list.map((ex) => (
                      <div key={ex.id} className="flex items-start justify-between gap-3 pb-2.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm" style={{ color: "var(--text)" }}>{ex.name}</span>
                            {ex.video_url && <Badge tone="green"><Icon name="eye" size={11} /> video</Badge>}
                            {ex.safety_notes && (
                              <span title={ex.safety_notes} className="inline-flex">
                                <Icon name="alert" size={14} style={{ color: "var(--amber, #d97706)" }} />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {ex.equipment && <Badge tone="slate">{titleCase(ex.equipment)}</Badge>}
                            {ex.level && <span className="text-xs faint">{titleCase(ex.level)}</span>}
                            {ex.age_min != null && <span className="text-xs faint">min. {ex.age_min} jr</span>}
                          </div>
                          {ex.safety_notes && (
                            <p className="text-xs mt-1" style={{ color: "var(--amber, #d97706)" }}>{ex.safety_notes}</p>
                          )}
                        </div>
                        {canWrite && <div className="shrink-0"><ExerciseVideoModal exercise={ex} /></div>}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <div className="mt-6">
        <Section title="Programmasjablonen">
          {templates.length === 0 ? (
            <EmptyState icon="layers" title="Nog geen sjablonen" subtitle="Maak herbruikbare programmasjablonen aan." />
          ) : (
            <DataTable
              head={
                <>
                  <th>Sjabloon</th>
                  <th>Doel</th>
                  <th>Niveau</th>
                  <th className="text-right">Weken</th>
                  <th>Omschrijving</th>
                </>
              }
            >
              {templates.map((tpl) => (
                <tr key={tpl.id}>
                  <td className="font-medium" style={{ color: "var(--text)" }}>{tpl.name}</td>
                  <td>{tpl.goal ? <Badge tone="indigo">{titleCase(tpl.goal)}</Badge> : <span className="faint">—</span>}</td>
                  <td className="muted">{tpl.level ? titleCase(tpl.level) : "—"}</td>
                  <td className="text-right tabular-nums">{tpl.weeks ?? "—"}</td>
                  <td className="muted text-sm max-w-md truncate">{tpl.description ?? "—"}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>
      </div>

      <div className="mt-6">
        <Section title="Actieve trainingsplannen">
          {plans.length === 0 ? (
            <EmptyState icon="clipboard" title="Nog geen trainingsplannen" subtitle="Genereer plannen via de AI Coach of stel ze handmatig op." />
          ) : (
            <DataTable
              head={
                <>
                  <th>Lid</th>
                  <th>Plan</th>
                  <th>Doel</th>
                  <th>Bron</th>
                  <th>Status</th>
                  <th>Goedgekeurd</th>
                </>
              }
            >
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/app/members/${p.id}`} className="flex items-center gap-3 group">
                      <Avatar name={fullName(p)} url={p.photo_url} size={32} />
                      <span className="font-medium group-hover:underline truncate" style={{ color: "var(--text)" }}>{fullName(p)}</span>
                    </Link>
                  </td>
                  <td className="muted">{p.name}</td>
                  <td>{p.goal ? <Badge tone="slate">{titleCase(p.goal)}</Badge> : <span className="faint">—</span>}</td>
                  <td>
                    {p.generated_by === "ai" ? (
                      <Badge tone="purple">AI</Badge>
                    ) : (
                      <Badge tone="blue">Coach</Badge>
                    )}
                  </td>
                  <td>
                    {p.status === "blocked" ? <StatusBadge status="red" /> : <StatusBadge status={p.status} />}
                  </td>
                  <td>
                    {p.approved_by ? <Badge tone="green">goedgekeurd</Badge> : <span className="faint text-sm">—</span>}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>
      </div>
    </>
  );
}
