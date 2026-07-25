import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, StatusBadge, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { dateNL, fullName, titleCase } from "@/lib/format";
import { can } from "@/lib/rbac";
import { AwardPromotionModal, ScheduleGradingModal } from "./CurriculumActions";

export const dynamic = "force-dynamic";

type KpiRow = {
  disciplines: number;
  skills: number;
  ranks: number;
  promotions_year: number;
  upcoming_gradings: number;
};

type RankRow = {
  id: string;
  name: string;
  level_order: number;
  color: string | null;
  min_attendance: number | null;
  discipline: string | null;
  member_count: number;
};

type SkillRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  discipline: string | null;
  curriculum_name: string | null;
  mastered: number;
  competent: number;
};

type AssessmentRow = {
  id: string;
  type: string;
  scheduled_for: string | null;
  note: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  assessor: string | null;
};

type PromotionRow = {
  id: string;
  promoted_at: string | null;
  discipline: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  rank_name: string | null;
  rank_color: string | null;
  promoted_by_name: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  stance: "Stance", footwork: "Footwork", punch: "Punches", kick: "Kicks",
  knee: "Knees", elbow: "Elbows", clinch: "Clinch", defense: "Verdediging",
  conditioning: "Conditie",
};

export default async function CurriculumPage() {
  const user = await guard({ feature: "curriculum", cap: "curriculum.read" });
  if (!user.ok) return <FeatureLocked feature="Curriculum & ranks" pack="combat" />;
  const t = user.tenantId;

  const [kpiRows, ranks, skills, gradings, promotions] = await Promise.all([
    query<KpiRow>(
      `SELECT
         (SELECT count(DISTINCT discipline)::int FROM curricula WHERE tenant_id=$1) AS disciplines,
         (SELECT count(*)::int FROM skills WHERE tenant_id=$1) AS skills,
         (SELECT count(*)::int FROM ranks WHERE tenant_id=$1) AS ranks,
         (SELECT count(*)::int FROM promotions WHERE tenant_id=$1 AND promoted_at >= date_trunc('year', CURRENT_DATE)) AS promotions_year,
         (SELECT count(*)::int FROM assessments WHERE tenant_id=$1 AND result='scheduled') AS upcoming_gradings`,
      [t],
    ),
    query<RankRow>(
      `SELECT r.id, r.name, r.level_order, r.color, r.min_attendance, r.discipline,
         (SELECT count(*)::int FROM promotions p WHERE p.tenant_id=$1 AND p.rank_id = r.id) AS member_count
       FROM ranks r
       WHERE r.tenant_id=$1
       ORDER BY r.discipline NULLS FIRST, r.level_order`,
      [t],
    ),
    query<SkillRow>(
      `SELECT s.id, s.name, s.category, s.description, c.discipline, c.name AS curriculum_name,
         (SELECT count(*)::int FROM skill_progress sp WHERE sp.tenant_id=$1 AND sp.skill_id = s.id AND sp.status='mastered') AS mastered,
         (SELECT count(*)::int FROM skill_progress sp WHERE sp.tenant_id=$1 AND sp.skill_id = s.id AND sp.status='competent') AS competent
       FROM skills s
       JOIN curricula c ON c.id = s.curriculum_id AND c.tenant_id=$1
       WHERE s.tenant_id=$1
       ORDER BY s.category, s.sort NULLS LAST, s.name`,
      [t],
    ),
    query<AssessmentRow>(
      `SELECT a.id, a.type, a.scheduled_for, a.note,
         m.first_name, m.last_name, m.photo_url, co.name AS assessor
       FROM assessments a
       JOIN members m ON m.id = a.member_id AND m.tenant_id=$1
       LEFT JOIN coaches co ON co.id = a.assessor_id AND co.tenant_id=$1
       WHERE a.tenant_id=$1 AND a.result='scheduled'
       ORDER BY a.scheduled_for ASC NULLS LAST
       LIMIT 12`,
      [t],
    ),
    query<PromotionRow>(
      `SELECT p.id, p.promoted_at, p.discipline,
         m.first_name, m.last_name, m.photo_url,
         r.name AS rank_name, r.color AS rank_color, co.name AS promoted_by_name
       FROM promotions p
       JOIN members m ON m.id = p.member_id AND m.tenant_id=$1
       JOIN ranks r ON r.id = p.rank_id AND r.tenant_id=$1
       LEFT JOIN coaches co ON co.id = p.promoted_by AND co.tenant_id=$1
       WHERE p.tenant_id=$1
       ORDER BY p.promoted_at DESC NULLS LAST
       LIMIT 12`,
      [t],
    ),
  ]);

  const kpi = kpiRows[0];

  // Write-flow data (only needed for the action modals)
  const canWrite = can(user, "curriculum.write");
  let members: { id: string; first_name: string | null; last_name: string | null }[] = [];
  let coaches: { id: string; name: string }[] = [];
  if (canWrite) {
    [members, coaches] = await Promise.all([
      query<{ id: string; first_name: string | null; last_name: string | null }>(
        `SELECT id, first_name, last_name FROM members WHERE tenant_id=$1 ORDER BY last_name, first_name`,
        [t],
      ),
      query<{ id: string; name: string }>(
        `SELECT id, name FROM coaches WHERE tenant_id=$1 AND active=true ORDER BY name`,
        [t],
      ),
    ]);
  }
  const rankOpts = ranks.map((r) => ({ id: r.id, name: r.name }));

  // Ranks grouped by discipline (belt ladder per discipline)
  const rankGroups = new Map<string, RankRow[]>();
  for (const r of ranks) {
    const key = r.discipline ?? "algemeen";
    (rankGroups.get(key) ?? rankGroups.set(key, []).get(key)!).push(r);
  }

  // Skills grouped by category
  const skillGroups = new Map<string, SkillRow[]>();
  for (const s of skills) {
    (skillGroups.get(s.category) ?? skillGroups.set(s.category, []).get(s.category)!).push(s);
  }

  return (
    <>
      <PageHeader
        title="Curriculum & ranks"
        subtitle="Techniekbibliotheek, belt-progressie, gradings en promoties"
        icon="belt"
        actions={canWrite ? (
          <div className="flex items-center gap-2">
            <AwardPromotionModal members={members} ranks={rankOpts} coaches={coaches} />
            <ScheduleGradingModal members={members} coaches={coaches} />
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Disciplines" value={kpi?.disciplines ?? 0} icon="layers" tone="indigo" />
        <StatCard label="Skills" value={kpi?.skills ?? 0} icon="book" tone="brand" sub="in bibliotheek" />
        <StatCard label="Ranks" value={kpi?.ranks ?? 0} icon="belt" tone="purple" />
        <StatCard label="Promoties dit jaar" value={kpi?.promotions_year ?? 0} icon="trophy" tone="green" />
        <StatCard label="Aankomende gradings" value={kpi?.upcoming_gradings ?? 0} icon="clipboard" tone="amber" />
      </div>

      <Section title="Belt-progressie">
        {rankGroups.size === 0 ? (
          <EmptyState icon="belt" title="Nog geen ranks ingericht" subtitle="Voeg ranks toe per discipline om de progressie te tonen." />
        ) : (
          <div className="space-y-4">
            {[...rankGroups.entries()].map(([discipline, list]) => (
              <Card key={discipline}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="flag" size={15} className="faint" />
                  <h3 className="font-semibold">{titleCase(discipline)}</h3>
                  <span className="text-xs faint">{list.length} niveaus</span>
                </div>
                <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
                  {list.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-1 shrink-0">
                      <div
                        className="rounded-xl px-3 py-2.5 min-w-[9rem]"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border"
                            style={{ background: r.color ?? "var(--brand)", borderColor: "rgba(0,0,0,.15)" }}
                          />
                          <span className="text-sm font-semibold truncate">{r.name}</span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-xs">
                          <span className="faint">{r.min_attendance ?? 0}× aanwezig</span>
                          <span className="font-semibold tabular-nums" style={{ color: "var(--brand)" }}>
                            {r.member_count} lid{r.member_count === 1 ? "" : "leden"}
                          </span>
                        </div>
                      </div>
                      {i < list.length - 1 && <Icon name="chevronRight" size={14} className="faint shrink-0" />}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Skill-bibliotheek">
        {skillGroups.size === 0 ? (
          <EmptyState icon="book" title="Nog geen skills" subtitle="Bouw de techniekbibliotheek op per curriculum." />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...skillGroups.entries()].map(([cat, list]) => (
              <Card key={cat} padding={false}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <h3 className="font-semibold">{CATEGORY_LABEL[cat] ?? titleCase(cat)}</h3>
                  <Badge tone="slate">{list.length}</Badge>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {list.map((s) => (
                    <div key={s.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge tone="green">{s.mastered} beheerst</Badge>
                          <Badge tone="blue">{s.competent} competent</Badge>
                        </div>
                      </div>
                      {s.curriculum_name && <p className="text-xs faint mt-0.5 truncate">{s.curriculum_name}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Aankomende gradings & assessments">
          {gradings.length === 0 ? (
            <EmptyState icon="clipboard" title="Geen geplande gradings" subtitle="Plan assessments in om ze hier te zien." />
          ) : (
            <Card padding={false}>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {gradings.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 p-3">
                    <Avatar name={fullName(g)} url={g.photo_url} size={34} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fullName(g)}</p>
                      <p className="text-xs muted truncate">
                        {titleCase(g.type)}{g.assessor ? ` · ${g.assessor}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">{dateNL(g.scheduled_for)}</p>
                      <StatusBadge status="scheduled" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>

        <Section title="Recente promoties">
          {promotions.length === 0 ? (
            <EmptyState icon="trophy" title="Nog geen promoties" subtitle="Promoties verschijnen hier zodra ze zijn vastgelegd." />
          ) : (
            <Card padding={false}>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {promotions.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3">
                    <Avatar name={fullName(p)} url={p.photo_url} size={34} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fullName(p)}</p>
                      <p className="text-xs muted truncate">
                        {p.discipline ? titleCase(p.discipline) : "—"}
                        {p.promoted_by_name ? ` · door ${p.promoted_by_name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="w-3 h-3 rounded-full border"
                        style={{ background: p.rank_color ?? "var(--brand)", borderColor: "rgba(0,0,0,.15)" }}
                      />
                      <div className="text-right">
                        <p className="text-sm font-semibold">{p.rank_name ?? "—"}</p>
                        <p className="text-xs faint">{dateNL(p.promoted_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>
      </div>
    </>
  );
}
