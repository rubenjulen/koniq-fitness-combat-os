export type NavItem = { href: string; label: string; icon: string; cap: string; feature?: string; pack?: string };
export type NavGroup = { group: string; items: NavItem[] };

/** Back-office navigation. Items are filtered by capability + tenant feature entitlement. */
export const NAV: NavGroup[] = [
  {
    group: "Overzicht",
    items: [
      { href: "/app", label: "Dashboard", icon: "dashboard", cap: "*" },
      { href: "/app/inbox", label: "Inbox", icon: "inbox", cap: "communication.read", feature: "communication", pack: "pro" },
      { href: "/app/schedule", label: "Agenda & lessen", icon: "calendar", cap: "schedule.read", feature: "schedule" },
      { href: "/app/checkin", label: "Check-in kiosk", icon: "scan", cap: "attendance.write", feature: "attendance" },
    ],
  },
  {
    group: "Acquisitie & sales",
    items: [
      { href: "/app/leads", label: "Leads & CRM", icon: "funnel", cap: "lead.read", feature: "crm" },
      { href: "/app/marketing", label: "Marketing & social", icon: "megaphone", cap: "marketing.read", feature: "marketing", pack: "pro" },
      { href: "/app/website", label: "Website & CMS", icon: "globe", cap: "website.read", feature: "website" },
    ],
  },
  {
    group: "Members & lidmaatschap",
    items: [
      { href: "/app/members", label: "Members", icon: "users", cap: "member.read", feature: "members" },
      { href: "/app/packages", label: "Packages", icon: "tag", cap: "package.read", feature: "packages" },
      { href: "/app/billing", label: "Betalingen", icon: "coins", cap: "billing.read", feature: "billing" },
      { href: "/app/retention", label: "Retentie", icon: "heart", cap: "retention.read", feature: "retention", pack: "pro" },
    ],
  },
  {
    group: "Training & combat",
    items: [
      { href: "/app/attendance", label: "Attendance", icon: "check", cap: "attendance.read", feature: "attendance" },
      { href: "/app/curriculum", label: "Curriculum & ranks", icon: "belt", cap: "curriculum.read", feature: "curriculum", pack: "combat" },
      { href: "/app/fighters", label: "Fighters & competitie", icon: "trophy", cap: "fighter.read", feature: "fighters", pack: "combat" },
      { href: "/app/training", label: "Trainingsprogramma's", icon: "dumbbell", cap: "training.read", feature: "training", pack: "performance" },
      { href: "/app/ai-coach", label: "AI Coach", icon: "sparkles", cap: "training.read", feature: "ai_coach", pack: "performance" },
      { href: "/app/nutrition", label: "Nutrition", icon: "apple", cap: "nutrition.read", feature: "nutrition", pack: "performance" },
      { href: "/app/progress", label: "Progress", icon: "trend", cap: "progress.read", feature: "progress", pack: "performance" },
    ],
  },
  {
    group: "Staff & operatie",
    items: [
      { href: "/app/coaches", label: "Coaches & staff", icon: "whistle", cap: "coach.read", feature: "coaches" },
      { href: "/app/events", label: "Events & seminars", icon: "flag", cap: "event.read", feature: "events", pack: "pro" },
      { href: "/app/pos", label: "POS & retail", icon: "cart", cap: "pos.read", feature: "pos", pack: "pro" },
      { href: "/app/facility", label: "Faciliteit", icon: "building", cap: "facility.read", feature: "facility" },
    ],
  },
  {
    group: "Veiligheid & compliance",
    items: [
      { href: "/app/health", label: "Health & safety", icon: "shield", cap: "health.read", feature: "health_safety" },
      { href: "/app/safeguarding", label: "Safeguarding", icon: "lock", cap: "safeguarding.read", feature: "safeguarding", pack: "enterprise" },
      { href: "/app/documents", label: "Documenten", icon: "file", cap: "document.read", feature: "documents" },
    ],
  },
  {
    group: "Intelligentie & platform",
    items: [
      { href: "/app/finance", label: "Finance", icon: "chart", cap: "finance.read", feature: "finance", pack: "pro" },
      { href: "/app/analytics", label: "Analytics & BI", icon: "bars", cap: "analytics.read", feature: "analytics", pack: "enterprise" },
      { href: "/app/integrations", label: "Integraties & API", icon: "plug", cap: "settings.read", feature: "integrations", pack: "enterprise" },
      { href: "/app/settings", label: "Instellingen & edities", icon: "settings", cap: "*" },
    ],
  },
];
