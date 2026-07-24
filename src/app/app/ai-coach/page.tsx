import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { fullName, titleCase, WEEKDAYS_SHORT } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PlanRow = {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  safety_flag: string | null;
  explanation: string | null;
  approved_by: string | null;
  week: WeekJson | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type WeekJson = {
  ma?: string[];
  di?: string[];
  wo?: string[];
  do?: string[];
  vr?: string[];
  za?: string[];
  zo?: string[];
};

type Kpi = {
  ai_generated: number;
  approved: number;
  escalated: number;
  reviewed: number;
};

const DAY_KEYS: (keyof WeekJson)[] = ["ma", "di", "wo", "do", "vr", "za", "zo"];

const GUARDRAILS = [
  {
    code: "AIC-005",
    title: "Geen autonome sparring- of wedstrijdclearance",
    body: "De AI mag nooit zelfstandig toestemming geven voor sparring of competitie. Dat blijft een menselijk coach-besluit met medische onderbouwing.",
  },
  {
    code: "AIC-006",
    title: "Extra controles voor minderjarigen",
    body: "Voor leden onder de leeftijdsgrens gelden strengere belasting-, intensiteit- en oefeningslimieten; plannen worden altijd door een coach geverifieerd.",
  },
  {
    code: "AIC-007",
    title: "Escalatie bij medische red flags",
    body: "Bij pijnsignalen, blessures of gezondheidsvlaggen wordt het plan geblokkeerd of geëscaleerd naar een coach — nooit automatisch voortgezet.",
  },
];

export default async function AiCoachPage() {
  const user = await guard({ feature: "ai_coach", cap: "training.read" });
  if (!user.ok) return <FeatureLocked feature="AI Coach" pack="performance" />;
  const t = user.tenantId;

  const [plans, kpiRows] = await Promise.all([
    query<PlanRow>(
      `SELECT tp.id, tp.name, tp.goal, tp.status, tp.safety_flag, tp.explanation,
              tp.approved_by, tp.week, m.first_name, m.last_name, m.photo_url
         FROM training_plans tp
         JOIN members m ON m.id = tp.member_id AND m.tenant_id = $1
        WHERE tp.tenant_id = $1 AND tp.generated_by = 'ai'
        ORDER BY tp.created_at DESC`,
      [t]
    ),
    query<Kpi>(
      `SELECT
         (SELECT count(*)::int FROM training_plans WHERE tenant_id = $1 AND generated_by = 'ai') AS ai_generated,
         (SELECT count(*)::int FROM training_plans WHERE tenant_id = $1 AND generated_by = 'ai' AND approved_by IS NOT NULL) AS approved,
         (SELECT count(*)::int FROM training_plans WHERE tenant_id = $1 AND generated_by = 'ai'
            AND (safety_flag = 'escalated' OR status = 'blocked')) AS escalated,
         (SELECT count(*)::int FROM training_plans WHERE tenant_id = $1 AND generated_by = 'ai' AND approved_by IS NOT NULL) AS reviewed`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { ai_generated: 0, approved: 0, escalated: 0, reviewed: 0 };
  const reviewPct = k.ai_generated > 0 ? Math.round((k.reviewed / k.ai_generated) * 100) : 0;

  const example = plans.find((p) => p.week && DAY_KEYS.some((d) => (p.week?.[d]?.length ?? 0) > 0)) ?? null;

  return (
    <>
      <PageHeader
        title="AI Coach"
        subtitle="Veilige, begeleide trainingsplanning met menselijke eindcontrole"
        icon="sparkles"
      />

      <Card className="mb-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg p-2" style={{ background: "var(--brand-soft)" }}>
            <Icon name="shield" size={22} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <h2 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Veiligheidsmodel — geen vrije LLM</h2>
            <p className="text-sm muted">
              De AI Coach is een <strong>planning-engine</strong> die uitsluitend put uit de <strong>goedgekeurde oefeningenbibliotheek</strong>,
              begrensd door harde <strong>guardrails</strong> en met <strong>menselijke override</strong> als sluitstuk. Het genereert geen
              vrije adviezen: elk plan is samengesteld uit gevalideerde bouwstenen en wordt door een coach geaccordeerd voordat het live gaat.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge tone="red">AIC-005 · geen autonome sparring/wedstrijdclearance</Badge>
              <Badge tone="amber">AIC-006 · extra controles voor minderjarigen</Badge>
              <Badge tone="purple">AIC-007 · escalatie bij medische red flags</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="AI-plannen gegenereerd" value={k.ai_generated} icon="sparkles" tone="purple" />
        <StatCard label="Goedgekeurd door coach" value={k.approved} icon="check" tone="green" />
        <StatCard label="Geëscaleerd / geblokkeerd" value={k.escalated} icon="alert" tone={k.escalated > 0 ? "red" : "slate"} />
        <StatCard label="Met menselijke review" value={`${reviewPct}%`} icon="shield" tone="brand" sub={`${k.reviewed}/${k.ai_generated}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Section title="AI-gegenereerde plannen">
            {plans.length === 0 ? (
              <EmptyState icon="sparkles" title="Nog geen AI-plannen" subtitle="Er zijn nog geen plannen door de AI Coach gegenereerd." />
            ) : (
              <DataTable
                head={
                  <>
                    <th>Lid</th>
                    <th>Doel</th>
                    <th>Status</th>
                    <th>Veiligheid</th>
                    <th>Toelichting</th>
                    <th>Review</th>
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
                    <td>{p.goal ? <Badge tone="slate">{titleCase(p.goal)}</Badge> : <span className="faint">—</span>}</td>
                    <td>{p.status === "blocked" ? <StatusBadge status="red" /> : <StatusBadge status={p.status} />}</td>
                    <td>
                      {p.safety_flag === "escalated" ? (
                        <Badge tone="red">geëscaleerd — coach review</Badge>
                      ) : (
                        <Badge tone="green">binnen guardrails</Badge>
                      )}
                    </td>
                    <td className="muted text-sm max-w-xs truncate" title={p.explanation ?? undefined}>{p.explanation ?? "—"}</td>
                    <td>
                      {p.approved_by ? (
                        <Badge tone="green">gereviewd</Badge>
                      ) : (
                        <Badge tone="amber">wacht op review</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Section>
        </div>

        <div>
          <Section title="Guardrails actief">
            <Card>
              <ul className="space-y-3">
                {GUARDRAILS.map((g) => (
                  <li key={g.code} className="flex items-start gap-2.5">
                    <Icon name="check" size={16} style={{ color: "var(--brand)" }} className="mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: "var(--text)" }}>{g.title}</span>
                        <Badge tone="slate">{g.code}</Badge>
                      </div>
                      <p className="text-xs muted mt-0.5">{g.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        </div>
      </div>

      {example && (
        <div className="mt-6">
          <Section title="Voorbeeld AI-weekplan">
            <div className="mb-3 flex items-center gap-2 text-sm muted">
              <Avatar name={fullName(example)} url={example.photo_url} size={26} />
              <span className="font-medium" style={{ color: "var(--text)" }}>{fullName(example)}</span>
              <span className="faint">·</span>
              <span>{example.name}</span>
              {example.goal && <Badge tone="slate">{titleCase(example.goal)}</Badge>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {DAY_KEYS.map((day, i) => {
                const items = example.week?.[day] ?? [];
                return (
                  <Card key={day}>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--brand)" }}>
                      {WEEKDAYS_SHORT[i + 1]}
                    </div>
                    {items.length === 0 ? (
                      <p className="text-xs faint">Rust</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {items.map((it, j) => (
                          <li key={j} className="text-xs" style={{ color: "var(--text)" }}>{it}</li>
                        ))}
                      </ul>
                    )}
                  </Card>
                );
              })}
            </div>
          </Section>
        </div>
      )}
    </>
  );
}
