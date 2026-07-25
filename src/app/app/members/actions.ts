"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query, queryOne } from "@/db/client";

function isMinor(dob: string): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  return age < 18;
}

/** Create a new member; optionally attach a package → active membership + first invoice. */
export async function createMember(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "member.write")) throw new Error("Geen rechten om leden aan te maken.");
  const t = user.tenantId;

  const first = String(formData.get("first_name") ?? "").trim();
  const last = String(formData.get("last_name") ?? "").trim();
  if (!first || !last) throw new Error("Voor- en achternaam zijn verplicht.");
  const dob = String(formData.get("dob") ?? "") || null;
  const gender = String(formData.get("gender") ?? "") || null;
  const phone = String(formData.get("phone") ?? "") || null;
  const email = String(formData.get("email") ?? "") || null;
  const goal = String(formData.get("goal") ?? "") || null;
  const experience = String(formData.get("experience") ?? "") || null;
  const source = String(formData.get("source") ?? "") || null;
  const status = String(formData.get("status") ?? "active");
  const packageId = String(formData.get("package_id") ?? "") || null;

  const cnt = await queryOne<{ n: number }>(`SELECT count(*)::int AS n FROM members WHERE tenant_id=$1`, [t]);
  const memberNo = "KS-" + (1000 + (cnt?.n ?? 0));
  const minor = dob ? isMinor(dob) : false;

  const memberId = randomUUID();
  await query(
    `INSERT INTO members (id, tenant_id, member_no, first_name, last_name, dob, gender, email, phone, whatsapp, is_minor, status, join_date, source, goal, experience)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,current_date,$12,$13,$14)`,
    [memberId, t, memberNo, first, last, dob, gender, email, phone, minor, status, source, goal, experience]
  );

  if (packageId) {
    const pkg = await queryOne<{ price: number; billing_period: string }>(
      `SELECT price::float AS price, billing_period FROM packages WHERE id=$1 AND tenant_id=$2`, [packageId, t]
    );
    if (pkg) {
      const msId = randomUUID();
      await query(
        `INSERT INTO memberships (id, tenant_id, member_id, package_id, payer_member_id, status, start_date, next_bill_date, price, currency, auto_renew)
         VALUES ($1,$2,$3,$4,$3,'active',current_date, current_date + interval '30 days', $5, $6, true)`,
        [msId, t, memberId, packageId, pkg.price, user.tenant.currency]
      );
      await query(
        `INSERT INTO invoices (id, tenant_id, member_id, payer_member_id, membership_id, number, category, amount, currency, status, issued_at, due_date, description)
         VALUES ($1,$2,$3,$3,$4,$5,'membership',$6,$7,'due',current_date, current_date + interval '7 days','Eerste lidmaatschapsfactuur')`,
        [randomUUID(), t, memberId, msId, "F-" + Math.floor(10000 + Math.random() * 89999), pkg.price, user.tenant.currency]
      );
    }
  }

  await query(
    `INSERT INTO audit_log (id, tenant_id, user_id, actor_name, action, entity, entity_id, meta)
     VALUES ($1,$2,$3,$4,'create','member',$5,$6)`,
    [randomUUID(), t, user.id, user.name, memberId, JSON.stringify({ memberNo })]
  );
  revalidatePath("/app/members");
}

/** Quick status change from the member detail page. */
export async function setMemberStatus(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "member.write")) throw new Error("Geen rechten.");
  const memberId = String(formData.get("memberId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = ["prospect", "trial", "active", "frozen", "overdue", "cancelled", "alumni"];
  if (!memberId || !allowed.includes(status)) return;
  await query(`UPDATE members SET status=$1 WHERE id=$2 AND tenant_id=$3`, [status, memberId, user.tenantId]);
  revalidatePath(`/app/members/${memberId}`);
  revalidatePath("/app/members");
}

/** Add an emergency contact to a member. */
export async function addEmergencyContact(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "member.write")) throw new Error("Geen rechten.");
  const t = user.tenantId;
  const memberId = String(formData.get("memberId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!memberId || !name) throw new Error("Naam is verplicht.");
  const relationship = String(formData.get("relationship") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const medicalNote = String(formData.get("medical_note") ?? "").trim() || null;
  await query(
    `INSERT INTO emergency_contacts (id, tenant_id, member_id, name, relationship, phone, medical_note)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [randomUUID(), t, memberId, name, relationship, phone, medicalNote]
  );
  revalidatePath(`/app/members/${memberId}`);
}

/** Toggle a membership between active and frozen (30-day freeze). */
export async function freezeMembership(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "member.write")) throw new Error("Geen rechten.");
  const t = user.tenantId;
  const membershipId = String(formData.get("membershipId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  if (!membershipId) return;
  await query(
    `UPDATE memberships
        SET status = CASE WHEN status='frozen' THEN 'active' ELSE 'frozen' END,
            freeze_until = CASE WHEN status='frozen' THEN NULL ELSE current_date + interval '30 days' END
      WHERE id=$1 AND tenant_id=$2`,
    [membershipId, t]
  );
  if (memberId) revalidatePath(`/app/members/${memberId}`);
  revalidatePath("/app/members");
}
