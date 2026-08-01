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

const CATEGORIES = ["combat_drill", "strength", "conditioning", "mobility", "recovery", "technique"];

/** Couple/replace the demo video (URL) + instructions + safety notes for an exercise. */
export async function updateExercise(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "training.write")) throw new Error("Geen rechten.");
  const id = String(formData.get("exerciseId") ?? "");
  if (!id) return;
  const videoUrl = String(formData.get("video_url") ?? "").trim() || null;
  const instructions = String(formData.get("instructions") ?? "").trim() || null;
  const safety = String(formData.get("safety_notes") ?? "").trim() || null;
  await query(
    `UPDATE exercises SET video_url=$1, instructions=$2, safety_notes=$3 WHERE id=$4 AND tenant_id=$5`,
    [videoUrl, instructions, safety, id, user.tenantId]
  );
  revalidatePath("/app/training");
}

/** Add a new exercise to the library (optionally with a demo video). */
export async function createExercise(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "training.write")) throw new Error("Geen rechten.");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Naam is verplicht.");
  const catRaw = String(formData.get("category") ?? "strength");
  const category = CATEGORIES.includes(catRaw) ? catRaw : "strength";
  const equipment = String(formData.get("equipment") ?? "").trim() || null;
  const level = String(formData.get("level") ?? "").trim() || null;
  const videoUrl = String(formData.get("video_url") ?? "").trim() || null;
  const instructions = String(formData.get("instructions") ?? "").trim() || null;
  const safety = String(formData.get("safety_notes") ?? "").trim() || null;
  await query(
    `INSERT INTO exercises (id, tenant_id, name, category, equipment, level, video_url, instructions, safety_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [randomUUID(), user.tenantId, name, category, equipment, level, videoUrl, instructions, safety]
  );
  revalidatePath("/app/training");
}
