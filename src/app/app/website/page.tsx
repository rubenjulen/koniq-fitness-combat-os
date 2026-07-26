import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { PageHeader, Card, StatCard, Section, DataTable, Badge, EmptyState, LinkButton, FeatureLocked } from "@/components/ui";
import { money, dateNL, titleCase } from "@/lib/format";
import { can } from "@/lib/rbac";
import { NewPageModal, PagePublishToggle } from "./WebsiteActions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  const user = await guard({ feature: "website", cap: "website.read" });
  if (!user.ok) return <FeatureLocked feature="Website & CMS" pack="starter" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;
  const canWrite = can(user, "website.write");

  const [pages, programs, packages, coaches, events, kpi] = await Promise.all([
    query<{ id: string; slug: string; title: string; published: boolean; updated_at: string }>(
      `SELECT id, slug, title, published, updated_at
       FROM pages WHERE tenant_id=$1 ORDER BY sort NULLS LAST, title`,
      [t]
    ),
    query<{ id: string; name: string; discipline: string | null; level: string | null }>(
      `SELECT id, name, discipline, level FROM class_types
       WHERE tenant_id=$1 ORDER BY discipline NULLS LAST, name`,
      [t]
    ),
    query<{ id: string; name: string; price: number | null; billing_period: string | null; discipline: string | null }>(
      `SELECT id, name, price, billing_period, discipline FROM packages
       WHERE tenant_id=$1 AND is_public=true AND active=true ORDER BY sort NULLS LAST, price`,
      [t]
    ),
    query<{ id: string; name: string; role: string | null; specialties: string | null; photo_url: string | null }>(
      `SELECT id, name, role, specialties, photo_url FROM coaches
       WHERE tenant_id=$1 AND is_public=true AND active=true ORDER BY name`,
      [t]
    ),
    query<{ id: string; name: string; type: string; start_date: string | null; status: string }>(
      `SELECT id, name, type, start_date, status FROM events
       WHERE tenant_id=$1 AND is_public=true AND status='published'
       ORDER BY start_date NULLS LAST`,
      [t]
    ),
    query<{ pub_pages: number; pub_programs: number; pub_packages: number }>(
      `SELECT
         (SELECT COUNT(*) FROM pages WHERE tenant_id=$1 AND published=true)::int AS pub_pages,
         (SELECT COUNT(*) FROM class_types WHERE tenant_id=$1)::int AS pub_programs,
         (SELECT COUNT(*) FROM packages WHERE tenant_id=$1 AND is_public=true AND active=true)::int AS pub_packages`,
      [t]
    ),
  ]);

  const k = kpi[0] ?? { pub_pages: 0, pub_programs: 0, pub_packages: 0 };

  return (
    <>
      <PageHeader
        title="Website & CMS"
        subtitle="Beheer wat er op je publieke site verschijnt"
        icon="globe"
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/" variant="secondary" icon="eye">Bekijk site</LinkButton>
            {canWrite && <NewPageModal />}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Gepubliceerde pagina's" value={k.pub_pages} icon="file" tone="brand" sub={`${pages.length} totaal`} />
        <StatCard label="Publieke programma's" value={k.pub_programs} icon="dumbbell" tone="indigo" />
        <StatCard label="Publieke packages" value={k.pub_packages} icon="tag" tone="green" />
        <StatCard label="Publieke coaches" value={coaches.length} icon="users" tone="purple" />
      </div>

      <Section title="Pagina's">
        {pages.length === 0 ? (
          <EmptyState icon="file" title="Nog geen pagina's" subtitle="Maak pagina's aan om je publieke site te vullen." />
        ) : (
          <DataTable head={<><th>Titel</th><th>Slug</th><th>Status</th><th className="text-right">Bijgewerkt</th>{canWrite && <th className="text-right">Actie</th>}</>}>
            {pages.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.title}</td>
                <td className="faint">/{p.slug}</td>
                <td>{p.published ? <Badge tone="green">Gepubliceerd</Badge> : <Badge tone="slate">Concept</Badge>}</td>
                <td className="text-right faint text-sm">{dateNL(p.updated_at)}</td>
                {canWrite && <td className="text-right"><PagePublishToggle pageId={p.id} published={p.published} /></td>}
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Publieke programma's">
          {programs.length === 0 ? (
            <Card><p className="text-sm muted">Geen programma's.</p></Card>
          ) : (
            <Card>
              <div className="flex flex-wrap gap-2">
                {programs.map((p) => (
                  <div key={p.id} className="rounded-lg px-3 py-2" style={{ background: "var(--bg-subtle)" }}>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs faint capitalize">
                      {[p.discipline?.replace(/_/g, " "), p.level].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>

        <Section title="Publieke packages">
          {packages.length === 0 ? (
            <Card><p className="text-sm muted">Geen publieke packages.</p></Card>
          ) : (
            <DataTable head={<><th>Package</th><th>Discipline</th><th className="text-right">Prijs</th></>}>
              {packages.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td className="capitalize faint">{p.discipline?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="text-right tabular-nums font-semibold">
                    {money(p.price ?? 0, cur)}
                    {p.billing_period && <span className="text-xs faint font-normal">/{titleCase(p.billing_period)}</span>}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Publieke coaches">
          {coaches.length === 0 ? (
            <Card><p className="text-sm muted">Geen publieke coaches.</p></Card>
          ) : (
            <Card padding={false}>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {coaches.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs faint truncate">
                        {[c.role ? titleCase(c.role) : null, c.specialties].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>

        <Section title="Publieke events">
          {events.length === 0 ? (
            <Card><p className="text-sm muted">Geen gepubliceerde events.</p></Card>
          ) : (
            <DataTable head={<><th>Event</th><th>Type</th><th className="text-right">Datum</th></>}>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium">{e.name}</td>
                  <td><Badge tone="indigo">{titleCase(e.type)}</Badge></td>
                  <td className="text-right faint text-sm">{dateNL(e.start_date)}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </Section>
      </div>

      <Section title="Preview">
        <Card>
          <p className="text-sm muted">
            De publieke site toont bovenstaande programma's, packages, coaches en events.
            Bekijk het eindresultaat op <Link href="/" className="link">de publieke homepage →</Link>.
          </p>
        </Card>
      </Section>
    </>
  );
}
