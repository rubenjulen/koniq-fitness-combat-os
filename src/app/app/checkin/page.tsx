import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { fullName, timeAgo, titleCase, WEEKDAYS } from "@/lib/format";

export const dynamic = "force-dynamic";

type TodayClass = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  capacity: number;
  resource: string | null;
  is_sparring: boolean;
  color: string | null;
  coach_name: string | null;
  booked: number;
};

type CheckinRow = {
  id: string;
  checked_in_at: string;
  method: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  class_title: string | null;
  start_time: string | null;
};

type KpiRow = { checkins: number; unique_members: number; no_shows: number };

type MemberRow = { id: string; first_name: string | null; last_name: string | null; status: string; photo_url: string | null };

export default async function CheckinPage() {
  const user = await guard({ feature: "attendance", cap: "attendance.write" });
  if (!user.ok) return <FeatureLocked feature="Check-in & attendance" pack="starter" />;
  const t = user.tenantId;

  // JS weekday → 1=Mon .. 7=Sun
  const todayWeekday = ((new Date().getDay() + 6) % 7) + 1;

  const [todayClasses, checkins, kpi, roster] = await Promise.all([
    query<TodayClass>(
      `SELECT c.id, c.title, c.start_time, c.end_time, c.capacity, c.resource, c.is_sparring,
              ct.color, co.name AS coach_name,
              (SELECT count(*)::int FROM bookings b
                 WHERE b.class_id = c.id AND b.tenant_id = c.tenant_id
                   AND b.session_date = current_date AND b.status <> 'cancelled') AS booked
         FROM classes c
         LEFT JOIN class_types ct ON ct.id = c.class_type_id AND ct.tenant_id = c.tenant_id
         LEFT JOIN coaches co ON co.id = c.coach_id AND co.tenant_id = c.tenant_id
        WHERE c.tenant_id = $1 AND c.active = true AND c.weekday = $2
        ORDER BY c.start_time`,
      [t, todayWeekday]
    ),
    query<CheckinRow>(
      `SELECT a.id, a.checked_in_at, a.method, m.first_name, m.last_name, m.photo_url,
              cl.title AS class_title, cl.start_time
         FROM attendance a
         JOIN members m ON m.id = a.member_id AND m.tenant_id = a.tenant_id
         LEFT JOIN classes cl ON cl.id = a.class_id AND cl.tenant_id = a.tenant_id
        WHERE a.tenant_id = $1 AND a.session_date = current_date
        ORDER BY a.checked_in_at DESC`,
      [t]
    ),
    query<KpiRow>(
      `SELECT
          (SELECT count(*)::int FROM attendance a WHERE a.tenant_id = $1 AND a.session_date = current_date) AS checkins,
          (SELECT count(DISTINCT a.member_id)::int FROM attendance a WHERE a.tenant_id = $1 AND a.session_date = current_date) AS unique_members,
          (SELECT count(*)::int FROM bookings b WHERE b.tenant_id = $1 AND b.session_date = current_date AND b.status = 'no_show') AS no_shows`,
      [t]
    ),
    query<MemberRow>(
      `SELECT id, first_name, last_name, status, photo_url
         FROM members
        WHERE tenant_id = $1 AND status = 'active'
        ORDER BY first_name, last_name
        LIMIT 48`,
      [t]
    ),
  ]);

  const k = kpi[0] ?? { checkins: 0, unique_members: 0, no_shows: 0 };
  const methodTone = (m: string): "green" | "blue" | "amber" | "slate" =>
    m === "kiosk" ? "green" : m === "app" ? "blue" : m === "manual" ? "amber" : "slate";

  return (
    <>
      <PageHeader title="Check-in kiosk" subtitle={`${WEEKDAYS[todayWeekday]} — scan of tik om in te checken`} icon="qr" />

      {/* Kiosk hero */}
      <Card className="text-center mb-6" >
        <div className="mx-auto w-20 h-20 rounded-2xl grid place-items-center mb-4" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
          <Icon name="qr" size={44} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Welkom — check hier in</h2>
        <p className="text-sm muted mt-1 max-w-md mx-auto">
          Scan je lidmaatschaps-QR of tik je naam aan in de lijst hieronder. Je check-in wordt automatisch geregistreerd voor de les van vandaag.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "var(--bg-subtle)", color: "var(--text)" }}>
            <Icon name="scan" size={16} /> QR-scanner actief
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full" style={{ background: "var(--bg-subtle)", color: "var(--text)" }}>
            <Icon name="clock" size={16} /> {new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Check-ins vandaag" value={k.checkins} icon="check" tone="green" />
        <StatCard label="Unieke leden" value={k.unique_members} icon="users" tone="brand" />
        <StatCard label="No-shows vandaag" value={k.no_shows} icon="x" tone={k.no_shows > 0 ? "red" : "slate"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Lessen vandaag">
            {todayClasses.length === 0 ? (
              <EmptyState icon="calendar" title="Geen lessen vandaag" subtitle="Er staan vandaag geen lessen op het rooster." />
            ) : (
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {todayClasses.map((c) => {
                    const full = c.booked >= c.capacity;
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-3">
                        <div className="w-1.5 h-11 rounded-full shrink-0" style={{ background: c.color ?? "var(--brand)" }} />
                        <div className="w-16 text-sm font-semibold tabular-nums">{c.start_time}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{c.title}{c.is_sparring && <span className="ml-2 align-middle"><Badge tone="red">sparring</Badge></span>}</p>
                          <p className="text-xs muted truncate">{c.coach_name ?? "—"} · {c.start_time}–{c.end_time}{c.resource ? ` · ${c.resource}` : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold" style={{ color: full ? "#dc2626" : "var(--text)" }}>{c.booked}/{c.capacity}</p>
                          <p className="text-xs faint">geboekt</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </Section>

          <Section title="Check-ins vandaag">
            {checkins.length === 0 ? (
              <EmptyState icon="qr" title="Nog geen check-ins" subtitle="Zodra leden inchecken verschijnen ze hier." />
            ) : (
              <Card padding={false}>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {checkins.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3">
                      <Avatar name={fullName(c)} url={c.photo_url} size={36} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{fullName(c)}</p>
                        <p className="text-xs muted truncate">{c.class_title ?? "Vrije training"}{c.start_time ? ` · ${c.start_time}` : ""}</p>
                      </div>
                      <Badge tone={methodTone(c.method)}>{titleCase(c.method)}</Badge>
                      <span className="text-xs faint w-24 text-right hidden sm:block">{timeAgo(c.checked_in_at)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>
        </div>

        <div>
          <Section title="Actieve leden — tik om in te checken">
            {roster.length === 0 ? (
              <EmptyState icon="users" title="Geen actieve leden" />
            ) : (
              <Card padding={false}>
                <div className="max-h-[560px] overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
                  {roster.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2.5 hover:bg-[var(--bg-subtle)] cursor-pointer">
                      <Avatar name={fullName(m)} url={m.photo_url} size={34} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fullName(m)}</p>
                      </div>
                      <Icon name="chevronRight" size={16} className="faint" />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
