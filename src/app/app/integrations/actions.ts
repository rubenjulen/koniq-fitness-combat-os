"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/db/client";

/** Toggle an integration between connected and disconnected; stamp last_sync_at on connect. */
export async function toggleIntegration(formData: FormData) {
  const user = await requireSession();
  if (!can(user, "settings.write")) throw new Error("Geen rechten om integraties te wijzigen.");
  const integrationId = String(formData.get("integrationId") ?? "");
  if (!integrationId) return;
  await query(
    `UPDATE integrations
        SET status = CASE WHEN status='connected' THEN 'disconnected' ELSE 'connected' END,
            last_sync_at = CASE WHEN status='connected' THEN last_sync_at ELSE now() END
      WHERE id=$1 AND tenant_id=$2`,
    [integrationId, user.tenantId]
  );
  revalidatePath("/app/integrations");
}
