"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

const ALLOWED_ROLES = ["head_coach", "coach", "assistant", "pt", "frontdesk"];
const ALLOWED_EMPLOYMENT = ["employee", "contractor", "volunteer"];
const ALLOWED_COMP = ["fixed", "per_class", "pt_split"];

/** Create a new coach / staff member. */
export async function createCoach(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "coach.write")) throw new Error("Geen rechten om coaches aan te maken.");
  const t = user.tenantId;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Naam is verplicht.");

  const roleRaw = String(formData.get("role") ?? "coach");
  const role = ALLOWED_ROLES.includes(roleRaw) ? roleRaw : "coach";

  const employmentRaw = String(formData.get("employment") ?? "employee");
  const employment = ALLOWED_EMPLOYMENT.includes(employmentRaw) ? employmentRaw : "employee";

  const compTypeRaw = String(formData.get("comp_type") ?? "fixed");
  const compType = ALLOWED_COMP.includes(compTypeRaw) ? compTypeRaw : "fixed";

  const specialties = String(formData.get("specialties") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  const rateParsed = parseFloat(String(formData.get("comp_rate") ?? ""));
  const compRate = isNaN(rateParsed) ? null : rateParsed;

  const id = randomUUID();
  await query(
    `INSERT INTO coaches
       (id, tenant_id, name, role, specialties, email, phone, employment, comp_type, comp_rate, is_public, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,true)`,
    [id, t, name, role, specialties, email, phone, employment, compType, compRate]
  );

  revalidatePath("/app/coaches");
}
