import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/data/common";
import { listMessages, markConversationRead, sendMessage } from "@/lib/data/chat";

export const dynamic = "force-dynamic";

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

/**
 * GET /api/conversations/[id]/messages
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await listMessages(params.id);
  await markConversationRead(params.id, viewerId);

  return NextResponse.json({ messages });
}

/**
 * POST /api/conversations/[id]/messages
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const message = await sendMessage(params.id, viewerId, parsed.data.content);

  if (!message) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ message }, { status: 201 });
}
