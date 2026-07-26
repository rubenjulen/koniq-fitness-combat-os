"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

/** Start a new marketing campaign. */
export async function createCampaign(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "marketing.write")) throw new Error("Geen rechten om campagnes aan te maken.");
  const t = user.tenantId;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Naam is verplicht.");

  const channel = String(formData.get("channel") ?? "meta");
  const objective = String(formData.get("objective") ?? "").trim() || null;
  const audience = String(formData.get("audience") ?? "").trim() || null;
  const startDate = String(formData.get("start_date") ?? "") || null;
  const endDate = String(formData.get("end_date") ?? "") || null;

  const budgetRaw = parseFloat(String(formData.get("budget") ?? ""));
  const budget = Number.isNaN(budgetRaw) || budgetRaw < 0 ? 0 : budgetRaw;

  await query(
    `INSERT INTO campaigns (id, tenant_id, name, channel, objective, budget, spend, audience, start_date, end_date, leads, conversions, status)
     VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,0,0,'active')`,
    [randomUUID(), t, name, channel, objective, budget, audience, startDate, endDate]
  );
  revalidatePath("/app/marketing");
}
