# Security, Privacy & Compliance Model

## 1. Threat Model & Protections

### 1.1 Mutual Consent Communication
- **Risk:** Unsolicited harassment, stalking, and spamming in direct messages.
- **Defense:** Direct messaging channels can **only** be initialized via mutual match acceptance. Messages cannot be dispatched unless both `sender_id` and `recipient_id` possess an accepted `match_requests` row.

### 1.2 Geolocation Obfuscation
- **Risk:** Stalking through precise coordinate revelation.
- **Defense:** Precise GPS coordinates (`latitude`, `longitude`, PostGIS `GEOGRAPHY(Point, 4326)`) are stored in restricted columns accessible strictly by server-side matching jobs. Client-facing API responses output only coarse city/area and relative distance bands (e.g., "Within 15 km", "Same city").

### 1.3 Row Level Security (RLS)
- Supabase Postgres enforces RLS on **every** table.
- Policies ensure:
  - Users can read public profiles and verified badges, but cannot modify another user's profile.
  - Chat messages are readable strictly by conversation participants.
  - Reports, bans, and concierge match tools are accessible solely by authenticated users with role `'admin'`.

### 1.4 Rate Limiting & Abuse Prevention
- Upstash Redis token bucket rate limiting on:
  - Login / Auth endpoints: 5 attempts per 10 minutes.
  - Match requests: 10 requests per day per user (discourages spam swipe behavior).
  - Direct chat messages: 30 messages per minute.
  - File / Certificate uploads: 5 uploads per hour with MIME-type and magic byte validation.

---

## 2. India Digital Personal Data Protection (DPDP) Act Compliance

Hackpact adheres to the foundational requirements of India's DPDP Act:
1. **Explicit Notice & Consent:** Users provide explicit granular consent on onboarding for:
   - Profile indexing for team matching.
   - City and proximity calculations for offline hackathons.
   - Communication of match notifications via email/push.
2. **Age Gate:** Explicit declaration that user is 18 years of age or older, or has guardian consent.
3. **Right to Access & Data Portability:** Self-service `/api/user/export-data` endpoint provides a downloadable JSON archive containing all stored profile data, past hackathons, reviews, and chat history.
4. **Right to Erasure / Account Deletion:** Immediate soft-delete with permanent purge within 30 days via `/api/user/delete-account`.
5. **Grievance Redressal:** Contact information for the designated Grievance Officer is published on the public legal pages.
