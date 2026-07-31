"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireMember } from "@/lib/portal-auth";
import { query, queryOne } from "@/db/client";

/** Finish a guided workout: log it and return to the member home. */
export async function completeWorkout(formData: FormData) {
  const m = await requireMember();
  const summary = String(formData.get("summary") ?? "").trim() || "Geleide workout";
  const rpeRaw = String(formData.get("rpe") ?? "").trim();
  const rpe = rpeRaw ? parseInt(rpeRaw, 10) : null;
  await query(
    `INSERT INTO workout_logs (id, tenant_id, member_id, log_date, summary, rpe, completed)
     VALUES ($1,$2,$3,current_date,$4,$5,true)`,
    [randomUUID(), m.tenantId, m.id, summary, rpe !== null && !isNaN(rpe) ? rpe : null]
  );
  revalidatePath("/portal");
  revalidatePath("/portal/training");
  redirect("/portal");
}

/** Book today's class for the logged-in member (idempotent per member+class+day). */
export async function bookClass(formData: FormData) {
  const m = await requireMember();
  const classId = String(formData.get("classId") ?? "");
  if (!classId) return;

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM bookings
      WHERE tenant_id=$1 AND member_id=$2 AND class_id=$3 AND session_date=current_date
      LIMIT 1`,
    [m.tenantId, m.id, classId]
  );
  if (existing) return;

  await query(
    `INSERT INTO bookings (id, tenant_id, class_id, member_id, session_date, status)
     VALUES ($1,$2,$3,$4,current_date,'booked')`,
    [randomUUID(), m.tenantId, classId, m.id]
  );
  revalidatePath("/portal");
}

/** Log a one-click workout for the logged-in member. */
export async function logWorkout(formData: FormData) {
  const m = await requireMember();
  const summary = String(formData.get("summary") ?? "").trim() || "Eigen training";
  const rpeRaw = String(formData.get("rpe") ?? "").trim();
  const rpe = rpeRaw ? parseInt(rpeRaw, 10) : null;
  const rpeVal = rpe !== null && !isNaN(rpe) ? rpe : null;

  await query(
    `INSERT INTO workout_logs (id, tenant_id, member_id, log_date, summary, rpe, completed)
     VALUES ($1,$2,$3,current_date,$4,$5,true)`,
    [randomUUID(), m.tenantId, m.id, summary, rpeVal]
  );
  revalidatePath("/portal");
  revalidatePath("/portal/training");
}
