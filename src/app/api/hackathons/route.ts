import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/data/common";
import { listHackathons } from "@/lib/data/hackathons";

export const dynamic = "force-dynamic";

/**
 * GET /api/hackathons
 * The published external hackathon directory. Public read.
 */
export async function GET(request: NextRequest) {
  const viewerId = await getSessionUserId();

  const hackathons = await listHackathons(viewerId, {
    mode: request.nextUrl.searchParams.get("mode") ?? undefined,
    cityId: request.nextUrl.searchParams.get("cityId") ?? undefined,
    search: request.nextUrl.searchParams.get("search") ?? undefined,
  });

  return NextResponse.json({ hackathons });
}
