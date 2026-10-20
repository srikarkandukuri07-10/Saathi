import {
  scoreCandidate,
  type MatchCandidateProfile,
  type MatchContext,
  type MatchScoreResult,
} from "@/lib/matching/scorer";
import type {
  AvailabilityMode,
  GoalType,
  IntensityLevel,
  MatchCandidate,
  Profile,
  ProfileSkill,
  Skill,
} from "@/types/models";

/**
 * Shape of a `profiles` row as returned by the Phase 3 candidate query.
 * `location` is the server-only PostGIS point cast to lat/lng. It is never
 * exposed to another user: `toPublicProfile` strips it before it leaves the server.
 */
export interface ProfileRow {
  id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  college?: string | null;
  year?: number | null;
  branch?: string | null;
  city_id?: string | null;
  city_name?: string | null;
  area?: string | null;
  location?: { lat: number; lng: number } | null;
  bio?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  goals: GoalType;
  intensity: IntensityLevel;
  availability: AvailabilityMode;
  travel_cities?: string[] | null;
  reliability_score?: number | null;
  completeness_score?: number | null;
  is_onboarded?: boolean | null;
  is_banned?: boolean | null;
  matching_enabled?: boolean | null;
  open_to_remote?: boolean | null;
  preferred_team_size?: number | null;
  looking_for_skills?: string[] | null;
  github_stats?: {
    public_repos?: number;
    followers?: number;
    top_languages?: string[];
    recent_commits_count?: number;
  } | null;
  skills?: Array<{
    proficiency: number;
    is_primary: boolean;
    skill?: { name: string; category: string } | null;
  }> | null;
  past_hackathons_count?: number | null;
}

/** Options that shape which candidates a viewer is allowed to see. */
export interface CandidateSelectionOptions {
  /** Minimum profile completeness required to enter the matching pool. */
  minCompleteness: number;
  /** User ids the viewer blocked, or who blocked the viewer. */
  blockedIds?: string[];
  /** User ids the viewer already connected with (accepted requests, teams, chats). */
  connectedIds?: string[];
  /** Include builders who opted out of matching. Defaults to false. */
  includeOptedOut?: boolean;
}

/** Everything the generator needs that does not come from a profile row. */
export interface ViewerContext {
  viewerId: string;
  hackathonId: string;
  hackathonMode: "online" | "offline" | "hybrid";
  hackathonCity?: string;
  /** Roles the viewer is actively recruiting for (drives "Fills Open Role Slot"). */
  targetSkillsNeeded?: string[];
  preferredIntensity?: "casual" | "serious" | "grind";
  limit?: number;
}

const DEFAULT_LIMIT = 50;

/**
 * PostgREST returns an embedded relation as an object for one-to-one and as an
 * array for one-to-many joins. This normalizes both into a single name.
 */
export function relationName(value: unknown): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const first = value[0] as { name?: string } | undefined;
    return first?.name;
  }
  return (value as { name?: string }).name;
}

/**
 * Same as {@link relationName} but keeps the whole embedded record.
 * PostgREST returns embedded relations as an array for many-to-one joins
 * when the relationship is not detected as unique.
 */
export function relationRecord<T>(value: unknown): T | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (value[0] ?? null) as T | null;
  }
  return value as T;
}

