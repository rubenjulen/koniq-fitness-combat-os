import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/db/client";

const COOKIE = "koniq_fit_session";
const ADMIN_COOKIE = "koniq_fit_admin"; // stashes the platform-admin token while impersonating a tenant
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type TenantContext = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  defaultLanguage: string;
  timezone: string;
  brand: Record<string, unknown>;
  planKey: string | null;
};

export type SessionUser = {
  id: string;
  tenantId: string | null;
  email: string;
  name: string;
  avatarUrl: string | null;
  roleId: string | null;
  roleKey: string | null;
  roleName: string | null;
  capabilities: string[];
  isPlatformAdmin: boolean;
  locationId: string | null;
  tenant: TenantContext | null;
};

export function hashPassword(pw: string) {
  return bcrypt.hashSync(pw, 10);
}
export function verifyPassword(pw: string, hash: string) {
  return bcrypt.compareSync(pw, hash);
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await queryOne<{ id: string; tenant_id: string | null; password_hash: string; active: boolean }>(
    `SELECT u.id, u.tenant_id, u.password_hash, u.active
       FROM users u
      WHERE lower(u.email) = lower($1)
      ORDER BY u.is_platform_admin DESC
      LIMIT 1`,
    [email.trim()]
  );
  if (!user || !user.active) return { ok: false, error: "Onbekende gebruiker of account inactief." };
  if (!verifyPassword(password, user.password_hash)) return { ok: false, error: "Onjuist wachtwoord." };

  const token = randomBytes(32).toString("hex");
  await query(
    `INSERT INTO sessions (id, user_id, tenant_id, token, expires_at) VALUES ($1,$2,$3,$4, now() + interval '7 days')`,
    [randomUUID(), user.id, user.tenant_id, token]
  );
  await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await query(`DELETE FROM sessions WHERE token = $1`, [token]);
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const row = await queryOne<{
    id: string; tenant_id: string | null; email: string; name: string; avatar_url: string | null;
    role_id: string | null; is_platform_admin: boolean; location_id: string | null;
    role_key: string | null; role_name: string | null; capabilities: string[] | null;
    t_id: string | null; t_name: string | null; t_slug: string | null; t_currency: string | null;
    t_lang: string | null; t_tz: string | null; t_brand: Record<string, unknown> | null; t_plan: string | null;
  }>(
    `SELECT u.id, u.tenant_id, u.email, u.name, u.avatar_url, u.role_id, u.is_platform_admin, u.location_id,
            r.key AS role_key, r.name AS role_name, r.capabilities AS capabilities,
            t.id AS t_id, t.name AS t_name, t.slug AS t_slug, t.currency AS t_currency,
            t.default_language AS t_lang, t.timezone AS t_tz, t.brand AS t_brand, t.plan_key AS t_plan
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE s.token = $1 AND s.expires_at > now() AND u.active = true`,
    [token]
  );
  if (!row) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    roleId: row.role_id,
    roleKey: row.role_key,
    roleName: row.role_name,
    capabilities: Array.isArray(row.capabilities) ? row.capabilities : [],
    isPlatformAdmin: row.is_platform_admin,
    locationId: row.location_id,
    tenant: row.t_id
      ? {
          id: row.t_id,
          name: row.t_name!,
          slug: row.t_slug!,
          currency: row.t_currency!,
          defaultLanguage: row.t_lang!,
          timezone: row.t_tz!,
          brand: row.t_brand ?? {},
          planKey: row.t_plan,
        }
      : null,
  };
}

/** Require an authenticated back-office user with a tenant. Platform admins → /platform. */
export async function requireSession(): Promise<SessionUser & { tenantId: string; tenant: TenantContext }> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!s.tenantId || !s.tenant) {
    if (s.isPlatformAdmin) redirect("/platform");
    redirect("/login");
  }
  return s as SessionUser & { tenantId: string; tenant: TenantContext };
}

/** Require the KoniQ platform super-admin. Others → /login (or their app). */
export async function requirePlatformAdmin(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!s.isPlatformAdmin) redirect("/app");
  return s;
}

/** Create a session row for a user id and return its token (does not set the cookie). */
export async function createSessionForUser(userId: string, tenantId: string | null): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await query(
    `INSERT INTO sessions (id, user_id, tenant_id, token, expires_at) VALUES ($1,$2,$3,$4, now() + interval '7 days')`,
    [randomUUID(), userId, tenantId, token]
  );
  return token;
}

async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}

/** Platform admin opens a customer's back-office (impersonation), stashing the admin token to return later. */
export async function beginImpersonation(ownerUserId: string, tenantId: string) {
  const jar = await cookies();
  const adminToken = jar.get(COOKIE)?.value;
  if (adminToken) jar.set(ADMIN_COOKIE, adminToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
  const token = await createSessionForUser(ownerUserId, tenantId);
  await setSessionCookie(token);
}

/** Return from impersonation to the platform console. */
export async function endImpersonation() {
  const jar = await cookies();
  const adminToken = jar.get(ADMIN_COOKIE)?.value;
  const current = jar.get(COOKIE)?.value;
  if (current) await query(`DELETE FROM sessions WHERE token=$1`, [current]); // drop the impersonation session
  if (adminToken) {
    await setSessionCookie(adminToken);
    jar.delete(ADMIN_COOKIE);
  } else {
    jar.delete(COOKIE);
  }
}

/** Is the current request a platform-admin impersonating a tenant? */
export async function isImpersonating(): Promise<boolean> {
  const jar = await cookies();
  return !!jar.get(ADMIN_COOKIE)?.value;
}
