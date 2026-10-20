import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/data/common";
import { blockUser } from "@/lib/data/chat";

export const dynamic = "force-dynamic";

/**
 * POST /api/blocks
 * Blocks another builder. Blocked builders are removed from the match pool.
 */
export async function POST(request: NextRequest) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = z.object({ blockedId: z.string().uuid() }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid block request" }, { status: 400 });
  }

  const result = await blockUser(viewerId, parsed.data.blockedId);

  return NextResponse.json(result);
}
