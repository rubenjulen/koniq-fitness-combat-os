"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";
import { featuresForEdition, FEATURE_KEYS, edition } from "@/lib/editions";

async function requireOwner() {
  const user = await requireSession();
  if (!can(user, "settings.write") && !can(user, "*")) throw new Error("Geen rechten");
  return user;
}

/** Apply an edition preset: set plan_key + reset tenant_features to that bundle. */
export async function applyEdition(editionKey: string) {
  const user = await requireOwner();
  const ed = edition(editionKey);
  const on = new Set(featuresForEdition(ed.key));
  await query(`UPDATE tenants SET plan_key=$1 WHERE id=$2`, [ed.key, user.tenantId]);
  await query(`DELETE FROM tenant_features WHERE tenant_id=$1`, [user.tenantId]);
  for (const key of FEATURE_KEYS) {
    await query(`INSERT INTO tenant_features (tenant_id, feature_key, enabled) VALUES ($1,$2,$3)`,
      [user.tenantId, key, on.has(key)]);
  }
  await query(`INSERT INTO audit_log (id, tenant_id, user_id, actor_name, action, entity, meta) VALUES ($1,$2,$3,$4,'update','edition',$5)`,
    [randomUUID(), user.tenantId, user.id, user.name, JSON.stringify({ edition: ed.key })]);
  revalidatePath("/app", "layout");
}

/** Toggle a single feature entitlement on/off (fine-tune beyond the edition preset). */
export async function toggleFeature(featureKey: string, enabled: boolean) {
  const user = await requireOwner();
  await query(
    `INSERT INTO tenant_features (tenant_id, feature_key, enabled) VALUES ($1,$2,$3)
     ON CONFLICT (tenant_id, feature_key) DO UPDATE SET enabled=EXCLUDED.enabled`,
    [user.tenantId, featureKey, enabled]
  );
  revalidatePath("/app", "layout");
}

export async function updateBrand(formData: FormData) {
  const user = await requireOwner();
  const name = String(formData.get("name") ?? user.tenant.name);
  const tagline = String(formData.get("tagline") ?? "");
  const primary = String(formData.get("primary") ?? "#e11d48");
  const accent = String(formData.get("accent") ?? "#f59e0b");
  await query(`UPDATE tenants SET name=$1, brand=$2 WHERE id=$3`,
    [name, JSON.stringify({ ...(user.tenant.brand as object), tagline, primary, accent }), user.tenantId]);
  revalidatePath("/app", "layout");
}
