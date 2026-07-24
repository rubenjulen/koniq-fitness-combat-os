import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { EDITIONS, FEATURES, featuresForEdition } from "@/lib/editions";
import { ROLE_TEMPLATES } from "@/lib/rbac";

type DB = {
  query: <T = any>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
  exec: (sql: string) => Promise<void>;
};

const DEMO_SLUG = "krachtstad";

// deterministic pseudo-random so seed output is stable across boots
let _s = 987654321;
function rnd() { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; }
function pick<T>(a: T[]): T { return a[Math.floor(rnd() * a.length)]; }
function int(min: number, max: number) { return Math.floor(rnd() * (max - min + 1)) + min; }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function daysAhead(n: number) { return daysAgo(-n); }

export async function seedDatabase(db: DB) {
  const q = (sql: string, params: unknown[] = []) => db.query(sql, params);
  const existing = await q(`SELECT id FROM tenants WHERE slug = $1`, [DEMO_SLUG]);
  if (existing.rows.length > 0) return; // already seeded

  // ---- Plans (editions) ----
  for (const e of EDITIONS) {
    await q(
      `INSERT INTO plans (key, name, price_month, currency, tagline, sort) VALUES ($1,$2,$3,'USD',$4,$5)
       ON CONFLICT (key) DO NOTHING`,
      [e.key, e.name, e.priceMonth, e.tagline, EDITIONS.indexOf(e)]
    );
  }

  // ---- Tenant (demo op ENTERPRISE zodat alle modules zichtbaar zijn) ----
  const tenantId = randomUUID();
  await q(
    `INSERT INTO tenants (id, name, slug, subdomain, currency, plan_key, brand, status)
     VALUES ($1,$2,$3,$3,'SRD','enterprise',$4,'active')`,
    [tenantId, "Krachtstad Muay Thai & Fitness", DEMO_SLUG,
      JSON.stringify({ tagline: "Discipline • Kracht • Respect", primary: "#e11d48", accent: "#f59e0b" })]
  );

  // feature entitlements = enterprise preset (alles aan)
  for (const key of featuresForEdition("enterprise")) {
    await q(`INSERT INTO tenant_features (tenant_id, feature_key, enabled) VALUES ($1,$2,true)
             ON CONFLICT DO NOTHING`, [tenantId, key]);
  }

  // ---- Locations ----
  const locHQ = randomUUID(), locNoord = randomUUID();
  await q(`INSERT INTO locations (id, tenant_id, name, address, district, ressort, phone, capacity, is_headquarters)
           VALUES ($1,$2,'Krachtstad Centrum','Maagdenstraat 42','Paramaribo','Centrum','+597 471000',60,true)`, [locHQ, tenantId]);
  await q(`INSERT INTO locations (id, tenant_id, name, address, district, ressort, phone, capacity)
           VALUES ($1,$2,'Krachtstad Noord','Kwattaweg 210','Paramaribo','Noord','+597 471222',40)`, [locNoord, tenantId]);
  const locs = [locHQ, locNoord];

  // ---- Roles ----
  const roleIds: Record<string, string> = {};
  for (const r of ROLE_TEMPLATES) {
    const id = randomUUID();
    roleIds[r.key] = id;
    await q(`INSERT INTO roles (id, tenant_id, key, name, capabilities, is_system) VALUES ($1,$2,$3,$4,$5,true)`,
      [id, tenantId, r.key, r.name, JSON.stringify(r.capabilities)]);
  }

  // ---- Users ----
  const pw = bcrypt.hashSync("demo12345", 10);
  const uOwner = randomUUID(), uFront = randomUUID(), uCoach = randomUUID();
  await q(`INSERT INTO users (id, tenant_id, email, password_hash, name, role_id, location_id, is_platform_admin, mfa_enabled)
           VALUES ($1,$2,'owner@demo.koniq',$3,'Ravi Bhagwandin',$4,$5,false,true)`, [uOwner, tenantId, pw, roleIds.owner, locHQ]);
  await q(`INSERT INTO users (id, tenant_id, email, password_hash, name, role_id, location_id)
           VALUES ($1,$2,'receptie@demo.koniq',$3,'Priya Ramdas',$4,$5)`, [uFront, tenantId, pw, roleIds.frontdesk, locHQ]);
  await q(`INSERT INTO users (id, tenant_id, email, password_hash, name, role_id, location_id)
           VALUES ($1,$2,'coach@demo.koniq',$3,'Kenji Karta',$4,$5)`, [uCoach, tenantId, pw, roleIds.coach, locHQ]);
  // platform super admin (geen tenant)
  await q(`INSERT INTO users (id, tenant_id, email, password_hash, name, is_platform_admin)
           VALUES ($1,NULL,'admin@koniq.app',$2,'KoniQ Platform',true)`, [randomUUID(), pw]);

  // ---- Coaches ----
  const coaches: { id: string; name: string; role: string }[] = [
    { id: randomUUID(), name: "Kenji Karta", role: "head_coach" },
    { id: randomUUID(), name: "Sergio Amatstam", role: "coach" },
    { id: randomUUID(), name: "Lisa Redan", role: "coach" },
    { id: randomUUID(), name: "Marlon Pinas", role: "assistant" },
  ];
  const specs = ["Muay Thai, Clinch", "Kickboxing, Conditioning", "Fitness, Kids", "Boxing, Pads"];
  for (let i = 0; i < coaches.length; i++) {
    const c = coaches[i];
    await q(`INSERT INTO coaches (id, tenant_id, user_id, name, role, specialties, email, phone, employment, comp_type, comp_rate, bio, is_public, active)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'employee',$9,$10,$11,true,true)`,
      [c.id, tenantId, i === 0 ? uCoach : null, c.name, c.role, specs[i],
       c.name.toLowerCase().replace(/\s/g, ".") + "@krachtstad.sr", "+597 88" + int(10000, 99999),
       pick(["fixed", "per_class", "pt_split"]), i === 0 ? 4500 : 150,
       `${c.name} traint al jaren atleten bij Krachtstad met focus op ${specs[i].toLowerCase()}.`]);
    await q(`INSERT INTO coach_qualifications (id, tenant_id, coach_id, name, issued_at, expires_at)
             VALUES ($1,$2,$3,'EHBO / First Aid',$4,$5)`, [randomUUID(), tenantId, c.id, daysAgo(400), daysAhead(330)]);
  }
  await q(`INSERT INTO coach_qualifications (id, tenant_id, coach_id, name, issued_at, expires_at)
           VALUES ($1,$2,$3,'Safeguarding certificaat',$4,$5)`, [randomUUID(), tenantId, coaches[0].id, daysAgo(200), daysAhead(-10)]); // expired

  // ---- Class types + classes (weekly schedule) ----
  const ctDefs = [
    { name: "Muay Thai Fundamentals", disc: "muay_thai", age: "adult", lvl: "beginner", int: "medium", color: "#e11d48" },
    { name: "Muay Thai Advanced", disc: "muay_thai", age: "adult", lvl: "advanced", int: "high", color: "#be123c" },
    { name: "Kickboxing Fitness", disc: "kickboxing", age: "adult", lvl: "all", int: "medium", color: "#f59e0b" },
    { name: "Kids Kickboxing (7-12)", disc: "kickboxing", age: "youth", lvl: "beginner", int: "low", color: "#3b82f6" },
    { name: "Boxing Technique", disc: "boxing", age: "adult", lvl: "all", int: "medium", color: "#8b5cf6" },
    { name: "Sparring (op uitnodiging)", disc: "muay_thai", age: "adult", lvl: "advanced", int: "high", color: "#dc2626" },
    { name: "Strength & Conditioning", disc: "fitness", age: "adult", lvl: "all", int: "high", color: "#10b981" },
  ];
  const cts: string[] = [];
  for (const c of ctDefs) {
    const id = randomUUID(); cts.push(id);
    await q(`INSERT INTO class_types (id, tenant_id, name, discipline, age_group, level, intensity, color)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [id, tenantId, c.name, c.disc, c.age, c.lvl, c.int, c.color]);
  }
  const classes: { id: string; ct: number; weekday: number; start: string; end: string; spar: boolean }[] = [];
  const sched = [
    [0, 1, "18:00", "19:15", false], [2, 1, "19:30", "20:45", false],
    [3, 2, "17:00", "18:00", false], [0, 2, "18:00", "19:15", false],
    [1, 3, "18:00", "19:00", false], [3, 3, "18:00", "19:00", false],
    [4, 4, "17:00", "18:00", false], [6, 4, "10:00", "11:00", false],
    [5, 5, "19:00", "20:00", false], [1, 5, "20:00", "21:00", true],
    [2, 6, "07:00", "08:00", false], [4, 6, "18:00", "19:00", false],
  ];
  for (const [ctIdx, wd, s, e, spar] of sched as [number, number, string, string, boolean][]) {
    const id = randomUUID();
    classes.push({ id, ct: ctIdx, weekday: wd, start: s, end: e, spar });
    await q(`INSERT INTO classes (id, tenant_id, location_id, class_type_id, coach_id, assistant_coach_id, title, weekday, start_time, end_time, capacity, resource, requires_approval, is_sparring)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [id, tenantId, pick(locs), cts[ctIdx], pick(coaches).id, coaches[3].id, ctDefs[ctIdx].name, wd, s, e,
       int(14, 30), pick(["ring", "mat", "bag_area", "main_floor"]), spar, spar]);
  }

  // ---- Packages ----
  const pkgDefs = [
    { name: "Onbeperkt Maand", type: "membership", period: "month", price: 450, cpw: null, credits: null, pub: true },
    { name: "2x per week", type: "membership", period: "month", price: 300, cpw: 2, credits: null, pub: true },
    { name: "Jaarabonnement Onbeperkt", type: "membership", period: "year", price: 4500, cpw: null, credits: null, pub: true },
    { name: "10-lessenkaart", type: "class_pack", period: "one_off", price: 350, cpw: null, credits: 10, pub: true },
    { name: "Drop-in les", type: "drop_in", period: "one_off", price: 50, cpw: null, credits: 1, pub: true },
    { name: "Kids Maand (7-12)", type: "youth", period: "month", price: 200, cpw: 2, credits: null, pub: true },
    { name: "Family (2+ leden)", type: "family", period: "month", price: 700, cpw: null, credits: null, pub: true },
    { name: "Fighter / Competition Team", type: "competition", period: "month", price: 250, cpw: null, credits: null, pub: false },
    { name: "Private Training (5x)", type: "private", period: "one_off", price: 900, cpw: null, credits: 5, pub: false },
  ];
  const pkgs: { id: string; price: number; type: string; period: string }[] = [];
  for (let i = 0; i < pkgDefs.length; i++) {
    const p = pkgDefs[i]; const id = randomUUID();
    pkgs.push({ id, price: p.price, type: p.type, period: p.period });
    await q(`INSERT INTO packages (id, tenant_id, name, type, billing_period, price, currency, classes_per_week, credits, is_public, sort, description)
             VALUES ($1,$2,$3,$4,$5,$6,'SRD',$7,$8,$9,$10,$11)`,
      [id, tenantId, p.name, p.type, p.period, p.price, p.cpw, p.credits, p.pub, i,
       `${p.name} — ${p.type === "youth" ? "voor de jeugd" : p.type === "competition" ? "voor wedstrijdatleten" : "voor leden"}.`]);
  }

  // ---- Households ----
  const hh1 = randomUUID(), hh2 = randomUUID();
  await q(`INSERT INTO households (id, tenant_id, name, discount_pct) VALUES ($1,$2,'Familie Wong',10)`, [hh1, tenantId]);
  await q(`INSERT INTO households (id, tenant_id, name, discount_pct) VALUES ($1,$2,'Familie Overman',10)`, [hh2, tenantId]);

  // ---- Members ----
  const firstNames = ["Jason", "Amir", "Sanne", "Devon", "Prakash", "Ivy", "Roan", "Naomi", "Xavier", "Melissa", "Bryan", "Kavita", "Dennis", "Shirley", "Owen", "Farah", "Glenn", "Priscilla", "Ruben", "Tamara", "Kishan", "Denise", "Mohan", "Ashley"];
  const lastNames = ["Wong", "Overman", "Sitaram", "Blakman", "Doerga", "Vishnudatt", "Karg", "Amatredjo", "Pinas", "Redan", "Bhola", "Tjon", "Somai", "Graanoogst", "Kertoidjojo"];
  type M = { id: string; first: string; last: string; minor: boolean; status: string; exp: string };
  const members: M[] = [];
  const statuses = ["active", "active", "active", "active", "active", "trial", "overdue", "frozen", "alumni", "prospect"];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const id = randomUUID();
    const minor = i < 4; // eerste 4 zijn jeugd
    const first = firstNames[i];
    const last = minor && i < 2 ? "Wong" : minor ? "Overman" : pick(lastNames);
    const status = i < 5 ? "active" : pick(statuses);
    const exp = minor ? "beginner" : pick(["beginner", "intermediate", "advanced"]);
    const dobY = minor ? int(2013, 2018) : int(1985, 2005);
    const hh = i < 2 ? hh1 : (i >= 2 && i < 4) ? hh2 : null;
    members.push({ id, first, last, minor, status, exp });
    await q(`INSERT INTO members (id, tenant_id, location_id, household_id, member_no, first_name, last_name, dob, gender, email, phone, whatsapp, address, district, is_minor, status, join_date, source, goal, experience, portal_password_hash)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12,'Paramaribo',$13,$14,$15,$16,$17,$18,$19)`,
      [id, tenantId, pick(locs), hh, "KS-" + (1000 + i), first, last, `${dobY}-0${int(1,9)}-1${int(0,9)}`,
       pick(["m", "v"]), `${first.toLowerCase()}@example.sr`, "+597 7" + int(100000, 999999),
       minor ? null : pick(["Paranam", "Latour", "Flora", "Uitvlugt"]) + " straat " + int(1, 99),
       minor, status, daysAgo(int(20, 900)), pick(["website", "meta", "whatsapp", "referral", "walk_in"]),
       pick(["fitter worden", "zelfverdediging", "afvallen", "wedstrijdsport", "techniek"]), exp, pw]);
  }
  // guardians (ouders zijn volwassen members die voor kinderen betalen)
  await q(`INSERT INTO guardians (id, tenant_id, guardian_member_id, minor_member_id, relationship, is_payer, can_pickup)
           VALUES ($1,$2,$3,$4,'parent',true,true)`, [randomUUID(), tenantId, members[10].id, members[0].id]);
  await q(`INSERT INTO guardians (id, tenant_id, guardian_member_id, minor_member_id, relationship, is_payer, can_pickup)
           VALUES ($1,$2,$3,$4,'parent',true,true)`, [randomUUID(), tenantId, members[10].id, members[1].id]);
  await q(`INSERT INTO guardians (id, tenant_id, guardian_member_id, minor_member_id, relationship, is_payer, can_pickup)
           VALUES ($1,$2,$3,$4,'parent',true,true)`, [randomUUID(), tenantId, members[11].id, members[2].id]);
  // emergency contacts + consents
  for (const m of members.slice(0, 12)) {
    await q(`INSERT INTO emergency_contacts (id, tenant_id, member_id, name, relationship, phone, medical_note)
             VALUES ($1,$2,$3,$4,'familie','+597 8'||$5,$6)`,
      [randomUUID(), tenantId, m.id, pick(firstNames) + " " + pick(lastNames), int(100000, 999999),
       rnd() > 0.7 ? "Astma — inhaler in tas" : null]);
    if (m.minor) {
      await q(`INSERT INTO consents (id, tenant_id, member_id, type, granted, granted_by, granted_at)
               VALUES ($1,$2,$3,'guardian_consent',true,'ouder',now())`, [randomUUID(), tenantId, m.id]);
    }
  }

  // ---- Health screenings + medical flags ----
  for (const m of members.slice(0, 16)) {
    const flag = rnd() > 0.85 ? "red" : rnd() > 0.7 ? "amber" : "green";
    await q(`INSERT INTO health_screenings (id, tenant_id, member_id, answers, risk_flag, cleared_by, cleared_at, note)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [randomUUID(), tenantId, m.id, JSON.stringify({ chest_pain: false, dizziness: false, joint_problem: flag !== "green" }),
       flag, flag === "green" ? uCoach : null, flag === "green" ? new Date().toISOString() : null,
       flag === "red" ? "Doorverwezen naar arts vóór high-intensity training." : null]);
  }
  await q(`INSERT INTO medical_flags (id, tenant_id, member_id, type, description, restriction, active)
           VALUES ($1,$2,$3,'injury','Knieblessure links','Geen sparring / geen zware kicks',true)`, [randomUUID(), tenantId, members[6].id]);
  await q(`INSERT INTO medical_flags (id, tenant_id, member_id, type, description, restriction, active)
           VALUES ($1,$2,$3,'condition','Astma','Inhaler beschikbaar, let op intensiteit',true)`, [randomUUID(), tenantId, members[8].id]);

  // ---- Memberships + invoices + payments ----
  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    if (m.status === "prospect") continue;
    const pkg = m.minor ? pkgs[5] : m.status === "alumni" ? pkgs[1] : pick([pkgs[0], pkgs[1], pkgs[2], pkgs[3]]);
    const msId = randomUUID();
    const msStatus = m.status === "frozen" ? "frozen" : m.status === "alumni" ? "cancelled" : m.status === "overdue" ? "active" : "active";
    const payer = m.minor ? members[10].id : m.id;
    await q(`INSERT INTO memberships (id, tenant_id, member_id, package_id, payer_member_id, status, start_date, end_date, next_bill_date, price, currency, credits_remaining, auto_renew, freeze_until)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'SRD',$11,$12,$13)`,
      [msId, tenantId, m.id, pkg.id, payer, msStatus, daysAgo(int(30, 400)),
       pkg.period === "year" ? daysAhead(200) : null, daysAhead(int(1, 28)), pkg.price,
       pkg.type === "class_pack" ? int(1, 8) : null, m.status !== "alumni", m.status === "frozen" ? daysAhead(20) : null]);

    // 3 recente maandfacturen
    for (let mo = 0; mo < 3; mo++) {
      const invId = randomUUID();
      const overdue = m.status === "overdue" && mo === 0;
      const status = overdue ? "overdue" : mo === 0 && rnd() > 0.6 ? "due" : "paid";
      const amount = pkg.price;
      await q(`INSERT INTO invoices (id, tenant_id, member_id, payer_member_id, membership_id, number, category, amount, currency, status, issued_at, due_date, description)
               VALUES ($1,$2,$3,$4,$5,$6,'membership',$7,'SRD',$8,$9,$10,$11)`,
        [invId, tenantId, m.id, payer, msId, "F-" + int(10000, 99999), amount, status,
         daysAgo(mo * 30 + 5), daysAgo(mo * 30 - 5), `Lidmaatschap ${pick(["juli", "juni", "mei"])}`]);
      if (status === "paid") {
        await q(`INSERT INTO payments (id, tenant_id, member_id, invoice_id, amount, currency, method, status, reference, recorded_by, received_at)
                 VALUES ($1,$2,$3,$4,$5,'SRD',$6,'confirmed',$7,$8,$9)`,
          [randomUUID(), tenantId, m.id, invId, amount, pick(["cash", "bank_transfer", "wallet"]),
           "REF" + int(1000, 9999), uFront, daysAgo(mo * 30 + 2) + "T10:00:00Z"]);
      }
    }
  }

  // ---- Bookings + attendance (laatste 4 weken) ----
  const activeMembers = members.filter((m) => ["active", "overdue", "trial"].includes(m.status));
  for (let d = 0; d < 28; d++) {
    const date = daysAgo(d);
    const wd = ((new Date(date).getDay() + 6) % 7) + 1; // 1=Mon..7=Sun
    const todays = classes.filter((c) => c.weekday === wd);
    for (const cls of todays) {
      const attendees = activeMembers.filter(() => rnd() > 0.6).slice(0, int(4, 14));
      for (const m of attendees) {
        const noShow = rnd() > 0.9;
        await q(`INSERT INTO bookings (id, tenant_id, class_id, member_id, session_date, status)
                 VALUES ($1,$2,$3,$4,$5,$6)`,
          [randomUUID(), tenantId, cls.id, m.id, date, noShow ? "no_show" : "attended"]);
        if (!noShow) {
          await q(`INSERT INTO attendance (id, tenant_id, member_id, class_id, session_date, checked_in_at, method, coach_confirmed)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
            [randomUUID(), tenantId, m.id, cls.id, date, date + "T" + cls.start + ":00Z", pick(["kiosk", "app", "manual"])]);
        }
      }
    }
  }

  // ---- Curriculum, skills, ranks, progression ----
  const curId = randomUUID();
  await q(`INSERT INTO curricula (id, tenant_id, discipline, name, age_group, level, description)
           VALUES ($1,$2,'muay_thai','Muay Thai Kern-curriculum','all','all','Van stance tot clinch en sparring readiness.')`, [curId, tenantId]);
  const skillDefs = [
    ["Stance & Guard", "stance"], ["Footwork & angles", "footwork"], ["Jab / Cross", "punch"],
    ["Hook & Uppercut", "punch"], ["Teep (push kick)", "kick"], ["Roundhouse kick", "kick"],
    ["Knee strikes", "knee"], ["Elbow strikes", "elbow"], ["Clinch control", "clinch"],
    ["Blocking & checking", "defense"], ["Counter-striking", "defense"], ["Conditioning rounds", "conditioning"],
  ];
  const skills: string[] = [];
  for (let i = 0; i < skillDefs.length; i++) {
    const id = randomUUID(); skills.push(id);
    await q(`INSERT INTO skills (id, tenant_id, curriculum_id, name, category, description, sort)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`, [id, tenantId, curId, skillDefs[i][0], skillDefs[i][1], `Techniek: ${skillDefs[i][0]}.`, i]);
  }
  const rankDefs = [["Prajioud Wit", "#e5e7eb", 0], ["Prajioud Geel", "#fde047", 10], ["Prajioud Groen", "#4ade80", 25], ["Prajioud Blauw", "#60a5fa", 50], ["Prajioud Rood", "#f87171", 100], ["Prajioud Zwart", "#111827", 200]];
  const ranks: string[] = [];
  for (let i = 0; i < rankDefs.length; i++) {
    const id = randomUUID(); ranks.push(id);
    await q(`INSERT INTO ranks (id, tenant_id, discipline, name, level_order, color, min_attendance)
             VALUES ($1,$2,'muay_thai',$3,$4,$5,$6)`, [id, tenantId, rankDefs[i][0], i, rankDefs[i][1], rankDefs[i][2]]);
  }
  for (const m of members.filter((x) => !x.minor && ["active", "overdue"].includes(x.status)).slice(0, 12)) {
    const rankIdx = m.exp === "advanced" ? int(3, 5) : m.exp === "intermediate" ? int(1, 3) : int(0, 1);
    await q(`INSERT INTO promotions (id, tenant_id, member_id, rank_id, discipline, promoted_by, promoted_at, note)
             VALUES ($1,$2,$3,$4,'muay_thai',$5,$6,'Grading behaald')`,
      [randomUUID(), tenantId, m.id, ranks[rankIdx], coaches[0].id, daysAgo(int(30, 300))]);
    for (const s of skills.slice(0, int(4, 12))) {
      await q(`INSERT INTO skill_progress (id, tenant_id, member_id, skill_id, status, signed_off_by, signed_off_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [randomUUID(), tenantId, m.id, s, pick(["learning", "competent", "competent", "mastered"]), coaches[0].id, daysAgo(int(10, 120))]);
    }
  }
  // upcoming assessments
  for (const m of members.slice(5, 10)) {
    await q(`INSERT INTO assessments (id, tenant_id, member_id, type, scheduled_for, result, assessor_id)
             VALUES ($1,$2,$3,'grading',$4,'scheduled',$5)`, [randomUUID(), tenantId, m.id, daysAhead(int(5, 40)), coaches[0].id]);
  }

  // ---- Fighters + fights + medicals ----
  const fighterMembers = members.filter((m) => !m.minor && m.exp === "advanced").slice(0, 5);
  for (const m of fighterMembers) {
    const fid = randomUUID();
    const w = int(0, 4);
    await q(`INSERT INTO fighters (id, tenant_id, member_id, discipline, stance, level, weight_class, current_weight, target_weight, wins, losses, draws, active)
             VALUES ($1,$2,$3,'muay_thai',$4,$5,$6,$7,$8,$9,$10,$11,true)`,
      [fid, tenantId, m.id, pick(["orthodox", "southpaw"]), pick(["amateur", "semi_pro"]),
       pick(["-63.5kg", "-67kg", "-71kg", "-75kg"]), 68 + w, 67 + w, int(2, 12), int(0, 5), int(0, 2)]);
    for (let f = 0; f < int(2, 5); f++) {
      await q(`INSERT INTO fights (id, tenant_id, fighter_id, event_name, fight_date, discipline, opponent, result, method, note)
               VALUES ($1,$2,$3,$4,$5,'muay_thai',$6,$7,$8,'')`,
        [randomUUID(), tenantId, fid, pick(["Paramaribo Fight Night", "Suriname Open", "WAKO Regional"]),
         daysAgo(int(30, 500)), pick(firstNames) + " " + pick(lastNames), pick(["win", "win", "loss", "draw"]), pick(["decision", "ko", "tko"])]);
    }
    await q(`INSERT INTO fight_medicals (id, tenant_id, fighter_id, doc_type, status, expires_at, note)
             VALUES ($1,$2,$3,'medical_cert',$4,$5,'')`,
      [randomUUID(), tenantId, fid, pick(["approved", "approved", "pending"]), daysAhead(int(-20, 180))]);
  }

  // ---- Exercises + program templates + training plans ----
  const exDefs = [
    ["Shadowboxing 3 rondes", "combat_drill", "none"], ["Bag work — combinations", "combat_drill", "bag"],
    ["Pad rounds", "combat_drill", "pads"], ["Teep drill", "technique", "none"],
    ["Jump rope", "conditioning", "none"], ["Kettlebell swings", "strength", "weights"],
    ["Push-ups", "strength", "none"], ["Plank hold", "conditioning", "none"],
    ["Hip mobility flow", "mobility", "none"], ["Cooldown & stretch", "recovery", "none"],
    ["Sprint intervals", "conditioning", "none"], ["Core circuit", "strength", "none"],
  ];
  const exercises: string[] = [];
  for (const [name, cat, eq] of exDefs) {
    const id = randomUUID(); exercises.push(id);
    await q(`INSERT INTO exercises (id, tenant_id, name, category, equipment, level, instructions, safety_notes, age_min)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, tenantId, name, cat, eq, pick(["beginner", "intermediate"]), "Voer uit met correcte techniek.",
       cat === "strength" ? "Let op houding, geen pijn forceren." : null, cat === "strength" ? 14 : null]);
  }
  const tmplDefs = [["Beginner Kickboxing 4 weken", "general_fitness"], ["Fight Camp 6 weken", "fight_camp"], ["Home Training (no equipment)", "home"], ["Vetverlies + conditie", "weight_loss"]];
  for (const [name, goal] of tmplDefs) {
    await q(`INSERT INTO program_templates (id, tenant_id, name, goal, level, weeks, description)
             VALUES ($1,$2,$3,$4,'all',$5,$6)`, [randomUUID(), tenantId, name, goal, int(4, 6), `Template: ${name}.`]);
  }
  const week = (arr: string[]) => JSON.stringify({
    ma: ["Technique", exDefs[0][0], exDefs[1][0]], di: ["Conditioning", exDefs[4][0], exDefs[10][0]],
    wo: ["Rust / mobility", exDefs[8][0]], do: ["Pads + bag", exDefs[2][0], exDefs[1][0]],
    vr: ["Strength", exDefs[5][0], exDefs[11][0]], za: ["Sparring / drills", exDefs[0][0]], zo: ["Recovery", exDefs[9][0]],
  });
  for (const m of members.filter((x) => ["active", "overdue"].includes(x.status)).slice(0, 10)) {
    const byAi = rnd() > 0.5;
    const tpId = randomUUID();
    const risk = members.indexOf(m) === 6 ? "escalated" : null; // knieblessure member
    await q(`INSERT INTO training_plans (id, tenant_id, member_id, name, goal, status, generated_by, week, explanation, safety_flag, approved_by, approved_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [tpId, tenantId, m.id, byAi ? "AI weekplan" : "Coach weekplan", pick(["general_fitness", "technique", "weight_loss"]),
       risk ? "blocked" : "active", byAi ? "ai" : "coach", week(exercises),
       byAi ? "Opgebouwd uit goedgekeurde oefenbibliotheek o.b.v. doel, ervaring en beschikbare dagen; volume aangepast op RPE." : null,
       risk, risk ? null : coaches[0].id, risk ? null : new Date().toISOString()]);
    for (let l = 0; l < int(3, 8); l++) {
      await q(`INSERT INTO workout_logs (id, tenant_id, member_id, plan_id, log_date, summary, rpe, soreness, pain_flag, completed)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
        [randomUUID(), tenantId, m.id, tpId, daysAgo(int(1, 25)), pick(["Technique + bag", "Conditioning", "Strength", "Pads"]),
         int(5, 9), int(1, 7), rnd() > 0.9]);
    }
  }

  // ---- Nutrition ----
  for (const m of members.filter((x) => !x.minor && ["active"].includes(x.status)).slice(0, 6)) {
    await q(`INSERT INTO nutrition_plans (id, tenant_id, member_id, goal, style, calories, macros, status, needs_pro_review, risk_flag, approved_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$9,$10)`,
      [randomUUID(), tenantId, m.id, pick(["lose_fat", "gain_muscle", "performance", "maintain"]),
       pick(["balanced", "high_protein", "vegetarian"]), int(1800, 2800),
       JSON.stringify({ protein: int(120, 200), carbs: int(150, 300), fat: int(50, 90) }),
       rnd() > 0.8, null, rnd() > 0.8 ? uCoach : null]);
  }

  // ---- Goals, progress metrics, PRs ----
  for (const m of members.filter((x) => ["active", "overdue"].includes(x.status)).slice(0, 14)) {
    await q(`INSERT INTO goals (id, tenant_id, member_id, title, baseline, target, target_date, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [randomUUID(), tenantId, m.id, pick(["5kg afvallen", "Eerste amateurpartij", "Groene prajioud", "3x/week trainen"]),
       "start", "doel", daysAhead(int(30, 120)), pick(["active", "active", "achieved"])]);
    for (let p = 0; p < 4; p++) {
      await q(`INSERT INTO progress_metrics (id, tenant_id, member_id, measured_on, weight, body_fat, note, is_private)
               VALUES ($1,$2,$3,$4,$5,$6,'',true)`,
        [randomUUID(), tenantId, m.id, daysAgo(p * 21 + 3), 60 + int(0, 30) - p * int(0, 1), 12 + int(0, 15)]);
    }
    await q(`INSERT INTO personal_bests (id, tenant_id, member_id, metric, value, unit, achieved_on)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [randomUUID(), tenantId, m.id, pick(["Bag rounds", "Push-ups", "Plank"]), int(20, 100), pick(["reps", "sec", "rounds"]), daysAgo(int(5, 60))]);
  }

  // ---- Retention tasks ----
  for (const m of members.filter((x) => ["overdue", "frozen"].includes(x.status))) {
    await q(`INSERT INTO retention_tasks (id, tenant_id, member_id, type, reason, status, owner_id, due_date, note)
             VALUES ($1,$2,$3,$4,$5,'open',$6,$7,$8)`,
      [randomUUID(), tenantId, m.id, m.status === "overdue" ? "at_risk" : "freeze_recovery",
       m.status === "overdue" ? "Betaling achterstallig + 2 weken niet getraind" : "Freeze eindigt binnenkort",
       uFront, daysAhead(int(1, 7)), "Bel voor check-in."]);
  }
  // at-risk door dalende attendance
  await q(`INSERT INTO retention_tasks (id, tenant_id, member_id, type, reason, status, owner_id, due_date, note)
           VALUES ($1,$2,$3,'at_risk','Attendance gedaald van 4x naar 1x per week','open',$4,$5,'')`,
    [randomUUID(), tenantId, members[12].id, uCoach, daysAhead(3)]);

  // ---- POS: products + sales ----
  const prodDefs = [
    ["Bokshandschoenen 12oz", "gloves", 650, 8], ["Scheenbeschermers", "shin_guards", 550, 5],
    ["Bandage / wraps", "wraps", 90, 30], ["Krachtstad T-shirt", "apparel", 175, 20],
    ["Bidon 750ml", "drinks", 60, 40], ["Proteïne shake", "supplements", 120, 15],
    ["Mondbeschermer", "gloves", 85, 12], ["Springtouw", "apparel", 110, 6],
  ];
  const products: { id: string; price: number }[] = [];
  for (const [name, cat, price, stock] of prodDefs) {
    const id = randomUUID(); products.push({ id, price: price as number });
    await q(`INSERT INTO products (id, tenant_id, sku, name, category, price, currency, tax_pct, stock, reorder_level, active)
             VALUES ($1,$2,$3,$4,$5,$6,'SRD',10,$7,5,true)`,
      [id, tenantId, "SKU-" + int(1000, 9999), name, cat, price, stock]);
  }
  for (let s = 0; s < 18; s++) {
    const saleId = randomUUID();
    const prod = pick(products); const qty = int(1, 2); const total = prod.price * qty;
    await q(`INSERT INTO sales (id, tenant_id, member_id, location_id, total, currency, method, sold_by, created_at)
             VALUES ($1,$2,$3,$4,$5,'SRD',$6,$7,$8)`,
      [saleId, tenantId, pick(members).id, locHQ, total, pick(["cash", "card", "wallet"]), uFront, daysAgo(int(0, 30)) + "T14:00:00Z"]);
    await q(`INSERT INTO sale_items (id, tenant_id, sale_id, product_id, name, qty, price)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`, [randomUUID(), tenantId, saleId, prod.id, prodDefs[products.indexOf(prod)][0], qty, prod.price]);
  }

  // ---- Events ----
  const evDefs = [
    ["Muay Thai Seminar — Kru Sombat", "seminar", daysAhead(21), false], ["Fight Camp Weekend", "camp", daysAhead(40), false],
    ["Grading & Prajioud ceremonie", "grading", daysAhead(14), false], ["Open Dag & proefles", "open_day", daysAhead(7), true],
    ["Paramaribo Fight Night", "fight", daysAhead(60), true],
  ];
  for (const [name, type, date, pub] of evDefs) {
    const eid = randomUUID();
    await q(`INSERT INTO events (id, tenant_id, location_id, name, type, start_date, end_date, capacity, member_price, nonmember_price, currency, status, is_public, description)
             VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,'SRD','published',$10,$11)`,
      [eid, tenantId, locHQ, name, type, date, int(20, 60), int(0, 150), int(50, 250), pub, `${name} bij Krachtstad.`]);
    for (const m of members.slice(0, int(4, 10))) {
      await q(`INSERT INTO event_registrations (id, tenant_id, event_id, member_id, name, status, paid, checked_in)
               VALUES ($1,$2,$3,$4,$5,'registered',$6,false)`,
        [randomUUID(), tenantId, eid, m.id, m.first + " " + m.last, rnd() > 0.4]);
    }
  }

  // ---- Communication: templates, messages, announcements, campaigns ----
  const tmpls = [
    ["welcome", "Welkom nieuw lid", "Welkom bij Krachtstad {naam}! Je eerste les staat gepland. Tot op de mat. 🥊"],
    ["trial_reminder", "Trial reminder", "Hoi {naam}, je proefles is morgen om {tijd}. Neem sportkleding en water mee!"],
    ["missed_class", "Gemiste les", "We misten je deze week {naam}. Alles goed? Boek je volgende les via de app."],
    ["renewal", "Verlenging", "Je lidmaatschap verloopt binnenkort {naam}. Verleng eenvoudig via de app."],
    ["payment_due", "Betaling openstaand", "Herinnering: er staat nog een betaling open. Bedankt {naam}!"],
    ["birthday", "Verjaardag", "Gefeliciteerd met je verjaardag {naam}! 🎉 Van het hele Krachtstad-team."],
  ];
  for (const [key, name, body] of tmpls) {
    await q(`INSERT INTO message_templates (id, tenant_id, key, name, channel, body)
             VALUES ($1,$2,$3,$4,'whatsapp',$5)`, [randomUUID(), tenantId, key, name, body]);
  }
  for (let i = 0; i < 30; i++) {
    const m = pick(members);
    await q(`INSERT INTO messages (id, tenant_id, member_id, channel, direction, body, template_key, status, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [randomUUID(), tenantId, m.id, pick(["whatsapp", "whatsapp", "email", "in_app"]), pick(["out", "out", "in"]),
       pick(["Bedankt voor de les!", "Kun je mijn abonnement pauzeren?", tmpls[0][2].replace("{naam}", m.first), "Tot morgen 💪"]),
       rnd() > 0.5 ? pick(tmpls)[0] : null, pick(["sent", "delivered", "read"]), daysAgo(int(0, 20)) + "T12:00:00Z"]);
  }
  await q(`INSERT INTO announcements (id, tenant_id, title, body, segment, created_by)
           VALUES ($1,$2,'Feestdag: zaterdag gesloten','I.v.m. de feestdag is de sportschool zaterdag gesloten. Zondag normale rooster.','all',$3)`, [randomUUID(), tenantId, uOwner]);
  await q(`INSERT INTO announcements (id, tenant_id, title, body, segment, created_by)
           VALUES ($1,$2,'Kids ouders-info-avond','Ouders van jeugdleden: info-avond over grading en veiligheid volgende week.','youth_parents',$3)`, [randomUUID(), tenantId, uOwner]);
  const campDefs = [["Meta — Proefles zomer", "meta", 1500, 42, 11], ["WhatsApp win-back", "whatsapp", 0, 18, 6], ["Referral programma", "referral", 0, 24, 14]];
  for (const [name, ch, budget, leads, conv] of campDefs) {
    await q(`INSERT INTO campaigns (id, tenant_id, name, channel, objective, budget, spend, audience, start_date, end_date, leads, conversions, status)
             VALUES ($1,$2,$3,$4,'leads',$5,$6,'Paramaribo 16-40',$7,$8,$9,$10,'active')`,
      [randomUUID(), tenantId, name, ch, budget, (budget as number) * 0.7, daysAgo(30), daysAhead(15), leads, conv]);
  }

  // ---- Leads ----
  const leadStatuses = ["new", "new", "contacted", "trial_booked", "trial_attended", "offer", "won", "lost"];
  for (let i = 0; i < 18; i++) {
    const st = pick(leadStatuses);
    await q(`INSERT INTO leads (id, tenant_id, location_id, name, phone, whatsapp, email, source, discipline, age_group, package_interest, status, owner_id, lost_reason, first_response_at, created_at)
             VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [randomUUID(), tenantId, pick(locs), pick(firstNames) + " " + pick(lastNames),
       "+597 7" + int(100000, 999999), `lead${i}@example.sr`,
       pick(["website", "meta", "whatsapp", "walk_in", "referral"]), pick(["muay_thai", "kickboxing", "fitness"]),
       pick(["youth", "adult"]), pick(["Onbeperkt Maand", "2x per week", "Kids Maand"]), st, pick([uOwner, uFront]),
       st === "lost" ? pick(["prijs", "tijd", "locatie", "geen reactie"]) : null,
       st === "new" ? null : daysAgo(int(1, 10)) + "T09:00:00Z", daysAgo(int(0, 30))]);
  }

  // ---- Website pages (CMS) ----
  const pageDefs = [
    ["home", "Welkom bij Krachtstad", "Muay Thai, kickboxing en fitness in hartje Paramaribo. Voor jeugd en volwassenen, van beginner tot fighter."],
    ["programma", "Programma's", "Muay Thai Fundamentals, Kickboxing Fitness, Kids Kickboxing, Boxing, Sparring en Strength & Conditioning."],
    ["over-ons", "Over Krachtstad", "Al meer dan 10 jaar bouwen we aan discipline, kracht en respect."],
    ["contact", "Contact", "Maagdenstraat 42, Paramaribo. WhatsApp: +597 471000."],
  ];
  for (let i = 0; i < pageDefs.length; i++) {
    await q(`INSERT INTO pages (id, tenant_id, slug, title, body, published, sort)
             VALUES ($1,$2,$3,$4,$5,true,$6)`, [randomUUID(), tenantId, pageDefs[i][0], pageDefs[i][1], pageDefs[i][2], i]);
  }

  // ---- Facility: equipment + maintenance ----
  const eqDefs = [["Zware bokszak #1", "bag"], ["Zware bokszak #2", "bag"], ["Boksring", "ring"], ["Mat vloer zone A", "mat"], ["Kettlebells set", "weights"], ["Loopband", "cardio"], ["Pads set", "gloves"]];
  const eqIds: string[] = [];
  for (const [name, cat] of eqDefs) {
    const id = randomUUID(); eqIds.push(id);
    await q(`INSERT INTO equipment (id, tenant_id, location_id, name, category, purchase_date, status, last_inspection)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, tenantId, pick(locs), name, cat, daysAgo(int(200, 1000)), pick(["ok", "ok", "ok", "maintenance"]), daysAgo(int(10, 90))]);
  }
  await q(`INSERT INTO maintenance_tickets (id, tenant_id, location_id, equipment_id, title, priority, status, reported_by)
           VALUES ($1,$2,$3,$4,'Bokszak ketting nazien','high','open',$5)`, [randomUUID(), tenantId, locHQ, eqIds[0], uCoach]);
  await q(`INSERT INTO maintenance_tickets (id, tenant_id, location_id, equipment_id, title, priority, status, reported_by, resolved_at)
           VALUES ($1,$2,$3,$4,'Ringtouwen aanspannen','normal','resolved',$5,now())`, [randomUUID(), tenantId, locHQ, eqIds[2], uCoach]);

  // ---- Documents ----
  for (const m of members.slice(0, 14)) {
    await q(`INSERT INTO documents (id, tenant_id, member_id, category, name, version, signed_at, signed_by, uploaded_by)
             VALUES ($1,$2,$3,'waiver','Aansprakelijkheidswaiver',1,$4,$5,$6)`,
      [randomUUID(), tenantId, m.id, daysAgo(int(20, 300)) + "T10:00:00Z", m.first + " " + m.last, uFront]);
  }
  await q(`INSERT INTO documents (id, tenant_id, member_id, category, name, expires_at, uploaded_by)
           VALUES ($1,$2,$3,'medical','Medische verklaring',$4,$5)`, [randomUUID(), tenantId, fighterMembers[0]?.id ?? members[15].id, daysAhead(120), uFront]);

  // ---- Safeguarding ----
  await q(`INSERT INTO safeguarding_cases (id, tenant_id, member_id, type, severity, description, status, reported_by, assigned_to, confidential)
           VALUES ($1,$2,$3,'welfare','medium','Vertrouwelijk: welzijnssignaal jeugdlid, opgevolgd met ouders.','in_progress',$4,$5,true)`,
    [randomUUID(), tenantId, members[2].id, uCoach, uOwner]);

  // ---- Integrations ----
  const intDefs = [
    ["whatsapp", "WhatsApp Business", "messaging", "connected"], ["meta", "Meta Lead Ads", "marketing", "connected"],
    ["mope", "Mopé Wallet", "payment", "disconnected"], ["bank", "Bank transfer (SNEPS)", "payment", "connected"],
    ["google_calendar", "Google Calendar", "calendar", "disconnected"], ["fitbit", "Fitbit / wearables", "wearable", "disconnected"],
    ["accounting", "Boekhouding export", "accounting", "error"],
  ];
  for (const [key, name, cat, status] of intDefs) {
    await q(`INSERT INTO integrations (id, tenant_id, key, name, category, status, last_sync_at, config)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'{}')`,
      [randomUUID(), tenantId, key, name, cat, status, status === "connected" ? new Date().toISOString() : null]);
  }

  // ---- Usage meters ----
  const period = new Date().toISOString().slice(0, 7);
  for (const [metric, val] of [["active_members", 20], ["messages", 340], ["storage_mb", 512], ["ai_plans", 8]] as [string, number][]) {
    await q(`INSERT INTO usage_meters (id, tenant_id, metric, value, period) VALUES ($1,$2,$3,$4,$5)`,
      [randomUUID(), tenantId, metric, val, period]);
  }

  // silence unused-var lint for FEATURES import used elsewhere
  void FEATURES;
}
