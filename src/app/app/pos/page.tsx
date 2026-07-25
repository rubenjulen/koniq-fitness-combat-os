import { guard } from "@/lib/guard";
import { query } from "@/db/client";
import { can } from "@/lib/rbac";
import { PageHeader, Card, StatCard, Section, DataTable, Badge, Avatar, EmptyState, FeatureLocked } from "@/components/ui";
import { money, timeAgo, fullName, titleCase } from "@/lib/format";
import Link from "next/link";
import { QuickSaleModal } from "./QuickSaleModal";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number | null;
  tax_pct: number | null;
  stock: number | null;
  reorder_level: number | null;
};

type SaleRow = {
  id: string;
  total: number | null;
  method: string | null;
  created_at: string;
  sold_by_name: string | null;
  member_id: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
};

type TopRow = { id: string | null; name: string; category: string | null; qty: number; revenue: number };

const CAT_TONE: Record<string, Parameters<typeof Badge>[0]["tone"]> = {
  gloves: "red",
  shin_guards: "amber",
  wraps: "indigo",
  apparel: "purple",
  drinks: "blue",
  supplements: "green",
};

export default async function PosPage() {
  const user = await guard({ feature: "pos", cap: "pos.read" });
  if (!user.ok) return <FeatureLocked feature="Kassa & retail" pack="pro" />;
  const t = user.tenantId;
  const cur = user.tenant.currency;
  const canWrite = can(user, "pos.write");

  const [products, sales, top, kpiRows, memberOpts] = await Promise.all([
    query<ProductRow>(
      `SELECT id, name, category, price::float AS price, tax_pct::float AS tax_pct, stock, reorder_level
         FROM products WHERE tenant_id = $1 AND active
        ORDER BY category, name`,
      [t]
    ),
    query<SaleRow>(
      `SELECT s.id, s.total::float AS total, s.method, s.created_at,
              u.name AS sold_by_name,
              m.id AS member_id, m.first_name, m.last_name, m.photo_url
         FROM sales s
         LEFT JOIN users u ON u.id = s.sold_by AND u.tenant_id = $1
         LEFT JOIN members m ON m.id = s.member_id AND m.tenant_id = $1
        WHERE s.tenant_id = $1
        ORDER BY s.created_at DESC LIMIT 20`,
      [t]
    ),
    query<TopRow>(
      `SELECT p.id, COALESCE(p.name, si.name) AS name, p.category,
              SUM(si.qty)::int AS qty, SUM(si.qty * si.price)::float AS revenue
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id AND s.tenant_id = $1
         LEFT JOIN products p ON p.id = si.product_id AND p.tenant_id = $1
        WHERE si.tenant_id = $1
        GROUP BY p.id, COALESCE(p.name, si.name), p.category
        ORDER BY qty DESC LIMIT 10`,
      [t]
    ),
    query<{ revenue: number; txns: number; avg_ticket: number; low_stock: number }>(
      `SELECT
         (SELECT COALESCE(SUM(total),0)::float FROM sales
            WHERE tenant_id = $1 AND created_at >= date_trunc('month', now())) AS revenue,
         (SELECT count(*)::int FROM sales
            WHERE tenant_id = $1 AND created_at >= date_trunc('month', now())) AS txns,
         (SELECT COALESCE(AVG(total),0)::float FROM sales
            WHERE tenant_id = $1 AND created_at >= date_trunc('month', now())) AS avg_ticket,
         (SELECT count(*)::int FROM products
            WHERE tenant_id = $1 AND active AND stock <= reorder_level) AS low_stock`,
      [t]
    ),
    query<{ id: string; first_name: string; last_name: string }>(
      `SELECT id, first_name, last_name FROM members
        WHERE tenant_id = $1 AND status <> 'cancelled'
        ORDER BY first_name, last_name`,
      [t]
    ),
  ]);

  const k = kpiRows[0] ?? { revenue: 0, txns: 0, avg_ticket: 0, low_stock: 0 };
  const productOpts = products.map((p) => ({ id: p.id, name: p.name, price: p.price ?? 0, stock: p.stock ?? 0 }));

  return (
    <>
      <PageHeader
        title="Kassa & retail"
        subtitle="Verkoop, voorraad en producten"
        icon="cart"
        actions={canWrite ? <QuickSaleModal products={productOpts} members={memberOpts} /> : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Omzet deze maand" value={money(k.revenue, cur)} icon="coins" tone="green" />
        <StatCard label="Transacties" value={k.txns} icon="cart" tone="brand" sub="deze maand" />
        <StatCard label="Gem. bon" value={money(k.avg_ticket, cur)} icon="chart" tone="indigo" />
        <StatCard label="Lage voorraad" value={k.low_stock} icon="alert" tone={k.low_stock > 0 ? "red" : "slate"} sub="onder bestelniveau" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Section title="Productcatalogus">
            {products.length === 0 ? (
              <EmptyState icon="tag" title="Geen producten" subtitle="Voeg retailproducten toe om ze via de kassa te verkopen." />
            ) : (
              <DataTable head={<><th>Product</th><th>Categorie</th><th className="text-right">Prijs</th><th className="text-right">Voorraad</th><th className="text-right">BTW</th></>}>
                {products.map((p) => {
                  const low = (p.stock ?? 0) <= (p.reorder_level ?? 0);
                  return (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name}</td>
                      <td><Badge tone={CAT_TONE[p.category] ?? "slate"}>{titleCase(p.category)}</Badge></td>
                      <td className="text-right tabular-nums">{money(p.price, cur)}</td>
                      <td className="text-right tabular-nums font-semibold" style={{ color: low ? "#dc2626" : "var(--text)" }}>
                        {p.stock ?? 0}{low && <span className="text-xs"> ↓</span>}
                      </td>
                      <td className="text-right tabular-nums faint">{p.tax_pct != null ? `${p.tax_pct}%` : "—"}</td>
                    </tr>
                  );
                })}
              </DataTable>
            )}
          </Section>
        </div>

        <div>
          <Section title="Topproducten">
            {top.length === 0 ? (
              <Card><p className="text-sm muted">Nog geen verkopen.</p></Card>
            ) : (
              <Card padding={false}>
                <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {top.map((p, i) => (
                    <li key={p.id ?? i} className="flex items-center gap-3 p-3">
                      <span className="text-xs font-bold faint tabular-nums w-5">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs faint">{money(p.revenue, cur)}</p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums shrink-0">{p.qty}×</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Section>
        </div>
      </div>

      <Section title="Recente verkopen">
        {sales.length === 0 ? (
          <Card><p className="text-sm muted">Nog geen verkopen geregistreerd.</p></Card>
        ) : (
          <DataTable head={<><th>Klant</th><th>Betaalwijze</th><th>Verkocht door</th><th className="text-right">Bedrag</th><th className="text-right">Wanneer</th></>}>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.member_id ? (
                    <Link href={`/app/members/${s.member_id}`} className="flex items-center gap-2.5 group">
                      <Avatar name={fullName(s)} url={s.photo_url} size={30} />
                      <span className="font-medium group-hover:underline">{fullName(s)}</span>
                    </Link>
                  ) : (
                    <span className="faint">Losse verkoop</span>
                  )}
                </td>
                <td>{s.method ? <Badge tone="slate">{titleCase(s.method)}</Badge> : <span className="faint">—</span>}</td>
                <td className="muted text-sm">{s.sold_by_name ?? <span className="faint">—</span>}</td>
                <td className="text-right tabular-nums font-semibold">{money(s.total, cur)}</td>
                <td className="text-right faint text-sm">{timeAgo(s.created_at)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
