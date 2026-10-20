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

---

## Phase 3 Pipeline (Implementation)

The scorer above is the single source of truth for ranking. Phase 3 wires it to
real data, adds the eligibility gates, and exposes the result over HTTP.

### 1. Candidate Generation

`src/lib/matching/candidateGenerator.ts` is a pure module (no I/O, fully unit tested):

| Function | Responsibility |
|---|---|
| `toMatchCandidate(row)` | Maps a `profiles` row (+ joined skills) into `MatchCandidateProfile`. |
| `toPublicProfile(row)` | Builds the projection returned to other users. **Exact coordinates are stripped server-side.** |
| `selectEligibleCandidates(rows, viewerId, options)` | Applies every hard gate. |
| `buildMatchFeed(viewerRow, candidates, context)` | Scores, sorts by score, and caps the result set. |
| `relationName` / `relationRecord` | Normalize PostgREST embedded relations (object or array). |

`src/lib/matching/location.ts` parses the PostGIS `geography` column from any
of the shapes PostgREST returns (GeoJSON, little/big-endian WKB hex, explicit
lat/lng) so distance bands work regardless of server version.

### 2. Eligibility Gates

Applied in order by `selectEligibleCandidates`:

1. **Self** — a builder is never their own match.
2. **Banned** — `is_banned = true` never enters the pool.
3. **Opt-out** — `matching_enabled = false` (unless explicitly included).
4. **Onboarding** — `is_onboarded = true`.
5. **Completeness floor** — `completeness_score >= 80` (config: `APP_CONFIG.minProfileCompleteness`).
6. **Blocks** — anyone the viewer blocked, or who blocked the viewer.
7. **Existing connections** — builders already connected through a match request.

### 3. Serving the feed

| Endpoint | Method | Behaviour |
|---|---|---|
| `/api/matches` | GET | Authenticated feed for the viewer. `403` with an explanation while the completeness gate is closed, `200` with the ranked feed otherwise. The feed is computed from the live pool only — there is no sample pool behind it. |
| `/api/matching/precompute` | POST | Cron job (`Bearer $CRON_SECRET`). Scores every eligible pair for every published hackathon and upserts into `match_candidates` (`user_id`, `candidate_id`, `hackathon_id`, `score`, `breakdown`, `reasons`). Offline events are city-scoped, online events are not. |
| `/api/match-requests` | GET/POST/PATCH | Persists the mutual-accept shield. On accept the 1:1 conversation is created and both parties are queued a notification. |

### 4. Notifications

| Endpoint | Method | Behaviour |
|---|---|---|
| `/api/notifications/subscribe` | POST/DELETE | Stores the browser Web Push subscription (`push_subscriptions`). |
| `/api/notifications/push` | POST | Cron job (`Bearer $CRON_SECRET`). Delivers queued `notifications` rows through Web Push, marks them `push_sent_at`, and deletes subscriptions the browser dropped (`404`/`410`). |

VAPID keys (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) are read
server-side only. When they are missing the sender degrades to a no-op instead
of failing the job.

### 5. Privacy Invariants

- Exact GPS never leaves the server: `toPublicProfile` returns `location: undefined`.
- The UI only ever shows coarse distance bands (`Within 5 km`, `Same metro area`).
- Blocked and banned builders are excluded before scoring, not after.
- `looking_for_skills` (the roles a builder is recruiting for) is read on the
  server and only used to weight matching, never shown verbatim to other users.
