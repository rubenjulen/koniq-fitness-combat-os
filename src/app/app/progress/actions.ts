"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

function floatOrNull(v: FormDataEntryValue | null): number | null {
  const n = parseFloat(String(v ?? ""));
  return Number.isNaN(n) ? null : n;
}

/** Add a goal for a member. */
export async function addGoal(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "progress.write")) throw new Error("Geen rechten om doelen aan te maken.");
  const t = user.tenantId;

  const memberId = String(formData.get("member_id") ?? "").trim();
  if (!memberId) throw new Error("Kies een lid.");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Titel is verplicht.");
  const baseline = String(formData.get("baseline") ?? "").trim() || null;
  const target = String(formData.get("target") ?? "").trim() || null;
  const targetDate = String(formData.get("target_date") ?? "").trim() || null;

  await query(
    `INSERT INTO goals (id, tenant_id, member_id, title, baseline, target, target_date, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'active')`,
    [randomUUID(), t, memberId, title, baseline, target, targetDate]
  );
  revalidatePath("/app/progress");
}

/** Log a private progress metric (weight / body fat) for a member. */
export async function logMetric(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "progress.write")) throw new Error("Geen rechten om metingen te loggen.");
  const t = user.tenantId;

  const memberId = String(formData.get("member_id") ?? "").trim();
  if (!memberId) throw new Error("Kies een lid.");
  const measuredOn = String(formData.get("measured_on") ?? "").trim() || null;
  const weight = floatOrNull(formData.get("weight"));
  const bodyFat = floatOrNull(formData.get("body_fat"));
  const note = String(formData.get("note") ?? "").trim() || null;

  await query(
    `INSERT INTO progress_metrics (id, tenant_id, member_id, measured_on, weight, body_fat, note, is_private)
     VALUES ($1,$2,$3, COALESCE($4::date, current_date), $5,$6,$7, true)`,
    [randomUUID(), t, memberId, measuredOn, weight, bodyFat, note]
  );
  revalidatePath("/app/progress");
}
