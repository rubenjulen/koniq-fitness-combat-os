"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query, queryOne } from "@/db/client";

/** Kiosk check-in: register attendance for a member today (idempotent per day). */
export async function checkInMember(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "attendance.write")) throw new Error("Geen rechten voor check-in.");
  const memberId = String(formData.get("memberId") ?? "");
  if (!memberId) return;

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM attendance WHERE tenant_id=$1 AND member_id=$2 AND session_date=current_date LIMIT 1`,
    [user.tenantId, memberId]
  );
  if (existing) { revalidatePath("/app/checkin"); return; }

  // Attach the class currently in progress today (most recently started), else free training.
  const wd = ((new Date().getDay() + 6) % 7) + 1;
  const cls = await queryOne<{ id: string }>(
    `SELECT id FROM classes WHERE tenant_id=$1 AND active AND weekday=$2 AND start_time <= to_char(now(),'HH24:MI')
      ORDER BY start_time DESC LIMIT 1`,
    [user.tenantId, wd]
  );

  await query(
    `INSERT INTO attendance (id, tenant_id, member_id, class_id, session_date, checked_in_at, method, coach_confirmed)
     VALUES ($1,$2,$3,$4,current_date,now(),'kiosk',false)`,
    [randomUUID(), user.tenantId, memberId, cls?.id ?? null]
  );
  if (cls) {
    await query(
      `INSERT INTO bookings (id, tenant_id, class_id, member_id, session_date, status)
       VALUES ($1,$2,$3,$4,current_date,'attended')`,
      [randomUUID(), user.tenantId, cls.id, memberId]
    );
  }
  revalidatePath("/app/checkin");
}
