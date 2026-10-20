import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  PROFILE_SELECT,
  toProfileRow,
  toPublicProfile,
  type ProfileRow,
} from "@/lib/data/common";
import type { Profile } from "@/types/models";

/**
 * Profile reads and writes. The signed-in user's own profile is returned with
 * every field; other profiles are projected through the public projection,
 * which never includes the exact coordinates.
 */

export async function getProfileRow(
  profileId: string
): Promise<ProfileRow | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) return null;
  return toProfileRow(data as unknown as ProfileRow);
}

export async function getPublicProfile(
  profileId: string
): Promise<Profile | null> {
  const row = await getProfileRow(profileId);
  return row ? toPublicProfile(row) : null;
}

export interface UpdateProfileInput {
  name?: string;
  college?: string;
  year?: number;
  branch?: string;
  cityId?: string;
  area?: string;
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  goals?: Profile["goals"];
  intensity?: Profile["intensity"];
  availability?: Profile["availability"];
  travelCities?: string[];
  lookingForSkills?: string[];
  preferredTeamSize?: number;
  openToRemote?: boolean;
  matchingEnabled?: boolean;
}

export async function updateProfile(
  profileId: string,
  input: UpdateProfileInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.name !== undefined) patch.name = input.name;
  if (input.college !== undefined) patch.college = input.college;
  if (input.year !== undefined) patch.year = input.year;
  if (input.branch !== undefined) patch.branch = input.branch;
  if (input.cityId !== undefined) patch.city_id = input.cityId;
  if (input.area !== undefined) patch.area = input.area;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.linkedinUrl !== undefined) patch.linkedin_url = input.linkedinUrl;
  if (input.githubUrl !== undefined) patch.github_url = input.githubUrl;
  if (input.portfolioUrl !== undefined) patch.portfolio_url = input.portfolioUrl;
  if (input.goals !== undefined) patch.goals = input.goals;
  if (input.intensity !== undefined) patch.intensity = input.intensity;
  if (input.availability !== undefined) patch.availability = input.availability;
  if (input.travelCities !== undefined) patch.travel_cities = input.travelCities;
  if (input.lookingForSkills !== undefined)
    patch.looking_for_skills = input.lookingForSkills;
  if (input.preferredTeamSize !== undefined)
    patch.preferred_team_size = input.preferredTeamSize;
  if (input.openToRemote !== undefined) patch.open_to_remote = input.openToRemote;
  if (input.matchingEnabled !== undefined)
    patch.matching_enabled = input.matchingEnabled;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", profileId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Recompute the completeness gate from the stored values.
  const row = await getProfileRow(profileId);
  if (row) {
    const completeness = await computeCompleteness(row);
    await supabase
      .from("profiles")
      .update({ completeness_score: completeness, is_onboarded: completeness >= 80 })
      .eq("id", profileId);
  }

  return { success: true };
}

async function computeCompleteness(row: ProfileRow): Promise<number> {
  const supabase = createServerSupabaseClient();

  const { count: projectCount } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", row.id);

  const { count: hackathonCount } = await supabase
    .from("past_hackathons")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", row.id);

  let score = 0;
  if (row.name?.trim()) score += 5;
  if (row.avatar_url?.trim()) score += 5;
  if (row.college?.trim()) score += 10;
  if (row.year && row.year >= 1) score += 5;
  if (row.branch?.trim()) score += 5;
  if (row.city_id) score += 5;
  if (row.linkedin_url?.trim()) score += 15;
  if (row.github_url?.trim()) score += 10;

  const skillCount = row.skills?.length ?? 0;
  if (skillCount >= 3) score += 20;
  else if (skillCount > 0) score += skillCount * 6;

  if (row.goals) score += 5;
  if (row.intensity && row.availability) score += 5;
  if ((projectCount ?? 0) > 0) score += 5;
  if ((hackathonCount ?? 0) > 0) score += 5;

  return Math.min(100, Math.round(score));
}

/**
 * Showcase projects. Stored in the `projects` table.
 */
export async function listProjects(profileId: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, profile_id, title, description, tech_stack, repo_url, demo_url, image_url, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[data/profiles] projects failed:", error.message);
    return [];
  }

  return data ?? [];
}

export async function addProject(
  profileId: string,
  input: {
    title: string;
    description: string;
    techStack: string[];
    repoUrl?: string;
    demoUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("projects").insert({
    profile_id: profileId,
    title: input.title,
    description: input.description,
    tech_stack: input.techStack,
    repo_url: input.repoUrl ?? null,
    demo_url: input.demoUrl ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await refreshCompleteness(profileId);
  return { success: true };
}

/**
 * Past hackathon history. Stored in the `past_hackathons` table.
 */
export async function listPastHackathons(profileId: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("past_hackathons")
    .select(
      "id, profile_id, event_name, year, result, team_size, proof_url, certificate_url, verification_status, created_at"
    )
    .eq("profile_id", profileId)
    .order("year", { ascending: false });

  if (error) {
    console.error("[data/profiles] past hackathons failed:", error.message);
    return [];
  }

  return data ?? [];
}

export async function addPastHackathon(
  profileId: string,
  input: {
    eventName: string;
    year: number;
    result: "Winner" | "Runner Up" | "Finalist" | "Participant";
    teamSize?: number;
    proofUrl?: string;
    certificateUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("past_hackathons").insert({
    profile_id: profileId,
    event_name: input.eventName,
    year: input.year,
    result: input.result,
    team_size: input.teamSize ?? null,
    proof_url: input.proofUrl ?? null,
    certificate_url: input.certificateUrl ?? null,
    verification_status: "pending",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await refreshCompleteness(profileId);
  return { success: true };
}

/** Recomputes the completeness gate after a child record changed. */
export async function refreshCompleteness(profileId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const row = await getProfileRow(profileId);
  if (!row) return;

  const completeness = await computeCompleteness(row);

  await supabase
    .from("profiles")
    .update({ completeness_score: completeness, is_onboarded: completeness >= 80 })
    .eq("id", profileId);
}