function asNumber(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Maps a database profile row into the neutral shape the scorer consumes.
 */
export function toMatchCandidate(row: ProfileRow): MatchCandidateProfile {
  const skills = (row.skills ?? [])
    .filter((entry) => Boolean(entry.skill?.name))
    .map((entry) => ({
      category: entry.skill?.category ?? "other",
      skill: entry.skill?.name as string,
      proficiency: asNumber(entry.proficiency, 3),
      isPrimary: Boolean(entry.is_primary),
    }));

  return {
    id: row.id,
    name: row.name,
    city: row.city_name ?? row.city_id ?? "Unknown",
    location: row.location ?? undefined,
    skills,
    goals: row.goals,
    intensity: row.intensity,
    availability: row.availability,
    travelCities: row.travel_cities ?? undefined,
    reliabilityScore: asNumber(row.reliability_score, 85),
    pastHackathonsCount: asNumber(row.past_hackathons_count, 0),
    isVerified: Boolean(row.is_onboarded) && asNumber(row.completeness_score, 0) >= 80,
    githubReposCount: row.github_stats?.public_repos ?? undefined,
    lookingForSkills: row.looking_for_skills ?? undefined,
  };
}

/**
 * Builds the public profile projection for a candidate.
 * Exact GPS coordinates are stripped server-side (India DPDP + location privacy).
 */
export function toPublicProfile(row: ProfileRow): Profile {
  const skills: ProfileSkill[] = (row.skills ?? []).map((entry, index) => ({
    id: `ps-${row.id}-${index}`,
    profile_id: row.id,
    skill_id: `skill-${row.id}-${index}`,
    skill_name: entry.skill?.name,
    category: (entry.skill?.category as Skill["category"]) ?? undefined,
    proficiency: asNumber(entry.proficiency, 3),
    is_primary: Boolean(entry.is_primary),
  }));

  return {
    id: row.id,
    role: "user",
    name: row.name,
    email: row.email ?? "",
    avatar_url: row.avatar_url ?? undefined,
    college: row.college ?? undefined,
    year: row.year ?? undefined,
    branch: row.branch ?? undefined,
    city_id: row.city_id ?? undefined,
    city_name: row.city_name ?? undefined,
    area: row.area ?? undefined,
    location: undefined, // exact coordinates never leave the server
    bio: row.bio ?? undefined,
    linkedin_url: row.linkedin_url ?? undefined,
    github_url: row.github_url ?? undefined,
    portfolio_url: row.portfolio_url ?? undefined,
    goals: row.goals,
    intensity: row.intensity,
    availability: row.availability,
    travel_cities: row.travel_cities ?? undefined,
    reliability_score: asNumber(row.reliability_score, 85),
    completeness_score: asNumber(row.completeness_score, 0),
    is_onboarded: Boolean(row.is_onboarded),
    is_banned: Boolean(row.is_banned),
    github_stats: row.github_stats ?? undefined,
    skills,
    created_at: "",
    updated_at: "",
  };
}

/**
 * Applies the hard eligibility gates for the matching pool.
 *
 * Gates (in order): banned, opted out, onboarding/completeness floor,
 * blocked relationships, already connected, and self-exclusion.
 */
export function selectEligibleCandidates(
  rows: ProfileRow[],
  viewerId: string,
  options: CandidateSelectionOptions
): ProfileRow[] {
  const blocked = new Set(options.blockedIds ?? []);
  const connected = new Set(options.connectedIds ?? []);

  return rows.filter((row) => {
    if (row.id === viewerId) return false;
    if (row.is_banned) return false;
    if (!options.includeOptedOut && row.matching_enabled === false) return false;
    if (!row.is_onboarded) return false;
    if (asNumber(row.completeness_score, 0) < options.minCompleteness) return false;
    if (blocked.has(row.id)) return false;
    if (connected.has(row.id)) return false;
    return true;
  });
}

/**
 * Scores the eligible candidates for a viewer and returns the ranked feed
 * consumed by the "Why you match" cards.
 */
export function buildMatchFeed(
  viewerRow: ProfileRow,
  candidateRows: ProfileRow[],
  context: ViewerContext
): MatchCandidate[] {
  const viewer = toMatchCandidate(viewerRow);
  const matchContext: MatchContext = {
    hackathonId: context.hackathonId,
    hackathonMode: context.hackathonMode,
    hackathonCity: context.hackathonCity,
    targetSkillsNeeded:
      context.targetSkillsNeeded && context.targetSkillsNeeded.length > 0
        ? context.targetSkillsNeeded
        : viewer.lookingForSkills ?? [],
    preferredIntensity: context.preferredIntensity,
  };

  return candidateRows
    .map((row): MatchCandidate => {
      const result: MatchScoreResult = scoreCandidate(
        viewer,
        toMatchCandidate(row),
        matchContext
      );

      return {
        id: `match-${row.id}`,
        user_id: viewer.id,
        candidate_id: row.id,
        candidate: toPublicProfile(row),
        hackathon_id: context.hackathonId,
        score: result.score,
        breakdown: result.breakdown,
        reasons: result.reasons,
        computed_at: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, context.limit ?? DEFAULT_LIMIT);
}
