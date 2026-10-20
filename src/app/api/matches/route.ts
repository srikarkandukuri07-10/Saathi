import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";
import { getMatchFeed } from "@/lib/matching/feed";
import { relationName } from "@/lib/matching/candidateGenerator";
import { APP_CONFIG } from "@/config/site";

export const dynamic = "force-dynamic";

/**
 * GET /api/matches
 *
 * Returns the ranked "Why you match" feed for the authenticated viewer.
 * Matching stays gated behind the profile completeness floor; the response
 * explains the gate instead of returning an unexplained empty list.
 */
export async function GET(request: NextRequest) {
  const supabase = await createRouteClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hackathonId = request.nextUrl.searchParams.get("hackathonId") ?? "";
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100)
    : 50;

  // Resolve the event context: mode and city drive the proximity weighting.
  let hackathonMode: "online" | "offline" | "hybrid" = "hybrid";
  let hackathonCity: string | undefined;
  let resolvedHackathonId = hackathonId;

  if (hackathonId) {
    const { data: hackathon } = await supabase
      .from("hackathons")
      .select("id, name, mode, city:cities(name)")
      .eq("id", hackathonId)
      .maybeSingle();

    if (hackathon) {
      hackathonMode = hackathon.mode as "online" | "offline" | "hybrid";
      hackathonCity = relationName(hackathon.city);
      resolvedHackathonId = hackathon.id;
    }
  }

  const feed = await getMatchFeed(user.id, {
    viewerId: user.id,
    hackathonId: resolvedHackathonId,
    hackathonMode,
    hackathonCity,
    limit,
    minCompleteness: APP_CONFIG.minProfileCompleteness,
  });

  // Completeness gate: the feed exists, but matching is locked until onboarding.
  if (feed.source === "database" && feed.viewer) {
    const { completeness, isOnboarded } = feed.viewer;
    if (!isOnboarded || completeness < APP_CONFIG.minProfileCompleteness) {
      return NextResponse.json(
        {
          error: "profile_incomplete",
          message: `Matching unlocks at ${APP_CONFIG.minProfileCompleteness}% profile completeness. Complete your profile to unlock teammate suggestions.`,
          completeness,
          required: APP_CONFIG.minProfileCompleteness,
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({
    matches: feed.matches,
    source: feed.source,
    notice: feed.notice ?? null,
    viewer: feed.viewer ?? null,
    meta: {
      total: feed.matches.length,
      limit,
      generatedAt: new Date().toISOString(),
    },
  });
}
