import { requireMember } from "@/lib/portal-auth";
import { query, queryOne } from "@/db/client";
import { Card, StatusBadge, EmptyState, Badge } from "@/components/ui";
import { Icon } from "@/components/icons";
import { money, dateNL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalPayments() {
  const m = await requireMember();
  const [open, invoices, membership] = await Promise.all([
    queryOne<{ total: number }>(`SELECT coalesce(sum(amount),0)::float AS total FROM invoices WHERE tenant_id=$1 AND member_id=$2 AND status IN ('due','overdue','partial')`, [m.tenantId, m.id]),
    query<{ number: string | null; amount: number; status: string; issued_at: string; description: string | null }>(
      `SELECT number, amount, status, issued_at, description FROM invoices WHERE tenant_id=$1 AND member_id=$2 ORDER BY issued_at DESC LIMIT 12`, [m.tenantId, m.id]),
    queryOne<{ package: string | null; next_bill_date: string | null; price: number }>(
      `SELECT p.name AS package, ms.next_bill_date, ms.price FROM memberships ms LEFT JOIN packages p ON p.id=ms.package_id WHERE ms.tenant_id=$1 AND ms.member_id=$2 ORDER BY ms.created_at DESC LIMIT 1`, [m.tenantId, m.id]),
  ]);
  const openAmount = open?.total ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Betalingen</h1>

      <Card className={openAmount > 0 ? "" : ""}>
        <p className="section-title mb-1">Openstaand</p>
        <p className="text-3xl font-extrabold" style={{ color: openAmount > 0 ? "#b45309" : "#059669" }}>{money(openAmount, "SRD")}</p>
        {openAmount > 0 ? (
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary btn-sm"><Icon name="coins" size={15} /> Betaal nu</button>
            <button className="btn btn-secondary btn-sm">Bewijs uploaden</button>
          </div>
        ) : <p className="text-sm muted mt-1">Alles betaald — top! 🙌</p>}
      </Card>

      {membership && (
        <Card>
          <p className="section-title mb-2">Abonnement</p>
          <div className="flex items-center justify-between text-sm"><span className="muted">Pakket</span><span className="font-medium">{membership.package ?? "—"}</span></div>
          <div className="flex items-center justify-between text-sm mt-1"><span className="muted">Prijs</span><span className="font-medium">{money(membership.price, "SRD")}</span></div>
          <div className="flex items-center justify-between text-sm mt-1"><span className="muted">Volgende incasso</span><span className="font-medium">{dateNL(membership.next_bill_date)}</span></div>
        </Card>
      )}

      <Card>
        <p className="section-title mb-2">Facturen</p>
        {invoices.length === 0 ? <EmptyState icon="file" title="Geen facturen" /> : (
          <div className="space-y-2">
            {invoices.map((inv, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="text-sm font-medium">{inv.description ?? inv.number ?? "Factuur"}</p>
                  <p className="text-xs faint">{dateNL(inv.issued_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{money(inv.amount, "SRD")}</p>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-xs faint text-center">Betaalmethoden: cash · banktransfer · Mopé wallet · online</p>
    </div>
  );
}
