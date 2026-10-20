import { createServerSupabaseClient } from "@/lib/supabase/server";
import { relationRecord } from "@/lib/matching/candidateGenerator";
import type { GoalType, IntensityLevel, AvailabilityMode } from "@/types/models";

/**
 * Superadmin concierge tools. Every action here is executed against the
 * database; the admin console never invents rows.
 */

export interface VerificationQueueItem {
  id: string;
  profileId: string;
  userName: string;
  college?: string;
  type: string;
  status: string;
  proofUrl?: string;
  adminNotes?: string;
  createdAt: string;
}

export async function listVerificationQueue(
  status = "pending"
): Promise<VerificationQueueItem[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("verifications")
    .select(
      "id, profile_id, type, status, proof_data, admin_notes, created_at, profile:profiles(id, name, college)"
    )
    .eq("status", status)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[data/admin] verification queue failed:", error.message);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const profile = relationRecord<{ id: string; name: string; college?: string }>(
      row.profile
    );
    if (!profile) return [];

    const proof = (row.proof_data ?? {}) as Record<string, unknown>;

    return [
      {
        id: row.id,
        profileId: profile.id,
        userName: profile.name,
        college: profile.college,
        type: row.type,
        status: row.status,
        proofUrl: typeof proof.proof_url === "string" ? proof.proof_url : undefined,
        adminNotes: row.admin_notes ?? undefined,
        createdAt: row.created_at,
      },
    ];
  });
}

export async function reviewVerification(
  verificationId: string,
  decision: "verified" | "rejected",
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("verifications")
    .update({
      status: decision,
      admin_notes: adminNotes ?? null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", verificationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export interface ReportRow {
  id: string;
  reporterName: string;
  reportedName: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
}

export async function listReports(): Promise<ReportRow[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, reason, description, status, created_at, reporter:profiles!reports_reporter_id_fkey(id, name), reported:profiles!reports_reported_user_id_fkey(id, name)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[data/admin] reports failed:", error.message);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const reporter = relationRecord<{ id: string; name: string }>(row.reporter);
    const reported = relationRecord<{ id: string; name: string }>(row.reported);
    if (!reporter || !reported) return [];

    return [
      {
        id: row.id,
        reporterName: reporter.name,
        reportedName: reported.name,
        reason: row.reason,
        description: row.description ?? undefined,
        status: row.status,
        createdAt: row.created_at,
      },
    ];
  });
}

export async function resolveReport(
  reportId: string,
  status: "resolved" | "dismissed"
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("reports")
    .update({ status, resolved_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function setProfileBanned(
  profileId: string,
  banned: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: banned, updated_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export interface AdminProfile {
  id: string;
  name: string;
  college?: string;
  email: string;
  isBanned: boolean;
  completeness: number;
  skills: Array<{ name: string; category: string; proficiency: number }>;
  goals: GoalType;
  intensity: IntensityLevel;
  availability: AvailabilityMode;
}

/** The builder pool the concierge matcher can introduce. */
export async function listAdminProfiles(
  search?: string
): Promise<AdminProfile[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, name, college, email, is_banned, completeness_score, goals, intensity, availability, skills:profile_skills(proficiency, is_primary, skill:skills(name, category))"
    )
    .order("completeness_score", { ascending: false })
    .limit(200);

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`name.ilike.${term},college.ilike.${term},email.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[data/admin] profiles failed:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as Array<{
    id: string;
    name: string;
    college?: string;
    email: string;
    is_banned: boolean;
    completeness_score: number;
    goals: GoalType;
    intensity: IntensityLevel;
    availability: AvailabilityMode;
    skills?: Array<{
      proficiency: number;
      is_primary: boolean;
      skill?: { name: string; category: string } | null;
    }>;
  }>).map((row) => ({
    id: row.id,
    name: row.name,
    college: row.college ?? undefined,
    email: row.email,
    isBanned: row.is_banned,
    completeness: row.completeness_score,
    skills: (row.skills ?? []).flatMap((entry) => {
      const skill = relationRecord<{ name: string; category: string }>(entry.skill);
      return skill
        ? [{ name: skill.name, category: skill.category, proficiency: entry.proficiency }]
        : [];
    }),
    goals: row.goals,
    intensity: row.intensity,
    availability: row.availability,
  }));
}

export interface AdminHackathonInput {
  name: string;
  slug: string;
  organizer: string;
  mode: "online" | "offline" | "hybrid";
  cityId?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  prizePool?: string;
  theme?: string;
  description?: string;
  websiteUrl: string;
  minTeamSize: number;
  maxTeamSize: number;
  isPublished: boolean;
}

/**
 * Bulk import for the admin CSV importer. Every row is written to the
 * `hackathons` table.
 */
export async function importHackathons(
  rows: AdminHackathonInput[]
): Promise<{ imported: number; error?: string }> {
  const supabase = createServerSupabaseClient();

  if (rows.length === 0) {
    return { imported: 0 };
  }

  const { error } = await supabase.from("hackathons").upsert(
    rows.map((row) => ({
      name: row.name,
      slug: row.slug,
      organizer: row.organizer,
      mode: row.mode,
      city_id: row.cityId ?? null,
      venue: row.venue ?? null,
      start_date: row.startDate,
      end_date: row.endDate,
      registration_deadline: row.registrationDeadline,
      prize_pool: row.prizePool ?? null,
      theme: row.theme ?? null,
      description: row.description ?? null,
      website_url: row.websiteUrl,
      min_team_size: row.minTeamSize,
      max_team_size: row.maxTeamSize,
      is_published: row.isPublished,
    })),
    { onConflict: "slug" }
  );

  if (error) {
    return { imported: 0, error: error.message };
  }

  return { imported: rows.length };
}

/**
 * Concierge introduction: the admin creates the match request on behalf of
 * both builders, which is the only way a chat can open before a mutual accept.
 */
export async function createConciergeIntroduction(input: {
  senderId: string;
  receiverId: string;
  hackathonId: string;
  note: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("match_requests").insert({
    sender_id: input.senderId,
    receiver_id: input.receiverId,
    hackathon_id: input.hackathonId,
    note: input.note,
    status: "pending",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("notifications").insert([
    {
      profile_id: input.receiverId,
      type: "match_request",
      title: "A concierge introduction",
      body: input.note,
      action_url: "/matches",
    },
    {
      profile_id: input.senderId,
      type: "match_request",
      title: "A concierge introduction",
      body: input.note,
      action_url: "/matches",
    },
  ]);

  return { success: true };
}
