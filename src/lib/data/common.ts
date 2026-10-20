import { createServerSupabaseClient } from "@/lib/supabase/server";
import { relationName, relationRecord } from "@/lib/matching/candidateGenerator";
import type { Profile, ProfileSkill } from "@/types/models";

/**
 * Server-side data access.
 *
 * Every helper in this folder reads the live Postgres database through the
 * caller's session, so Row Level Security decides what is visible. There is
 * no in-memory sample data anywhere in the application: when a table is empty
 * the API returns an empty list and the UI renders an honest empty state.
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
  city?: unknown;
  area?: string | null;
  location?: { lat: number; lng: number } | null;
  bio?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  goals: Profile["goals"];
  intensity: Profile["intensity"];
  availability: Profile["availability"];
  travel_cities?: string[] | null;
  reliability_score?: number | null;
  completeness_score?: number | null;
  is_onboarded?: boolean | null;
  is_banned?: boolean | null;
  role?: Profile["role"] | null;
  matching_enabled?: boolean | null;
  open_to_remote?: boolean | null;
  preferred_team_size?: number | null;
  looking_for_skills?: string[] | null;
  github_stats?: Profile["github_stats"];
  skills?: Array<{
    proficiency: number;
    is_primary: boolean;
    skill?: unknown;
  }> | null;
  past_hackathons?: Array<{ id: string }> | null;
  projects?: Array<{ id: string }> | null;
}

export const PROFILE_SELECT = `
  id, name, email, avatar_url, college, year, branch, city_id, area, location, bio,
  linkedin_url, github_url, portfolio_url, goals, intensity, availability,
  travel_cities, reliability_score, completeness_score, is_onboarded, is_banned,
  role, matching_enabled, open_to_remote, preferred_team_size, looking_for_skills,
  github_stats,
  city:cities(name),
  skills:profile_skills(proficiency, is_primary, skill:skills(name, category)),
  past_hackathons(id),
  projects(id)
`;

/** Normalises a row returned by {@link PROFILE_SELECT} into a domain row. */
export function toProfileRow(row: ProfileRow): ProfileRow {
  return {
    ...row,
    city_name: relationName(row.city) ?? row.city_name,
    skills: (row.skills ?? []).map((entry) => ({
      proficiency: entry.proficiency,
      is_primary: entry.is_primary,
      skill: relationRecord<{ name: string; category: string }>(entry.skill),
    })),
  };
}

/** Builds the public projection of a profile. Exact coordinates never leave the server. */
export function toPublicProfile(row: ProfileRow): Profile {
  const skills: ProfileSkill[] = (row.skills ?? []).map((entry, index) => {
    const skill = relationRecord<{ name: string; category: string }>(entry.skill);
    return {
      id: `ps-${row.id}-${index}`,
      profile_id: row.id,
      skill_id: `skill-${row.id}-${index}`,
      skill_name: skill?.name,
      category: skill?.category as ProfileSkill["category"],
      proficiency: entry.proficiency,
      is_primary: entry.is_primary,
    };
  });

  return {
    id: row.id,
    role: row.role ?? "user",
    name: row.name,
    email: row.email ?? "",
    avatar_url: row.avatar_url ?? undefined,
    college: row.college ?? undefined,
    year: row.year ?? undefined,
    branch: row.branch ?? undefined,
    city_id: row.city_id ?? undefined,
    city_name: row.city_name ?? undefined,
    area: row.area ?? undefined,
    location: undefined,
    bio: row.bio ?? undefined,
    linkedin_url: row.linkedin_url ?? undefined,
    github_url: row.github_url ?? undefined,
    portfolio_url: row.portfolio_url ?? undefined,
    goals: row.goals,
    intensity: row.intensity,
    availability: row.availability,
    travel_cities: row.travel_cities ?? undefined,
    reliability_score: row.reliability_score ?? 0,
    completeness_score: row.completeness_score ?? 0,
    is_onboarded: Boolean(row.is_onboarded),
    is_banned: Boolean(row.is_banned),
    github_stats: row.github_stats ?? undefined,
    skills,
    created_at: "",
    updated_at: "",
  };
}

/** Returns the signed-in user id, or null when there is no session. */
export async function getSessionUserId(): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}
