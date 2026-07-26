"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

const CATEGORIES = ["waiver", "contract", "medical", "certificate", "id", "consent"];

/** Register a new document (optionally linked to a member). */
export async function addDocument(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "document.write")) throw new Error("Geen rechten om documenten toe te voegen.");
  const t = user.tenantId;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Naam is verplicht.");
  const categoryRaw = String(formData.get("category") ?? "");
  const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : "waiver";
  const memberId = String(formData.get("member_id") ?? "") || null;
  const expiresAt = String(formData.get("expires_at") ?? "") || null;

  await query(
    `INSERT INTO documents (id, tenant_id, member_id, category, name, version, expires_at, uploaded_by)
     VALUES ($1,$2,$3,$4,$5,1,$6,$7)`,
    [randomUUID(), t, memberId, category, name, expiresAt, user.id]
  );
  revalidatePath("/app/documents");
}
