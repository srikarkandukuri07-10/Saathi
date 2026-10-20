import { describe, it, expect } from "vitest";
import { scoreCandidate, type MatchCandidateProfile, type MatchContext } from "@/lib/matching/scorer";

describe("Hackpact Matching Scorer", () => {
  const baseUser: MatchCandidateProfile = {
    id: "user-1",
    name: "Arjun Rao",
    city: "Hyderabad",
    location: { lat: 17.4401, lng: 78.3489 }, // Gachibowli
    skills: [
      { category: "frontend", skill: "Next.js / React", proficiency: 5, isPrimary: true },
      { category: "design", skill: "Figma UI/UX", proficiency: 4, isPrimary: false },
    ],
    goals: "win",
    intensity: "grind",
    availability: "offline_city",
    reliabilityScore: 95,
    pastHackathonsCount: 2,
    isVerified: true,
  };

  const contextOfflineHyd: MatchContext = {
    hackathonId: "h-sih-2026",
    hackathonMode: "offline",
    hackathonCity: "Hyderabad",
    targetSkillsNeeded: ["backend", "ml_ai"],
  };

  it("rewards complementary skills (e.g. Frontend builder matched with ML/Backend builder)", () => {
    const candidateBackendML: MatchCandidateProfile = {
      id: "cand-1",
      name: "Sneha Reddy",
      city: "Hyderabad",
      location: { lat: 17.4483, lng: 78.3807 }, // HITEC City (~4 km)
      skills: [
        { category: "backend", skill: "Python / FastAPI", proficiency: 5, isPrimary: true },
        { category: "ml_ai", skill: "LLMs & AI Agents", proficiency: 4, isPrimary: true },
      ],
      goals: "win",
      intensity: "grind",
      availability: "offline_city",
      reliabilityScore: 92,
      pastHackathonsCount: 3,
      isVerified: true,
      githubReposCount: 28,
    };

    const result = scoreCandidate(baseUser, candidateBackendML, contextOfflineHyd);

    // Complementary skills + shared win + shared 24h grind + same city
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.breakdown.skillComplementarity).toBeGreaterThanOrEqual(30);
    expect(result.reasons.some((r) => r.includes("Fills Open Role Slot"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("24h Grind Squad"))).toBe(true);
  });

  it("penalizes intensity mismatch (24h grind vs casual learner)", () => {
    const candidateCasual: MatchCandidateProfile = {
      id: "cand-casual",
      name: "Ravi Kumar",
      city: "Hyderabad",
      location: { lat: 17.4401, lng: 78.3489 },
      skills: [
        { category: "backend", skill: "Node.js", proficiency: 3 },
      ],
      goals: "learn",
      intensity: "casual",
      availability: "offline_city",
      reliabilityScore: 75,
      pastHackathonsCount: 0,
      isVerified: false,
    };

    const result = scoreCandidate(baseUser, candidateCasual, contextOfflineHyd);
    // Goal & intensity subscore will be heavily penalized
    expect(result.breakdown.goalAlignment).toBeLessThanOrEqual(8);
  });

  it("applies first-timer fairness bonus so high-skill newcomers are not buried", () => {
    const firstTimer: MatchCandidateProfile = {
      id: "cand-first-timer",
      name: "Pooja V",
      city: "Hyderabad",
      skills: [
        { category: "backend", skill: "Go", proficiency: 4 },
        { category: "ml_ai", skill: "PyTorch", proficiency: 4 },
      ],
      goals: "win",
      intensity: "grind",
      availability: "offline_city",
      reliabilityScore: 85,
      pastHackathonsCount: 0, // First time!
      isVerified: true,
    };

    const result = scoreCandidate(baseUser, firstTimer, contextOfflineHyd);
    expect(result.breakdown.fairnessBonus).toBe(5);
    expect(result.reasons.some((r) => r.includes("Rising Builder"))).toBe(true);
  });

  it("handles online hackathons without penalizing distant locations", () => {
    const contextOnline: MatchContext = {
      hackathonId: "h-online-devpost",
      hackathonMode: "online",
      targetSkillsNeeded: ["backend"],
    };

    const candidateDistant: MatchCandidateProfile = {
      id: "cand-delhi",
      name: "Aman Gupta",
      city: "Delhi NCR",
      location: { lat: 28.6139, lng: 77.2090 }, // ~1500 km away
      skills: [
        { category: "backend", skill: "Rust", proficiency: 5 },
      ],
      goals: "win",
      intensity: "grind",
      availability: "online_only",
      reliabilityScore: 90,
      pastHackathonsCount: 2,
      isVerified: true,
    };

    const result = scoreCandidate(baseUser, candidateDistant, contextOnline);
    // Location proximity should give full 15 points for online mode
    expect(result.breakdown.locationProximity).toBe(15);
  });
});
