"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

const CHANNELS = ["whatsapp", "email", "in_app"];
const SEGMENTS = ["all", "youth_parents", "competition_team", "beginners"];

/** Send an outbound message to a member (WhatsApp / e-mail / in-app). */
export async function sendMessage(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "communication.write")) throw new Error("Geen rechten om berichten te versturen.");
  const t = user.tenantId;

  const memberId = String(formData.get("member_id") ?? "").trim();
  if (!memberId) throw new Error("Kies een lid.");
  const channelRaw = String(formData.get("channel") ?? "whatsapp");
  const channel = CHANNELS.includes(channelRaw) ? channelRaw : "whatsapp";
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Bericht mag niet leeg zijn.");
  const templateKey = String(formData.get("template_key") ?? "").trim() || null;

  await query(
    `INSERT INTO messages (id, tenant_id, member_id, channel, direction, body, template_key, status)
     VALUES ($1,$2,$3,$4,'out',$5,$6,'sent')`,
    [randomUUID(), t, memberId, channel, body, templateKey]
  );
  revalidatePath("/app/inbox");
}

/** Publish a broadcast announcement to a member segment. */
export async function createAnnouncement(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "communication.write")) throw new Error("Geen rechten om aankondigingen te plaatsen.");
  const t = user.tenantId;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Titel is verplicht.");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Bericht is verplicht.");
  const segmentRaw = String(formData.get("segment") ?? "all");
  const segment = SEGMENTS.includes(segmentRaw) ? segmentRaw : "all";

  await query(
    `INSERT INTO announcements (id, tenant_id, title, body, segment, created_by)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [randomUUID(), t, title, body, segment, user.id]
  );
  revalidatePath("/app/inbox");
}
