"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

const GOALS = ["maintain", "lose_fat", "gain_muscle", "performance"];
const STYLES = ["balanced", "high_protein", "vegetarian", "low_carb"];

function intOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isNaN(n) ? null : n;
}

/** Create a nutrition plan for a member (WHO-principle guidance, optional pro review). */
export async function createNutritionPlan(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "nutrition.write")) throw new Error("Geen rechten om voedingsplannen aan te maken.");
  const t = user.tenantId;

  const memberId = String(formData.get("member_id") ?? "").trim();
  if (!memberId) throw new Error("Kies een lid.");
  const goalRaw = String(formData.get("goal") ?? "maintain");
  const goal = GOALS.includes(goalRaw) ? goalRaw : "maintain";
  const styleRaw = String(formData.get("style") ?? "balanced");
  const style = STYLES.includes(styleRaw) ? styleRaw : "balanced";

  const calories = intOrNull(formData.get("calories"));
  const protein = intOrNull(formData.get("protein"));
  const carbs = intOrNull(formData.get("carbs"));
  const fat = intOrNull(formData.get("fat"));
  const macros = JSON.stringify({ protein, carbs, fat });
  const needsProReview = String(formData.get("needs_pro_review") ?? "false") === "true";

  await query(
    `INSERT INTO nutrition_plans (id, tenant_id, member_id, goal, style, calories, macros, status, needs_pro_review)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8)`,
    [randomUUID(), t, memberId, goal, style, calories, macros, needsProReview]
  );
  revalidatePath("/app/nutrition");
}
