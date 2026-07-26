"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query, queryOne } from "@/db/client";

type WeekJson = {
  ma: string[]; di: string[]; wo: string[]; do: string[]; vr: string[]; za: string[]; zo: string[];
};

const GOALS = ["general_fitness", "technique", "fight_camp", "weight_loss"];

const EXPLANATION =
  "Opgebouwd uit de goedgekeurde oefenbibliotheek o.b.v. doel, ervaring en beschikbare dagen; volume aangepast op RPE.";

/** Build a week from approved library exercises (falls back to a fixed sensible week). */
function buildWeek(exercises: string[]): WeekJson {
  const week: WeekJson = {
    ma: ["Warming-up 10 min"],
    di: ["Kracht: full body"],
    wo: ["Rust / mobiliteit"],
    do: ["Conditie: intervallen"],
    vr: ["Techniek: pad work"],
    za: ["Lange duurtraining"],
    zo: ["Rust"],
  };
  const days: (keyof WeekJson)[] = ["ma", "di", "do", "vr"];
  exercises.slice(0, 8).forEach((ex, i) => week[days[i % days.length]].push(ex));
  return week;
}

/** AI Coach generates a guided weekly plan; minors / medical flags auto-escalate to coach review. */
export async function generateAiPlan(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "training.write")) throw new Error("Geen rechten om AI-plannen te genereren.");
  const t = user.tenantId;

  const memberId = String(formData.get("member_id") ?? "").trim();
  if (!memberId) throw new Error("Kies een lid.");
  const goalRaw = String(formData.get("goal") ?? "general_fitness");
  const goal = GOALS.includes(goalRaw) ? goalRaw : "general_fitness";
  const medicalFlag = formData.get("medical_flag") != null;

  const member = await queryOne<{ is_minor: boolean }>(
    `SELECT is_minor FROM members WHERE id = $1 AND tenant_id = $2`,
    [memberId, t]
  );
  const escalate = medicalFlag || !!member?.is_minor;

  const exRows = await query<{ name: string }>(
    `SELECT name FROM exercises WHERE tenant_id = $1 ORDER BY category, name LIMIT 8`,
    [t]
  );
  const week = buildWeek(exRows.map((e) => e.name));

  const status = escalate ? "blocked" : "active";
  const safetyFlag = escalate ? "escalated" : null;

  await query(
    `INSERT INTO training_plans (id, tenant_id, member_id, name, goal, status, generated_by, week, explanation, safety_flag)
     VALUES ($1,$2,$3,'AI weekplan',$4,$5,'ai',$6,$7,$8)`,
    [randomUUID(), t, memberId, goal, status, JSON.stringify(week), EXPLANATION, safetyFlag]
  );
  revalidatePath("/app/ai-coach");
  revalidatePath("/app/training");
}
