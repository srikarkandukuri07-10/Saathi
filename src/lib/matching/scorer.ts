import type { Profile, Skill } from "@/types/models";

export interface MatchCandidateProfile {
  id: string;
  name: string;
  city: string;
  location?: { lat: number; lng: number };
  skills: Array<{ category: string; skill: string; proficiency: number; isPrimary?: boolean }>;
  goals: "win" | "learn" | "balanced";
  intensity: "casual" | "serious" | "grind";
  availability: "online_only" | "offline_city" | "willing_to_travel";
  travelCities?: string[];
  reliabilityScore: number;
  pastHackathonsCount: number;
  isVerified: boolean;
  githubReposCount?: number;
}

export interface MatchContext {
  hackathonId: string;
  hackathonMode: "online" | "offline" | "hybrid";
  hackathonCity?: string;
  targetSkillsNeeded?: string[]; // Missing skill categories in team
  preferredIntensity?: "casual" | "serious" | "grind";
}

export interface MatchScoreResult {
  score: number; // 0 to 100
  breakdown: {
    skillComplementarity: number; // 0 - 40
    goalAlignment: number;        // 0 - 20
    locationProximity: number;    // 0 - 15
    availability: number;         // 0 - 10
    trustBoost: number;           // 0 - 15
    fairnessBonus: number;        // -5 to +5
  };
  reasons: string[]; // Plain-language compatibility bullets for the UI card
}

/**
 * Calculates geodesic distance between two coordinate pairs in kilometers (Haversine formula)
 */
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Transparent, explainable rule-based candidate compatibility scorer.
 * Encapsulated behind a clean interface so ML ranking models can easily be plugged in.
 */
