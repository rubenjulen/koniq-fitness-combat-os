"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

const ALLOWED_TYPES = ["membership", "class_pack", "drop_in", "family", "youth", "private", "competition"];
const ALLOWED_PERIODS = ["month", "quarter", "year", "one_off"];

/** Create a new package / membership plan. */
export async function createPackage(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "package.write")) throw new Error("Geen rechten om pakketten aan te maken.");
  const t = user.tenantId;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Naam is verplicht.");

  const typeRaw = String(formData.get("type") ?? "membership");
  const type = ALLOWED_TYPES.includes(typeRaw) ? typeRaw : "membership";

  const periodRaw = String(formData.get("billing_period") ?? "month");
  const billingPeriod = ALLOWED_PERIODS.includes(periodRaw) ? periodRaw : "month";

  const priceParsed = parseFloat(String(formData.get("price") ?? ""));
  const price = isNaN(priceParsed) ? 0 : priceParsed;

  const cpwParsed = parseInt(String(formData.get("classes_per_week") ?? ""), 10);
  const classesPerWeek = isNaN(cpwParsed) ? null : cpwParsed;

  const creditsParsed = parseInt(String(formData.get("credits") ?? ""), 10);
  const credits = isNaN(creditsParsed) ? null : creditsParsed;

  const isPublic = String(formData.get("is_public") ?? "true") === "true";
  const description = String(formData.get("description") ?? "").trim() || null;

  const id = randomUUID();
  await query(
    `INSERT INTO packages
       (id, tenant_id, name, type, billing_period, price, currency, classes_per_week, credits, is_public, active, sort, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,0,$11)`,
    [id, t, name, type, billingPeriod, price, user.tenant.currency, classesPerWeek, credits, isPublic, description]
  );

  revalidatePath("/app/packages");
}
