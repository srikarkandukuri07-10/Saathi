# Hackpact Matching Algorithm & Fairness Specification

## Scoring Philosophy

Unlike casual chat groups where teaming up is disorganized and full of flaking, Hackpact's matching engine treats hackathon team formation as an optimization problem:
1. **Complementarity over Similarity:** Two pure backend engineers struggle without design or frontend; a diverse stack produces working demos.
2. **Commitment Alignment:** Mixing a "here to win / 24h grind" competitor with a "casual learner" causes resentment and ghosting.
3. **No Cold-Start Bias Against First-Timers:** Experienced hackers should not monopolize matching; first-timers with high skill ratings must be surfaced.
4. **Explainability:** Users are shown concrete, readable reasons ("Complementary Skills", "Shared Goal: Full Grind", "Same City: Hyderabad") to foster confidence before sending a request.

---

## Mathematical Formulation

Let candidate $B$ be evaluated for candidate or team slot $A$ in context $C$:

$$\text{FinalScore}(A, B, C) = w_s \cdot S_{\text{skill}} + w_g \cdot S_{\text{goal}} + w_p \cdot S_{\text{proximity}} + w_a \cdot S_{\text{avail}} + w_r \cdot S_{\text{reliability}} + B_{\text{fairness}}$$

### Weights Breakdown
- **$w_s = 0.40$ (Skill Complementarity):** Gaps in candidate $A$'s team or personal tech stack compared to candidate $B$'s primary proficiencies.
- **$w_g = 0.20$ (Goal & Intensity Alignment):** Match between intent ("Here to win", "Here to learn", "Balanced") and intensity ("Casual", "Serious", "Full 24h Grind").
- **$w_p = 0.15$ (Location Proximity):** For offline hackathons, PostGIS geodesic distance:
  - $\le 25\text{ km} \implies 1.0$
  - $\le 75\text{ km} \implies 0.75$
  - $\le 250\text{ km} \implies 0.40$
  - Remote / Online hackathon $\implies 1.0$ regardless of distance.
- **$w_a = 0.10$ (Availability & Travel Willingness):** Matching modes (online-only vs. willing to travel).
- **$w_r = 0.15$ (Reliability & Trust Boost):** Scaled from 0 to 1 based on verified GitHub activity, peer reviews, completed locks, and low ghost reports.
- **$B_{\text{fairness}} = \pm 0.05$ (Experience Diversity Bonus):** If candidate $B$ is a first-time participant with high profile completeness and verified skills, a diversity boost is injected so they are mixed into the top 5 match suggestions.

---

## Clean Interface Contract

```typescript
export interface CandidateProfile {
  id: string;
  name: string;
  city: string;
  location?: { lat: number; lng: number };
  skills: Array<{ category: string; skill: string; proficiency: number }>;
  goals: "win" | "learn" | "balanced";
  intensity: "casual" | "serious" | "grind";
  availability: "online_only" | "offline_city" | "willing_to_travel";
  reliabilityScore: number;
  pastHackathonsCount: number;
  isVerified: boolean;
}

export interface MatchContext {
  hackathonId: string;
  hackathonMode: "online" | "offline" | "hybrid";
  hackathonCity?: string;
  targetSkillsNeeded: string[]; // Missing roles in team
  preferredIntensity?: "casual" | "serious" | "grind";
}

export interface MatchScoreResult {
  score: number; // 0 - 100
  breakdown: {
    skillComplementarity: number;
    goalAlignment: number;
    locationProximity: number;
    availability: number;
    trustBoost: number;
    fairnessBonus: number;
  };
  reasons: string[]; // Plain-language compatibility bullets
}

export function scoreCandidate(
  user: CandidateProfile,
  candidate: CandidateProfile,
  context: MatchContext
): MatchScoreResult;
```
