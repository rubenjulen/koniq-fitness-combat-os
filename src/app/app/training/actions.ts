"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

type WeekJson = {
  ma: string[]; di: string[]; wo: string[]; do: string[]; vr: string[]; za: string[]; zo: string[];
};

const GOALS = ["general_fitness", "technique", "fight_camp", "weight_loss"];

/** Sensible default week, optionally seeded with exercise names supplied by the coach. */
function buildWeek(exercises: string[]): WeekJson {
  if (exercises.length > 0) {
    // Spread the supplied exercises across the four training days, two per day.
    const days: (keyof WeekJson)[] = ["ma", "di", "do", "vr"];
    const week: WeekJson = { ma: [], di: [], wo: ["Rust / mobiliteit"], do: [], vr: [], za: ["Lange duurtraining"], zo: ["Rust"] };
    exercises.forEach((ex, i) => {
      const day = days[i % days.length];
      week[day].push(ex);
    });
    for (const d of days) if (week[d].length === 0) week[d].push("Techniek: basis combinaties");
    return week;
  }
  return {
    ma: ["Warming-up 10 min", "Techniek: basis combinaties"],
    di: ["Kracht: full body", "Core-circuit"],
    wo: ["Rust / mobiliteit"],
    do: ["Conditie: intervallen", "Bag work"],
    vr: ["Techniek: pad work", "Cooldown"],
    za: ["Lange duurtraining"],
    zo: ["Rust"],
  };
}

/** Coach creates a training plan for a member (optionally seeded from a template). */
export async function createTrainingPlan(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "training.write")) throw new Error("Geen rechten om trainingsplannen aan te maken.");
  const t = user.tenantId;

  const memberId = String(formData.get("member_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!memberId) throw new Error("Kies een lid.");
  if (!name) throw new Error("Naam is verplicht.");
  const goalRaw = String(formData.get("goal") ?? "general_fitness");
  const goal = GOALS.includes(goalRaw) ? goalRaw : "general_fitness";
  const templateId = String(formData.get("template_id") ?? "") || null;

  const exercises = String(formData.get("exercises") ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const week = buildWeek(exercises);

  const explanation = templateId ? "Opgesteld vanuit een programmasjabloon." : null;

  await query(
    `INSERT INTO training_plans (id, tenant_id, member_id, name, goal, status, generated_by, week, explanation)
     VALUES ($1,$2,$3,$4,$5,'active','coach',$6,$7)`,
    [randomUUID(), t, memberId, name, goal, JSON.stringify(week), explanation]
  );
  revalidatePath("/app/training");
}
