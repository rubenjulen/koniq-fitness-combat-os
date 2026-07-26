import { NextResponse } from "next/server";
import { queryOne } from "@/db/client";

export const dynamic = "force-dynamic";

/** Health check for Coolify/Hetzner load balancers. Verifies the DB is reachable. */
export async function GET() {
  try {
    await queryOne<{ ok: number }>("SELECT 1 AS ok");
    return NextResponse.json({ status: "ok", db: "up", ts: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ status: "error", db: "down", error: String(e) }, { status: 503 });
  }
}
