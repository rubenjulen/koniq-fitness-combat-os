"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query, queryOne } from "@/db/client";

/** Create a new staff user for this tenant (owner only). */
export async function createStaffUser(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "settings.write")) throw new Error("Geen rechten.");
  const t = user.tenantId;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const roleId = String(formData.get("role_id") ?? "") || null;

  if (!name) throw new Error("Naam is verplicht.");
  if (!email) throw new Error("E-mail is verplicht.");
  if (password.length < 6) throw new Error("Wachtwoord moet minstens 6 tekens zijn.");

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM users WHERE lower(email)=$1`,
    [email]
  );
  if (existing) throw new Error("Er bestaat al een gebruiker met dit e-mailadres.");

  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = randomUUID();
  await query(
    `INSERT INTO users (id, tenant_id, email, password_hash, name, role_id, is_platform_admin, active)
     VALUES ($1,$2,$3,$4,$5,$6,false,true)`,
    [userId, t, email, passwordHash, name, roleId]
  );

  await query(
    `INSERT INTO audit_log (id, tenant_id, user_id, actor_name, action, entity, entity_id, meta)
     VALUES ($1,$2,$3,$4,'create','user',$5,$6)`,
    [randomUUID(), t, user.id, user.name, userId, JSON.stringify({ email, name })]
  );
  revalidatePath("/app/team");
}

/** Toggle a staff user active/inactive (owner only). */
export async function toggleStaffUser(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "settings.write")) throw new Error("Geen rechten.");
  const t = user.tenantId;
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  await query(
    `UPDATE users SET active = NOT active
      WHERE id=$1 AND tenant_id=$2 AND is_platform_admin=false`,
    [userId, t]
  );
  revalidatePath("/app/team");
}
