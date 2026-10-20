import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/data/common";
import { addPastHackathon, listPastHackathons } from "@/lib/data/profiles";

export const dynamic = "force-dynamic";

const historySchema = z.object({
  eventName: z.string().min(3).max(200),
  year: z.number().int().min(2015).max(2100),
  result: z.enum(["Winner", "Runner Up", "Finalist", "Participant"]),
  teamSize: z.number().int().min(1).max(20).optional(),
  proofUrl: z.string().url().optional().or(z.literal("")),
  certificateUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * GET /api/profile/past-hackathons
 */
export async function GET() {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pastHackathons = await listPastHackathons(viewerId);

  return NextResponse.json({ pastHackathons });
}

/**
 * POST /api/profile/past-hackathons
 * New entries start as "pending" and are reviewed by an admin.
 */
export async function POST(request: NextRequest) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = historySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid entry", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await addPastHackathon(viewerId, {
    eventName: parsed.data.eventName,
    year: parsed.data.year,
    result: parsed.data.result,
    teamSize: parsed.data.teamSize,
    proofUrl: parsed.data.proofUrl || undefined,
    certificateUrl: parsed.data.certificateUrl || undefined,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to add the entry", detail: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
