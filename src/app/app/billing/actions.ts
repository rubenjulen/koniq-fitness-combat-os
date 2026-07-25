"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query, queryOne } from "@/db/client";

/** Record a payment against an invoice; mark the invoice paid/partial accordingly. */
export async function recordPayment(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "billing.write")) throw new Error("Geen rechten om betalingen te registreren.");
  const t = user.tenantId;

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const method = String(formData.get("method") ?? "cash");
  const reference = String(formData.get("reference") ?? "") || null;
  const amountRaw = parseFloat(String(formData.get("amount") ?? "0"));
  if (!invoiceId) return;

  const inv = await queryOne<{ amount: number; member_id: string | null; currency: string }>(
    `SELECT amount::float AS amount, member_id, currency FROM invoices WHERE id=$1 AND tenant_id=$2`,
    [invoiceId, t]
  );
  if (!inv) return;
  const amount = amountRaw > 0 ? amountRaw : inv.amount;

  await query(
    `INSERT INTO payments (id, tenant_id, member_id, invoice_id, amount, currency, method, status, reference, recorded_by, received_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed',$8,$9, now())`,
    [randomUUID(), t, inv.member_id, invoiceId, amount, inv.currency, method, reference, user.id]
  );

  const newStatus = amount >= inv.amount ? "paid" : "partial";
  await query(`UPDATE invoices SET status=$1 WHERE id=$2 AND tenant_id=$3`, [newStatus, invoiceId, t]);

  await query(
    `INSERT INTO audit_log (id, tenant_id, user_id, actor_name, action, entity, entity_id, meta)
     VALUES ($1,$2,$3,$4,'update','invoice',$5,$6)`,
    [randomUUID(), t, user.id, user.name, invoiceId, JSON.stringify({ paid: amount, method })]
  );
  revalidatePath("/app/billing");
  if (inv.member_id) revalidatePath(`/app/members/${inv.member_id}`);
}
