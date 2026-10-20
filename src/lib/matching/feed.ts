import {
  buildMatchFeed,
  relationName,
  relationRecord,
  selectEligibleCandidates,
  toMatchCandidate,
  type ProfileRow,
  type ViewerContext,
} from "@/lib/matching/candidateGenerator";
import { parseLocation, type RawLocation } from "@/lib/matching/location";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_CONFIG } from "@/config/site";
import { MatchingService } from "@/lib/services/matching";
import type { MatchCandidate } from "@/types/models";

export type MatchFeedSource = "database" | "seed";

export interface MatchFeed {
  matches: MatchCandidate[];
  source: MatchFeedSource;
  /** Set when the database path failed, so the UI can label the fallback. */
  notice?: string;
  /** The viewer the feed was generated for (absent on the seed fallback). */
  viewer?: {
    id: string;
    name: string;
    completeness: number;
    isOnboarded: boolean;
    cityName?: string;
  };
}

interface ProfileQueryRow {
  id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  college?: string | null;
  year?: number | null;
  branch?: string | null;
  city_id?: string | null;
  area?: string | null;
  location?: RawLocation;
  bio?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  goals: ProfileRow["goals"];
  intensity: ProfileRow["intensity"];
  availability: ProfileRow["availability"];
  travel_cities?: string[] | null;
  reliability_score?: number | null;
  completeness_score?: number | null;
  is_onboarded?: boolean | null;
  is_banned?: boolean | null;
  matching_enabled?: boolean | null;
  open_to_remote?: boolean | null;
  preferred_team_size?: number | null;
  looking_for_skills?: string[] | null;
  github_stats?: ProfileRow["github_stats"];
  city?: unknown;
  skills?: Array<{
    proficiency: number;
    is_primary: boolean;
    skill?: unknown;
  }> | null;
  past_hackathons?: Array<{ id: string }> | null;
}

const PROFILE_SELECT = `
  id, name, email, avatar_url, college, year, branch, city_id, area, location, bio,
  linkedin_url, github_url, portfolio_url, goals, intensity, availability,
  travel_cities, reliability_score, completeness_score, is_onboarded, is_banned,
  matching_enabled, open_to_remote, preferred_team_size, looking_for_skills,
  github_stats,
  city:cities(name),
  skills:profile_skills(proficiency, is_primary, skill:skills(name, category)),
  past_hackathons(id)
`;

function rowFromQuery(row: ProfileQueryRow): ProfileRow {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    avatar_url: row.avatar_url ?? undefined,
    college: row.college ?? undefined,
    year: row.year ?? undefined,
    branch: row.branch ?? undefined,
    city_id: row.city_id ?? undefined,
    city_name: relationName(row.city),
    area: row.area ?? undefined,
    location: parseLocation(row.location) ?? null,
    bio: row.bio ?? undefined,
    linkedin_url: row.linkedin_url ?? undefined,
    github_url: row.github_url ?? undefined,
    portfolio_url: row.portfolio_url ?? undefined,
    goals: row.goals,
    intensity: row.intensity,
    availability: row.availability,
    travel_cities: row.travel_cities ?? undefined,
    reliability_score: row.reliability_score ?? undefined,
    completeness_score: row.completeness_score ?? undefined,
    is_onboarded: row.is_onboarded ?? undefined,
    is_banned: row.is_banned ?? undefined,
    matching_enabled: row.matching_enabled ?? undefined,
    open_to_remote: row.open_to_remote ?? undefined,
    preferred_team_size: row.preferred_team_size ?? undefined,
    looking_for_skills: row.looking_for_skills ?? undefined,
    github_stats: row.github_stats ?? undefined,
    skills: (row.skills ?? []).map((entry) => ({
      proficiency: entry.proficiency,
      is_primary: entry.is_primary,
      skill: relationRecord<{ name: string; category: string }>(entry.skill),
    })),
    past_hackathons_count: row.past_hackathons?.length ?? 0,
  };
}

/**
 * Database-backed match feed for an authenticated viewer.
 *
 * Applies the eligibility gates (completeness floor, opt-out, blocks,
 * existing connections), scores every survivor and returns them ranked.
 * Falls back to the seeded pool when Supabase is unreachable so the demo
 * never renders an empty surface.
 */
export async function getMatchFeed(
  viewerId: string,
  context: ViewerContext & { minCompleteness?: number }
): Promise<MatchFeed> {
  const minCompleteness =
    context.minCompleteness ?? APP_CONFIG.minProfileCompleteness;

  try {
    const supabase = createAdminClient();

    const [viewerResult, candidatesResult, blocksResult, requestsResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(PROFILE_SELECT)
          .eq("id", viewerId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select(PROFILE_SELECT)
          .neq("id", viewerId)
          .eq("is_banned", false)
          .limit(300),
        supabase
          .from("blocks")
          .select("blocked_id, blocker_id")
          .or(`blocker_id.eq.${viewerId},blocked_id.eq.${viewerId}`),
        supabase
          .from("match_requests")
          .select("sender_id, receiver_id")
          .or(`sender_id.eq.${viewerId},receiver_id.eq.${viewerId}`),
      ]);

    const viewerRow = viewerResult.data
      ? rowFromQuery(viewerResult.data as ProfileQueryRow)
      : null;

    if (!viewerRow || !candidatesResult.data) {
      throw new Error("viewer or candidate pool unavailable");
    }

    const blockedIds = (blocksResult.data ?? []).flatMap((row) => [
      row.blocker_id,
      row.blocked_id,
    ]);

    const connectedIds = (requestsResult.data ?? []).flatMap((row) => [
      row.sender_id,
      row.receiver_id,
    ]);

    const candidateRows = (candidatesResult.data as ProfileQueryRow[]).map(
      rowFromQuery
    );

    const eligible = selectEligibleCandidates(candidateRows, viewerId, {
      minCompleteness,
      blockedIds,
      connectedIds,
    });

    const matches = buildMatchFeed(viewerRow, eligible, context);

    return {
      matches,
      source: "database",
      viewer: {
        id: viewerRow.id,
        name: viewerRow.name,
        completeness: viewerRow.completeness_score ?? 0,
        isOnboarded: Boolean(viewerRow.is_onboarded),
        cityName: viewerRow.city_name ?? undefined,
      },
    };
  } catch (error) {
    console.error("[matching] database feed unavailable:", error);

    const viewer = toMatchCandidate({
      id: viewerId,
      name: "You",
      goals: "balanced",
      intensity: "serious",
      availability: "offline_city",
    });

    const matches = await MatchingService.getMatches(viewer, {
      hackathonId: context.hackathonId,
      hackathonMode: context.hackathonMode,
      hackathonCity: context.hackathonCity,
      targetSkillsNeeded: context.targetSkillsNeeded ?? [],
      preferredIntensity: context.preferredIntensity,
    });

    return {
      matches,
      source: "seed",
      notice:
        "Live matching pool unavailable — showing the Hyderabad sample chapter.",
    };
  }
}
