import { guard } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, StatusBadge, Badge, EmptyState, InfoRow, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { SubmitButton } from "@/components/FormControls";
import { timeAgo, titleCase } from "@/lib/format";
import { toggleIntegration } from "./actions";

export const dynamic = "force-dynamic";

type IntegrationRow = {
  id: string;
  key: string;
  name: string;
  category: string;
  status: string;
  last_sync_at: string | null;
};

type Kpi = {
  connected: number;
  disconnected: number;
  errors: number;
  last_sync: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  marketing: "Marketing",
  messaging: "Berichten",
  payment: "Betalingen",
  calendar: "Agenda",
  wearable: "Wearables",
  accounting: "Boekhouding",
  access: "Toegang",
};

const CATEGORY_ICONS: Record<string, string> = {
  marketing: "megaphone",
  messaging: "chat",
  payment: "coins",
  calendar: "calendar",
  wearable: "heart",
  accounting: "file",
  access: "key",
};

export default async function IntegrationsPage() {
  const user = await guard({ feature: "integrations", cap: "settings.read" });
  if (!user.ok) return <FeatureLocked feature="Integraties" pack="enterprise" />;
  const t = user.tenantId;
  const canWrite = can(user, "settings.write");

  const [rows, kpiRows] = await Promise.all([
    query<IntegrationRow>(
      `SELECT id, key, name, category, status, last_sync_at
         FROM integrations
        WHERE tenant_id=$1
        ORDER BY category, name`,
      [t]
    ),
    query<Kpi>(
      `SELECT
         count(*) FILTER (WHERE status='connected')::int AS connected,
         count(*) FILTER (WHERE status='disconnected')::int AS disconnected,
         count(*) FILTER (WHERE status='error')::int AS errors,
         max(last_sync_at) AS last_sync
       FROM integrations WHERE tenant_id=$1`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { connected: 0, disconnected: 0, errors: 0, last_sync: null };

  // Group by category preserving a sensible order.
  const order = ["marketing", "messaging", "payment", "calendar", "wearable", "accounting", "access"];
  const groups = new Map<string, IntegrationRow[]>();
  for (const r of rows) {
    if (!groups.has(r.category)) groups.set(r.category, []);
    groups.get(r.category)!.push(r);
  }
  const orderedCategories = [
    ...order.filter((c) => groups.has(c)),
    ...[...groups.keys()].filter((c) => !order.includes(c)),
  ];

  const dotColor = (status: string) =>
    status === "connected" ? "#16a34a" : status === "error" ? "#dc2626" : "var(--text-faint)";

  const endpoints = [
    { method: "GET", path: "/api/v1/members", desc: "Ledenlijst met status en lidmaatschap" },
    { method: "POST", path: "/api/v1/leads", desc: "Nieuwe lead aanmaken (formulier / landingspagina)" },
    { method: "GET", path: "/api/v1/classes", desc: "Rooster en beschikbaarheid" },
    { method: "POST", path: "/api/v1/attendance/check-in", desc: "Check-in registreren (kiosk / app)" },
    { method: "GET", path: "/api/v1/invoices", desc: "Facturen en betaalstatus" },
  ];

  const webhooks = [
    { event: "lead.created", desc: "Nieuwe lead binnengekomen" },
    { event: "payment.received", desc: "Betaling bevestigd" },
    { event: "attendance.checked_in", desc: "Lid ingecheckt bij les" },
    { event: "membership.cancelled", desc: "Lidmaatschap opgezegd" },
  ];

  return (
    <>
      <PageHeader title="Integraties & API" subtitle="Koppelingen, synchronisatie en ontwikkelaars-API" icon="plug" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Verbonden" value={k.connected} icon="check" tone="green" />
        <StatCard label="Niet verbonden" value={k.disconnected} icon="plug" tone="slate" />
        <StatCard label="Fouten" value={k.errors} icon="alert" tone={k.errors > 0 ? "red" : "slate"} />
        <StatCard label="Laatste sync" value={k.last_sync ? timeAgo(k.last_sync) : "—"} icon="clock" tone="blue" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="plug" title="Nog geen integraties" subtitle="Koppel marketing-, betaal- en berichtenkanalen om data te synchroniseren." />
      ) : (
        <div className="space-y-6">
          {orderedCategories.map((cat) => (
            <Section
              key={cat}
              title={CATEGORY_LABELS[cat] ?? titleCase(cat)}
              actions={<Badge tone="slate">{groups.get(cat)!.length}</Badge>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groups.get(cat)!.map((i) => (
                  <Card key={i.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex items-center justify-center rounded-lg shrink-0"
                          style={{ width: 38, height: 38, background: "var(--bg-subtle)" }}
                        >
                          <Icon name={CATEGORY_ICONS[cat] ?? "plug"} size={18} style={{ color: "var(--brand)" }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block rounded-full shrink-0"
                              style={{ width: 8, height: 8, background: dotColor(i.status) }}
                            />
                            <span className="font-medium truncate" style={{ color: "var(--text)" }}>{i.name}</span>
                          </div>
                          <div className="text-xs faint truncate">{i.key}</div>
                        </div>
                      </div>
                      <StatusBadge status={i.status} />
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="faint">
                        {i.last_sync_at ? `Sync ${timeAgo(i.last_sync_at)}` : "Nog niet gesynchroniseerd"}
                      </span>
                      {canWrite ? (
                        <form action={toggleIntegration}>
                          <input type="hidden" name="integrationId" value={i.id} />
                          <SubmitButton
                            icon={i.status === "connected" ? "plug" : "check"}
                            variant={i.status === "connected" ? "ghost" : "primary"}
                            className="btn-sm"
                          >
                            {i.status === "connected" ? "Verbreken" : "Verbinden"}
                          </SubmitButton>
                        </form>
                      ) : (
                        <span className={i.status === "connected" ? "muted" : "link"} style={{ fontWeight: 500 }}>
                          {i.status === "connected" ? "Verbonden" : i.status === "error" ? "Opnieuw verbinden" : "Verbinden"}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Section>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Section title="Ontwikkelaars-API">
          <Card>
            <p className="text-sm muted mb-3">
              API-first platform met geversioneerde, REST-achtige endpoints. Authenticatie via service-accounts (scoped API-sleutels), tenant-gescheiden.
            </p>
            <div className="space-y-2">
              {endpoints.map((e) => (
                <div key={e.path} className="flex items-center gap-3 text-sm">
                  <Badge tone={e.method === "GET" ? "blue" : "green"}>{e.method}</Badge>
                  <code className="tabular-nums" style={{ color: "var(--text)" }}>{e.path}</code>
                  <span className="faint text-xs truncate hidden md:inline">{e.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <InfoRow label="Basis-URL"><code className="muted">https://api.koniq.app/v1</code></InfoRow>
              <InfoRow label="Auth"><span className="muted text-sm">Bearer-token · service-account</span></InfoRow>
              <InfoRow label="Rate limit"><span className="muted text-sm">600 req/min per tenant</span></InfoRow>
            </div>
          </Card>
        </Section>

        <Section title="Webhooks">
          <Card>
            <p className="text-sm muted mb-3">
              Ondertekende webhooks (HMAC) met automatische retries en idempotentie-sleutels, zodat gebeurtenissen betrouwbaar en dubbelvrij aankomen.
            </p>
            <div className="space-y-2">
              {webhooks.map((w) => (
                <div key={w.event} className="flex items-center gap-3 text-sm">
                  <Icon name="bolt" size={14} style={{ color: "var(--brand)" }} />
                  <code style={{ color: "var(--text)" }}>{w.event}</code>
                  <span className="faint text-xs truncate hidden md:inline">{w.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <InfoRow label="Ondertekening"><span className="muted text-sm">HMAC-SHA256 · X-Koniq-Signature</span></InfoRow>
              <InfoRow label="Retries"><span className="muted text-sm">Exponentiële backoff, tot 24 uur</span></InfoRow>
              <InfoRow label="Idempotentie"><span className="muted text-sm">Idempotency-Key per levering</span></InfoRow>
            </div>
          </Card>
        </Section>
      </div>

      <div className="mt-6">
        <Card>
          <div className="flex items-start gap-3">
            <Icon name="shield" size={18} style={{ color: "var(--brand)" }} />
            <div className="text-sm">
              <div className="font-medium mb-1" style={{ color: "var(--text)" }}>Integratie-gezondheid</div>
              <p className="muted">
                Laatste succesvolle sync {k.last_sync ? timeAgo(k.last_sync) : "onbekend"}.
                {k.errors > 0
                  ? ` ${k.errors} koppeling${k.errors === 1 ? "" : "en"} in foutstatus — controleer credentials.`
                  : " Alle actieve koppelingen synchroniseren normaal."}{" "}
                Verlopende credentials en tokens worden gemonitord en gesignaleerd vóór verlopen.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
