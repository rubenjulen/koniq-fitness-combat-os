import type { SessionUser } from "./auth";

/**
 * Capability-based RBAC (IAM-002).
 * Capabilities look like "member.read", "billing.write", "safeguarding.read".
 * A role may hold "*" (all), a domain wildcard "member.*", or exact capabilities.
 * A ".write" implies ".read" for the same domain.
 */
export function can(user: Pick<SessionUser, "capabilities" | "isPlatformAdmin">, capability: string): boolean {
  if (user.isPlatformAdmin) return true;
  const caps = user.capabilities ?? [];
  if (caps.includes("*")) return true;
  if (caps.includes(capability)) return true;
  const domain = capability.split(".")[0];
  if (caps.includes(`${domain}.*`)) return true;
  if (capability.endsWith(".read")) {
    if (caps.includes(`${domain}.write`)) return true;
  }
  return false;
}

export function canAny(user: Pick<SessionUser, "capabilities" | "isPlatformAdmin">, capabilities: string[]): boolean {
  return capabilities.some((c) => can(user, c));
}

/** Standard role templates seeded per tenant. */
export const ROLE_TEMPLATES: { key: string; name: string; capabilities: string[] }[] = [
  { key: "owner", name: "Eigenaar", capabilities: ["*"] },
  {
    key: "manager",
    name: "Manager",
    capabilities: [
      "member.*", "lead.*", "billing.*", "package.*", "schedule.*", "attendance.*",
      "coach.*", "curriculum.*", "fighter.*", "training.*", "nutrition.*", "progress.*",
      "retention.*", "pos.*", "event.*", "communication.*", "marketing.*", "website.*",
      "facility.*", "finance.*", "document.*", "health.*", "analytics.read", "settings.read",
    ],
  },
  {
    key: "frontdesk",
    name: "Receptie",
    capabilities: [
      "member.read", "member.write", "lead.*", "billing.read", "billing.write",
      "package.read", "schedule.read", "attendance.*", "pos.*", "event.read",
      "communication.read", "communication.write", "document.read", "health.read",
    ],
  },
  {
    key: "coach",
    name: "Coach",
    capabilities: [
      "member.read", "schedule.read", "attendance.*", "curriculum.*", "fighter.*",
      "training.*", "progress.*", "coach.read", "health.read", "communication.read",
    ],
  },
];
