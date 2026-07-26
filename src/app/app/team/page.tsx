import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, StatCard, Section, DataTable, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import { can } from "@/lib/rbac";
import { NewStaffUserModal, StaffToggleButton } from "./StaffActions";

export const dynamic = "force-dynamic";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  last_login_at: string | null;
  role_name: string | null;
  role_key: string | null;
};

export default async function TeamPage() {
  const user = await guard({ cap: "settings.read" });
  if (!user.ok) return <FeatureLocked feature="Team & gebruikers" />;
  const t = user.tenantId;
  const canManage = can(user, "settings.write");

  const [users, roles] = await Promise.all([
    query<StaffUser>(
      `SELECT u.id, u.name, u.email, u.active, u.last_login_at,
              r.name AS role_name, r.key AS role_key
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
        WHERE u.tenant_id=$1 AND u.is_platform_admin=false
        ORDER BY u.created_at`,
      [t]
    ),
    query<{ id: string; name: string; key: string }>(
      `SELECT id, name, key FROM roles WHERE tenant_id=$1 ORDER BY key`,
      [t]
    ),
  ]);

  const total = users.length;
  const activeCount = users.filter((u) => u.active).length;
  const roleCount = new Set(users.map((u) => u.role_key).filter(Boolean)).size;

  return (
    <>
      <PageHeader title="Team & gebruikers" subtitle="Beheer medewerkers en hun toegang" icon="users"
        actions={canManage ? <NewStaffUserModal roles={roles} /> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard label="Gebruikers" value={total} icon="users" tone="brand" sub="totaal in team" />
        <StatCard label="Actief" value={activeCount} icon="check" tone="green" sub={`${total - activeCount} inactief`} />
        <StatCard label="Rollen" value={roleCount} icon="key" tone="indigo" sub="in gebruik" />
      </div>

      <Section title="Medewerkers">
        {users.length === 0 ? (
          <EmptyState icon="users" title="Nog geen gebruikers" subtitle="Voeg medewerkers toe om ze toegang te geven tot het platform." />
        ) : (
          <DataTable head={<><th>Naam</th><th>E-mail</th><th>Rol</th><th>Status</th><th className="text-right">Laatst ingelogd</th>{canManage && <th className="text-right">Actie</th>}</>}>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} size={30} />
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td><span className="font-mono text-xs">{u.email}</span></td>
                <td>{u.role_name ? <Badge tone="indigo">{u.role_name}</Badge> : <span className="faint">—</span>}</td>
                <td>{u.active ? <Badge tone="green">actief</Badge> : <Badge tone="slate">inactief</Badge>}</td>
                <td className="text-right faint text-sm">{u.last_login_at ? timeAgo(u.last_login_at) : "nooit"}</td>
                {canManage && <td className="text-right"><StaffToggleButton userId={u.id} active={u.active} /></td>}
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
