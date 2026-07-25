"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

const TYPES = ["injury", "accident", "near_miss", "medical", "emergency"];
const SEVERITIES = ["low", "medium", "high"];

/** Log a health & safety incident. */
export async function logIncident(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "health.write")) throw new Error("Geen rechten om incidenten te registreren.");
  const t = user.tenantId;

  const type = String(formData.get("type") ?? "injury");
  if (!TYPES.includes(type)) throw new Error("Ongeldig type.");
  const severity = String(formData.get("severity") ?? "low");
  if (!SEVERITIES.includes(severity)) throw new Error("Ongeldige ernst.");
  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("Omschrijving is verplicht.");
  const actionTaken = String(formData.get("action_taken") ?? "") || null;
  const locationId = String(formData.get("location_id") ?? "") || null;
  const memberId = String(formData.get("member_id") ?? "") || null;

  await query(
    `INSERT INTO incidents (id, tenant_id, location_id, member_id, type, severity, description, action_taken, reported_by, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open')`,
    [randomUUID(), t, locationId, memberId, type, severity, description, actionTaken, user.id]
  );
  revalidatePath("/app/health");
}
