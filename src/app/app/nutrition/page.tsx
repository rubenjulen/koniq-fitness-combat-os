import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { fullName, titleCase } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Macros = { protein?: number; carbs?: number; fat?: number };

type PlanRow = {
  id: string;
  goal: string | null;
  style: string | null;
  calories: number | null;
  macros: Macros | null;
  status: string | null;
  needs_pro_review: boolean;
  risk_flag: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type Kpi = {
  active: number;
  needs_review: number;
  risk: number;
  avg_calories: number;
};

const DIET_STYLES = [
  { key: "balanced", label: "Gebalanceerd", desc: "Evenwichtige verdeling van eiwitten, koolhydraten en vetten volgens WHO-richtlijnen. Basis voor de meeste leden." },
  { key: "high_protein", label: "Eiwitrijk", desc: "Verhoogde eiwitinname ter ondersteuning van spieropbouw en herstel; koolhydraten en vetten blijven adequaat." },
  { key: "vegetarian", label: "Vegetarisch", desc: "Plantaardig met zuivel/ei; aandacht voor volwaardige eiwitbronnen, ijzer en B12." },
  { key: "low_carb", label: "Koolhydraatarm", desc: "Beperkte koolhydraten met behoud van adequate energie; niet toegepast bij minderjarigen." },
];

export default async function NutritionPage() {
  const user = await guard({ feature: "nutrition", cap: "nutrition.read" });
  if (!user.ok) return <FeatureLocked feature="Voeding" pack="performance" />;
  const t = user.tenantId;

  const [plans, kpiRows] = await Promise.all([
    query<PlanRow>(
      `SELECT np.id, np.goal, np.style, np.calories, np.macros, np.status,
              np.needs_pro_review, np.risk_flag, m.first_name, m.last_name, m.photo_url
         FROM nutrition_plans np
         JOIN members m ON m.id = np.member_id AND m.tenant_id = $1
        WHERE np.tenant_id = $1
        ORDER BY np.created_at DESC`,
      [t]
    ),
    query<Kpi>(
      `SELECT
         (SELECT count(*)::int FROM nutrition_plans WHERE tenant_id = $1 AND status = 'active') AS active,
         (SELECT count(*)::int FROM nutrition_plans WHERE tenant_id = $1 AND needs_pro_review = true) AS needs_review,
         (SELECT count(*)::int FROM nutrition_plans WHERE tenant_id = $1 AND risk_flag IS NOT NULL AND risk_flag <> 'green') AS risk,
         (SELECT COALESCE(avg(calories), 0)::int FROM nutrition_plans WHERE tenant_id = $1 AND calories IS NOT NULL) AS avg_calories`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { active: 0, needs_review: 0, risk: 0, avg_calories: 0 };

  return (
    <>
      <PageHeader
        title="Voeding"
        subtitle="Voedingsbegeleiding op basis van WHO-principes met professionele controle"
        icon="apple"
      />

      <Card className="mb-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg p-2" style={{ background: "var(--brand-soft)" }}>
            <Icon name="apple" size={22} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <h2 className="font-semibold mb-1" style={{ color: "var(--text)" }}>WHO-filosofie: adequaatheid, balans, matiging, diversiteit</h2>
            <p className="text-sm muted">
              Voedingsadvies richt zich op <strong>adequaatheid</strong> (voldoende energie en voedingsstoffen),
              <strong> balans</strong> tussen macronutriënten, <strong>matiging</strong> en <strong>diversiteit</strong> in voedselkeuzes —
              geen extreme diëten.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge tone="amber">Geen automatisch keto of extreem caloriearm voor minderjarigen</Badge>
              <Badge tone="red">Eetstoornis-risico → menselijke follow-up</Badge>
              <Badge tone="purple">Therapeutische diëten uitsluitend via professional</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Actieve voedingsplannen" value={k.active} icon="apple" tone="green" />
        <StatCard label="Pro-review nodig" value={k.needs_review} icon="alert" tone={k.needs_review > 0 ? "amber" : "slate"} />
        <StatCard label="Risicovlaggen" value={k.risk} icon="shield" tone={k.risk > 0 ? "red" : "slate"} />
        <StatCard label="Gem. calorieën" value={k.avg_calories} icon="fire" tone="brand" sub="kcal/dag" />
      </div>

      <Section title="Voedingsplannen">
        {plans.length === 0 ? (
          <EmptyState icon="apple" title="Nog geen voedingsplannen" subtitle="Stel voedingsplannen op voor je leden." />
        ) : (
          <DataTable
            head={
              <>
                <th>Lid</th>
                <th>Doel</th>
                <th>Stijl</th>
                <th className="text-right">Calorieën</th>
                <th>Macro's (E / K / V)</th>
                <th>Controle</th>
              </>
            }
          >
            {plans.map((p) => {
              const mac = p.macros ?? {};
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/app/members/${p.id}`} className="flex items-center gap-3 group">
                      <Avatar name={fullName(p)} url={p.photo_url} size={32} />
                      <span className="font-medium group-hover:underline truncate" style={{ color: "var(--text)" }}>{fullName(p)}</span>
                    </Link>
                  </td>
                  <td>{p.goal ? <Badge tone="indigo">{titleCase(p.goal)}</Badge> : <span className="faint">—</span>}</td>
                  <td>{p.style ? <Badge tone="blue">{titleCase(p.style)}</Badge> : <span className="faint">—</span>}</td>
                  <td className="text-right tabular-nums">{p.calories != null ? `${p.calories} kcal` : "—"}</td>
                  <td className="tabular-nums text-sm muted">
                    {mac.protein != null || mac.carbs != null || mac.fat != null
                      ? `${mac.protein ?? "—"}g / ${mac.carbs ?? "—"}g / ${mac.fat ?? "—"}g`
                      : "—"}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.needs_pro_review && <Badge tone="amber">pro-review</Badge>}
                      {p.risk_flag && p.risk_flag !== "green" && <Badge tone="red">{titleCase(p.risk_flag)}</Badge>}
                      {!p.needs_pro_review && (!p.risk_flag || p.risk_flag === "green") && <span className="faint text-sm">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>

      <div className="mt-6">
        <Section title="Dieetstijlen — referentie">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DIET_STYLES.map((s) => (
              <Card key={s.key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon name="apple" size={16} style={{ color: "var(--brand)" }} />
                  <h3 className="font-semibold" style={{ color: "var(--text)" }}>{s.label}</h3>
                  <Badge tone="slate">{s.key}</Badge>
                </div>
                <p className="text-sm muted">{s.desc}</p>
              </Card>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
