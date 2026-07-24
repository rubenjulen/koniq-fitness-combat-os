import { requireMember } from "@/lib/portal-auth";
import { query, queryOne } from "@/db/client";
import { Card, Badge, Progress, Sparkline, StatusBadge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { dateNL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalProgress() {
  const m = await requireMember();
  const [att, goals, pbs, metrics, rank, skills] = await Promise.all([
    queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM attendance WHERE tenant_id=$1 AND member_id=$2`, [m.tenantId, m.id]),
    query<{ title: string; target: string | null; status: string }>(`SELECT title, target, status FROM goals WHERE tenant_id=$1 AND member_id=$2 ORDER BY created_at DESC`, [m.tenantId, m.id]),
    query<{ metric: string; value: number; unit: string | null }>(`SELECT metric, value, unit FROM personal_bests WHERE tenant_id=$1 AND member_id=$2 ORDER BY achieved_on DESC LIMIT 5`, [m.tenantId, m.id]),
    query<{ weight: number | null; measured_on: string }>(`SELECT weight, measured_on FROM progress_metrics WHERE tenant_id=$1 AND member_id=$2 ORDER BY measured_on`, [m.tenantId, m.id]),
    queryOne<{ name: string; color: string | null }>(`SELECT r.name, r.color FROM promotions pr JOIN ranks r ON r.id=pr.rank_id WHERE pr.tenant_id=$1 AND pr.member_id=$2 ORDER BY pr.promoted_at DESC LIMIT 1`, [m.tenantId, m.id]),
    queryOne<{ mastered: number; total: number }>(`SELECT count(*) FILTER (WHERE status='mastered')::int AS mastered, count(*)::int AS total FROM skill_progress WHERE tenant_id=$1 AND member_id=$2`, [m.tenantId, m.id]),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Progress</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="section-title mb-1">Trainingen totaal</p>
          <p className="text-3xl font-extrabold">{att?.n ?? 0}</p>
        </Card>
        <Card>
          <p className="section-title mb-1">Huidige rang</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-4 h-4 rounded-full" style={{ background: rank?.color ?? "var(--brand)" }} />
            <span className="font-semibold text-sm">{rank?.name ?? "—"}</span>
          </div>
        </Card>
      </div>

      {skills && skills.total > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2"><p className="section-title">Technieken beheerst</p><span className="text-sm font-semibold">{skills.mastered}/{skills.total}</span></div>
          <Progress value={(skills.mastered / skills.total) * 100} tone="green" />
        </Card>
      )}

      {metrics.length > 1 && (
        <Card>
          <p className="section-title mb-2">Gewicht (privé) <Icon name="lock" size={12} className="inline faint" /></p>
          <Sparkline points={metrics.map((x) => x.weight ?? 0)} width={300} height={50} />
          <p className="text-xs faint mt-1">{dateNL(metrics[0].measured_on)} – {dateNL(metrics[metrics.length - 1].measured_on)}</p>
        </Card>
      )}

      <Card>
        <p className="section-title mb-2">Doelen</p>
        {goals.length === 0 ? <p className="text-sm muted">Nog geen doelen.</p> : (
          <div className="space-y-2">
            {goals.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <span>{g.title}</span><StatusBadge status={g.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <p className="section-title mb-2">Persoonlijke records</p>
        {pbs.length === 0 ? <p className="text-sm muted">Nog geen PR's.</p> : (
          <div className="space-y-2">
            {pbs.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <span className="flex items-center gap-2"><Icon name="fire" size={14} className="tprimary" /> {p.metric}</span>
                <span className="font-semibold">{p.value} {p.unit}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
