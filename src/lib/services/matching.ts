import { scoreCandidate, type MatchCandidateProfile, type MatchContext } from "@/lib/matching/scorer";
import type { MatchCandidate, MatchRequest, Profile } from "@/types/models";

/**
 * Seeded candidate pool for the Hyderabad cold start.
 * Used as an explicit, labelled fallback when Supabase is unreachable
 * (local dev without a database, demos, unit tests).
 */
export const seededCandidates: MatchCandidateProfile[] = [
  {
    id: "cand-1",
    name: "Sneha Reddy",
    city: "Hyderabad",
    location: { lat: 17.4483, lng: 78.3807 },
    skills: [
      { category: "backend", skill: "Python / FastAPI", proficiency: 5, isPrimary: true },
      { category: "ml_ai", skill: "LLMs & AI Agents", proficiency: 5, isPrimary: true },
      { category: "data", skill: "Vector DBs & Embeddings", proficiency: 4 },
    ],
    goals: "win",
    intensity: "grind",
    availability: "offline_city",
    reliabilityScore: 94,
    pastHackathonsCount: 3,
    isVerified: true,
    githubReposCount: 31,
  },
  {
    id: "cand-2",
    name: "Vikram Chandra",
    city: "Hyderabad",
    location: { lat: 17.4401, lng: 78.3489 },
    skills: [
      { category: "hardware_iot", skill: "Arduino & ESP32", proficiency: 5, isPrimary: true },
      { category: "backend", skill: "Embedded C / C++", proficiency: 4 },
      { category: "mobile", skill: "Flutter", proficiency: 3 },
    ],
    goals: "win",
    intensity: "grind",
    availability: "offline_city",
    reliabilityScore: 90,
    pastHackathonsCount: 2,
    isVerified: true,
    githubReposCount: 19,
  },
  {
    id: "cand-3",
    name: "Pooja Varma",
    city: "Hyderabad",
    location: { lat: 17.3850, lng: 78.4867 },
    skills: [
      { category: "design", skill: "Figma UI/UX & Prototyping", proficiency: 5, isPrimary: true },
      { category: "pitching", skill: "Pitch Deck & Presentation", proficiency: 5, isPrimary: true },
      { category: "frontend", skill: "Tailwind CSS", proficiency: 4 },
    ],
    goals: "win",
    intensity: "serious",
    availability: "offline_city",
    reliabilityScore: 88,
    pastHackathonsCount: 0, // First timer, tests fairness rule!
    isVerified: true,
    githubReposCount: 12,
  },
  {
    id: "cand-4",
    name: "Tarun G",
    city: "Hyderabad",
    location: { lat: 17.4933, lng: 78.3995 },
    skills: [
      { category: "blockchain", skill: "Solidity & Smart Contracts", proficiency: 4, isPrimary: true },
      { category: "frontend", skill: "Next.js", proficiency: 4 },
    ],
    goals: "balanced",
    intensity: "serious",
    availability: "willing_to_travel",
    reliabilityScore: 86,
    pastHackathonsCount: 1,
    isVerified: true,
    githubReposCount: 22,
  },
];

const mockRequests: MatchRequest[] = [];

export class MatchingService {
  /**
   * Scores the seeded fallback pool. Used when no database is reachable and
   * by the local demo so the matches surface is never a dead screen.
   */
  static async getMatches(
    user: MatchCandidateProfile,
    context: MatchContext
  ): Promise<MatchCandidate[]> {
    const scoredList: MatchCandidate[] = seededCandidates
      .filter((c) => c.id !== user.id)
      .map((cand) => {
        const result = scoreCandidate(user, cand, context);

        const candidateProfile: Profile = {
          id: cand.id,
          role: "user",
          name: cand.name,
          email: `${cand.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          college: "Top Hyderabad Tech College",
          year: 3,
          branch: "Computer Science",
          city_name: cand.city,
          area: "HITEC City / Gachibowli",
          goals: cand.goals,
          intensity: cand.intensity,
          availability: cand.availability,
          reliability_score: cand.reliabilityScore,
          completeness_score: 95,
          is_onboarded: true,
          is_banned: false,
          skills: cand.skills.map((s, idx) => ({
            id: `s-${idx}`,
            profile_id: cand.id,
            skill_id: `sk-${idx}`,
            skill_name: s.skill,
            category: s.category as any,
            proficiency: s.proficiency,
            is_primary: !!s.isPrimary,
          })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return {
          id: `match-${cand.id}`,
          user_id: user.id,
          candidate_id: cand.id,
          candidate: candidateProfile,
          hackathon_id: context.hackathonId,
          score: result.score,
          breakdown: result.breakdown,
          reasons: result.reasons,
          computed_at: new Date().toISOString(),
        };
      });

    // Sort descending by total compatibility score
    return scoredList.sort((a, b) => b.score - a.score);
  }

  /**
   * Submits a match request with an introductory note
   */
  static async sendMatchRequest(input: {
    senderId: string;
    receiverId: string;
    hackathonId: string;
    hackathonName?: string;
    teamId?: string;
    note?: string;
  }): Promise<MatchRequest> {
    const newReq: MatchRequest = {
      id: `req-${Date.now()}`,
      sender_id: input.senderId,
      receiver_id: input.receiverId,
      hackathon_id: input.hackathonId,
      hackathon_name: input.hackathonName || "External Hackathon",
      team_id: input.teamId,
      note: input.note,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    mockRequests.unshift(newReq);
    return newReq;
  }

  /**
   * Handles mutual accept or decline.
   * Direct messaging chat opens ONLY when status === 'accepted'.
   */
  static async respondToRequest(
    requestId: string,
    status: "accepted" | "declined"
  ): Promise<MatchRequest | null> {
    const req = mockRequests.find((r) => r.id === requestId);
    if (!req) return null;

    req.status = status;
    req.responded_at = new Date().toISOString();
    return req;
  }
}
