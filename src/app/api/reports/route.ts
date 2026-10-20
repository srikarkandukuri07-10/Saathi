import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/data/common";
import { reportUser } from "@/lib/data/chat";

export const dynamic = "force-dynamic";

const reportSchema = z.object({
  reportedUserId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  reason: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
});

/**
 * POST /api/reports
 * Files a safety report against another builder. The report lands in the
 * admin queue (`reports` table) for review.
 */
export async function POST(request: NextRequest) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await reportUser({
    reporterId: viewerId,
    reportedUserId: parsed.data.reportedUserId,
    conversationId: parsed.data.conversationId,
    reason: parsed.data.reason,
    description: parsed.data.description,
  });

  return NextResponse.json(result);
}
