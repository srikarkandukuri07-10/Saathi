import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/data/common";
import { getHackathonBySlug, setParticipation } from "@/lib/data/hackathons";

export const dynamic = "force-dynamic";

/**
 * GET /api/hackathons/[slug]
 * A single published event.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const viewerId = await getSessionUserId();
  const hackathon = await getHackathonBySlug(params.slug, viewerId);

  if (!hackathon) {
    return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
  }

  return NextResponse.json({ hackathon });
}

/**
 * POST /api/hackathons/[slug]
 * Toggles the signed-in user's "I'm going" state for the event.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hackathon = await getHackathonBySlug(params.slug, viewerId);
  if (!hackathon) {
    return NextResponse.json({ error: "Hackathon not found" }, { status: 404 });
  }

  const result = await setParticipation(hackathon.id, viewerId, !hackathon.is_user_going);

  return NextResponse.json(result);
}
