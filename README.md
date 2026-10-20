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

## 💻 Quickstart

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
│   │   ├── api/               # Health endpoint, data export, account delete
│   │   └── design/            # Living 3-color style guide
│   ├── components/            # UI components (Button, Card, Input, Progress, Alert)
│   ├── config/site.ts         # Single Saathi product configuration constant
│   ├── lib/
│   │   ├── matching/          # Scorer, candidate generator, fairness logic
│   │   ├── services/          # Pure domain services (Profile, Team, Hackathon, Chat)
│   │   └── supabase/          # Client, SSR Server, and Admin Service Role clients
│   └── types/models.ts        # Complete domain interfaces
├── supabase/migrations/       # Postgres DDL migrations with PostGIS and strict RLS
└── tests/
    ├── unit/                  # Vitest unit tests (Scorer, Completeness, Privacy)
    ├── e2e/                   # Playwright critical path end-to-end tests
    └── load/                  # k6 load test script (1,000 concurrent users)
```

---

## ⚖️ License & Compliance

Complies with India's **Digital Personal Data Protection Act, 2023**.
Grievance Officer: `grievance@hackpact.dev`.
&copy; 2026 Hackpact (`Saathi`). Built with passion for serious student builders.
