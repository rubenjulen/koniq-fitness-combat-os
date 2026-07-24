import "server-only";
import { query } from "@/db/client";
import { FEATURE_KEYS, featuresForEdition } from "./editions";

/**
 * Loads a tenant's effective feature entitlements (SAA-004).
 * Precedence: explicit tenant_features row wins; otherwise the tenant's edition
 * preset decides. Returns a Set of enabled feature keys.
 */
export async function loadFeatures(tenantId: string, planKey: string | null): Promise<Set<string>> {
  const rows = await query<{ feature_key: string; enabled: boolean }>(
    `SELECT feature_key, enabled FROM tenant_features WHERE tenant_id = $1`,
    [tenantId]
  );
  const explicit = new Map(rows.map((r) => [r.feature_key, r.enabled]));
  const editionDefaults = new Set(featuresForEdition(planKey));
  const enabled = new Set<string>();
  for (const key of FEATURE_KEYS) {
    const ex = explicit.get(key);
    if (ex === true) enabled.add(key);
    else if (ex === false) continue;
    else if (editionDefaults.has(key)) enabled.add(key);
  }
  return enabled;
}

export function hasFeature(features: Set<string>, key?: string | null): boolean {
  if (!key) return true;
  return features.has(key);
}
