# Hackpact Architecture Specification

## Overview

**Hackpact** (`Saathi`) is a full-stack platform built for competitive, dedicated student technologists seeking teammates for external hackathons. The architecture is designed for low latency, zero-user cold-start resilience, explainable algorithmic matching, and strict security and privacy standards.

```
+-----------------------------------------------------------------------------------------+
|                                      CLIENT TIER                                        |
|   Next.js 14 App Router (React 18, Strict TypeScript, Tailwind CSS, Framer Motion)     |
|   - Mobile-First Responsive PWA Shell                                                   |
|   - Strict 3-Color Visual System (#B8F2C9, #0A0A0A, #FFFFFF)                            |
|   - Service Worker (Push Notifications, Offline Fallback Shell)                         |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
|                                    APPLICATION TIER                                     |
|   Edge / Serverless Node.js Route Handlers & Server Actions                             |
|                                                                                         |
|   [Middleware Layer]                                                                    |
|   - Strict CSP, HSTS, Secure Cookie Session Validation, Rate Limiter                    |
|                                                                                         |
|   [Service Layer]                                                                       |
|   - ProfileService           - HackathonService         - TeamService                   |
|   - MatchingEngine           - ChatService              - VerificationService           |
|   - WaitlistService          - SpinEngine               - AdminConciergeService         |
+-----------------------------------------------------------------------------------------+
               |                                            |
               v                                            v
+-----------------------------+              +-----------------------------+
|        REDIS TIER           |              |       DATA & AUTH TIER      |
|   Upstash Redis & QStash    |              |   Supabase Postgres 16      |
|   - Rate Limiting           |              |   - PostGIS (Geo Queries)   |
|   - Matching Cache          |              |   - Row Level Security (RLS)|
|   - Background Queue Jobs   |              |   - Supabase Auth (OAuth)   |
|   - Graceful Fallback       |              |   - Supabase Realtime (WS)  |
|                             |              |   - Supabase Storage (S3)   |
+-----------------------------+              +-----------------------------+
```

## Directory Structure

```
d:/Saathi
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI Pipeline: Lint, Typecheck, Test, Build
├── docs/
│   ├── architecture.md            # System architecture and diagrams
│   ├── matching-algorithm.md      # Mathematical scorer and fairness specifications
│   ├── security-model.md          # RLS, privacy, DPDP Act compliance
│   ├── runbook.md                 # Ops, backup, disaster recovery, concierge tools
│   └── decisions.md               # Architecture decision records
├── public/
│   ├── icons/                     # PWA icons and web app manifest
│   └── manifest.json
├── src/
│   ├── app/
│   │   ├── (auth)/                # Auth flows (login, callback, verify-email)
│   │   ├── (dashboard)/           # Protected user & match surfaces
│   │   │   ├── onboarding/        # Mandatory profile setup (completeness >= 80%)
│   │   │   ├── profile/           # User profile editor & showcase
│   │   │   ├── hackathons/        # Directory & "I'm going" details
│   │   │   ├── teams/             # Team creation, slot management, locking
│   │   │   ├── matches/           # Suggestions with "Why you match" cards
│   │   │   ├── chat/              # 1:1 mutual-accept realtime chat
│   │   │   ├── spin/              # Lucky Mystery Teammate spin wheel
│   │   │   ├── hall-of-fame/      # Winning teams and shareable victory cards
│   │   │   ├── waitlist/          # City progress bars and referral share
│   │   │   └── admin/             # Concierge match, verification queue, metrics
│   │   ├── (legal)/               # India DPDP, Terms, Privacy Policy
│   │   ├── api/                   # REST endpoints, health check, cron jobs
│   │   ├── design/                # Living design system token style guide
│   │   ├── layout.tsx             # Root layout with responsive bottom navigation
│   │   └── page.tsx               # Landing page with cold start city banners
│   ├── components/
│   │   ├── ui/                    # Base primitives styled to 3-color palette
│   │   ├── navigation/            # Top Navbar, Mobile BottomNav, Breadcrumbs
│   │   ├── cards/                 # HackathonCard, MatchCard, TeamSlotCard
│   │   ├── forms/                 # Zod-validated forms with explicit error boxes
│   │   ├── chat/                  # Realtime message bubbles, typing indicators
│   │   └── spin/                  # Framer Motion animated wheel and modal
│   ├── config/
│   │   └── site.ts                # Single Saathi config constant
│   ├── lib/
│   │   ├── supabase/              # Typed client, server SSR, admin client
│   │   ├── redis/                 # Rate limiter and cache helpers
│   │   ├── matching/              # Rule-based scorer, candidate generator, tests
│   │   ├── services/              # Pure domain services (no React dependencies)
│   │   ├── validations/           # Zod schemas for forms and API payloads
│   │   └── utils/                 # Formatting, geo distance, cn helper
│   ├── types/
│   │   ├── database.ts            # Generated/typed Supabase database schema
│   │   └── models.ts              # Domain entities
│   └── styles/
│       └── globals.css            # Strict 3-color CSS variables
├── supabase/
│   └── migrations/                # SQL DDL with PostGIS and strict RLS
└── tests/
    ├── unit/                      # Vitest unit tests (Scorer, Completeness, etc.)
    ├── e2e/                       # Playwright tests for critical user flows
    └── load/                      # k6 load testing script
```
