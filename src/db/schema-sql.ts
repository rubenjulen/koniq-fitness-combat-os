// AUTO-GEGENEREERD uit schema.sql — niet handmatig bewerken.
// Regenereren na wijziging van schema.sql:  npm run gen:schema
export const SCHEMA_SQL = `
-- =============================================================================
-- KoniQ Fitness & Combat Sports OS  |  Postgres 16 schema (PGlite / Supabase-ready)
-- Multi-tenant sportschool & combat sports operating platform (Suriname).
-- Every business table carries tenant_id for strict multi-tenant isolation (SAA-001).
-- Same DDL ports to Supabase with RLS policies (tenant_id = auth tenant).
-- Central core (Definitief Baselinebesluit): Lead · Person/Household · Member ·
-- Membership · Payment Ledger · Class · Attendance · Training Plan · Skill
-- Progression · Health/Safety Profile · Communication Timeline.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SAA — SaaS Platform, Editions & Multi-Tenancy
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  key            text PRIMARY KEY,          -- starter|pro|combat|performance|enterprise
  name           text NOT NULL,
  price_month    numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'USD',
  tagline        text,
  sort           int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tenants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  slug           text UNIQUE NOT NULL,
  subdomain      text UNIQUE,
  default_language text NOT NULL DEFAULT 'nl',
  timezone       text NOT NULL DEFAULT 'America/Paramaribo',
  currency       text NOT NULL DEFAULT 'SRD',
  country        text NOT NULL DEFAULT 'SR',
  brand          jsonb NOT NULL DEFAULT '{}',   -- logo, colors, tagline, domain, email sender
  plan_key       text REFERENCES plans(key),
  status         text NOT NULL DEFAULT 'active', -- trial|active|suspended|offboarding
  data_retention_months int NOT NULL DEFAULT 120,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Backend-enforced feature entitlements (SAA-004). Editions are presets that
-- flip a bundle of these; individual keys stay per-tenant toggleable.
CREATE TABLE IF NOT EXISTS tenant_features (
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key    text NOT NULL,
  enabled        boolean NOT NULL DEFAULT true,
  PRIMARY KEY (tenant_id, feature_key)
);

CREATE TABLE IF NOT EXISTS locations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  address        text,
  district       text,
  ressort        text,
  landmark       text,
  gps            text,
  phone          text,
  capacity       int,
  is_headquarters boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_meters (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric         text NOT NULL,       -- active_members|messages|storage_mb|ai_plans
  value          numeric(14,2) NOT NULL DEFAULT 0,
  period         text NOT NULL,       -- YYYY-MM
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- IAM — Identity, Access & Security
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null = system template
  key            text NOT NULL,
  name           text NOT NULL,
  capabilities   jsonb NOT NULL DEFAULT '[]',  -- ["crm.read","billing.write",...] or ["*"]
  is_system      boolean NOT NULL DEFAULT false,
  UNIQUE (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null = platform super admin
  email          text NOT NULL,
  password_hash  text NOT NULL,
  name           text NOT NULL,
  phone          text,
  avatar_url     text,
  role_id        uuid REFERENCES roles(id) ON DELETE SET NULL,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  is_platform_admin boolean NOT NULL DEFAULT false,
  mfa_enabled    boolean NOT NULL DEFAULT false,
  active         boolean NOT NULL DEFAULT true,
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id      uuid REFERENCES tenants(id) ON DELETE CASCADE,
  token          text UNIQUE NOT NULL,
  expires_at     timestamptz NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        uuid,
  actor_name     text,
  action         text NOT NULL,      -- create|update|delete|view|sign|login|override
  entity         text NOT NULL,
  entity_id      text,
  meta           jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- MEM — Members, Households, Family & Guardians
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS households (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  discount_pct   numeric(5,2) NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  household_id   uuid REFERENCES households(id) ON DELETE SET NULL,
  member_no      text,
  first_name     text NOT NULL,
  last_name      text NOT NULL,
  dob            date,
  gender         text,
  email          text,
  phone          text,
  whatsapp       text,
  address        text,
  district       text,
  ressort        text,
  is_minor       boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'prospect', -- prospect|trial|active|frozen|overdue|cancelled|alumni
  join_date      date,
  source         text,
  goal           text,
  experience     text,          -- beginner|intermediate|advanced
  photo_url      text,
  notes          text,
  -- member portal login (member app / self-service)
  portal_password_hash text,
  custom         jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS member_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token          text UNIQUE NOT NULL,
  expires_at     timestamptz NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guardians (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  guardian_member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  minor_member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  relationship   text,           -- parent|guardian|family
  is_payer       boolean NOT NULL DEFAULT false,
  can_pickup     boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name           text NOT NULL,
  relationship   text,
  phone          text,
  medical_note   text,           -- sensitive (IAM-004)
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- CRM — Leads, Sales & Trial Conversion
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  name           text NOT NULL,
  phone          text,
  whatsapp       text,
  email          text,
  source         text,           -- website|meta|whatsapp|phone|walk_in|referral|manual
  discipline     text,
  age_group      text,           -- youth|adult
  package_interest text,
  status         text NOT NULL DEFAULT 'new', -- new|contacted|trial_booked|trial_attended|offer|won|lost
  owner_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  qualification  jsonb NOT NULL DEFAULT '{}',
  lost_reason    text,
  member_id      uuid REFERENCES members(id) ON DELETE SET NULL, -- set on conversion
  utm            jsonb NOT NULL DEFAULT '{}',
  first_response_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- HSC — Health Screening, Safety & Emergency
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_screenings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  answers        jsonb NOT NULL DEFAULT '{}',   -- PAR-Q+ style
  risk_flag      text NOT NULL DEFAULT 'green',  -- green|amber|red
  cleared_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  cleared_at     timestamptz,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medical_flags (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type           text NOT NULL,   -- injury|condition|medication|pregnancy|restriction
  description    text,
  restriction    text,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  member_id      uuid REFERENCES members(id) ON DELETE SET NULL,
  type           text NOT NULL,   -- injury|accident|near_miss|medical|emergency
  severity       text NOT NULL DEFAULT 'low', -- low|medium|high
  description    text,
  action_taken   text,
  reported_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'open', -- open|in_progress|resolved
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PKG — Memberships, Packages & Contracts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  type           text NOT NULL DEFAULT 'membership', -- membership|class_pack|drop_in|family|youth|private|competition
  billing_period text NOT NULL DEFAULT 'month',      -- month|quarter|year|one_off
  price          numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'SRD',
  classes_per_week int,
  credits        int,
  credits_validity_days int,
  discipline     text,
  age_group      text,
  is_public      boolean NOT NULL DEFAULT true,
  active         boolean NOT NULL DEFAULT true,
  sort           int NOT NULL DEFAULT 0,
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  package_id     uuid REFERENCES packages(id) ON DELETE SET NULL,
  payer_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'active', -- active|frozen|cancelled|expired|pending
  start_date     date,
  end_date       date,
  next_bill_date date,
  price          numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'SRD',
  credits_remaining int,
  auto_renew     boolean NOT NULL DEFAULT true,
  freeze_until   date,
  cancel_reason  text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- BIL / FIN — Billing, Payments, Dunning & Finance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  payer_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  membership_id  uuid REFERENCES memberships(id) ON DELETE SET NULL,
  number         text,
  category       text NOT NULL DEFAULT 'membership', -- membership|private|event|retail|competition|other
  amount         numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'SRD',
  status         text NOT NULL DEFAULT 'due', -- paid|due|partial|overdue|failed|waived|written_off
  issued_at      date NOT NULL DEFAULT current_date,
  due_date       date,
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES members(id) ON DELETE SET NULL,
  invoice_id     uuid REFERENCES invoices(id) ON DELETE SET NULL,
  amount         numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'SRD',
  method         text NOT NULL DEFAULT 'cash', -- cash|bank_transfer|wallet|card|online
  status         text NOT NULL DEFAULT 'confirmed', -- pending|confirmed|failed
  reference      text,
  proof_url      text,
  recorded_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  received_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- COA — Coaches, Staff & Workforce
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coaches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  name           text NOT NULL,
  role           text,           -- head_coach|coach|assistant|pt|frontdesk
  specialties    text,
  email          text,
  phone          text,
  employment     text,           -- employee|contractor|volunteer
  comp_type      text,           -- fixed|per_class|pt_split
  comp_rate      numeric(12,2),
  bio            text,
  photo_url      text,
  is_public      boolean NOT NULL DEFAULT true,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coach_qualifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  coach_id       uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name           text NOT NULL,   -- first_aid|coaching_cert|safeguarding
  issued_at      date,
  expires_at     date,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- SCH / ATT — Scheduling, Classes, Booking & Attendance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_types (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  discipline     text,           -- muay_thai|kickboxing|boxing|bjj|fitness|conditioning
  age_group      text,           -- youth|adult|all
  level          text,           -- beginner|intermediate|advanced|all
  intensity      text,           -- low|medium|high
  color          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  class_type_id  uuid REFERENCES class_types(id) ON DELETE SET NULL,
  coach_id       uuid REFERENCES coaches(id) ON DELETE SET NULL,
  assistant_coach_id uuid REFERENCES coaches(id) ON DELETE SET NULL,
  title          text NOT NULL,
  weekday        int NOT NULL DEFAULT 1,      -- 1=Mon .. 7=Sun
  start_time     text NOT NULL DEFAULT '18:00',
  end_time       text NOT NULL DEFAULT '19:00',
  capacity       int NOT NULL DEFAULT 20,
  resource       text,           -- ring|mat|bag_area|main_floor
  min_level      text,
  requires_approval boolean NOT NULL DEFAULT false,
  is_sparring    boolean NOT NULL DEFAULT false,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  class_id       uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  session_date   date NOT NULL,
  status         text NOT NULL DEFAULT 'booked', -- booked|waitlist|cancelled|attended|no_show
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  class_id       uuid REFERENCES classes(id) ON DELETE SET NULL,
  session_date   date NOT NULL,
  checked_in_at  timestamptz NOT NULL DEFAULT now(),
  method         text NOT NULL DEFAULT 'kiosk', -- kiosk|app|manual|offline
  coach_confirmed boolean NOT NULL DEFAULT false,
  note           text
);

-- ---------------------------------------------------------------------------
-- MAR — Martial Arts Curriculum, Skills & Rank
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS curricula (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  discipline     text NOT NULL,
  name           text NOT NULL,
  age_group      text,
  level          text,
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  curriculum_id  uuid REFERENCES curricula(id) ON DELETE CASCADE,
  name           text NOT NULL,
  category       text,           -- stance|footwork|punch|kick|knee|elbow|clinch|defense|conditioning
  description    text,
  video_url      text,
  sort           int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ranks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  discipline     text NOT NULL,
  name           text NOT NULL,   -- e.g. Prajioud White, Level 1, Yellow
  level_order    int NOT NULL DEFAULT 0,
  color          text,
  min_attendance int,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skill_progress (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  skill_id       uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'learning', -- learning|competent|mastered
  signed_off_by  uuid REFERENCES coaches(id) ON DELETE SET NULL,
  signed_off_at  timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  rank_id        uuid REFERENCES ranks(id) ON DELETE SET NULL,
  discipline     text,
  promoted_by    uuid REFERENCES coaches(id) ON DELETE SET NULL,
  promoted_at    date NOT NULL DEFAULT current_date,
  certificate_url text,
  note           text
);

CREATE TABLE IF NOT EXISTS assessments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type           text,           -- grading|skill|fitness
  scheduled_for  date,
  result         text,           -- passed|not_yet|scheduled
  assessor_id    uuid REFERENCES coaches(id) ON DELETE SET NULL,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- FGT — Fighter & Competition Management
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fighters (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  discipline     text,
  stance         text,           -- orthodox|southpaw
  level          text,           -- amateur|semi_pro|pro
  weight_class   text,
  current_weight numeric(6,2),
  target_weight  numeric(6,2),
  wins           int NOT NULL DEFAULT 0,
  losses         int NOT NULL DEFAULT 0,
  draws          int NOT NULL DEFAULT 0,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fights (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fighter_id     uuid NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  event_name     text,
  fight_date     date,
  discipline     text,
  opponent       text,
  result         text,           -- win|loss|draw|nc
  method         text,           -- ko|tko|decision|submission
  note           text
);

CREATE TABLE IF NOT EXISTS fight_medicals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fighter_id     uuid NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  doc_type       text NOT NULL,   -- medical_cert|clearance|questionnaire|waiver|parental_consent
  status         text NOT NULL DEFAULT 'pending', -- pending|approved|expired
  expires_at     date,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- TRN / AIC — Exercise Library, Training Plans & AI Coach
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exercises (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  category       text,           -- combat_drill|strength|conditioning|mobility|recovery|technique
  equipment      text,           -- none|bag|pads|gloves|weights|bands
  level          text,           -- beginner|intermediate|advanced
  video_url      text,
  instructions   text,
  safety_notes   text,
  age_min        int,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_templates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  goal           text,           -- general_fitness|technique|fight_camp|home|weight_loss
  level          text,
  weeks          int NOT NULL DEFAULT 4,
  description    text,
  plan           jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_plans (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name           text NOT NULL,
  goal           text,
  status         text NOT NULL DEFAULT 'active', -- draft|active|completed|blocked
  generated_by   text NOT NULL DEFAULT 'coach',  -- coach|ai
  week           jsonb NOT NULL DEFAULT '{}',     -- {mon:[...],tue:[...],...}
  explanation    text,          -- AIC-004 explainability
  safety_flag    text,          -- null|escalated (AIC-005)
  approved_by    uuid REFERENCES coaches(id) ON DELETE SET NULL,
  approved_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id        uuid REFERENCES training_plans(id) ON DELETE SET NULL,
  log_date       date NOT NULL DEFAULT current_date,
  summary        text,
  rpe            int,
  soreness       int,
  pain_flag      boolean NOT NULL DEFAULT false,
  completed      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- NUT — Nutrition, Hydration & Meal Guidance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  goal           text,           -- maintain|lose_fat|gain_muscle|performance
  style          text,           -- balanced|high_protein|vegetarian|low_carb
  calories       int,
  macros         jsonb NOT NULL DEFAULT '{}',
  status         text NOT NULL DEFAULT 'active',
  needs_pro_review boolean NOT NULL DEFAULT false, -- NUT-009
  risk_flag      text,           -- null|eating_disorder|minor_keto
  approved_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PRO — Progress, Assessments & Wearables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title          text NOT NULL,
  baseline       text,
  target         text,
  target_date    date,
  status         text NOT NULL DEFAULT 'active', -- active|achieved|paused
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS progress_metrics (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  measured_on    date NOT NULL DEFAULT current_date,
  weight         numeric(6,2),
  body_fat       numeric(5,2),
  measurements   jsonb NOT NULL DEFAULT '{}',
  note           text,
  is_private     boolean NOT NULL DEFAULT true, -- PRO-003 sensitive
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_bests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  metric         text NOT NULL,
  value          numeric(12,2),
  unit           text,
  achieved_on    date NOT NULL DEFAULT current_date
);

-- ---------------------------------------------------------------------------
-- RET — Retention, Churn & Member Success
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS retention_tasks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type           text,           -- at_risk|winback|check_in|freeze_recovery
  reason         text,
  status         text NOT NULL DEFAULT 'open', -- open|in_progress|done
  owner_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  due_date       date,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- POS — Point of Sale, Retail & Gear
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku            text,
  name           text NOT NULL,
  category       text,           -- gloves|shin_guards|wraps|apparel|drinks|supplements
  price          numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'SRD',
  tax_pct        numeric(5,2) NOT NULL DEFAULT 0,
  stock          int NOT NULL DEFAULT 0,
  reorder_level  int NOT NULL DEFAULT 0,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES members(id) ON DELETE SET NULL,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  total          numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'SRD',
  method         text NOT NULL DEFAULT 'cash',
  sold_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id        uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id     uuid REFERENCES products(id) ON DELETE SET NULL,
  name           text,
  qty            int NOT NULL DEFAULT 1,
  price          numeric(12,2) NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- EVT — Events, Seminars, Camps & Gradings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  name           text NOT NULL,
  type           text,           -- seminar|camp|grading|fight|open_day|social
  start_date     date,
  end_date       date,
  capacity       int,
  member_price   numeric(12,2) NOT NULL DEFAULT 0,
  nonmember_price numeric(12,2) NOT NULL DEFAULT 0,
  currency       text NOT NULL DEFAULT 'SRD',
  status         text NOT NULL DEFAULT 'planning', -- planning|published|completed|cancelled
  is_public      boolean NOT NULL DEFAULT true,
  description    text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id       uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES members(id) ON DELETE SET NULL,
  name           text,
  status         text NOT NULL DEFAULT 'registered', -- registered|waitlist|cancelled
  paid           boolean NOT NULL DEFAULT false,
  checked_in     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- COM / MKT — Communication, Templates, Announcements & Campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS message_templates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key            text NOT NULL,
  name           text NOT NULL,
  channel        text NOT NULL DEFAULT 'whatsapp', -- whatsapp|email|push|in_app
  subject        text,
  body           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES members(id) ON DELETE SET NULL,
  lead_id        uuid REFERENCES leads(id) ON DELETE SET NULL,
  channel        text NOT NULL DEFAULT 'whatsapp',
  direction      text NOT NULL DEFAULT 'out', -- in|out
  subject        text,
  body           text,
  template_key   text,
  status         text NOT NULL DEFAULT 'sent', -- queued|sent|delivered|read|failed
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title          text NOT NULL,
  body           text,
  segment        text,           -- all|program|location|competition_team|youth_parents
  created_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  channel        text,           -- meta|whatsapp|email|referral
  objective      text,
  budget         numeric(12,2) NOT NULL DEFAULT 0,
  spend          numeric(12,2) NOT NULL DEFAULT 0,
  audience       text,
  start_date     date,
  end_date       date,
  leads          int NOT NULL DEFAULT 0,
  conversions    int NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'planning', -- planning|active|paused|completed
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- WEB — Website & CMS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug           text NOT NULL,
  title          text NOT NULL,
  body           text,
  published      boolean NOT NULL DEFAULT true,
  sort           int NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- FAC — Facility, Equipment & Operations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  name           text NOT NULL,
  category       text,           -- bag|ring|mat|gloves|weights|cardio
  purchase_date  date,
  status         text NOT NULL DEFAULT 'ok', -- ok|maintenance|defect|retired
  last_inspection date,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id    uuid REFERENCES locations(id) ON DELETE SET NULL,
  equipment_id   uuid REFERENCES equipment(id) ON DELETE SET NULL,
  title          text NOT NULL,
  priority       text NOT NULL DEFAULT 'normal',
  status         text NOT NULL DEFAULT 'open', -- open|in_progress|resolved
  reported_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- DOC — Documents, Contracts & E-Sign
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES members(id) ON DELETE SET NULL,
  coach_id       uuid REFERENCES coaches(id) ON DELETE SET NULL,
  event_id       uuid REFERENCES events(id) ON DELETE SET NULL,
  fighter_id     uuid REFERENCES fighters(id) ON DELETE SET NULL,
  category       text NOT NULL,   -- waiver|contract|medical|certificate|id|consent
  name           text NOT NULL,
  url            text,
  version        int NOT NULL DEFAULT 1,
  signed_at      timestamptz,
  signed_by      text,
  expires_at     date,
  uploaded_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- SAF — Youth Safeguarding & Conduct
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS safeguarding_cases (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES members(id) ON DELETE SET NULL,
  type           text NOT NULL,   -- bullying|harassment|misconduct|welfare
  severity       text NOT NULL DEFAULT 'medium',
  description    text,
  status         text NOT NULL DEFAULT 'open', -- open|in_progress|resolved
  reported_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_to    uuid REFERENCES users(id) ON DELETE SET NULL,
  confidential   boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id      uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type           text NOT NULL,   -- guardian_consent|code_of_conduct|media|waiver
  granted        boolean NOT NULL DEFAULT false,
  granted_by     text,
  granted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INT — Integration Hub & External Ecosystem
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key            text NOT NULL,   -- meta|whatsapp|mope|bank|google_calendar|fitbit|accounting|access_control
  name           text NOT NULL,
  category       text,            -- marketing|messaging|payment|calendar|wearable|accounting|access
  status         text NOT NULL DEFAULT 'disconnected', -- connected|disconnected|error
  last_sync_at   timestamptz,
  config         jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes (tenant-scoped hot paths)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_members_tenant   ON members(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_tenant      ON leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant   ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_tenant   ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance(tenant_id, session_date);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant   ON bookings(tenant_id, session_date);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON memberships(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_features   ON tenant_features(tenant_id);
`;
