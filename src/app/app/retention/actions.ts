"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

const TASK_TYPES = ["at_risk", "winback", "check_in", "freeze_recovery"];

/** Mark a retention task as handled. */
export async function completeTask(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "retention.write")) throw new Error("Geen rechten om retentietaken te wijzigen.");
  const t = user.tenantId;
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;
  await query(`UPDATE retention_tasks SET status='done' WHERE id=$1 AND tenant_id=$2`, [taskId, t]);
  revalidatePath("/app/retention");
}

/** Create a new retention task for a member. */
export async function createRetentionTask(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "retention.write")) throw new Error("Geen rechten om retentietaken aan te maken.");
  const t = user.tenantId;

  const memberId = String(formData.get("member_id") ?? "") || null;
  const type = String(formData.get("type") ?? "at_risk");
  if (!TASK_TYPES.includes(type)) throw new Error("Ongeldig type.");
  const reason = String(formData.get("reason") ?? "") || null;
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const note = String(formData.get("note") ?? "") || null;

  await query(
    `INSERT INTO retention_tasks (id, tenant_id, member_id, type, reason, status, owner_id, due_date, note)
     VALUES ($1,$2,$3,$4,$5,'open',$6,$7,$8)`,
    [randomUUID(), t, memberId, type, reason, user.id, dueDate, note]
  );
  revalidatePath("/app/retention");
}
