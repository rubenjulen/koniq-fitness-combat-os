import { requireMember } from "@/lib/portal-auth";
import { query, queryOne } from "@/db/client";
import { Card, Badge, StatusBadge, Progress } from "@/components/ui";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/FormControls";
import { money, WEEKDAYS_SHORT } from "@/lib/format";
import { bookClass, logWorkout } from "./actions";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const m = await requireMember();
  const wd = ((new Date().getDay() + 6) % 7) + 1;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";

  const [nextClass, membership, lastInvoice, attCount, plan] = await Promise.all([
    queryOne<{ id: string; title: string; start_time: string; end_time: string }>(
      `SELECT id, title, start_time, end_time FROM classes WHERE tenant_id=$1 AND weekday=$2 AND active ORDER BY start_time LIMIT 1`, [m.tenantId, wd]),
    queryOne<{ status: string; package: string | null; next_bill_date: string | null }>(
      `SELECT ms.status, p.name AS package, ms.next_bill_date FROM memberships ms LEFT JOIN packages p ON p.id=ms.package_id
        WHERE ms.tenant_id=$1 AND ms.member_id=$2 ORDER BY ms.created_at DESC LIMIT 1`, [m.tenantId, m.id]),
    queryOne<{ status: string; amount: number }>(
      `SELECT status, amount FROM invoices WHERE tenant_id=$1 AND member_id=$2 ORDER BY issued_at DESC LIMIT 1`, [m.tenantId, m.id]),
    queryOne<{ n: number }>(
      `SELECT count(*)::int AS n FROM attendance WHERE tenant_id=$1 AND member_id=$2 AND session_date >= date_trunc('week', current_date)`, [m.tenantId, m.id]),
    queryOne<{ week: Record<string, string[]>; goal: string | null }>(
      `SELECT week, goal FROM training_plans WHERE tenant_id=$1 AND member_id=$2 AND status='active' ORDER BY created_at DESC LIMIT 1`, [m.tenantId, m.id]),
  ]);

  const alreadyBooked = nextClass
    ? await queryOne<{ id: string }>(
        `SELECT id FROM bookings WHERE tenant_id=$1 AND member_id=$2 AND class_id=$3 AND session_date=current_date LIMIT 1`,
        [m.tenantId, m.id, nextClass.id]
      )
    : null;

  const dayKeys = ["ma", "di", "wo", "do", "vr", "za", "zo"];
  const week = plan?.week ?? {};
  const paid = lastInvoice?.status === "paid";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm faint uppercase tracking-wide">{greet}</p>
        <h1 className="text-2xl font-extrabold">{m.firstName} 🥊</h1>
      </div>

      <Card>
        <p className="section-title mb-2">Vandaag</p>
        {nextClass ? (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl grid place-items-center" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}><Icon name="calendar" size={22} /></div>
            <div className="flex-1">
              <p className="font-semibold">{nextClass.title}</p>
              <p className="text-sm muted">{nextClass.start_time} – {nextClass.end_time}</p>
            </div>
            {alreadyBooked ? (
              <span className="text-sm font-semibold flex items-center gap-1" style={{ color: "#059669" }}>
                <Icon name="check" size={16} /> geboekt
              </span>
            ) : (
              <form action={bookClass}>
                <input type="hidden" name="classId" value={nextClass.id} />
                <SubmitButton variant="primary" className="btn-sm">Boek</SubmitButton>
              </form>
            )}
          </div>
        ) : <p className="text-sm muted">Geen les gepland vandaag. Tijd voor rust of eigen training. 💪</p>}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="section-title mb-1">Membership</p>
          <div className="mt-1"><StatusBadge status={membership?.status ?? "—"} /></div>
          <p className="text-xs muted mt-2">{membership?.package ?? "Geen abonnement"}</p>
        </Card>
        <Card>
          <p className="section-title mb-1">Betaling</p>
          <div className="mt-1 flex items-center gap-1.5" style={{ color: paid ? "#059669" : "#b45309" }}>
            <Icon name={paid ? "check" : "alert"} size={18} />
            <span className="font-semibold text-sm">{paid ? "Betaald" : "Openstaand"}</span>
          </div>
          {!paid && lastInvoice && <p className="text-xs muted mt-2">{money(lastInvoice.amount, "SRD")}</p>}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="section-title">Deze week</p>
          <span className="text-sm font-semibold">{attCount?.n ?? 0} / 4 trainingen</span>
        </div>
        <Progress value={Math.min(100, ((attCount?.n ?? 0) / 4) * 100)} tone="green" />
      </Card>

      <Card>
        <p className="section-title mb-3">Training plan {plan?.goal ? `· ${plan.goal.replace("_", " ")}` : ""}</p>
        <div className="space-y-1.5">
          {dayKeys.map((d, i) => {
            const items = week[d] ?? [];
            const isToday = i + 1 === wd;
            return (
              <div key={d} className="flex items-center gap-3 py-1">
                <span className="w-8 text-xs font-bold" style={{ color: isToday ? "var(--brand)" : "var(--text-faint)" }}>{WEEKDAYS_SHORT[i + 1]}</span>
                <span className="text-sm truncate flex-1">{items[0] ?? "—"}</span>
                {isToday && <Badge tone="rose">vandaag</Badge>}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <form action={logWorkout} className="contents">
          <input type="hidden" name="summary" value="Eigen training" />
          <SubmitButton icon="dumbbell" variant="primary">Start workout</SubmitButton>
        </form>
        <button className="btn btn-secondary"><Icon name="trend" size={16} /> Progress</button>
      </div>
    </div>
  );
}
