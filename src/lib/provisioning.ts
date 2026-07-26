import "server-only";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/db/client";
import { featuresForEdition, FEATURE_KEYS, edition } from "./editions";
import { ROLE_TEMPLATES } from "./rbac";

export type NewCustomerInput = {
  name: string;
  slug: string;
  editionKey: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  currency?: string;
  tagline?: string;
  primary?: string;
  accent?: string;
};

/**
 * Provision a brand-new customer (tenant): tenant row + feature entitlements for
 * the chosen edition + standard role templates + a first owner login.
 * Used by the platform-admin console and re-usable elsewhere. Returns the tenant id.
 */
export async function createTenant(input: NewCustomerInput): Promise<{ ok: true; tenantId: string } | { ok: false; error: string }> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!name) return { ok: false, error: "Naam is verplicht." };
  if (!slug) return { ok: false, error: "Slug is verplicht." };
  const email = input.ownerEmail.trim().toLowerCase();
  if (!email || !input.ownerPassword) return { ok: false, error: "Eigenaar e-mail en wachtwoord zijn verplicht." };

  const existsSlug = await queryOne<{ id: string }>(`SELECT id FROM tenants WHERE slug=$1`, [slug]);
  if (existsSlug) return { ok: false, error: `Slug "${slug}" is al in gebruik.` };
  const existsEmail = await queryOne<{ id: string }>(`SELECT id FROM users WHERE lower(email)=$1`, [email]);
  if (existsEmail) return { ok: false, error: `E-mail "${email}" is al in gebruik.` };

  const ed = edition(input.editionKey);
  const tenantId = randomUUID();
  await query(
    `INSERT INTO tenants (id, name, slug, subdomain, currency, plan_key, brand, status)
     VALUES ($1,$2,$3,$3,$4,$5,$6,'active')`,
    [tenantId, name, slug, input.currency || "SRD", ed.key,
     JSON.stringify({ tagline: input.tagline || "", primary: input.primary || "#e11d48", accent: input.accent || "#f59e0b" })]
  );

  const on = new Set(featuresForEdition(ed.key));
  for (const key of FEATURE_KEYS) {
    await query(`INSERT INTO tenant_features (tenant_id, feature_key, enabled) VALUES ($1,$2,$3)`,
      [tenantId, key, on.has(key)]);
  }

  const roleIds: Record<string, string> = {};
  for (const r of ROLE_TEMPLATES) {
    const id = randomUUID();
    roleIds[r.key] = id;
    await query(`INSERT INTO roles (id, tenant_id, key, name, capabilities, is_system) VALUES ($1,$2,$3,$4,$5,true)`,
      [id, tenantId, r.key, r.name, JSON.stringify(r.capabilities)]);
  }

  await query(
    `INSERT INTO users (id, tenant_id, email, password_hash, name, role_id, is_platform_admin, active)
     VALUES ($1,$2,$3,$4,$5,$6,false,true)`,
    [randomUUID(), tenantId, email, bcrypt.hashSync(input.ownerPassword, 10), input.ownerName.trim() || "Eigenaar", roleIds.owner]
  );

  return { ok: true, tenantId };
}
