"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

/** Award a rank promotion to a member. */
export async function awardPromotion(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "curriculum.write")) throw new Error("Geen rechten om promoties vast te leggen.");
  const t = user.tenantId;

  const memberId = String(formData.get("member_id") ?? "").trim();
  const rankId = String(formData.get("rank_id") ?? "").trim();
  if (!memberId || !rankId) throw new Error("Lid en rank zijn verplicht.");
  const discipline = String(formData.get("discipline") ?? "").trim() || null;
  const promotedBy = String(formData.get("promoted_by") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  await query(
    `INSERT INTO promotions (id, tenant_id, member_id, rank_id, discipline, promoted_by, promoted_at, note)
     VALUES ($1,$2,$3,$4,$5,$6,current_date,$7)`,
    [randomUUID(), t, memberId, rankId, discipline, promotedBy, note],
  );

  revalidatePath("/app/curriculum");
}

/** Schedule a grading assessment for a member. */
export async function scheduleAssessment(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "curriculum.write")) throw new Error("Geen rechten om assessments te plannen.");
  const t = user.tenantId;

  const memberId = String(formData.get("member_id") ?? "").trim();
  if (!memberId) throw new Error("Lid is verplicht.");
  const scheduledFor = String(formData.get("scheduled_for") ?? "").trim() || null;
  const assessorId = String(formData.get("assessor_id") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  await query(
    `INSERT INTO assessments (id, tenant_id, member_id, type, scheduled_for, result, assessor_id, note)
     VALUES ($1,$2,$3,'grading',$4,'scheduled',$5,$6)`,
    [randomUUID(), t, memberId, scheduledFor, assessorId, note],
  );

  revalidatePath("/app/curriculum");
}
