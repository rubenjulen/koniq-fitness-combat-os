"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

/** Log a fight result and update the fighter's win/loss/draw record. */
export async function addFight(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "fighter.write")) throw new Error("Geen rechten om partijen vast te leggen.");
  const t = user.tenantId;

  const fighterId = String(formData.get("fighter_id") ?? "").trim();
  if (!fighterId) throw new Error("Fighter is verplicht.");
  const eventName = String(formData.get("event_name") ?? "").trim() || null;
  const fightDate = String(formData.get("fight_date") ?? "").trim() || null;
  const discipline = String(formData.get("discipline") ?? "").trim() || null;
  const opponent = String(formData.get("opponent") ?? "").trim() || null;
  const result = String(formData.get("result") ?? "").trim() || null;
  const method = String(formData.get("method") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  await query(
    `INSERT INTO fights (id, tenant_id, fighter_id, event_name, fight_date, discipline, opponent, result, method, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [randomUUID(), t, fighterId, eventName, fightDate, discipline, opponent, result, method, note],
  );

  // Update the fighter's record for a decided result (nc does not count).
  const column = result === "win" ? "wins" : result === "loss" ? "losses" : result === "draw" ? "draws" : null;
  if (column) {
    await query(
      `UPDATE fighters SET ${column} = ${column} + 1 WHERE id=$1 AND tenant_id=$2`,
      [fighterId, t],
    );
  }

  revalidatePath("/app/fighters");
}
