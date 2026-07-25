import { guard } from "@/lib/guard";
import { query, queryOne } from "@/db/client";
import { PageHeader, Card, Section, StatusBadge, Badge, Avatar, EmptyState, InfoRow, RiskBadge, Progress, LinkButton, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { money, dateNL, timeAgo, age, fullName, titleCase } from "@/lib/format";
import { can } from "@/lib/rbac";
import { freezeMembership } from "../actions";
import { StatusChanger, AddEmergencyContactModal } from "./MemberDetailActions";
import { SubmitButton } from "@/components/FormControls";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Member = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  member_no: string | null;
  status: string;
  dob: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  district: string | null;
  is_minor: boolean;
  join_date: string | null;
  source: string | null;
  goal: string | null;
  experience: string | null;
  photo_url: string | null;
  notes: string | null;
  location_name: string | null;
};

type Membership = {
  id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  next_bill_date: string | null;
  price: number | null;
  auto_renew: boolean;
  credits_remaining: number | null;
  package_name: string | null;
  package_type: string | null;
  billing_period: string | null;
};

type Invoice = { id: string; number: string | null; category: string; amount: number; status: string; issued_at: string | null; due_date: string | null };
type Payment = { id: string; amount: number; method: string; status: string; reference: string | null; received_at: string | null };
type Att = { id: string; session_date: string | null; checked_in_at: string | null; method: string; class_title: string | null };
type GuardianOf = { id: string; relationship: string | null; is_payer: boolean; can_pickup: boolean; first_name: string | null; last_name: string | null; status: string | null };
type Emergency = { id: string; name: string; relationship: string | null; phone: string | null; medical_note: string | null };
type MedFlag = { id: string; type: string; description: string | null; restriction: string | null; active: boolean };
type Screening = { risk_flag: string; cleared_at: string | null; note: string | null };
type SkillSummary = { total: number; learning: number; competent: number; mastered: number };
type Promotion = { id: string; discipline: string | null; promoted_at: string | null; rank_name: string | null; rank_color: string | null };
type Goal = { id: string; title: string; baseline: string | null; target: string | null; target_date: string | null; status: string };
type Doc = { id: string; category: string; name: string; expires_at: string | null; signed_at: string | null; created_at: string | null };

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await guard({ feature: "members", cap: "member.read" });
  if (!user.ok) return <FeatureLocked feature="Members" pack="starter" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;
  const canWrite = can(user, "member.write");

  const member = await queryOne<Member>(
    `SELECT m.id, m.first_name, m.last_name, m.member_no, m.status, m.dob, m.gender, m.email, m.phone,
            m.whatsapp, m.address, m.district, m.is_minor, m.join_date, m.source, m.goal, m.experience,
            m.photo_url, m.notes, l.name AS location_name
       FROM members m
       LEFT JOIN locations l ON l.id = m.location_id AND l.tenant_id = $1
      WHERE m.id = $2 AND m.tenant_id = $1`,
    [t, id]
  );

  if (!member) {
    return (
      <>
        <PageHeader title="Lid niet gevonden" icon="users" actions={<LinkButton href="/app/members" icon="arrowRight" variant="secondary">Terug naar leden</LinkButton>} />
        <EmptyState icon="users" title="Dit lid bestaat niet" subtitle="Het lid is mogelijk verwijderd of hoort bij een andere vestiging." />
      </>
    );
  }

  const [membership, invoices, payments, attendance, guardians, minors, emergency, medFlags, screening, skills, promotion, goals, documents] = await Promise.all([
    queryOne<Membership>(
      `SELECT ms.id, ms.status, ms.start_date, ms.end_date, ms.next_bill_date, ms.price::float AS price,
              ms.auto_renew, ms.credits_remaining, p.name AS package_name, p.type AS package_type, p.billing_period
         FROM memberships ms
         LEFT JOIN packages p ON p.id = ms.package_id AND p.tenant_id = $1
        WHERE ms.member_id = $2 AND ms.tenant_id = $1
        ORDER BY (ms.status = 'active') DESC, ms.start_date DESC NULLS LAST
        LIMIT 1`,
      [t, id]
    ),
    query<Invoice>(
      `SELECT id, number, category, amount::float AS amount, status, issued_at, due_date
         FROM invoices WHERE member_id = $2 AND tenant_id = $1
        ORDER BY issued_at DESC NULLS LAST, created_at DESC LIMIT 6`,
      [t, id]
    ),
    query<Payment>(
      `SELECT id, amount::float AS amount, method, status, reference, received_at
         FROM payments WHERE member_id = $2 AND tenant_id = $1
        ORDER BY received_at DESC NULLS LAST LIMIT 6`,
      [t, id]
    ),
    query<Att>(
      `SELECT a.id, a.session_date, a.checked_in_at, a.method, c.title AS class_title
         FROM attendance a
         LEFT JOIN classes c ON c.id = a.class_id AND c.tenant_id = $1
        WHERE a.member_id = $2 AND a.tenant_id = $1
        ORDER BY a.session_date DESC NULLS LAST, a.checked_in_at DESC NULLS LAST LIMIT 10`,
      [t, id]
    ),
    // Guardians OF this member (this member is the minor)
    query<GuardianOf>(
      `SELECT g.id, g.relationship, g.is_payer, g.can_pickup, gm.first_name, gm.last_name, gm.status
         FROM guardians g
         JOIN members gm ON gm.id = g.guardian_member_id AND gm.tenant_id = $1
        WHERE g.minor_member_id = $2 AND g.tenant_id = $1`,
      [t, id]
    ),
    // Minors this member is guardian of
    query<GuardianOf>(
      `SELECT g.id, g.relationship, g.is_payer, g.can_pickup, mm.first_name, mm.last_name, mm.status
         FROM guardians g
         JOIN members mm ON mm.id = g.minor_member_id AND mm.tenant_id = $1
        WHERE g.guardian_member_id = $2 AND g.tenant_id = $1`,
      [t, id]
    ),
    query<Emergency>(
      `SELECT id, name, relationship, phone, medical_note
         FROM emergency_contacts WHERE member_id = $2 AND tenant_id = $1 ORDER BY created_at`,
      [t, id]
    ),
    query<MedFlag>(
      `SELECT id, type, description, restriction, active
         FROM medical_flags WHERE member_id = $2 AND tenant_id = $1 ORDER BY active DESC, created_at DESC`,
      [t, id]
    ),
    queryOne<Screening>(
      `SELECT risk_flag, cleared_at, note
         FROM health_screenings WHERE member_id = $2 AND tenant_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [t, id]
    ),
    queryOne<SkillSummary>(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE status = 'learning')::int AS learning,
              count(*) FILTER (WHERE status = 'competent')::int AS competent,
              count(*) FILTER (WHERE status = 'mastered')::int AS mastered
         FROM skill_progress WHERE member_id = $2 AND tenant_id = $1`,
      [t, id]
    ),
    queryOne<Promotion>(
      `SELECT pr.id, pr.discipline, pr.promoted_at, r.name AS rank_name, r.color AS rank_color
         FROM promotions pr
         LEFT JOIN ranks r ON r.id = pr.rank_id AND r.tenant_id = $1
        WHERE pr.member_id = $2 AND pr.tenant_id = $1
        ORDER BY pr.promoted_at DESC NULLS LAST LIMIT 1`,
      [t, id]
    ),
    query<Goal>(
      `SELECT id, title, baseline, target, target_date, status
         FROM goals WHERE member_id = $2 AND tenant_id = $1 ORDER BY created_at DESC LIMIT 6`,
      [t, id]
    ),
    query<Doc>(
      `SELECT id, category, name, expires_at, signed_at, created_at
         FROM documents WHERE member_id = $2 AND tenant_id = $1 ORDER BY created_at DESC LIMIT 8`,
      [t, id]
    ),
  ]);

  const a = age(member.dob);
  const openInvoices = invoices.filter((i) => ["due", "overdue", "partial"].includes(i.status));
  const skillTotal = skills?.total ?? 0;
  const masteredPct = skillTotal > 0 ? Math.round(((skills?.mastered ?? 0) / skillTotal) * 100) : 0;

  return (
    <>
      <PageHeader
        title={fullName(member)}
        subtitle={`Lid ${member.member_no ?? "—"} · sinds ${dateNL(member.join_date)}`}
        icon="users"
        actions={<LinkButton href="/app/members" icon="arrowRight" variant="secondary">Alle leden</LinkButton>}
      />

      {/* Identity header */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={fullName(member)} url={member.photo_url} size={72} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{fullName(member)}</h2>
              <StatusBadge status={member.status} />
              {member.is_minor && <Badge tone="purple">jeugd</Badge>}
              {screening && <RiskBadge risk={screening.risk_flag} />}
              {canWrite && <StatusChanger memberId={member.id} status={member.status} />}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm muted">
              {member.phone && <span className="inline-flex items-center gap-1.5"><Icon name="phone" size={14} />{member.phone}</span>}
              {member.whatsapp && <span className="inline-flex items-center gap-1.5"><Icon name="whatsapp" size={14} style={{ color: "#25D366" }} />{member.whatsapp}</span>}
              {member.email && <span className="inline-flex items-center gap-1.5"><Icon name="mail" size={14} />{member.email}</span>}
              {member.location_name && <span className="inline-flex items-center gap-1.5"><Icon name="mapPin" size={14} />{member.location_name}</span>}
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{a != null ? a : "—"}</p>
              <p className="text-xs faint">leeftijd</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{attendance.length}</p>
              <p className="text-xs faint">recente check-ins</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT column */}
        <div className="space-y-6">
          <Section title="Profiel">
            <Card>
              <InfoRow label="Lidnummer">{member.member_no ?? "—"}</InfoRow>
              <InfoRow label="Geslacht">{member.gender ? titleCase(member.gender) : "—"}</InfoRow>
              <InfoRow label="Geboortedatum">{dateNL(member.dob)}{a != null ? ` (${a} jr)` : ""}</InfoRow>
              <InfoRow label="Ervaring">{member.experience ? titleCase(member.experience) : "—"}</InfoRow>
              <InfoRow label="Doel">{member.goal ?? "—"}</InfoRow>
              <InfoRow label="Bron">{member.source ? titleCase(member.source) : "—"}</InfoRow>
              <InfoRow label="Adres">{[member.address, member.district].filter(Boolean).join(", ") || "—"}</InfoRow>
              <InfoRow label="Ingeschreven">{dateNL(member.join_date)}</InfoRow>
            </Card>
          </Section>

          <Section title="Lidmaatschap">
            {membership ? (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>{membership.package_name ?? "—"}</p>
                    <p className="text-xs faint">{membership.package_type ? titleCase(membership.package_type) : "—"}{membership.billing_period ? ` · per ${membership.billing_period}` : ""}</p>
                  </div>
                  <StatusBadge status={membership.status} />
                </div>
                <InfoRow label="Prijs">{money(membership.price ?? 0, cur)}</InfoRow>
                <InfoRow label="Startdatum">{dateNL(membership.start_date)}</InfoRow>
                <InfoRow label="Volgende incasso">{dateNL(membership.next_bill_date)}</InfoRow>
                {membership.credits_remaining != null && <InfoRow label="Resterende credits">{membership.credits_remaining}</InfoRow>}
                <InfoRow label="Auto-verlengen">{membership.auto_renew ? "Ja" : "Nee"}</InfoRow>
                {canWrite && (membership.status === "active" || membership.status === "frozen") && (
                  <form action={freezeMembership} className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <input type="hidden" name="membershipId" value={membership.id} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <SubmitButton icon={membership.status === "frozen" ? "bolt" : "clock"} variant="secondary" className="btn-sm">
                      {membership.status === "frozen" ? "Reactiveren" : "Bevriezen"}
                    </SubmitButton>
                  </form>
                )}
              </Card>
            ) : (
              <EmptyState icon="tag" title="Geen actief lidmaatschap" subtitle="Dit lid heeft nog geen pakket gekoppeld." />
            )}
          </Section>

          {/* Guardians / minors */}
          {(guardians.length > 0 || minors.length > 0) && (
            <Section title={minors.length > 0 ? "Gezin — pupillen" : "Ouders / verzorgers"}>
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {(minors.length > 0 ? minors : guardians).map((g) => (
                    <div key={g.id} className="flex items-center gap-3 p-3">
                      <Avatar name={fullName(g)} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{fullName(g)}</p>
                        <p className="text-xs faint">{g.relationship ? titleCase(g.relationship) : "—"}</p>
                      </div>
                      <div className="flex gap-1">
                        {g.is_payer && <Badge tone="green">betaler</Badge>}
                        {g.can_pickup && <Badge tone="slate">ophalen</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Section>
          )}

          <Section title="Noodcontacten" actions={canWrite ? <AddEmergencyContactModal memberId={member.id} /> : undefined}>
            {emergency.length === 0 ? (
              <EmptyState icon="phone" title="Geen noodcontact" subtitle="Voeg minimaal één noodcontact toe." />
            ) : (
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {emergency.map((e) => (
                    <div key={e.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{e.name}</p>
                        <span className="text-xs muted">{e.relationship ? titleCase(e.relationship) : "—"}</span>
                      </div>
                      {e.phone && <p className="text-xs muted inline-flex items-center gap-1.5 mt-0.5"><Icon name="phone" size={12} />{e.phone}</p>}
                      {e.medical_note && <p className="text-xs faint mt-1">{e.medical_note}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>
        </div>

        {/* MIDDLE column */}
        <div className="space-y-6">
          <Section title="Facturen" actions={<Link href="/app/billing" className="link text-xs">Facturatie →</Link>}>
            {invoices.length === 0 ? (
              <EmptyState icon="file" title="Geen facturen" />
            ) : (
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{inv.number ?? titleCase(inv.category)}</p>
                        <p className="text-xs faint">{titleCase(inv.category)} · {dateNL(inv.issued_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--text)" }}>{money(inv.amount, cur)}</p>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>

          <Section title="Betalingen">
            {payments.length === 0 ? (
              <EmptyState icon="coins" title="Geen betalingen" />
            ) : (
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3">
                      <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                        <Icon name="coins" size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{money(p.amount, cur)}</p>
                        <p className="text-xs faint">{titleCase(p.method)}{p.reference ? ` · ${p.reference}` : ""}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={p.status} />
                        <p className="text-xs faint mt-0.5">{dateNL(p.received_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>

          <Section title="Recente check-ins">
            {attendance.length === 0 ? (
              <EmptyState icon="qr" title="Nog geen bezoeken" />
            ) : (
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {attendance.map((at) => (
                    <div key={at.id} className="flex items-center gap-3 p-3">
                      <div className="w-1.5 h-9 rounded-full shrink-0" style={{ background: "var(--brand)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{at.class_title ?? "Vrije training"}</p>
                        <p className="text-xs faint">{dateNL(at.session_date)} · {titleCase(at.method)}</p>
                      </div>
                      <span className="text-xs faint">{at.checked_in_at ? timeAgo(at.checked_in_at) : ""}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>
        </div>

        {/* RIGHT column */}
        <div className="space-y-6">
          <Section title="Gezondheid & veiligheid">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Screening</h3>
                {screening ? <RiskBadge risk={screening.risk_flag} /> : <Badge tone="slate">geen</Badge>}
              </div>
              {screening?.note && <p className="text-xs muted mb-3">{screening.note}</p>}
              {medFlags.length === 0 ? (
                <p className="text-sm muted">Geen medische aandachtspunten.</p>
              ) : (
                <div className="space-y-2">
                  {medFlags.map((f) => (
                    <div key={f.id} className="flex items-start gap-2">
                      <Icon name="alert" size={15} style={{ color: f.active ? "#dc2626" : "var(--text-faint)", marginTop: 2 }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                          {titleCase(f.type)} {!f.active && <span className="text-xs faint">(inactief)</span>}
                        </p>
                        {f.description && <p className="text-xs muted">{f.description}</p>}
                        {f.restriction && <p className="text-xs" style={{ color: "#b45309" }}>Beperking: {f.restriction}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Section>

          <Section title="Voortgang & rang">
            <Card>
              {promotion && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="w-10 h-10 rounded-lg grid place-items-center shrink-0" style={{ background: promotion.rank_color ?? "var(--brand-soft)", color: "#fff" }}>
                    <Icon name="belt" size={20} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>{promotion.rank_name ?? "—"}</p>
                    <p className="text-xs faint">{promotion.discipline ? titleCase(promotion.discipline) : ""} · {dateNL(promotion.promoted_at)}</p>
                  </div>
                </div>
              )}
              {skillTotal === 0 ? (
                <p className="text-sm muted">Nog geen skill-voortgang vastgelegd.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="muted">Beheerst</span>
                    <span className="font-semibold">{skills?.mastered ?? 0}/{skillTotal}</span>
                  </div>
                  <Progress value={masteredPct} tone="green" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge tone="amber">In ontwikkeling {skills?.learning ?? 0}</Badge>
                    <Badge tone="blue">Competent {skills?.competent ?? 0}</Badge>
                    <Badge tone="green">Beheerst {skills?.mastered ?? 0}</Badge>
                  </div>
                </>
              )}
            </Card>
          </Section>

          <Section title="Doelen">
            {goals.length === 0 ? (
              <EmptyState icon="target" title="Geen doelen" />
            ) : (
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {goals.map((g) => (
                    <div key={g.id} className="flex items-center gap-3 p-3">
                      <Icon name="target" size={16} className="faint shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{g.title}</p>
                        <p className="text-xs faint truncate">
                          {[g.baseline && `van ${g.baseline}`, g.target && `naar ${g.target}`].filter(Boolean).join(" ") || "—"}
                          {g.target_date ? ` · ${dateNL(g.target_date)}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={g.status} />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>

          <Section title="Documenten">
            {documents.length === 0 ? (
              <EmptyState icon="file" title="Geen documenten" />
            ) : (
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {documents.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 p-3">
                      <Icon name="file" size={16} className="faint shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{d.name}</p>
                        <p className="text-xs faint">{titleCase(d.category)}{d.signed_at ? ` · getekend ${dateNL(d.signed_at)}` : ""}</p>
                      </div>
                      {d.expires_at && <span className="text-xs faint">verloopt {dateNL(d.expires_at)}</span>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>
        </div>
      </div>

      {openInvoices.length > 0 && (
        <div className="mt-6">
          <Card className="border-l-4" >
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
              <Icon name="alert" size={15} style={{ color: "#dc2626", verticalAlign: "-2px", marginRight: 6 }} />
              {openInvoices.length} openstaande factuur/facturen — totaal {money(openInvoices.reduce((s, i) => s + i.amount, 0), cur)}
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
