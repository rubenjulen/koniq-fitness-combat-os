/**
 * Editions & feature entitlements (SAA-004).
 *
 * The product is split into five commercial editions. Each edition is a *preset*
 * that turns on a bundle of feature keys. Individual features stay per-tenant
 * toggleable (tenant_features table) so a club can buy an edition and still
 * fine-tune. Nav items and server actions gate on these same feature keys, so a
 * disabled feature disappears from the UI *and* is refused backend-side.
 *
 *   STARTER      — website, CRM, registratie, members, packages, betalingen, agenda, attendance
 *   PRO          — automatisering, Meta/WhatsApp, family billing, member app, retention, POS, reporting
 *   COMBAT       — curriculum, progression/ranks, sparring controls, fighters, competition
 *   PERFORMANCE+ — adaptive workouts, nutrition, progress, wearables, AI Coach
 *   ENTERPRISE   — multi-location, advanced IAM/SSO, integrations, data/BI, governance
 */

export type EditionKey = "starter" | "pro" | "combat" | "performance" | "enterprise";
export type PackKey = EditionKey; // features are grouped by the pack that introduces them

export type FeatureDef = {
  key: string;
  label: string;
  pack: PackKey;
  description: string;
};

/** Every toggleable feature in the platform, grouped by the pack it belongs to. */
export const FEATURES: FeatureDef[] = [
  // ---- STARTER — commerciële kern ----
  { key: "website", label: "Website & CMS", pack: "starter", description: "Publieke site, programma's, schedule, coaches, online registratie." },
  { key: "crm", label: "CRM & leads", pack: "starter", description: "Lead inbox, pipeline, trial-conversie en sales-analytics." },
  { key: "registration", label: "Registratie & intake", pack: "starter", description: "Digitale registratie, health screening, waivers, packagekeuze." },
  { key: "members", label: "Members (360)", pack: "starter", description: "Member 360, family/guardian accounts, statussen, timeline." },
  { key: "packages", label: "Packages & memberships", pack: "starter", description: "Memberships, class packs, drop-ins, family/youth, freezes." },
  { key: "billing", label: "Betalingen & facturatie", pack: "starter", description: "Ledger, cash/bank/wallet, dunning, receipts, reconciliation." },
  { key: "schedule", label: "Agenda & lessen", pack: "starter", description: "Recurring schedule, class types, capacity, waitlists, bookings." },
  { key: "attendance", label: "Check-in & attendance", pack: "starter", description: "Kiosk/QR check-in, attendance ledger, eligibility, streaks." },
  { key: "coaches", label: "Coaches & staff", pack: "starter", description: "Coachprofielen, kwalificaties, beschikbaarheid, assignments." },
  { key: "facility", label: "Faciliteit & equipment", pack: "starter", description: "Locaties, equipment register, inspecties, onderhoud." },
  { key: "documents", label: "Documenten & e-sign", pack: "starter", description: "Waivers, contracten, medische clearances, versiebeheer." },
  { key: "health_safety", label: "Health & safety", pack: "starter", description: "Preparticipation screening, medical flags, incidenten, EAP." },

  // ---- PRO — groei & engagement ----
  { key: "communication", label: "Communicatie & community", pack: "pro", description: "WhatsApp/e-mail/push unified, announcements, groepen." },
  { key: "automation", label: "Automatisering", pack: "pro", description: "Welkom, trial-reminder, missed class, renewal, verjaardag." },
  { key: "marketing", label: "Marketing & social", pack: "pro", description: "Campagnes, Meta leads, content calendar, referral, ROI." },
  { key: "member_app", label: "Member app", pack: "pro", description: "Self-service portaal: home, booking, betalingen, training." },
  { key: "retention", label: "Retentie & member success", pack: "pro", description: "At-risk detectie, save-flows, win-back, NPS, cohorten." },
  { key: "pos", label: "POS & retail", pack: "pro", description: "Frontdesk POS, gear-catalogus, voorraad, bundels." },
  { key: "events", label: "Events & seminars", pack: "pro", description: "Seminars, camps, gradings, open days, registraties." },
  { key: "finance", label: "Finance dashboards", pack: "pro", description: "Omzetcategorieën, receivables, coach-pay, forecasting." },

  // ---- COMBAT — combat sports ----
  { key: "curriculum", label: "Curriculum & skills", pack: "combat", description: "Techniekbibliotheek, skill sign-off, assessments per discipline." },
  { key: "ranks", label: "Ranks & progression", pack: "combat", description: "Belts/stripes/levels, promotions, certificaten, criteria." },
  { key: "sparring", label: "Sparring controls", pack: "combat", description: "Sparring readiness & eligibility op leeftijd/level/clearance." },
  { key: "fighters", label: "Fighters", pack: "combat", description: "Fighterprofiel, weight class, fight record, fight camp." },
  { key: "competition", label: "Competition management", pack: "combat", description: "Event registration, weigh-in, medical docs, corner team." },

  // ---- PERFORMANCE+ — digital coaching ----
  { key: "training", label: "Training & oefenbibliotheek", pack: "performance", description: "Exercise library, program templates, weekplannen, RPE." },
  { key: "ai_coach", label: "AI Coach", pack: "performance", description: "Adaptive planning engine met safety guardrails & human override." },
  { key: "nutrition", label: "Nutrition & voeding", pack: "performance", description: "Meal plans, macro tracking, hydration, guardrails minors/keto." },
  { key: "progress", label: "Progress & assessments", pack: "performance", description: "Goals, body metrics, PR's, trends, progress photos." },
  { key: "wearables", label: "Wearables", pack: "performance", description: "Apple/Google/Fitbit/Garmin via adapters." },

  // ---- ENTERPRISE — schaal & governance ----
  { key: "multi_location", label: "Multi-location", pack: "enterprise", description: "Meerdere vestigingen, zalen en brands onder één organisatie." },
  { key: "analytics", label: "Analytics & BI", pack: "enterprise", description: "Executive dashboards, funnels, cohorten, data-export." },
  { key: "integrations", label: "Integraties & API", pack: "enterprise", description: "API-first, webhooks, payment/calendar/accounting adapters." },
  { key: "sso", label: "SSO & advanced IAM", pack: "enterprise", description: "Enterprise SSO, access reviews, segregation of duties." },
  { key: "safeguarding", label: "Safeguarding & governance", pack: "enterprise", description: "Vertrouwelijke safeguardingcases, conduct, staff screening." },
  { key: "platform_admin", label: "Platform admin", pack: "enterprise", description: "Tenant health, usage metering, support & audit." },
];

