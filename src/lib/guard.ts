import "server-only";
import { requireSession, type SessionUser, type TenantContext } from "./auth";
import { loadFeatures } from "./entitlements";
import { can } from "./rbac";

export type Guarded = SessionUser & { tenantId: string; tenant: TenantContext; features: Set<string> };

/**
 * Page guard: require a session, load feature entitlements, and optionally
 * assert a feature + capability. Returns { user, features, ok } so a page can
 * render <FeatureLocked/> instead of redirecting when a feature is off.
 */
export async function guard(opts: { feature?: string; cap?: string } = {}): Promise<Guarded & { ok: boolean }> {
  const user = await requireSession();
  const features = await loadFeatures(user.tenantId, user.tenant.planKey);
  const featureOk = !opts.feature || features.has(opts.feature);
  const capOk = !opts.cap || can(user, opts.cap);
  return { ...user, features, ok: featureOk && capOk } as Guarded & { ok: boolean };
}
