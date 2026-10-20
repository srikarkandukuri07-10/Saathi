import { NextResponse } from "next/server";
import { listHallOfFame } from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/hall-of-fame
 * Verified wins recorded by the builders on the platform.
 */
export async function GET() {
  const entries = await listHallOfFame();

  return NextResponse.json({ entries });
}
