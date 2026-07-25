"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query, queryOne } from "@/db/client";

const STATUSES = ["new", "contacted", "trial_booked", "trial_attended", "offer", "won", "lost"];

export async function createLead(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "lead.write")) throw new Error("Geen rechten.");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Naam is verplicht.");
  await query(
    `INSERT INTO leads (id, tenant_id, name, phone, whatsapp, email, source, discipline, age_group, package_interest, status, owner_id, created_at)
     VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,'new',$10, now())`,
    [randomUUID(), user.tenantId, name,
     String(formData.get("phone") ?? "") || null,
     String(formData.get("email") ?? "") || null,
     String(formData.get("source") ?? "walk_in"),
     String(formData.get("discipline") ?? "") || null,
     String(formData.get("age_group") ?? "adult"),
     String(formData.get("package_interest") ?? "") || null,
     user.id]
  );
  revalidatePath("/app/leads");
}

export async function advanceLead(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "lead.write")) throw new Error("Geen rechten.");
  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!leadId || !STATUSES.includes(status)) return;
  const lostReason = status === "lost" ? (String(formData.get("lost_reason") ?? "") || null) : null;
  await query(
    `UPDATE leads SET status=$1, lost_reason=$2,
        first_response_at = COALESCE(first_response_at, CASE WHEN $1 <> 'new' THEN now() ELSE NULL END)
      WHERE id=$3 AND tenant_id=$4`,
    [status, lostReason, leadId, user.tenantId]
  );
  revalidatePath("/app/leads");
}

/** Convert a lead into a member (won) without re-typing data. */
export async function convertLead(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "member.write")) throw new Error("Geen rechten om leden aan te maken.");
  const t = user.tenantId;
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return;

  const lead = await queryOne<{ name: string; phone: string | null; whatsapp: string | null; email: string | null; source: string | null; discipline: string | null; member_id: string | null }>(
    `SELECT name, phone, whatsapp, email, source, discipline, member_id FROM leads WHERE id=$1 AND tenant_id=$2`,
    [leadId, t]
  );
  if (!lead || lead.member_id) { revalidatePath("/app/leads"); return; }

  const parts = lead.name.trim().split(/\s+/);
  const first = parts[0] ?? lead.name;
  const last = parts.slice(1).join(" ") || "—";
  const cnt = await queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM members WHERE tenant_id=$1`, [t]);
  const memberNo = "KS-" + (1000 + (cnt?.n ?? 0));
  const memberId = randomUUID();

  await query(
    `INSERT INTO members (id, tenant_id, member_no, first_name, last_name, email, phone, whatsapp, status, join_date, source, goal)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'trial',current_date,$9,$10)`,
    [memberId, t, memberNo, first, last, lead.email, lead.phone, lead.whatsapp, lead.source, lead.discipline]
  );
  await query(`UPDATE leads SET status='won', member_id=$1 WHERE id=$2 AND tenant_id=$3`, [memberId, leadId, t]);
  await query(
    `INSERT INTO audit_log (id, tenant_id, user_id, actor_name, action, entity, entity_id, meta)
     VALUES ($1,$2,$3,$4,'create','member',$5,$6)`,
    [randomUUID(), t, user.id, user.name, memberId, JSON.stringify({ from_lead: leadId })]
  );
  revalidatePath("/app/leads");
  revalidatePath("/app/members");
}
