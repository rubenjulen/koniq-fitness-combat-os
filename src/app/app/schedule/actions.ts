"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

/** Add a recurring class to the weekly schedule. */
export async function createClass(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "schedule.write")) throw new Error("Geen rechten om lessen aan te maken.");
  const t = user.tenantId;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Titel is verplicht.");

  const weekday = parseInt(String(formData.get("weekday") ?? ""), 10);
  const wd = Number.isNaN(weekday) || weekday < 1 || weekday > 7 ? 1 : weekday;

  const startTime = String(formData.get("start_time") ?? "").trim() || null;
  const endTime = String(formData.get("end_time") ?? "").trim() || null;

  const capRaw = parseInt(String(formData.get("capacity") ?? ""), 10);
  const capacity = Number.isNaN(capRaw) || capRaw < 0 ? 0 : capRaw;

  const classTypeId = String(formData.get("class_type_id") ?? "") || null;
  const coachId = String(formData.get("coach_id") ?? "") || null;
  const locationId = String(formData.get("location_id") ?? "") || null;
  const resource = String(formData.get("resource") ?? "").trim() || null;
  const isSparring = String(formData.get("is_sparring") ?? "") === "true";

  await query(
    `INSERT INTO classes (id, tenant_id, location_id, class_type_id, coach_id, title, weekday, start_time, end_time, capacity, resource, is_sparring, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)`,
    [randomUUID(), t, locationId, classTypeId, coachId, title, wd, startTime, endTime, capacity, resource, isSparring]
  );
  revalidatePath("/app/schedule");
}

/** Define a new class type (lesvorm). */
export async function createClassType(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "schedule.write")) throw new Error("Geen rechten om lesvormen aan te maken.");
  const t = user.tenantId;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Naam is verplicht.");

  const discipline = String(formData.get("discipline") ?? "") || null;
  const ageGroup = String(formData.get("age_group") ?? "") || null;
  const level = String(formData.get("level") ?? "").trim() || null;
  const intensity = String(formData.get("intensity") ?? "") || null;
  const color = String(formData.get("color") ?? "").trim() || null;

  await query(
    `INSERT INTO class_types (id, tenant_id, name, discipline, age_group, level, intensity, color)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [randomUUID(), t, name, discipline, ageGroup, level, intensity, color]
  );
  revalidatePath("/app/schedule");
}
