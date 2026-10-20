import { createServerSupabaseClient } from "@/lib/supabase/server";
import { relationRecord } from "@/lib/matching/candidateGenerator";
import type { Profile, Team, TeamMember, TeamOpenSlot } from "@/types/models";

/**
 * Squad workspaces. Teams, their members and their open role slots are read
 * from Postgres; the anti-ghosting lock is persisted on confirmation.
 */

interface TeamRow {
  id: string;
  hackathon_id: string;
  hackathon?: { name: string } | null;
  lead_id: string;
  name: string;
  description?: string | null;
  github_repo_url?: string | null;
  idea_board?: string | null;
  is_locked: boolean;
  locked_at?: string | null;
  created_at: string;
  members?: Array<{
    id: string;
    profile_id: string;
    role_name?: string | null;
    status: TeamMember["status"];
    confirmed_lock: boolean;
    profile?: unknown;
  }> | null;
  open_slots?: Array<{
    id: string;
    title: string;
    category: string;
    description?: string | null;
    is_filled: boolean;
  }> | null;
}

const TEAM_SELECT = `
  id, hackathon_id, hackathon:hackathons(name), lead_id, name, description,
  github_repo_url, idea_board, is_locked, locked_at, created_at,
  members:team_members(id, profile_id, role_name, status, confirmed_lock,
    profile:profiles(id, name, college, branch, year, reliability_score, avatar_url, goals, intensity, availability, city_id, area)),
  open_slots:team_open_slots(id, title, category, description, is_filled)
`;

function toTeam(row: TeamRow): Team {
  const members: TeamMember[] = (row.members ?? []).map((member) => {
    const profile = relationRecord<Partial<Profile>>(member.profile);
    return {
      id: member.id,
      team_id: row.id,
      profile_id: member.profile_id,
      role_name: member.role_name ?? undefined,
      status: member.status,
      confirmed_lock: member.confirmed_lock,
      profile: profile
        ? {
            id: profile.id,
            name: profile.name,
            college: profile.college,
            branch: profile.branch,
            year: profile.year,
            reliability_score: profile.reliability_score,
            avatar_url: profile.avatar_url,
            goals: profile.goals,
            intensity: profile.intensity,
            availability: profile.availability,
            city_id: profile.city_id,
            area: profile.area,
          }
        : undefined,
    };
  });

  const openSlots: TeamOpenSlot[] = (row.open_slots ?? []).map((slot) => ({
    id: slot.id,
    team_id: row.id,
    title: slot.title,
    category: slot.category as TeamOpenSlot["category"],
    description: slot.description ?? undefined,
    is_filled: slot.is_filled,
  }));

  const lead = members.find((member) => member.profile_id === row.lead_id);

  return {
    id: row.id,
    hackathon_id: row.hackathon_id,
    hackathon_name: row.hackathon?.name,
    lead_id: row.lead_id,
    lead_profile: lead?.profile,
    name: row.name,
    description: row.description ?? undefined,
    github_repo_url: row.github_repo_url ?? undefined,
    idea_board: row.idea_board ?? undefined,
    is_locked: row.is_locked,
    locked_at: row.locked_at ?? undefined,
    members,
    open_slots: openSlots,
    created_at: row.created_at,
  };
}

export async function listTeams(hackathonId?: string): Promise<Team[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("teams")
    .select(TEAM_SELECT)
    .order("created_at", { ascending: false });

  if (hackathonId) {
    query = query.eq("hackathon_id", hackathonId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[data/teams] list failed:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as TeamRow[]).map(toTeam);
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("teams")
    .select(TEAM_SELECT)
    .eq("id", teamId)
    .maybeSingle();

  if (error || !data) return null;
  return toTeam(data as unknown as TeamRow);
}

export interface CreateTeamInput {
  hackathonId: string;
  leadId: string;
  name: string;
  description?: string;
  githubRepoUrl?: string;
  ideaBoard?: string;
  openSlots: Array<{ title: string; category: string; description?: string }>;
}

/**
 * Creates a squad with its lead member and open role slots.
 */
export async function createTeam(input: CreateTeamInput): Promise<Team | null> {
  const supabase = createServerSupabaseClient();

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      hackathon_id: input.hackathonId,
      lead_id: input.leadId,
      name: input.name,
      description: input.description ?? null,
      github_repo_url: input.githubRepoUrl ?? null,
      idea_board: input.ideaBoard ?? null,
    })
    .select("id")
    .single();

  if (error || !team) {
    console.error("[data/teams] create failed:", error.message);
    return null;
  }

  await supabase.from("team_members").insert({
    team_id: team.id,
    profile_id: input.leadId,
    role_name: "Team Lead",
    status: "joined",
    confirmed_lock: true,
  });

  if (input.openSlots.length > 0) {
    await supabase.from("team_open_slots").insert(
      input.openSlots.map((slot) => ({
        team_id: team.id,
        title: slot.title,
        category: slot.category,
        description: slot.description ?? null,
      }))
    );
  }

  return getTeam(team.id);
}

/**
 * Records a member's commitment. When every member has confirmed, the squad is
 * locked and each confirmed member receives the reliability bonus.
 */
export async function confirmTeamLock(
  teamId: string,
  memberId: string
): Promise<{ allLocked: boolean; team: Team | null; awarded: number }> {
  const supabase = createServerSupabaseClient();

  const { data: member, error: memberError } = await supabase
    .from("team_members")
    .update({ confirmed_lock: true, status: "locked" })
    .eq("team_id", teamId)
    .eq("profile_id", memberId)
    .select("id")
    .maybeSingle();

  if (memberError || !member) {
    return { allLocked: false, team: await getTeam(teamId), awarded: 0 };
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("profile_id, confirmed_lock")
    .eq("team_id", teamId);

  const allConfirmed = (members ?? []).every((m) => m.confirmed_lock);

  if (allConfirmed) {
    const { data: team } = await supabase
      .from("teams")
      .update({ is_locked: true, locked_at: new Date().toISOString() })
      .eq("id", teamId)
      .select("is_locked")
      .maybeSingle();

    if (team?.is_locked) {
      await supabase.from("reliability_events").insert(
        (members ?? []).map((m) => ({
          profile_id: m.profile_id,
          event_type: "team_locked",
          delta_score: 10,
          reason: "Confirmed the anti-ghosting team lock",
        }))
      );
    }
  }

  return { allLocked: allConfirmed, team: await getTeam(teamId), awarded: 10 };
}
