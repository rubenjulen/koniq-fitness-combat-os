import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { money, dateNL, fullName, titleCase, pct } from "@/lib/format";
import { can } from "@/lib/rbac";
import { AddFightModal } from "./AddFightModal";

export const dynamic = "force-dynamic";

type KpiRow = {
  active_fighters: number;
  total_fights: number;
  wins: number;
  losses: number;
  draws: number;
  upcoming_events: number;
  expired_medicals: number;
};

type FighterRow = {
  id: string;
  discipline: string | null;
  stance: string | null;
  level: string | null;
  weight_class: string | null;
  current_weight: number | null;
  target_weight: number | null;
  wins: number;
  losses: number;
  draws: number;
  active: boolean;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  medical_status: string | null;
  medical_expires: string | null;
};

type FightRow = {
  id: string;
  event_name: string | null;
  fight_date: string | null;
  opponent: string | null;
  result: string | null;
  method: string | null;
  discipline: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type EventRow = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  capacity: number | null;
  member_price: number | null;
  registrations: number;
};

const LEVEL_TONE: Record<string, "green" | "blue" | "purple"> = {
  amateur: "blue", semi_pro: "purple", pro: "green",
};

export default async function FightersPage() {
  const user = await guard({ feature: "fighters", cap: "fighter.read" });
  if (!user.ok) return <FeatureLocked feature="Fighters" pack="combat" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;

  const [kpiRows, fighters, fights, events] = await Promise.all([
    query<KpiRow>(
      `SELECT
         (SELECT count(*)::int FROM fighters WHERE tenant_id=$1 AND active=true) AS active_fighters,
         (SELECT count(*)::int FROM fights WHERE tenant_id=$1) AS total_fights,
         (SELECT coalesce(sum(wins),0)::float FROM fighters WHERE tenant_id=$1) AS wins,
         (SELECT coalesce(sum(losses),0)::float FROM fighters WHERE tenant_id=$1) AS losses,
         (SELECT coalesce(sum(draws),0)::float FROM fighters WHERE tenant_id=$1) AS draws,
         (SELECT count(*)::int FROM events WHERE tenant_id=$1 AND type IN ('fight','grading') AND start_date >= CURRENT_DATE) AS upcoming_events,
         (SELECT count(*)::int FROM fight_medicals WHERE tenant_id=$1 AND (expires_at < CURRENT_DATE OR status='expired')) AS expired_medicals`,
      [t],
    ),
    query<FighterRow>(
      `SELECT f.id, f.discipline, f.stance, f.level, f.weight_class,
         f.current_weight, f.target_weight, f.wins, f.losses, f.draws, f.active,
         m.first_name, m.last_name, m.photo_url,
         lm.status AS medical_status, lm.expires_at AS medical_expires
       FROM fighters f
       JOIN members m ON m.id = f.member_id AND m.tenant_id=$1
       LEFT JOIN LATERAL (
         SELECT fm.status, fm.expires_at
         FROM fight_medicals fm
         WHERE fm.tenant_id=$1 AND fm.fighter_id = f.id
         ORDER BY fm.created_at DESC
         LIMIT 1
       ) lm ON true
       WHERE f.tenant_id=$1
       ORDER BY f.active DESC, f.wins DESC, m.last_name`,
      [t],
    ),
    query<FightRow>(
      `SELECT ft.id, ft.event_name, ft.fight_date, ft.opponent, ft.result, ft.method, ft.discipline,
         m.first_name, m.last_name, m.photo_url
       FROM fights ft
       JOIN fighters f ON f.id = ft.fighter_id AND f.tenant_id=$1
       JOIN members m ON m.id = f.member_id AND m.tenant_id=$1
       WHERE ft.tenant_id=$1
       ORDER BY ft.fight_date DESC NULLS LAST
       LIMIT 12`,
      [t],
    ),
    query<EventRow>(
      `SELECT e.id, e.name, e.start_date, e.end_date, e.status, e.capacity, e.member_price,
         (SELECT count(*)::int FROM event_registrations er
            WHERE er.tenant_id=$1 AND er.event_id = e.id AND er.status <> 'cancelled') AS registrations
       FROM events e
       WHERE e.tenant_id=$1 AND e.type='fight'
       ORDER BY e.start_date DESC NULLS LAST
       LIMIT 8`,
      [t],
    ),
  ]);

  const kpi = kpiRows[0];
  const canWrite = can(user, "fighter.write");
  const fighterOpts = fighters.map((f) => ({ id: f.id, name: fullName(f) }));
  const decided = (kpi?.wins ?? 0) + (kpi?.losses ?? 0) + (kpi?.draws ?? 0);
  const winRate = decided > 0 ? Math.round(((kpi?.wins ?? 0) / decided) * 100) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isExpired = (f: FighterRow) =>
    f.medical_status === "expired" || (f.medical_expires != null && new Date(f.medical_expires) < today);

  // Weight cut guardrail: fighters more than 3 units above target
  const weightWatch = fighters.filter(
    (f) => f.current_weight != null && f.target_weight != null && f.current_weight - f.target_weight > 3,
  );

  return (
    <>
      <PageHeader
        title="Fighters & competitie"
        subtitle="Fight-team cockpit: roster, records, weight cuts en medische docs"
        icon="trophy"
        actions={canWrite ? (
          <div className="flex items-center gap-2">
            <AddFightModal fighters={fighterOpts} />
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Actieve fighters" value={kpi?.active_fighters ?? 0} icon="users" tone="brand" />
        <StatCard label="Totaal partijen" value={kpi?.total_fights ?? 0} icon="fire" tone="indigo" />
        <StatCard label="Win rate" value={pct(winRate)} icon="trophy" tone={winRate >= 50 ? "green" : "amber"} sub={`${kpi?.wins ?? 0}W · ${kpi?.losses ?? 0}L · ${kpi?.draws ?? 0}D`} />
        <StatCard label="Aankomende events" value={kpi?.upcoming_events ?? 0} icon="calendar" tone="purple" />
        <StatCard label="Medische docs verlopen" value={kpi?.expired_medicals ?? 0} icon="shield" tone={(kpi?.expired_medicals ?? 0) > 0 ? "red" : "green"} sub={(kpi?.expired_medicals ?? 0) > 0 ? "actie vereist" : "op orde"} />
      </div>

      {weightWatch.length > 0 && (
        <div className="card p-4 mb-6" style={{ background: "rgba(245,158,11,.08)", borderColor: "rgba(245,158,11,.35)" }}>
          <div className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5" style={{ color: "#b45309" }}><Icon name="alert" size={18} /></span>
            <div className="min-w-0">
              <p className="font-semibold" style={{ color: "#b45309" }}>Let op gewicht — {weightWatch.length} fighter{weightWatch.length === 1 ? "" : "s"} boven streefgewicht</p>
              <p className="text-sm muted mt-0.5">
                Meer dan 3 kg boven target. Snelle of extreme gewichtsafnames horen altijd onder begeleiding van een arts of gecertificeerde professional — nooit crash-cutten.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {weightWatch.map((f) => (
                  <Badge key={f.id} tone="amber">
                    {fullName(f)} · {f.current_weight}→{f.target_weight} kg (+{(Number(f.current_weight) - Number(f.target_weight)).toFixed(1)})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Section title="Fighter-roster">
        {fighters.length === 0 ? (
          <EmptyState icon="users" title="Nog geen fighters" subtitle="Voeg leden toe aan het wedstrijdteam om ze hier te beheren." />
        ) : (
          <DataTable head={<><th>Fighter</th><th>Discipline</th><th>Stance</th><th>Niveau</th><th>Gewichtsklasse</th><th>Gewicht</th><th>Record</th><th>Medisch</th></>}>
            {fighters.map((f) => {
              const expired = isExpired(f);
              const overWeight = f.current_weight != null && f.target_weight != null && f.current_weight - f.target_weight > 3;
              return (
                <tr key={f.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={fullName(f)} url={f.photo_url} size={32} />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{fullName(f)}</p>
                        {!f.active && <span className="text-xs faint">inactief</span>}
                      </div>
                    </div>
                  </td>
                  <td>{f.discipline ? titleCase(f.discipline) : "—"}</td>
                  <td className="capitalize">{f.stance ?? "—"}</td>
                  <td>{f.level ? <Badge tone={LEVEL_TONE[f.level] ?? "slate"}>{titleCase(f.level)}</Badge> : "—"}</td>
                  <td>{f.weight_class ?? "—"}</td>
                  <td>
                    {f.current_weight != null ? (
                      <span className="tabular-nums" style={{ color: overWeight ? "#b45309" : "var(--text)" }}>
                        {f.current_weight}
                        {f.target_weight != null && <span className="faint"> / {f.target_weight} kg</span>}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="tabular-nums font-semibold">{f.wins}-{f.losses}-{f.draws}</td>
                  <td>
                    {f.medical_status
                      ? <StatusBadge status={expired ? "expired" : f.medical_status} />
                      : <Badge tone="slate">geen</Badge>}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Fight record">
          {fights.length === 0 ? (
            <EmptyState icon="fire" title="Nog geen partijen" subtitle="Vastgelegde partijen verschijnen hier." />
          ) : (
            <DataTable head={<><th>Fighter</th><th>Event</th><th>Datum</th><th>Tegenstander</th><th>Uitslag</th><th>Methode</th></>}>
              {fights.map((ft) => (
                <tr key={ft.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={fullName(ft)} url={ft.photo_url} size={28} />
                      <span className="font-medium truncate">{fullName(ft)}</span>
                    </div>
                  </td>
                  <td className="truncate max-w-[10rem]">{ft.event_name ?? "—"}</td>
                  <td className="tabular-nums">{dateNL(ft.fight_date)}</td>
                  <td>{ft.opponent ?? "—"}</td>
                  <td>{ft.result ? <StatusBadge status={ft.result} /> : "—"}</td>
                  <td className="uppercase text-xs faint">{ft.method ?? "—"}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>

        <Section title="Competitie-events">
          {events.length === 0 ? (
            <EmptyState icon="calendar" title="Geen fight-events" subtitle="Plan een fight-event om registraties te volgen." />
          ) : (
            <Card padding={false}>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {events.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                      <Icon name="trophy" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{e.name}</p>
                      <p className="text-xs muted truncate">
                        {dateNL(e.start_date)}{e.member_price != null ? ` · ${money(e.member_price, cur)}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">
                        {e.registrations}{e.capacity != null ? `/${e.capacity}` : ""}
                      </p>
                      <StatusBadge status={e.status} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>
      </div>
    </>
  );
}
