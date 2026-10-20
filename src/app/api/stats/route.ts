import { NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/stats
 * Live platform counters for the landing page. Every value is counted from
 * the database.
 */
export async function GET() {
  const stats = await getPlatformStats();

  return NextResponse.json({ stats });
}
