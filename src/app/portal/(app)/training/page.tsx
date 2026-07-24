import { requireMember } from "@/lib/portal-auth";
import { query, queryOne } from "@/db/client";
import { Card, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { WEEKDAYS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalTraining() {
  const m = await requireMember();
  const [plan, logs] = await Promise.all([
    queryOne<{ name: string; goal: string | null; week: Record<string, string[]>; explanation: string | null; generated_by: string }>(
      `SELECT name, goal, week, explanation, generated_by FROM training_plans WHERE tenant_id=$1 AND member_id=$2 AND status='active' ORDER BY created_at DESC LIMIT 1`, [m.tenantId, m.id]),
    query<{ log_date: string; summary: string | null; rpe: number | null }>(
      `SELECT log_date, summary, rpe FROM workout_logs WHERE tenant_id=$1 AND member_id=$2 ORDER BY log_date DESC LIMIT 8`, [m.tenantId, m.id]),
  ]);
  const dayKeys = ["ma", "di", "wo", "do", "vr", "za", "zo"];
  const week = plan?.week ?? {};

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Training</h1>
      {plan ? (
        <>
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold">{plan.name}</p>
              <Badge tone={plan.generated_by === "ai" ? "purple" : "blue"}>{plan.generated_by === "ai" ? "AI Coach" : "Coach"}</Badge>
            </div>
            {plan.explanation && <p className="text-xs muted">{plan.explanation}</p>}
          </Card>
          <div className="space-y-2">
            {dayKeys.map((d, i) => (
              <Card key={d}>
                <p className="section-title mb-2">{WEEKDAYS[i + 1]}</p>
                <ul className="space-y-1">
                  {(week[d] ?? ["Rust"]).map((it, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm"><Icon name="check" size={14} className="tprimary" /> {it}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <Card>
            <p className="section-title mb-2">Recente logs</p>
            {logs.length === 0 ? <p className="text-sm muted">Nog geen workouts gelogd.</p> : (
              <div className="space-y-2">
                {logs.map((l, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <span>{l.summary ?? "Workout"}</span>
                    <span className="muted">RPE {l.rpe ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : <EmptyState icon="dumbbell" title="Nog geen actief plan" subtitle="Je coach stelt binnenkort een trainingsplan voor je op." />}
    </div>
  );
}
