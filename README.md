# Hackpact (`Saathi`)

> **Find serious, dedicated teammates for EXTERNAL hackathons.**
> Cold-start launch: **Hyderabad Chapter Active**.
> Built with a strict **3-Color Design System**: Light Green (`#B8F2C9`), Black (`#0A0A0A`), and White (`#FFFFFF`).

[![CI Pipeline](https://github.com/hackpact/saathi/actions/workflows/ci.yml/badge.svg)](https://github.com/hackpact/saathi/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-0A0A0A?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-0A0A0A?style=flat&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3_Color_Palette-B8F2C9?style=flat&logo=tailwindcss&labelColor=0A0A0A)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostGIS_&_RLS-0A0A0A?style=flat&logo=supabase)](https://supabase.com/)

---

## 💡 The Core Problem

Collegiate hackathon team formation today is fragmented across uncurated Discord and WhatsApp groups. It is filled with ghosting, mismatched ambition (casual participants paired with competitors aiming for 1st place), and zero quality signals.

**Hackpact** changes this by matching students for major **external hackathons** (e.g., Smart India Hackathon, EthIndia, HackHyderabad, Google Solution Challenge) using:
- **Skill Complementarity:** Algorithms prioritize filling missing technical roles in a squad rather than clustering identical proficiencies.
- **Commitment & Goal Alignment:** Separates 24h grind competitors from casual learners before pairing.
- **Mutual Accept Shield:** Direct 1:1 chat opens strictly after both parties confirm interest.
- **Anti-Ghosting Team Lock:** Squad members explicitly confirm locked commitment prior to deadlines, directly boosting their peer reliability score (0-100).
- **Location Proximity with Privacy:** PostGIS distance bands for offline hackathons with exact coordinates hidden server-side.

---

## 🎨 Strict 3-Color Design System (Non-Negotiable)

The entire user interface adheres to strictly **three colors**:
1. **Light Green (`#B8F2C9`, `--green`):** Action buttons, highlight states, active badges, completeness meters, progress bars.
2. **Black (`#0A0A0A`, `--black`):** Typography, high-contrast borders, solid shadows, dominant outlines.
3. **White (`#FFFFFF`, `--white`):** Background and clean card surfaces (~70% of UI).

> **Zero other hues:** No red errors, no blue links, no gradient fills. Errors and warnings are communicated using bold 2px black borders, geometric status iconography, and explicit copy.
> Visit `/design` in the app for the living interactive component style guide.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| **Mandatory Full Profile** | Gated until $\ge 80\%$ completeness. Structured skill picker (1-5), verified GitHub stats, college details, and goals. |
| **External Hackathons Directory** | Seeded directory with external events, registration deadlines, and "I'm Going" participant tracking. |
| **Algorithmic Matching Engine** | Transparent rule-based scorer evaluating complementarity (40%), goals (20%), proximity (15%), availability (10%), and trust boost (15%) with first-timer fairness. |
| **"Why You Match" Cards** | Plain-language explanations detailing why two candidates complement each other. |
| **Lucky Spin ("Mystery Teammate")** | Opt-in animated spin wheel that randomly matches a compatible attendee meeting $\ge 80\%$ compatibility. |
| **Mutual-Accept Realtime Chat** | 1:1 messaging unlocking only after mutual consent, complete with typing indicators, and safety report/block actions. |
| **Anti-Ghosting Team Lock** | Squad confirmation step locking the roster and awarding +10 reliability points. |
| **Hyderabad Cold-Start Waitlist** | Progress bar (`23/50 Joined`), viral referral links (`HYD-NAME-XXX`), and Founding Member badges. |
| **Superadmin Concierge Tools** | Manual matcher tool to introduce the first 50 users, verification queue for certificates/proof links, and CSV hackathon bulk importer. |
| **India DPDP Act Compliance** | Explicit consent, age gate, self-service JSON data export, account deletion, and Grievance Officer details. |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router, Server Components, Strict TypeScript)
- **Styling:** Tailwind CSS + Radix UI primitives restyled to 3-color palette + Framer Motion
- **Database & Auth:** Supabase Postgres 16 with PostGIS geography extensions and strict Row Level Security (RLS) on all 27 tables
- **Cache & Rate Limiting:** Upstash Redis token bucket
- **Testing:** Vitest (unit tests for scorer and completeness), Playwright (E2E critical flows), k6 (1,000 VU load test)
- **Deployment:** Vercel (Edge/Serverless) + Cloudflare (DNS/WAF/Caching)

---

## 🧩 Phase Status

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation: Next.js shell, Tailwind tokens, 3-color UI primitives, `/design` style guide | Done |
| 2 | Data & auth: Postgres/PostGIS schema, strict RLS, OAuth login, gated onboarding | Done |
| 3 | **Matching engine & notifications**: candidate generation, eligibility gates, precompute job, match-request API, Web Push delivery | Done |
| 4 | Teams, chat, Lucky Spin, Hall of Fame, waitlist, admin concierge | Surfaces in place, backend wiring continues |
| 5 | Launch hardening: load tests, deployment runbook, PWA polish | In progress |

### Phase 3 — Matching Pipeline

- `src/lib/matching/scorer.ts` — the explainable, unit-tested scorer (complementarity 40%, goals 20%, proximity 15%, availability 10%, trust 15%, fairness ±5%).
- `src/lib/matching/candidateGenerator.ts` — pure candidate generation and the hard eligibility gates (self, banned, opt-out, onboarding, 80% completeness floor, blocks, existing connections).
- `src/lib/matching/location.ts` — PostGIS `geography` parsing (GeoJSON, WKB hex, lat/lng) for server-only distance bands.
- `src/lib/matching/feed.ts` — database-backed feed with a labelled sample-chapter fallback for cold start.
- `src/app/api/matches` — authenticated feed (`403` while the completeness gate is closed).
- `src/app/api/matching/precompute` — cron job that scores every eligible pair per published hackathon.
- `src/app/api/match-requests` — persisted mutual-accept shield; accepting unlocks the 1:1 conversation.
- `src/app/api/notifications/push` — Web Push delivery for queued notifications (VAPID, service-role only).

Exact GPS coordinates never leave the server: candidates are projected through
`toPublicProfile`, which strips the `location` field, and the UI only shows
coarse distance bands.

---

### 1. Clone & Install
```bash
git clone https://github.com/hackpact/saathi.git
cd saathi
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```
*(Default development mock fallbacks are pre-configured so the app runs out of the box).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page and explore `/design` for the living design system.

### 4. Execute Test Suite
```bash
# Run unit tests
npm run test

# TypeScript typecheck
npm run typecheck

# Lint check
npm run lint

# Production build test
npm run build
```

---

## 📁 Repository Structure

```
d:/Saathi
├── docs/
│   ├── architecture.md        # System architecture and data flow diagrams
│   ├── matching-algorithm.md  # Mathematical formulation and weights breakdown
│   ├── security-model.md      # RLS policies, privacy, and India DPDP Act
│   ├── deployment.md          # Vercel, Supabase, Cloudflare production setup
│   ├── runbook.md             # Backups, disaster recovery, concierge matching
│   └── decisions.md           # Architecture Decision Records (ADRs)
├── src/
│   ├── app/
│   │   ├── (auth)/login       # GitHub & Google OAuth login
│   │   ├── (dashboard)/
│   │   │   ├── onboarding     # Gated profile setup (80% gate)
│   │   │   ├── profile        # Profile showcase, projects, past hackathons
│   │   │   ├── hackathons     # External hackathons feed & [slug] details
│   │   │   ├── teams          # Squad workspaces & /new team builder
│   │   │   ├── matches        # Suggestions with "Why you match" cards
│   │   │   ├── chat           # 1:1 mutual-accept realtime chat
│   │   │   ├── spin           # Lucky Spin Mystery Teammate wheel
│   │   │   ├── hall-of-fame   # Winning squads with shareable victory cards
│   │   │   ├── waitlist       # Hyderabad cold-start progress tracker
│   │   │   └── admin          # Concierge matcher, verifications & CSV import
│   │   ├── (legal)/           # DPDP Act, Privacy Policy, Terms of Service
│   │   ├── api/               # Matches feed, match requests, precompute, push, health
│   │   └── design/            # Living 3-color style guide
│   ├── components/            # UI components (Button, Card, Input, Progress, Alert)
│   ├── config/site.ts         # Single Saathi product configuration constant
│   ├── lib/
│   │   ├── data/               # Server-side data access (Supabase, RLS enforced)
│   │   ├── matching/           # Scorer, candidate generator, geo parsing, feed
│   │   ├── notifications/      # Web Push sender (VAPID)
│   │   ├── supabase/           # Client, SSR Server, Admin Service Role clients
│   │   └── utils/              # Formatting, geo distance, CSV parsing, cn helper
│   └── types/models.ts        # Complete domain interfaces
├── supabase/migrations/       # Postgres DDL migrations with PostGIS and strict RLS
└── tests/
    ├── unit/                  # Vitest unit tests (Scorer, Completeness, Candidate Generator)
    ├── e2e/                   # Playwright critical path end-to-end tests
    └── load/                  # k6 load test script (1,000 concurrent users)
```

---

## 🗄️ No Sample Data

The application contains **no mock, sample or fabricated content**. Every
surface reads from Postgres through the caller's session, so Row Level
Security decides what is visible:

- There is no seeded candidate pool, no in-memory conversation store and no
  hardcoded event list. A table that is empty renders an honest empty state.
- The counters on the landing page and the waitlist are live `COUNT` queries.
- Protected routes stay closed without a real session; there is no demo
  identity that unlocks the UI.
- The Supabase clients refuse to start when the credentials are missing
  instead of silently pointing at a placeholder host.

The only rows in the database are the reference data a product needs to
function: **cities**, the **skill catalog** and the **published external
hackathons** (see `supabase/migrations/20261020000003_seed_data.sql`).

---

## 🔌 API Reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | No | Live service status, including a real probe of the database and PostGIS. |
| GET | `/api/stats` | No | Platform counters (hackathons, builders, squads, chapters) counted from the database. |
| GET | `/api/hackathons` | No | The published external hackathon directory with filters. |
| GET/POST | `/api/hackathons/[slug]` | No / Yes | A single event, and toggling "I'm going" for the signed-in user. |
| GET | `/api/skills` | No | The structured skill catalog used by the onboarding picker. |
| GET/POST | `/api/waitlist` | No | Live cold-start progress, and joining a city waitlist. |
| GET | `/api/hall-of-fame` | No | Verified wins recorded by builders. |
| GET | `/api/matches` | Yes | Ranked "Why you match" feed for the viewer. `403` while the 80% completeness gate is closed. |
| GET/POST/PATCH | `/api/match-requests` | Yes | List, send, and answer teammate requests. Accepting unlocks the 1:1 chat. |
| GET/POST | `/api/teams` | Yes | Squads for an event, and creating a squad. |
| POST | `/api/teams/[id]/lock` | Yes | Confirms the commitment and locks the roster when everyone has confirmed. |
| GET | `/api/conversations` | Yes | The signed-in user's mutual-accept conversations. |
| GET/POST | `/api/conversations/[id]/messages` | Yes | Reads and sends messages in a conversation. |
| GET/PATCH | `/api/profile` | Yes | The signed-in user's own profile. |
| GET | `/api/profiles/[id]` | Yes | Another builder's public profile (no exact coordinates). |
| GET/PUT | `/api/profile/skills` | Yes | Reads and replaces the profile skill set. |
| GET/POST | `/api/profile/projects` | Yes | Showcase projects. |
| GET/POST | `/api/profile/past-hackathons` | Yes | Competition history (new entries start as pending). |
| GET/POST | `/api/notifications` | Yes | In-app notifications, and marking them read. |
| POST | `/api/reports` | Yes | Files a safety report. |
| POST | `/api/blocks` | Yes | Blocks a builder. |
| GET/POST/PATCH | `/api/admin` | Admin | Verification queue, reports, moderation, CSV import, concierge introductions. |
| POST | `/api/matching/precompute` | `CRON_SECRET` | Scores every eligible pair per published hackathon. |
| POST | `/api/notifications/push` | `CRON_SECRET` | Delivers queued notifications through Web Push. |
| POST | `/api/profile/sync-github` | Yes | Pulls public GitHub stats into `profiles.github_stats`. |
| GET | `/api/user/export-data` | Yes | DPDP Act data export (JSON) of the caller's own data. |
| DELETE | `/api/user/delete-account` | Yes | DPDP Act right to erasure: personal records removed, profile soft-deleted with a 30 day purge window. |

---

## ⚖️ License & Compliance

Complies with India's **Digital Personal Data Protection Act, 2023**.
Grievance Officer: `grievance@hackpact.dev`.
&copy; 2026 Hackpact (`Saathi`). Built with passion for serious student builders.