export const FEATURE_KEYS = FEATURES.map((f) => f.key);

export type EditionDef = {
  key: EditionKey;
  name: string;
  tagline: string;
  priceMonth: number; // USD indicatief
  /** packs included by this edition preset (cumulative ladder). */
  packs: PackKey[];
};

export const EDITIONS: EditionDef[] = [
  { key: "starter", name: "Starter", tagline: "De complete commerciële kern om digitaal te starten.", priceMonth: 49, packs: ["starter"] },
  { key: "pro", name: "Pro", tagline: "Automatisering, member app, marketing, POS & finance.", priceMonth: 99, packs: ["starter", "pro"] },
  { key: "combat", name: "Combat", tagline: "Curriculum, ranks, sparring & competition voor combat sports.", priceMonth: 139, packs: ["starter", "pro", "combat"] },
  { key: "performance", name: "Performance+", tagline: "Adaptive coaching, nutrition, progress & AI Coach.", priceMonth: 169, packs: ["starter", "pro", "performance"] },
  { key: "enterprise", name: "Enterprise", tagline: "Multi-location, SSO, integraties, BI & governance.", priceMonth: 299, packs: ["starter", "pro", "combat", "performance", "enterprise"] },
];

export function edition(key: string | null | undefined): EditionDef {
  return EDITIONS.find((e) => e.key === key) ?? EDITIONS[0];
}

/** The set of feature keys a given edition preset turns on. */
export function featuresForEdition(key: string | null | undefined): string[] {
  const e = edition(key);
  const packs = new Set(e.packs);
  return FEATURES.filter((f) => packs.has(f.pack)).map((f) => f.key);
}

export const PACK_META: Record<PackKey, { label: string; color: string }> = {
  starter: { label: "Starter", color: "#3b82f6" },
  pro: { label: "Pro", color: "#8b5cf6" },
  combat: { label: "Combat", color: "#ef4444" },
  performance: { label: "Performance+", color: "#10b981" },
  enterprise: { label: "Enterprise", color: "#f59e0b" },
};
