import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/data/common";
import { listConversations } from "@/lib/data/chat";

export const dynamic = "force-dynamic";

/**
 * GET /api/conversations
 * The signed-in user's mutual-accept conversations.
 */
export async function GET() {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await listConversations(viewerId);

  return NextResponse.json({ conversations });
}
