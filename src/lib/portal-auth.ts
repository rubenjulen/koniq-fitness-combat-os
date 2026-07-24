import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/db/client";

const COOKIE = "koniq_fit_member";
const MAX_AGE = 60 * 60 * 24 * 30;

export type MemberSession = {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  isMinor: boolean;
  tenantName: string;
  brand: Record<string, unknown>;
};

export async function memberLogin(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const m = await queryOne<{ id: string; tenant_id: string; portal_password_hash: string | null; status: string }>(
    `SELECT id, tenant_id, portal_password_hash, status FROM members WHERE lower(email)=lower($1) LIMIT 1`,
    [email.trim()]
  );
  if (!m || !m.portal_password_hash) return { ok: false, error: "Onbekend lid of nog geen app-toegang." };
  if (!bcrypt.compareSync(password, m.portal_password_hash)) return { ok: false, error: "Onjuist wachtwoord." };
  const token = randomBytes(32).toString("hex");
  await query(`INSERT INTO member_sessions (id, member_id, tenant_id, token, expires_at) VALUES ($1,$2,$3,$4, now() + interval '30 days')`,
    [randomUUID(), m.id, m.tenant_id, token]);
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
  return { ok: true };
}

export async function memberLogout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await query(`DELETE FROM member_sessions WHERE token=$1`, [token]);
  jar.delete(COOKIE);
}

export async function getMemberSession(): Promise<MemberSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const row = await queryOne<{ id: string; tenant_id: string; first_name: string; last_name: string; email: string | null; is_minor: boolean; t_name: string; t_brand: Record<string, unknown> | null }>(
    `SELECT m.id, m.tenant_id, m.first_name, m.last_name, m.email, m.is_minor, t.name AS t_name, t.brand AS t_brand
       FROM member_sessions s JOIN members m ON m.id=s.member_id JOIN tenants t ON t.id=m.tenant_id
      WHERE s.token=$1 AND s.expires_at > now()`, [token]);
  if (!row) return null;
  return { id: row.id, tenantId: row.tenant_id, firstName: row.first_name, lastName: row.last_name, email: row.email, isMinor: row.is_minor, tenantName: row.t_name, brand: row.t_brand ?? {} };
}

export async function requireMember(): Promise<MemberSession> {
  const s = await getMemberSession();
  if (!s) redirect("/portal/login");
  return s;
}
