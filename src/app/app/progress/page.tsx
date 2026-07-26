import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, Sparkline, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { dateNL, fullName } from "@/lib/format";
import { can } from "@/lib/rbac";
import { NewGoalModal, LogMetricModal } from "./ProgressActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

type GoalRow = {
  id: string;
  title: string;
  baseline: string | null;
  target: string | null;
  target_date: string | null;
  status: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type WeightRow = {
  member_id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  weight: number | null;
  measured_on: string | null;
  prev_weight: number | null;
};

type SeriesRow = {
  member_id: string;
  first_name: string | null;
  last_name: string | null;
  weight: number;
  measured_on: string;
};

type PbRow = {
  id: string;
  metric: string;
  value: number | null;
  unit: string | null;
  achieved_on: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type MilestoneRow = {
  member_id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  sessions: number;
};

type Kpi = {
  active_goals: number;
  achieved_goals: number;
  prs: number;
  members_metrics: number;
};

function milestoneTier(n: number): number | null {
  if (n >= 100) return 100;
  if (n >= 50) return 50;
  if (n >= 25) return 25;
  return null;
}

export default async function ProgressPage() {
  const user = await guard({ feature: "progress", cap: "progress.read" });
  if (!user.ok) return <FeatureLocked feature="Voortgang" pack="performance" />;
  const t = user.tenantId;
  const canWrite = can(user, "progress.write");

  const [goals, weights, series, pbs, milestones, kpiRows, members] = await Promise.all([
    query<GoalRow>(
      `SELECT g.id, g.title, g.baseline, g.target, g.target_date, g.status,
              m.first_name, m.last_name, m.photo_url
         FROM goals g
         JOIN members m ON m.id = g.member_id AND m.tenant_id = $1
        WHERE g.tenant_id = $1
        ORDER BY g.status, g.target_date NULLS LAST`,
      [t]
    ),
    query<WeightRow>(
      `SELECT DISTINCT ON (pm.member_id)
              pm.member_id, m.first_name, m.last_name, m.photo_url,
              pm.weight::float AS weight, pm.measured_on,
              (SELECT pm2.weight::float FROM progress_metrics pm2
                 WHERE pm2.member_id = pm.member_id AND pm2.tenant_id = $1
                   AND pm2.weight IS NOT NULL AND pm2.measured_on < pm.measured_on
                 ORDER BY pm2.measured_on DESC LIMIT 1) AS prev_weight
         FROM progress_metrics pm
         JOIN members m ON m.id = pm.member_id AND m.tenant_id = $1
        WHERE pm.tenant_id = $1 AND pm.weight IS NOT NULL
        ORDER BY pm.member_id, pm.measured_on DESC`,
      [t]
    ),
    query<SeriesRow>(
      `SELECT pm.member_id, m.first_name, m.last_name, pm.weight::float AS weight, pm.measured_on
         FROM progress_metrics pm
         JOIN members m ON m.id = pm.member_id AND m.tenant_id = $1
        WHERE pm.tenant_id = $1 AND pm.weight IS NOT NULL
        ORDER BY pm.member_id, pm.measured_on ASC`,
      [t]
    ),
    query<PbRow>(
      `SELECT pb.id, pb.metric, pb.value::float AS value, pb.unit, pb.achieved_on,
              m.first_name, m.last_name, m.photo_url
         FROM personal_bests pb
         JOIN members m ON m.id = pb.member_id AND m.tenant_id = $1
        WHERE pb.tenant_id = $1
        ORDER BY pb.achieved_on DESC NULLS LAST`,
      [t]
    ),
    query<MilestoneRow>(
      `SELECT a.member_id, m.first_name, m.last_name, m.photo_url, count(*)::int AS sessions
         FROM attendance a
         JOIN members m ON m.id = a.member_id AND m.tenant_id = $1
        WHERE a.tenant_id = $1
        GROUP BY a.member_id, m.first_name, m.last_name, m.photo_url
       HAVING count(*) >= 25
        ORDER BY count(*) DESC`,
      [t]
    ),
    query<Kpi>(
      `SELECT
         (SELECT count(*)::int FROM goals WHERE tenant_id = $1 AND status = 'active') AS active_goals,
         (SELECT count(*)::int FROM goals WHERE tenant_id = $1 AND status = 'achieved') AS achieved_goals,
         (SELECT count(*)::int FROM personal_bests WHERE tenant_id = $1) AS prs,
         (SELECT count(DISTINCT member_id)::int FROM progress_metrics WHERE tenant_id = $1) AS members_metrics`,
      [t]
    ),
    query<{ id: string; first_name: string | null; last_name: string | null }>(
      `SELECT id, first_name, last_name FROM members
        WHERE tenant_id = $1 ORDER BY first_name, last_name`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { active_goals: 0, achieved_goals: 0, prs: 0, members_metrics: 0 };

  // Pick a sample member with the most weight datapoints for the trend Sparkline.
  const bySeries = new Map<string, SeriesRow[]>();
  for (const r of series) {
    const arr = bySeries.get(r.member_id) ?? [];
    arr.push(r);
    bySeries.set(r.member_id, arr);
  }
  let sampleId: string | null = null;
  let sampleLen = 0;
  for (const [id, arr] of bySeries) {
    if (arr.length > sampleLen) {
      sampleLen = arr.length;
      sampleId = id;
    }
  }
  const sample = sampleId ? bySeries.get(sampleId)! : [];
  const sampleName = sample.length ? fullName(sample[0]) : null;

  return (
    <>
      <PageHeader
        title="Voortgang & assessments"
        subtitle="Doelen, persoonlijke records en mijlpalen — metingen zijn privé"
        icon="trend"
        actions={canWrite ? (
          <div className="flex items-center gap-2">
            <LogMetricModal members={members} />
            <NewGoalModal members={members} />
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Actieve doelen" value={k.active_goals} icon="target" tone="brand" />
        <StatCard label="Behaalde doelen" value={k.achieved_goals} icon="check" tone="green" />
        <StatCard label="PR's gelogd" value={k.prs} icon="trophy" tone="amber" />
        <StatCard label="Leden met metingen" value={k.members_metrics} icon="scan" tone="indigo" />
      </div>

      <Section title="Doelen">
        {goals.length === 0 ? (
          <EmptyState icon="target" title="Nog geen doelen" subtitle="Stel doelen op voor je leden." />
        ) : (
          <DataTable
            head={
              <>
                <th>Lid</th>
                <th>Doel</th>
                <th>Target</th>
                <th>Streefdatum</th>
                <th>Status</th>
              </>
            }
          >
            {goals.map((g) => (
              <tr key={g.id}>
                <td>
                  <Link href={`/app/members/${g.id}`} className="flex items-center gap-3 group">
                    <Avatar name={fullName(g)} url={g.photo_url} size={32} />
                    <span className="font-medium group-hover:underline truncate" style={{ color: "var(--text)" }}>{fullName(g)}</span>
                  </Link>
                </td>
                <td className="font-medium" style={{ color: "var(--text)" }}>{g.title}</td>
                <td className="muted">{g.target ?? "—"}</td>
                <td className="muted">{dateNL(g.target_date)}</td>
                <td><StatusBadge status={g.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Section title="Lichaamsmetingen — laatste gewicht">
            <Card padding={false}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                <Icon name="lock" size={14} style={{ color: "var(--text-faint)" }} />
                <span className="text-xs faint">Privé & gevoelig (PRO-003) — vetpercentage en foto&apos;s worden bewust niet getoond.</span>
              </div>
              {weights.length === 0 ? (
                <div className="p-4"><EmptyState icon="scan" title="Nog geen metingen" /></div>
              ) : (
                <DataTable
                  head={
                    <>
                      <th>Lid</th>
                      <th className="text-right">Laatste gewicht</th>
                      <th>Trend</th>
                      <th>Gemeten</th>
                    </>
                  }
                >
                  {weights.map((w) => {
                    const delta = w.weight != null && w.prev_weight != null ? w.weight - w.prev_weight : null;
                    return (
                      <tr key={w.member_id}>
                        <td>
                          <Link href={`/app/members/${w.member_id}`} className="flex items-center gap-3 group">
                            <Avatar name={fullName(w)} url={w.photo_url} size={32} />
                            <span className="font-medium group-hover:underline truncate" style={{ color: "var(--text)" }}>{fullName(w)}</span>
                          </Link>
                        </td>
                        <td className="text-right tabular-nums font-semibold">{w.weight != null ? `${w.weight} kg` : "—"}</td>
                        <td>
                          {delta == null ? (
                            <span className="faint text-sm">—</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm" style={{ color: delta <= 0 ? "var(--brand)" : "var(--text-muted)" }}>
                              <Icon name={delta < 0 ? "arrowDown" : delta > 0 ? "arrowUp" : "arrowRight"} size={13} />
                              {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg
                            </span>
                          )}
                        </td>
                        <td className="muted">{dateNL(w.measured_on)}</td>
                      </tr>
                    );
                  })}
                </DataTable>
              )}
            </Card>
          </Section>
        </div>

        <div>
          <Section title="Gewichtstrend (voorbeeld)">
            <Card>
              {sample.length >= 2 ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="lock" size={13} style={{ color: "var(--text-faint)" }} />
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{sampleName}</span>
                  </div>
                  <Sparkline points={sample.map((s) => s.weight)} width={220} height={60} />
                  <div className="flex items-center justify-between mt-2 text-xs faint tabular-nums">
                    <span>{sample[0].weight} kg · {dateNL(sample[0].measured_on)}</span>
                    <span>{sample[sample.length - 1].weight} kg · {dateNL(sample[sample.length - 1].measured_on)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm faint">Onvoldoende metingen voor een trend.</p>
              )}
            </Card>
          </Section>
        </div>
      </div>

      <div className="mt-6">
        <Section title="Persoonlijke records">
          {pbs.length === 0 ? (
            <EmptyState icon="trophy" title="Nog geen PR's" subtitle="Log persoonlijke records van je leden." />
          ) : (
            <DataTable
              head={
                <>
                  <th>Lid</th>
                  <th>Metriek</th>
                  <th className="text-right">Waarde</th>
                  <th>Behaald op</th>
                </>
              }
            >
              {pbs.map((pb) => (
                <tr key={pb.id}>
                  <td>
                    <Link href={`/app/members/${pb.id}`} className="flex items-center gap-3 group">
                      <Avatar name={fullName(pb)} url={pb.photo_url} size={32} />
                      <span className="font-medium group-hover:underline truncate" style={{ color: "var(--text)" }}>{fullName(pb)}</span>
                    </Link>
                  </td>
                  <td className="font-medium" style={{ color: "var(--text)" }}>{pb.metric}</td>
                  <td className="text-right tabular-nums font-semibold">
                    {pb.value != null ? `${pb.value}${pb.unit ? ` ${pb.unit}` : ""}` : "—"}
                  </td>
                  <td className="muted">{dateNL(pb.achieved_on)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>
      </div>

      <div className="mt-6">
        <Section title="Mijlpalen — aanwezigheid">
          {milestones.length === 0 ? (
            <EmptyState icon="trophy" title="Nog geen mijlpalen" subtitle="Mijlpalen verschijnen vanaf 25 sessies." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {milestones.map((m) => {
                const tier = milestoneTier(m.sessions);
                const tone = tier === 100 ? "purple" : tier === 50 ? "amber" : "green";
                return (
                  <Card key={m.member_id}>
                    <div className="flex items-center gap-3">
                      <Avatar name={fullName(m)} url={m.photo_url} size={38} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/app/members/${m.member_id}`} className="font-medium hover:underline block truncate" style={{ color: "var(--text)" }}>
                          {fullName(m)}
                        </Link>
                        <span className="text-xs faint">{m.sessions} sessies bijgewoond</span>
                      </div>
                      <Badge tone={tone}>
                        <span className="inline-flex items-center gap-1"><Icon name="trophy" size={12} />{tier}+</span>
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
