# Technical & Product Architectural Decisions

This document tracks all key decisions, architectural trade-offs, and rationale made during the development of **Hackpact** (Code name: **Saathi**).

---

### Decision 1: Single Config Constant for Product Renaming
- **Context:** The working name is "Hackpact", but the code name / brand configuration must be cleanly renameable.
- **Decision:** All references to brand name, taglines, thresholds, and cold-start city settings are imported from `src/config/site.ts` through the `Saathi` export (aliased as `APP_CONFIG`).
- **Rationale:** Ensures rebranding only requires editing a single line in a configuration file with zero regressions across the codebase.

---

### Decision 2: Strict 3-Color Visual System
- **Context:** Design rule mandates exactly three colors: Light Green (`#B8F2C9`), Black (`#0A0A0A`), and White (`#FFFFFF`). Zero other hues (no red error text, no blue links).
- **Decision:**
  - CSS custom properties `--green`, `--black`, `--white` control the entire color space.
  - Tints and shades are strictly opacity variants of these 3 base colors (`rgba(10,10,10,0.6)` for secondary copy, `rgba(10,10,10,0.08)` for borders, `rgba(184,242,201,0.2)` for subtle highlights).
  - States (Error, Success, Warning) are communicated through bold black borders, prominent geometric icons (e.g. checkmarks, alert octagons), and precise semantic copy rather than color changes.
  - Dark mode is omitted as dark mode would require introducing inverted hues that conflict with the strict 3-color palette.
- **Rationale:** Delivers an ultra-distinctive, memorable, high-fashion aesthetic akin to brutalist minimalism (Linear/Notion inspired) and meets WCAG AA contrast.

---

### Decision 3: Service Layer Architecture
- **Context:** Business logic must not reside directly in React components.
- **Decision:** Every domain capability (`profiles`, `hackathons`, `teams`, `matching`, `chat`, `verification`, `waitlist`) is implemented inside `src/lib/services/` with typed inputs/outputs and Zod validation. Next.js server actions and route handlers act strictly as thin controllers.
- **Rationale:** Enables thorough unit and integration testing without mocking React hooks, keeps API handlers lightweight, and allows background workers to reuse the exact same services.

---

### Decision 4: Rule-based Transparent Scorer with Clean Interface
- **Context:** The matching engine must prioritize skill complementarity, goal/intensity alignment, location proximity (PostGIS), and soft reliability boosts, while avoiding penalizing high-potential first-timers.
- **Decision:**
  - Interface `scoreCandidate(a: Profile, b: Profile, context: MatchContext): MatchScoreResult`.
  - Computes sub-scores: `skillComplementarity` (40%), `goalAlignment` (20%), `proximity` (15%), `availability` (10%), and `trustBoost` (15%).
  - Provides a deterministic `reasons: string[]` breakdown to populate the "Why you match" compatibility card.
  - First-timer friendliness rule: Adds an experience-mix booster ensuring first-timers are distributed throughout top suggestions rather than buried.
- **Rationale:** Explainable matching creates user trust; clean encapsulation permits drop-in replacement with an embedding/ML-based model as user volume scales.

---

### Decision 5: Cold Start Strategy & PostGIS Geo Queries
- **Context:** Zero users on launch day. Empty apps feel dead.
- **Decision:**
  - Focus launch on **Hyderabad** first.
  - Live hackathon directory is pre-seeded with external events (e.g., Smart India Hackathon, EthIndia, Hacktoberfest events, Google Solution Challenge, Devpost/Devfolio hackathons) so visitors get immediate utility without other users.
  - City waitlist with interactive progress bar (`Matching opens at 50 members`) incentivizes viral sharing with referral codes.
  - Proximity calculations utilize PostGIS `ST_DWithin` and distance sorting, with server-side coarse distance bands to protect precise user privacy.

---

### Decision 6: Mutual Accept Chat & Anti-Ghosting Lock
- **Context:** Unsolicited spam, harassment, and team ghosting ruin hackathon matching.
- **Decision:**
  - Match requests require a concise note.
  - Direct 1:1 chat opens **only** when both parties mutually accept.
  - Before an external hackathon deadline, the team lead initiates a "Lock Team" action where all members must explicitly click "Confirm Commitment".
  - Successfully locking and completing a team awards +10 reliability points; unconfirmed dropouts or reported no-shows incur reliability penalties.
