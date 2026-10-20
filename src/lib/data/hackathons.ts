import { createServerSupabaseClient } from "@/lib/supabase/server";
import { relationName } from "@/lib/matching/candidateGenerator";
import type { Hackathon } from "@/types/models";

/**
 * External hackathon directory. Reads the published events from Postgres.
 */

interface HackathonRow {
  id: string;
  name: string;
  slug: string;
  organizer: string;
  mode: Hackathon["mode"];
  city_id?: string | null;
  city?: unknown;
  venue?: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  prize_pool?: string | null;
  theme?: string | null;
  description?: string | null;
  website_url: string;
  min_team_size: number;
  max_team_size: number;
  logo_url?: string | null;
  is_published: boolean;
  participants?: Array<{ id: string; profile_id: string }> | null;
}

const HACKATHON_SELECT = `
  id, name, slug, organizer, mode, city_id, city:cities(name), venue,
  start_date, end_date, registration_deadline, prize_pool, theme, description,
  website_url, min_team_size, max_team_size, logo_url, is_published,
  participants:hackathon_participants(id, profile_id)
`;

function toHackathon(
  row: HackathonRow,
  viewerId: string | null,
  participantIds: Set<string>
): Hackathon {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    organizer: row.organizer,
    mode: row.mode,
    city_id: row.city_id ?? undefined,
    city_name: relationName(row.city),
    venue: row.venue ?? undefined,
    start_date: row.start_date,
    end_date: row.end_date,
    registration_deadline: row.registration_deadline,
    prize_pool: row.prize_pool ?? undefined,
    theme: row.theme ?? undefined,
    description: row.description ?? undefined,
    website_url: row.website_url,
    min_team_size: row.min_team_size,
    max_team_size: row.max_team_size,
    logo_url: row.logo_url ?? undefined,
    is_published: row.is_published,
    participant_count: participantIds.size,
    is_user_going: viewerId ? participantIds.has(viewerId) : false,
  };
}

export interface HackathonFilters {
  mode?: string;
  cityId?: string;
  search?: string;
}

export async function listHackathons(
  viewerId: string | null,
  filters: HackathonFilters = {}
): Promise<Hackathon[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("hackathons")
    .select(HACKATHON_SELECT)
    .eq("is_published", true)
    .order("registration_deadline", { ascending: true });

  if (filters.mode && filters.mode !== "all") {
    query = query.eq("mode", filters.mode);
  }
  if (filters.cityId) {
    query = query.eq("city_id", filters.cityId);
  }
  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `name.ilike.${term},organizer.ilike.${term},theme.ilike.${term}`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[data/hackathons] list failed:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as HackathonRow[]).map((row) =>
    toHackathon(row, viewerId, new Set((row.participants ?? []).map((p) => p.profile_id)))
  );
}

export async function getHackathonBySlug(
  slug: string,
  viewerId: string | null
): Promise<Hackathon | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("hackathons")
    .select(HACKATHON_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as HackathonRow;
  return toHackathon(
    row,
    viewerId,
    new Set((row.participants ?? []).map((p) => p.profile_id))
  );
}

/**
 * Toggles the "I'm going" state of the signed-in user for an event.
 */
export async function setParticipation(
  hackathonId: string,
  userId: string,
  going: boolean
): Promise<{ isGoing: boolean; count: number }> {
  const supabase = createServerSupabaseClient();

  if (going) {
    await supabase
      .from("hackathon_participants")
      .upsert(
        { hackathon_id: hackathonId, profile_id: userId, status: "seeking_team" },
        { onConflict: "hackathon_id,profile_id" }
      );
  } else {
    await supabase
      .from("hackathon_participants")
      .delete()
      .eq("hackathon_id", hackathonId)
      .eq("profile_id", userId);
  }

  const { count } = await supabase
    .from("hackathon_participants")
    .select("id", { count: "exact", head: true })
    .eq("hackathon_id", hackathonId);

  return { isGoing: going, count: count ?? 0 };
}

export interface EventParticipant {
  id: string;
  name: string;
  college?: string;
  branch?: string;
  year?: number;
  status: string;
  reliabilityScore: number;
  intensity: string;
  goals: string;
  primarySkill?: string;
}

/**
 * The builders registered for an event. Only the rows that exist in
 * `hackathon_participants` are returned.
 */
export async function listEventParticipants(
  hackathonId: string
): Promise<EventParticipant[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("hackathon_participants")
    .select(
      "status, profile:profiles(id, name, college, branch, year, reliability_score, intensity, goals, skills:profile_skills(proficiency, is_primary, skill:skills(name, category)))"
    )
    .eq("hackathon_id", hackathonId);

  if (error || !data) {
    console.error("[data/hackathons] participants failed:", error.message);
    return [];
  }

  return (data as unknown as Array<{
    status: string;
    profile?: {
      id: string;
      name: string;
      college?: string;
      branch?: string;
      year?: number;
      reliability_score?: number;
      intensity?: string;
      goals?: string;
      skills?: Array<{
        proficiency: number;
        is_primary: boolean;
        skill?: { name: string; category: string } | null;
      }>;
    } | null;
  }>).flatMap((row) => {
    if (!row.profile) return [];

    const primary = (row.profile.skills ?? [])
      .filter((entry) => entry.is_primary)
      .sort((a, b) => b.proficiency - a.proficiency)[0];

    return [
      {
        id: row.profile.id,
        name: row.profile.name,
        college: row.profile.college,
        branch: row.profile.branch,
        year: row.profile.year,
        status: row.status,
        reliabilityScore: row.profile.reliability_score ?? 0,
        intensity: row.profile.intensity ?? "serious",
        goals: row.profile.goals ?? "balanced",
        primarySkill: primary?.skill?.name,
      },
    ];
  });
}
