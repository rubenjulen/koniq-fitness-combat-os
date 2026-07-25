"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

const EQUIP_CATEGORIES = ["bag", "ring", "mat", "gloves", "weights", "cardio"];

/** Close (resolve) a maintenance ticket. */
export async function resolveTicket(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "facility.write")) throw new Error("Geen rechten om onderhoudsmeldingen te sluiten.");
  const t = user.tenantId;
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) return;
  await query(
    `UPDATE maintenance_tickets SET status='resolved', resolved_at=now() WHERE id=$1 AND tenant_id=$2`,
    [ticketId, t]
  );
  revalidatePath("/app/facility");
}

/** Register a new piece of equipment. */
export async function createEquipment(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "facility.write")) throw new Error("Geen rechten om materiaal toe te voegen.");
  const t = user.tenantId;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Naam is verplicht.");
  const category = String(formData.get("category") ?? "bag");
  if (!EQUIP_CATEGORIES.includes(category)) throw new Error("Ongeldige categorie.");
  const locationId = String(formData.get("location_id") ?? "") || null;
  const purchaseDate = String(formData.get("purchase_date") ?? "") || null;

  await query(
    `INSERT INTO equipment (id, tenant_id, location_id, name, category, purchase_date, status, last_inspection)
     VALUES ($1,$2,$3,$4,$5,$6,'ok',current_date)`,
    [randomUUID(), t, locationId, name, category, purchaseDate]
  );
  revalidatePath("/app/facility");
}
