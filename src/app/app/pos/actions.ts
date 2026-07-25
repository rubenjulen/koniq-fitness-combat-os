"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query, queryOne } from "@/db/client";

/** Record a quick retail sale: creates a sale + sale_item and decrements stock. */
export async function recordSale(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "pos.write")) throw new Error("Geen rechten om verkopen te registreren.");
  const t = user.tenantId;

  const productId = String(formData.get("product_id") ?? "");
  const method = String(formData.get("method") ?? "cash");
  const memberId = String(formData.get("member_id") ?? "") || null;
  const qtyRaw = parseInt(String(formData.get("qty") ?? "1"), 10);
  const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
  if (!productId) return;

  const product = await queryOne<{ name: string; price: number }>(
    `SELECT name, price::float AS price FROM products WHERE id=$1 AND tenant_id=$2`,
    [productId, t]
  );
  if (!product) return;
  const price = product.price ?? 0;
  const total = price * qty;
  const cur = user.tenant.currency;

  const saleId = randomUUID();
  await query(
    `INSERT INTO sales (id, tenant_id, member_id, location_id, total, currency, method, sold_by)
     VALUES ($1,$2,$3,NULL,$4,$5,$6,$7)`,
    [saleId, t, memberId, total, cur, method, user.id]
  );
  await query(
    `INSERT INTO sale_items (id, tenant_id, sale_id, product_id, name, qty, price)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [randomUUID(), t, saleId, productId, product.name, qty, price]
  );
  await query(`UPDATE products SET stock = stock - $1 WHERE id=$2 AND tenant_id=$3`, [qty, productId, t]);

  await query(
    `INSERT INTO audit_log (id, tenant_id, user_id, actor_name, action, entity, entity_id, meta)
     VALUES ($1,$2,$3,$4,'create','sale',$5,$6)`,
    [randomUUID(), t, user.id, user.name, saleId, JSON.stringify({ product: product.name, qty, total })]
  );
  revalidatePath("/app/pos");
}
