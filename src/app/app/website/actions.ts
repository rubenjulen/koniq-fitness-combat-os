"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

/** Create a new CMS page. */
export async function createPage(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "website.write")) throw new Error("Geen rechten om pagina's aan te maken.");
  const t = user.tenantId;

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!title) throw new Error("Titel is verplicht.");
  if (!slug) throw new Error("Slug is verplicht.");

  const body = String(formData.get("body") ?? "").trim() || null;
  const published = String(formData.get("published") ?? "") === "true";

  await query(
    `INSERT INTO pages (id, tenant_id, slug, title, body, published, sort)
     VALUES ($1,$2,$3,$4,$5,$6,0)`,
    [randomUUID(), t, slug, title, body, published]
  );
  revalidatePath("/app/website");
}

/** Toggle a page between published and concept. */
export async function togglePagePublished(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "website.write")) throw new Error("Geen rechten.");
  const t = user.tenantId;
  const pageId = String(formData.get("pageId") ?? "");
  if (!pageId) return;
  await query(
    `UPDATE pages SET published = NOT published WHERE id = $1 AND tenant_id = $2`,
    [pageId, t]
  );
  revalidatePath("/app/website");
}
