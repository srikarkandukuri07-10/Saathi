import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPublicProfile } from "@/lib/data/profiles";

export const dynamic = "force-dynamic";

/**
 * GET /api/profiles/[id]
 * Public profile of another builder. Exact coordinates are never included.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const profile = await getPublicProfile(params.id);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
