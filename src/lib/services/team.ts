
import type { Team, TeamMember, TeamOpenSlot, Profile } from "@/types/models";

const mockTeams: Team[] = [
  {
    id: "team-alpha",
    hackathon_id: "20000000-0000-0000-0000-000000000001",
    hackathon_name: "Smart India Hackathon 2026",
    lead_id: "u-demo-1",
    lead_profile: {
      name: "Aditya Narang",
      college: "IIIT Hyderabad",
      reliability_score: 95,
    },
    name: "Autonomous Agents Lab",
    description: "Developing agentic emergency triage and drone dispatch system for SIH problem statement #1420.",
    github_repo_url: "https://github.com/hackpact-teams/sih-triage-agents",
    idea_board: "1. Fine-tuned triage model on emergency calls\n2. Realtime WebSocket dispatch map\n3. Edge drone simulation in ROS2\n4. Presentation deck with live demo",
    is_locked: false,
    members: [
      {
        id: "tm-1",
        team_id: "team-alpha",
        profile_id: "u-demo-1",
        role_name: "Lead / Full-Stack",
        status: "locked",
        confirmed_lock: true,
        profile: {
          name: "Aditya Narang",
          college: "IIIT Hyderabad",
          reliability_score: 95,
        },
      },
      {
        id: "tm-2",
        team_id: "team-alpha",
        profile_id: "u-sneha",
        role_name: "ML & PyTorch Specialist",
        status: "joined",
        confirmed_lock: true,
        profile: {
          name: "Sneha Reddy",
          college: "CBIT Hyderabad",
          reliability_score: 92,
        },
      },
    ],
    open_slots: [
      {
        id: "slot-1",
        team_id: "team-alpha",
        title: "Need 1 Frontend Engineer",
        category: "frontend",
        description: "Next.js 14, Tailwind, Mapbox integration for dispatch command center.",
        is_filled: false,
      },
      {
        id: "slot-2",
        team_id: "team-alpha",
        title: "Need 1 Hardware / IoT Specialist",
        category: "hardware_iot",
        description: "Telemetry bridge for drone sensor feeds using MQTT / ESP32.",
        is_filled: false,
      },
    ],
    created_at: new Date().toISOString(),
  },
];

export class TeamService {
  static async getTeamsForHackathon(hackathonId: string): Promise<Team[]> {
    return mockTeams.filter((t) => t.hackathon_id === hackathonId);
  }

  static async getTeam(teamId: string): Promise<Team | null> {
    const found = mockTeams.find((t) => t.id === teamId);
    return found || null;
  }

  static async createTeam(input: {
    hackathonId: string;
    hackathonName?: string;
    leadId: string;
    name: string;
    description?: string;
    githubRepoUrl?: string;
    ideaBoard?: string;
    openSlots: Array<{ title: string; category: any; description?: string }>;
  }): Promise<Team> {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      hackathon_id: input.hackathonId,
      hackathon_name: input.hackathonName || "External Hackathon",
      lead_id: input.leadId,
      name: input.name,
      description: input.description,
      github_repo_url: input.githubRepoUrl,
      idea_board: input.ideaBoard,
      is_locked: false,
      members: [
        {
          id: `tm-${Date.now()}`,
          team_id: `team-${Date.now()}`,
          profile_id: input.leadId,
          role_name: "Team Lead",
          status: "joined",
          confirmed_lock: true,
        },
      ],
      open_slots: input.openSlots.map((s, idx) => ({
        id: `slot-${idx}-${Date.now()}`,
        team_id: `team-${Date.now()}`,
        title: s.title,
        category: s.category,
        description: s.description,
        is_filled: false,
      })),
      created_at: new Date().toISOString(),
    };

    mockTeams.unshift(newTeam);
    return newTeam;
  }

  /**
   * Confirms member commitment or locks the team.
   * Feeds directly into user reliability scores (+10 pts for completed lock).
   */
  static async confirmLock(
    teamId: string,
    memberId: string
  ): Promise<{ allLocked: boolean; team: Team | null }> {
    const team = mockTeams.find((t) => t.id === teamId);
    if (!team) return { allLocked: false, team: null };

    const member = team.members.find((m) => m.profile_id === memberId);
    if (member) {
      member.confirmed_lock = true;
      member.status = "locked";
    }

    const allMembersConfirmed = team.members.every((m) => m.confirmed_lock);
    if (allMembersConfirmed) {
      team.is_locked = true;
      team.locked_at = new Date().toISOString();
    }

    return { allLocked: allMembersConfirmed, team };
  }
}
