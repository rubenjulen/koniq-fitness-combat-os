"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query, queryOne } from "@/db/client";

/** Register a member for an event. */
export async function registerForEvent(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "event.write")) throw new Error("Geen rechten om inschrijvingen te registreren.");
  const t = user.tenantId;

  const eventId = String(formData.get("event_id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  const paid = String(formData.get("paid") ?? "false") === "true";
  if (!eventId || !memberId) return;

  const member = await queryOne<{ first_name: string; last_name: string }>(
    `SELECT first_name, last_name FROM members WHERE id=$1 AND tenant_id=$2`,
    [memberId, t]
  );
  if (!member) return;
  const name = `${member.first_name} ${member.last_name}`.trim();

  await query(
    `INSERT INTO event_registrations (id, tenant_id, event_id, member_id, name, status, paid)
     VALUES ($1,$2,$3,$4,$5,'registered',$6)`,
    [randomUUID(), t, eventId, memberId, name, paid]
  );

  await query(
    `INSERT INTO audit_log (id, tenant_id, user_id, actor_name, action, entity, entity_id, meta)
     VALUES ($1,$2,$3,$4,'create','event_registration',$5,$6)`,
    [randomUUID(), t, user.id, user.name, eventId, JSON.stringify({ member: name, paid })]
  );
  revalidatePath("/app/events");
}

/** Toggle the paid flag of a registration. */
export async function toggleRegistrationPaid(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "event.write")) throw new Error("Geen rechten.");
  const t = user.tenantId;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await query(`UPDATE event_registrations SET paid = NOT paid WHERE id=$1 AND tenant_id=$2`, [id, t]);
  revalidatePath("/app/events");
}
