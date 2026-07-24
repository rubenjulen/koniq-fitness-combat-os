# Changelog — KoniQ Fitness & Combat Sports OS

## v0.1.0 — Fundering & volledig platform (2026-07-24)
Eerste release op basis van de Full Product / Enterprise Requirement Baseline v1.0 (330 requirements, 33 domeinen).

**Platform & fundering**
- Multi-tenant architectuur met `tenant_id`-isolatie; dual database driver (PGlite lokaal / Postgres-Supabase productie).
- Capability-based RBAC (eigenaar, manager, receptie, coach) + cookie-sessies met bcrypt.
- **Edities & feature-entitlements**: 5 commerciële edities (Starter, Pro, Combat, Performance+, Enterprise) als presets bovenop per-tenant toggle­bare features (`tenant_features`). Nav + backend gated op entitlement.
- Design system (thema-bewust, combat crimson + amber), iconset, herbruikbare componenten.
- Publieke marketingwebsite met modules- en editie-overzicht.

**Back-office modules (`/app`)**
- Dashboard, Leads & CRM, Marketing, Website & CMS, Inbox/communicatie.
- Members (360-profiel), Packages, Betalingen & facturatie, Retentie.
- Agenda & lessen, Check-in kiosk, Attendance, Coaches & staff.
- Curriculum & ranks, Fighters & competitie.
- Trainingsprogramma's, AI Coach (met guardrails), Nutrition, Progress.
- Events, POS & retail, Faciliteit, Health & safety, Safeguarding, Documenten.
- Finance, Analytics & BI, Integraties & API, Instellingen & edities.

**Member app (`/portal`)**
- Member login + mobile-first app: home, training, progress, betalingen.

**Demo-seed**: Krachtstad Muay Thai & Fitness — 2 locaties, 24 leden, families/guardians, coaches, weekrooster, memberships, facturen/betalingen, attendance, curriculum/ranks, fighters, trainingsplannen, voeding, events, POS, campagnes en integraties.
