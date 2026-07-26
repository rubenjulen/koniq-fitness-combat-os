"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

const TYPES = ["bullying", "harassment", "misconduct", "welfare"];
const SEVERITIES = ["low", "medium", "high"];

/** Open a confidential safeguarding case. */
export async function createCase(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "safeguarding.write")) throw new Error("Geen rechten om dossiers aan te maken.");
  const t = user.tenantId;

  const typeRaw = String(formData.get("type") ?? "");
  const type = TYPES.includes(typeRaw) ? typeRaw : null;
  if (!type) throw new Error("Kies een type.");
  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("Omschrijving is verplicht.");
  const sevRaw = String(formData.get("severity") ?? "medium");
  const severity = SEVERITIES.includes(sevRaw) ? sevRaw : "medium";
  const memberId = String(formData.get("member_id") ?? "") || null;

  await query(
    `INSERT INTO safeguarding_cases
       (id, tenant_id, member_id, type, severity, description, status, reported_by, assigned_to, confidential)
     VALUES ($1,$2,$3,$4,$5,$6,'open',$7,$7,true)`,
    [randomUUID(), t, memberId, type, severity, description, user.id]
  );
  revalidatePath("/app/safeguarding");
}
