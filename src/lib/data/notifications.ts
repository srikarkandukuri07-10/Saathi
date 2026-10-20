import { createServerSupabaseClient } from "@/lib/supabase/server";
import { relationRecord } from "@/lib/matching/candidateGenerator";

/**
 * In-app notifications and the landing page aggregates.
 * Every number comes from the database.
 */

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export async function listNotifications(
  profileId: string,
  limit = 50
): Promise<NotificationRow[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, action_url, is_read, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[data/notifications] list failed:", error.message);
    return [];
  }

  return data ?? [];
}

export async function markAllNotificationsRead(profileId: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("profile_id", profileId)
    .eq("is_read", false);
}

export interface PlatformStats {
  hackathons: number;
  builders: number;
  teams: number;
  cities: number;
  conversations: number;
}

export interface HallOfFameEntry {
  id: string;
  builderName: string;
  college?: string;
  eventName: string;
  year: number;
  result: string;
  proofUrl?: string;
  verificationStatus: string;
}

/**
 * Hall of fame: verified wins recorded in `past_hackathons`.
 * Only entries an admin has verified are listed.
 */
export async function listHallOfFame(limit = 24): Promise<HallOfFameEntry[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("past_hackathons")
    .select(
      "id, event_name, year, result, proof_url, verification_status, profile:profiles(id, name, college)"
    )
    .eq("verification_status", "verified")
    .in("result", ["Winner", "Runner Up"])
    .order("year", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[data/notifications] hall of fame failed:", error.message);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const profile = relationRecord<{
      id: string;
      name: string;
      college?: string;
    }>(row.profile);
    if (!profile) return [];

    return [
      {
        id: row.id,
        builderName: profile.name,
        college: profile.college ?? undefined,
        eventName: row.event_name,
        year: row.year,
        result: row.result,
        proofUrl: row.proof_url ?? undefined,
        verificationStatus: row.verification_status,
      },
    ];
  });
}

/**
 * Public counters shown on the landing page. Reads live rows only.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = createServerSupabaseClient();

  const [hackathons, builders, teams, cities] = await Promise.all([
    supabase
      .from("hackathons")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_onboarded", true)
      .eq("is_banned", false),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase
      .from("cities")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  return {
    hackathons: hackathons.count ?? 0,
    builders: builders.count ?? 0,
    teams: teams.count ?? 0,
    cities: cities.count ?? 0,
    conversations: 0,
  };
}