export function scoreCandidate(
  user: MatchCandidateProfile,
  candidate: MatchCandidateProfile,
  context: MatchContext
): MatchScoreResult {
  const reasons: string[] = [];

  // ----------------------------------------------------------------------------
  // 1. SKILL COMPLEMENTARITY (40% Weight - Max 40 points)
  // ----------------------------------------------------------------------------
  let skillScore = 0;
  const userCategories = new Set(user.skills.map((s) => s.category.toLowerCase()));
  const candidateCategories = new Set(candidate.skills.map((s) => s.category.toLowerCase()));

  // Find complementary skills candidate has that user lacks
  const complementaryCategories = candidate.skills.filter(
    (cs) => !userCategories.has(cs.category.toLowerCase()) && cs.proficiency >= 3
  );

  // Check if candidate matches any explicitly requested team open slots
  const neededTargetSkills = context.targetSkillsNeeded || [];
  const matchesTargetRole = candidate.skills.filter((cs) =>
    neededTargetSkills.some(
      (ts) => ts.toLowerCase() === cs.category.toLowerCase() || ts.toLowerCase() === cs.skill.toLowerCase()
    )
  );

  if (matchesTargetRole.length > 0) {
    skillScore += 25;
    reasons.push(
      `Fills Open Role Slot: Proficient in requested ${matchesTargetRole[0].skill} (${matchesTargetRole[0].proficiency}/5)`
    );
  }

  if (complementaryCategories.length > 0) {
    const topComp = complementaryCategories[0];
    skillScore += Math.min(25, complementaryCategories.length * 10 + topComp.proficiency * 2);
    reasons.push(
      `Complementary Stack: ${candidate.name} brings ${topComp.skill} (${topComp.category}) to balance your profile`
    );
  } else {
    // If exact same categories, score based on proficiency synergy
    skillScore += 12;
    reasons.push(`Shared Technical Depth: Strong mutual coverage in ${candidate.skills[0]?.skill || "core tech"}`);
  }

  const finalSkillScore = Math.min(40, skillScore);

  // ----------------------------------------------------------------------------
  // 2. GOAL & INTENSITY ALIGNMENT (20% Weight - Max 20 points)
  // ----------------------------------------------------------------------------
  let goalScore = 0;

  // Goals (Win vs Learn vs Balanced)
  if (user.goals === candidate.goals) {
    goalScore += 10;
    if (user.goals === "win") reasons.push('Shared Competitive Drive: Both marked "Here to Win"');
    else if (user.goals === "learn") reasons.push('Shared Learning Focus: Both marked "Here to Learn"');
    else reasons.push("Balanced Mindset: Both value both winning and learning");
  } else if (
    (user.goals === "balanced" && candidate.goals === "win") ||
    (user.goals === "win" && candidate.goals === "balanced")
  ) {
    goalScore += 7;
    reasons.push("Compatible Goals: High overlap between winning and balanced execution");
  } else {
    goalScore += 3;
  }

  // Intensity (Casual vs Serious vs Grind)
  if (user.intensity === candidate.intensity) {
    goalScore += 10;
    if (user.intensity === "grind") reasons.push("24h Grind Squad: Both committed to an all-night hackathon sprint");
    else reasons.push(`Synchronized Intensity: Both plan for ${user.intensity} commitment`);
  } else if (
    (user.intensity === "serious" && candidate.intensity === "grind") ||
    (user.intensity === "grind" && candidate.intensity === "serious")
  ) {
    goalScore += 7;
  } else {
    goalScore += 2; // Noticeable penalty for casual vs 24h grind mismatch
  }

  const finalGoalScore = Math.min(20, goalScore);

  // ----------------------------------------------------------------------------
  // 3. LOCATION PROXIMITY (15% Weight - Max 15 points)
  // ----------------------------------------------------------------------------
  let proximityScore = 15; // default full points for online

  if (context.hackathonMode === "offline" || context.hackathonMode === "hybrid") {
    if (user.location && candidate.location) {
      const distKm = calculateHaversineKm(
        user.location.lat,
        user.location.lng,
        candidate.location.lat,
        candidate.location.lng
      );

      if (distKm <= 15) {
        proximityScore = 15;
        reasons.push("Immediate Proximity: Located within ~15 km for fast offline meetups");
      } else if (distKm <= 40) {
        proximityScore = 12;
        reasons.push(`Same Metro Area: Located in ${candidate.city}`);
      } else if (distKm <= 150) {
        proximityScore = 8;
      } else {
        proximityScore = candidate.availability === "willing_to_travel" ? 7 : 3;
      }
    } else if (user.city.toLowerCase() === candidate.city.toLowerCase()) {
      proximityScore = 14;
      reasons.push(`Same City: Both based in ${candidate.city}`);
    } else {
      proximityScore = candidate.availability === "willing_to_travel" ? 7 : 3;
    }
  }

  const finalProximityScore = Math.min(15, proximityScore);

  // ----------------------------------------------------------------------------
  // 4. AVAILABILITY & TRAVEL (10% Weight - Max 10 points)
  // ----------------------------------------------------------------------------
  let availScore = 5;
  if (user.availability === candidate.availability) {
    availScore = 10;
  } else if (
    candidate.availability === "willing_to_travel" ||
    user.availability === "willing_to_travel"
  ) {
    availScore = 9;
    reasons.push("Flexible Attendance: Willing to travel for finals if shortlisted");
  } else {
    availScore = 6;
  }

  const finalAvailScore = Math.min(10, availScore);

  // ----------------------------------------------------------------------------
  // 5. RELIABILITY & TRUST BOOST (15% Weight - Max 15 points)
  // ----------------------------------------------------------------------------
  // Reliability score is 0 to 100 (Default 85)
  const normalizedReliability = Math.max(0, Math.min(100, candidate.reliabilityScore)) / 100;
  let trustScore = normalizedReliability * 11; // up to 11 points

  if (candidate.isVerified) {
    trustScore += 2;
  }
  if (candidate.githubReposCount && candidate.githubReposCount >= 10) {
    trustScore += 2;
    reasons.push(`GitHub Proven: ${candidate.githubReposCount}+ active public repositories`);
  }

  if (candidate.reliabilityScore >= 90) {
    reasons.push(`High Reliability: ${candidate.reliabilityScore}/100 peer trust rating with 0 no-shows`);
  }

  const finalTrustScore = Math.min(15, Math.round(trustScore));

  // ----------------------------------------------------------------------------
  // 6. FAIRNESS & FIRST-TIMER DIVERSITY BONUS (-5 to +5 points)
  // ----------------------------------------------------------------------------
  let fairnessBonus = 0;
  // If candidate is a first-time participant (pastHackathonsCount === 0) but has high skills,
  // award a fairness boost so newcomers are not buried beneath multi-time winners
  if (candidate.pastHackathonsCount === 0 && candidate.skills.length >= 2) {
    fairnessBonus = 5;
    reasons.push("Rising Builder: High technical skill index with fresh hackathon perspective");
  } else if (candidate.pastHackathonsCount >= 2) {
    fairnessBonus = 3;
    reasons.push(`Battle Tested: Competed in ${candidate.pastHackathonsCount}+ prior hackathons`);
  }

  // Calculate raw aggregate
  const rawTotal =
    finalSkillScore +
    finalGoalScore +
    finalProximityScore +
    finalAvailScore +
    finalTrustScore +
    fairnessBonus;

  const totalScore = Math.min(100, Math.max(10, Math.round(rawTotal)));

  return {
    score: totalScore,
    breakdown: {
      skillComplementarity: finalSkillScore,
      goalAlignment: finalGoalScore,
      locationProximity: finalProximityScore,
      availability: finalAvailScore,
      trustBoost: finalTrustScore,
      fairnessBonus,
    },
    reasons,
  };
}
