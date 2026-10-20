import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/data/common";
import { confirmTeamLock } from "@/lib/data/teams";

export const dynamic = "force-dynamic";

/**
 * POST /api/teams/[id]/lock
 * Confirms the caller's commitment to the squad. When every member has
 * confirmed, the squad is locked and the reliability bonus is awarded.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await confirmTeamLock(params.id, viewerId);

  if (!result.team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
