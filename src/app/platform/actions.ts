"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin, beginImpersonation, endImpersonation } from "@/lib/auth";
import { query, queryOne } from "@/db/client";
import { createTenant } from "@/lib/provisioning";
import { featuresForEdition, FEATURE_KEYS, edition } from "@/lib/editions";

/** Create a brand-new customer (school/tenant) + first owner login. */
export async function createCustomer(formData: FormData) {
  await requirePlatformAdmin();
  const res = await createTenant({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    editionKey: String(formData.get("edition") ?? "starter"),
    ownerName: String(formData.get("owner_name") ?? ""),
    ownerEmail: String(formData.get("owner_email") ?? ""),
    ownerPassword: String(formData.get("owner_password") ?? ""),
    currency: String(formData.get("currency") ?? "SRD"),
    tagline: String(formData.get("tagline") ?? ""),
  });
  if (!res.ok) throw new Error(res.error);
  revalidatePath("/platform");
}

/** Change a customer's edition (resets feature entitlements to that preset). */
export async function setTenantEdition(formData: FormData) {
  await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  const ed = edition(String(formData.get("edition") ?? ""));
  if (!tenantId) return;
  const on = new Set(featuresForEdition(ed.key));
  await query(`UPDATE tenants SET plan_key=$1 WHERE id=$2`, [ed.key, tenantId]);
  await query(`DELETE FROM tenant_features WHERE tenant_id=$1`, [tenantId]);
  for (const key of FEATURE_KEYS) {
    await query(`INSERT INTO tenant_features (tenant_id, feature_key, enabled) VALUES ($1,$2,$3)`, [tenantId, key, on.has(key)]);
  }
  revalidatePath("/platform");
}

/** Suspend or reactivate a customer. */
export async function setTenantStatus(formData: FormData) {
  await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!tenantId || !["active", "suspended"].includes(status)) return;
  await query(`UPDATE tenants SET status=$1 WHERE id=$2`, [status, tenantId]);
  revalidatePath("/platform");
}

/** Open a customer's back-office as its owner (impersonation) to see what they see. */
export async function impersonateTenant(formData: FormData) {
  await requirePlatformAdmin();
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!tenantId) return;
  const owner = await queryOne<{ id: string }>(
    `SELECT u.id FROM users u LEFT JOIN roles r ON r.id=u.role_id
      WHERE u.tenant_id=$1 AND u.active ORDER BY (r.key='owner') DESC, u.created_at LIMIT 1`,
    [tenantId]
  );
  if (!owner) throw new Error("Deze klant heeft geen actief gebruikersaccount.");
  await beginImpersonation(owner.id, tenantId);
  redirect("/app");
}

/** Return from impersonation back to the platform console. */
export async function stopImpersonation() {
  await endImpersonation();
  redirect("/platform");
}
