# KoniQ Fitness & Combat Sports OS

Multi-tenant **sportschool & combat sports operating platform** voor Suriname — voor kickboks-, Muay Thai- en fitnessscholen die jeugd én volwassenen bedienen. Aangeboden als KoniQ SaaS-concept.

> Eén member. Eén account. Eén betaalhistorie. Eén attendancehistorie. Eén trainings- en progressieprofiel. Eén platform voor de volledige sportschool.

Gebouwd op de **Full Product / Enterprise Requirement Baseline v1.0** (330 requirements, 33 domeinen). De keten: **Acquire → Trial → Register → Screen → Package → Pay → Book → Check-In → Train → Progress → Compete → Retain → Renew** — rond één member-core.

## Stack
- **Next.js 15** (App Router, React 19 server components) · **TypeScript** · **Tailwind 4**
- **Dual database driver**: PGlite ingebed voor lokaal/demo (geen setup), Postgres/Supabase in productie — dezelfde parameterized SQL.
- Auth: cookie-sessies + bcrypt · capability-based RBAC · multi-tenant met `tenant_id`-isolatie.

## Snel starten
```bash
npm install
npm run dev        # http://localhost:3040
```
De database wordt bij de eerste request automatisch aangemaakt en geseed (een demo-club: *Krachtstad Muay Thai & Fitness*).

### Demo-toegang
Back-office (`/login`):
| Rol | E-mail | Wachtwoord |
|-----|--------|-----------|
| Eigenaar | owner@demo.koniq | demo12345 |
| Receptie | receptie@demo.koniq | demo12345 |
| Coach | coach@demo.koniq | demo12345 |

Member app (`/portal`): `jason@example.sr` · `demo12345`

## Edities & pakketten (feature-entitlements)
Het product is opgedeeld in vijf commerciële edities. Elke editie is een **preset** die een bundel features aanzet; features blijven per tenant afzonderlijk toggle­baar (`tenant_features`). Uitgeschakelde modules verdwijnen uit het menu **én** worden backend-side geweigerd. Beheer via **Instellingen › Edities & pakketten**.

- **Starter** — website, CRM, registratie, members, packages, betalingen, agenda, attendance
- **Pro** — automatisering, Meta/WhatsApp, family billing, member app, retention, POS, reporting
- **Combat** — curriculum, progression/ranks, sparring controls, fighters, competition
- **Performance+** — adaptive workouts, nutrition, progress, wearables, AI Coach
- **Enterprise** — multi-location, advanced IAM/SSO, integrations, data/BI, governance

## Structuur
```
src/
  app/            landing · /login · /app (back-office) · /portal (member app)
  components/     ui.tsx, icons, Sidebar, Logo, ThemeToggle, UserMenu
  db/             schema.sql · client.ts (dual driver) · seed.ts
  lib/            auth · rbac · editions · entitlements · guard · data · format
```

## Productie
Zet `DATABASE_URL` (Supabase/Postgres) — de app schakelt automatisch over. `output: "standalone"` voor Docker/Coolify. Zie `.env.example`.

## Veiligheidspositie (AI & jeugd)
De AI-laag personaliseert algemene training op schaal; ze vervangt géén medische beoordeling, safeguarding, sparring- of competition-clearance. Voor minderjarigen, injury/medical flags, zwangerschap, return-to-play en extreme weight-cuts gelden extra menselijke/professionele gates.
