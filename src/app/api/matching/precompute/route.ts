import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { scoreCandidate } from "@/lib/matching/scorer";
import {
  relationName,
  relationRecord,
  toMatchCandidate,
  type ProfileRow,
} from "@/lib/matching/candidateGenerator";
import { parseLocation, type RawLocation } from "@/lib/matching/location";
import { APP_CONFIG } from "@/config/site";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 100;
const MAX_PROFILES = 300;

interface PrecomputeProfileRow {
  id: string;
  name: string;
  city_id?: string | null;
  goals: "win" | "learn" | "balanced";
  intensity: "casual" | "serious" | "grind";
  availability: "online_only" | "offline_city" | "willing_to_travel";
  reliability_score?: number | null;
  completeness_score?: number | null;
  is_onboarded?: boolean | null;
  is_banned?: boolean | null;
  matching_enabled?: boolean | null;
  looking_for_skills?: string[] | null;
  github_stats?: { public_repos?: number } | null;
  location?: RawLocation;
  city?: unknown;
  skills?: Array<{
    proficiency: number;
    is_primary: boolean;
    skill?: unknown;
  }> | null;
  past_hackathons?: Array<{ id: string }> | null;
}

interface PrecomputeHackathon {
  id: string;
  name: string;
  mode: "online" | "offline" | "hybrid";
  city?: unknown;
}

const PROFILE_SELECT = `
  id, name, city_id, goals, intensity, availability, reliability_score,
  completeness_score, is_onboarded, is_banned, matching_enabled,
  looking_for_skills, github_stats, location,
  city:cities(name),
  skills:profile_skills(proficiency, is_primary, skill:skills(name, category)),
  past_hackathons(id)
`;

function toRow(row: PrecomputeProfileRow): ProfileRow {
  return {
    id: row.id,
    name: row.name,
    city_id: row.city_id ?? undefined,
    city_name: relationName(row.city),
    goals: row.goals,
    intensity: row.intensity,
    availability: row.availability,
    reliability_score: row.reliability_score ?? undefined,
    completeness_score: row.completeness_score ?? undefined,
    is_onboarded: row.is_onboarded ?? undefined,
    is_banned: row.is_banned ?? undefined,
    matching_enabled: row.matching_enabled ?? undefined,
    looking_for_skills: row.looking_for_skills ?? undefined,
    github_stats: row.github_stats ?? undefined,
    location: parseLocation(row.location) ?? null,
    skills: (row.skills ?? []).map((entry) => ({
      proficiency: entry.proficiency,
      is_primary: entry.is_primary,
      skill: relationRecord<{ name: string; category: string }>(entry.skill),
    })),
    past_hackathons_count: row.past_hackathons?.length ?? 0,
  };
}

/**
 * POST /api/matching/precompute
 *
 * Cron-style job that scores the eligible pool for every published hackathon
 * and upserts the results into `match_candidates` (the same rows the
 * `/api/matches` feed reads). Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const startedAt = Date.now();

  const [profilesResult, hackathonsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("is_banned", false)
      .eq("is_onboarded", true)
      .eq("matching_enabled", true)
      .gte("completeness_score", APP_CONFIG.minProfileCompleteness)
      .limit(MAX_PROFILES),
    supabase
      .from("hackathons")
      .select("id, name, mode, city:cities(name)")
      .eq("is_published", true)
      .order("registration_deadline", { ascending: true })
      .limit(25),
  ]);

  if (profilesResult.error || !profilesResult.data) {
    return NextResponse.json(
      { error: "Failed to fetch profiles", detail: profilesResult.error?.message },
      { status: 500 }
    );
  }

  if (hackathonsResult.error || !hackathonsResult.data) {
    return NextResponse.json(
      { error: "Failed to fetch hackathons", detail: hackathonsResult.error?.message },
      { status: 500 }
    );
  }

  const profiles = (profilesResult.data as PrecomputeProfileRow[]).map(toRow);
  const hackathons = hackathonsResult.data as PrecomputeHackathon[];

  if (profiles.length === 0 || hackathons.length === 0) {
    return NextResponse.json({
      ok: true,
      profiles: profiles.length,
      hackathons: hackathons.length,
      pairs: 0,
      errors: 0,
      elapsed_seconds: 0,
    });
  }

  type UpsertRow = {
    user_id: string;
    candidate_id: string;
    hackathon_id: string;
    score: number;
    breakdown: Record<string, number>;
    reasons: string[];
    computed_at: string;
  };

  const upsertBatch: UpsertRow[] = [];
  let totalPairs = 0;
  let errors = 0;

  const flush = async () => {
    if (upsertBatch.length === 0) return;
    const batch = upsertBatch.splice(0, BATCH_SIZE);
    const { error } = await supabase.from("match_candidates").upsert(batch, {
      onConflict: "user_id,candidate_id,hackathon_id",
    });
    if (error) {
      errors += batch.length;
      console.error("[matching/precompute] upsert failed:", error.message);
    }
  };

  for (const hackathon of hackathons) {
    const hackathonCity = relationName(hackathon.city);

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const userRow = profiles[i];
        const candidateRow = profiles[j];

        // Offline events are city-scoped; online events can pair anyone.
        if (
          (hackathon.mode === "offline" || hackathon.mode === "hybrid") &&
          userRow.city_name &&
          candidateRow.city_name &&
          userRow.city_name !== candidateRow.city_name
        ) {
          continue;
        }

        try {
          const user = toMatchCandidate(userRow);
          const candidate = toMatchCandidate(candidateRow);
          const targetSkillsNeeded = user.lookingForSkills ?? [];

          const forward = scoreCandidate(user, candidate, {
            hackathonId: hackathon.id,
            hackathonMode: hackathon.mode,
            hackathonCity,
            targetSkillsNeeded,
          });

          const reverse = scoreCandidate(candidate, user, {
            hackathonId: hackathon.id,
            hackathonMode: hackathon.mode,
            hackathonCity,
            targetSkillsNeeded: candidate.lookingForSkills ?? [],
          });

          const computedAt = new Date().toISOString();

          upsertBatch.push({
            user_id: userRow.id,
            candidate_id: candidateRow.id,
            hackathon_id: hackathon.id,
            score: forward.score,
            breakdown: forward.breakdown,
            reasons: forward.reasons,
            computed_at: computedAt,
          });

          upsertBatch.push({
            user_id: candidateRow.id,
            candidate_id: userRow.id,
            hackathon_id: hackathon.id,
            score: reverse.score,
            breakdown: reverse.breakdown,
            reasons: reverse.reasons,
            computed_at: computedAt,
          });

          totalPairs += 2;
        } catch {
          errors++;
        }

        if (upsertBatch.length >= BATCH_SIZE) {
          await flush();
        }
      }
    }
  }

  await flush();

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  return NextResponse.json({
    ok: true,
    profiles: profiles.length,
    hackathons: hackathons.length,
    pairs: totalPairs,
    errors,
    elapsed_seconds: elapsed,
  });
}
