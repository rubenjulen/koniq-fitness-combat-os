import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, StatusBadge, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { Icon } from "@/components/icons";
import { timeAgo, dateNL, fullName, titleCase, pct } from "@/lib/format";
import { can } from "@/lib/rbac";
import { SendMessageModal, NewAnnouncementModal } from "./InboxActions";

export const dynamic = "force-dynamic";

type Message = {
  id: string;
  channel: string;
  direction: string;
  subject: string | null;
  body: string | null;
  status: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
};

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: "whatsapp",
  email: "mail",
  push: "bolt",
  in_app: "chat",
};
const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  push: "Push",
  in_app: "In-app",
};

function snippet(s: string | null, n = 90): string {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

export default async function InboxPage() {
  const user = await guard({ feature: "communication", cap: "communication.read" });
  if (!user.ok) return <FeatureLocked feature="Communicatie & community" pack="pro" />;
  const t = user.tenantId;
  const canWrite = can(user, "communication.write");

  const [messages, templates, announcements, byChannel, kpi, members] = await Promise.all([
    query<Message>(
      `SELECT m.id, m.channel, m.direction, m.subject, m.body, m.status, m.created_at,
              mem.first_name, mem.last_name
       FROM messages m
       LEFT JOIN members mem ON mem.id = m.member_id AND mem.tenant_id = m.tenant_id
       WHERE m.tenant_id=$1
       ORDER BY m.created_at DESC LIMIT 40`,
      [t]
    ),
    query<{ id: string; key: string; name: string; channel: string; body: string | null; subject: string | null }>(
      `SELECT id, key, name, channel, body, subject FROM message_templates
       WHERE tenant_id=$1 ORDER BY channel, name`,
      [t]
    ),
    query<{ id: string; title: string; body: string | null; segment: string | null; created_at: string }>(
      `SELECT id, title, body, segment, created_at FROM announcements
       WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 10`,
      [t]
    ),
    query<{ channel: string; n: number }>(
      `SELECT channel, COUNT(*)::int AS n FROM messages
       WHERE tenant_id=$1 GROUP BY channel ORDER BY n DESC`,
      [t]
    ),
    query<{ today: number; week: number; delivered: number; total: number }>(
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::int AS today,
         COUNT(*) FILTER (WHERE created_at >= date_trunc('week', now()))::int AS week,
         COUNT(*) FILTER (WHERE status IN ('delivered','read'))::int AS delivered,
         COUNT(*)::int AS total
       FROM messages WHERE tenant_id=$1`,
      [t]
    ),
    query<{ id: string; first_name: string | null; last_name: string | null }>(
      `SELECT id, first_name, last_name FROM members
       WHERE tenant_id=$1 ORDER BY first_name, last_name`,
      [t]
    ),
  ]);

  const k = kpi[0] ?? { today: 0, week: 0, delivered: 0, total: 0 };
  const deliveryRate = k.total > 0 ? (k.delivered / k.total) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Communicatie-inbox"
        subtitle="WhatsApp, e-mail en aankondigingen op één plek"
        icon="inbox"
        actions={canWrite ? (
          <div className="flex items-center gap-2">
            <SendMessageModal members={members} templates={templates} />
            <NewAnnouncementModal />
          </div>
        ) : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Berichten vandaag" value={k.today} icon="chat" tone="brand" sub={`${k.week} deze week`} />
        <StatCard label="Templates" value={templates.length} icon="file" tone="indigo" />
        <StatCard label="Delivery rate" value={pct(deliveryRate)} icon="check" tone="green" sub={`${k.delivered} van ${k.total}`} />
        <StatCard label="Kanalen actief" value={byChannel.length} icon="megaphone" tone="purple" />
      </div>

      {byChannel.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {byChannel.map((c) => (
            <div key={c.channel} className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: "var(--bg-subtle)" }}>
              <Icon name={CHANNEL_ICON[c.channel] ?? "chat"} size={15} className="faint" />
              <span className="text-sm font-medium">{CHANNEL_LABEL[c.channel] ?? c.channel}</span>
              <span className="text-xs font-bold faint tabular-nums">{c.n}</span>
            </div>
          ))}
        </div>
      )}

      <Section title="Recente berichten">
        {messages.length === 0 ? (
          <EmptyState icon="inbox" title="Nog geen berichten" subtitle="Verzonden en ontvangen berichten verschijnen hier." />
        ) : (
          <Card padding={false}>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {messages.map((m) => {
                const name = fullName(m);
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3">
                    <Avatar name={name === "—" ? undefined : name} size={34} />
                    <Icon name={CHANNEL_ICON[m.channel] ?? "chat"} size={16} className="faint shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{name}</p>
                        <Badge tone={m.direction === "in" ? "blue" : "slate"}>{m.direction === "in" ? "Inkomend" : "Uitgaand"}</Badge>
                      </div>
                      <p className="text-xs muted truncate">{snippet(m.body)}</p>
                    </div>
                    <StatusBadge status={m.status} />
                    <span className="text-xs faint hidden sm:block w-24 text-right shrink-0">{timeAgo(m.created_at)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </Section>

      <Section title="Templates">
        {templates.length === 0 ? (
          <Card><p className="text-sm muted">Geen templates.</p></Card>
        ) : (
          <DataTable head={<><th>Naam</th><th>Kanaal</th><th>Bericht</th></>}>
            {templates.map((tpl) => (
              <tr key={tpl.id}>
                <td className="font-medium">{tpl.name}</td>
                <td><Badge tone="slate">{CHANNEL_LABEL[tpl.channel] ?? tpl.channel}</Badge></td>
                <td className="muted">{snippet(tpl.subject ?? tpl.body, 70)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <Section title="Aankondigingen">
        {announcements.length === 0 ? (
          <Card><p className="text-sm muted">Geen aankondigingen.</p></Card>
        ) : (
          <Card padding={false}>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {announcements.map((a) => (
                <div key={a.id} className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{a.title}</p>
                    {a.segment && <Badge tone="indigo">{titleCase(a.segment)}</Badge>}
                    <span className="text-xs faint ml-auto">{dateNL(a.created_at)}</span>
                  </div>
                  <p className="text-sm muted">{snippet(a.body, 140)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Section>
    </>
  );
}
