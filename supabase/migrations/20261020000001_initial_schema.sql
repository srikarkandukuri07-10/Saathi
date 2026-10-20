-- ==============================================================================
-- HACKPACT / SAATHI: INITIAL DATABASE SCHEMA
-- Extensions: PostGIS, UUID-OSSP
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'ambassador', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE hackathon_mode AS ENUM ('online', 'offline', 'hybrid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE goal_type AS ENUM ('win', 'learn', 'balanced');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE intensity_level AS ENUM ('casual', 'serious', 'grind');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE availability_mode AS ENUM ('online_only', 'offline_city', 'willing_to_travel');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE match_request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE team_member_status AS ENUM ('invited', 'joined', 'locked', 'left');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE reliability_event_type AS ENUM (
        'team_locked',
        'team_completed',
        'peer_rated_positive',
        'no_show_reported',
        'unresponsive_reported',
        'manual_admin_adjustment'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 1. CITIES (Cold-start and geo tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    location GEOGRAPHY(Point, 4326),
    is_active BOOLEAN NOT NULL DEFAULT false,
    target_members INT NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cities_location ON public.cities USING GIST (location);

-- ------------------------------------------------------------------------------
-- 2. PROFILES (Full mandatory profile)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT,
    college VARCHAR(255),
    year INT CHECK (year BETWEEN 1 AND 5),
    branch VARCHAR(150),
    city_id UUID REFERENCES public.cities(id),
    area VARCHAR(150),
    location GEOGRAPHY(Point, 4326), -- Exact coordinates server-only!
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    goals goal_type NOT NULL DEFAULT 'balanced',
    intensity intensity_level NOT NULL DEFAULT 'serious',
    availability availability_mode NOT NULL DEFAULT 'offline_city',
    travel_cities TEXT[] DEFAULT '{}',
    reliability_score INT NOT NULL DEFAULT 85 CHECK (reliability_score BETWEEN 0 AND 100),
    completeness_score INT NOT NULL DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
    is_onboarded BOOLEAN NOT NULL DEFAULT false,
    is_banned BOOLEAN NOT NULL DEFAULT false,
    github_stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON public.profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_reliability ON public.profiles(reliability_score);
CREATE INDEX IF NOT EXISTS idx_profiles_completeness ON public.profiles(completeness_score);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles USING GIST (location);

-- ------------------------------------------------------------------------------
-- 3. SKILLS & PROFILE SKILLS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- frontend, backend, ml_ai, mobile, hardware_iot, design, product, devops, data, blockchain, pitching
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);

CREATE TABLE IF NOT EXISTS public.profile_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency INT NOT NULL DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_skills_profile ON public.profile_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_skill ON public.profile_skills(skill_id);

-- ------------------------------------------------------------------------------
-- 4. PROJECTS (Showcase)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    tech_stack TEXT[] NOT NULL DEFAULT '{}',
    repo_url TEXT,
    demo_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_profile ON public.projects(profile_id);

-- ------------------------------------------------------------------------------
-- 5. PAST HACKATHONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.past_hackathons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_name VARCHAR(200) NOT NULL,
    year INT NOT NULL,
    result VARCHAR(100) NOT NULL, -- Winner, Runner Up, Finalist, Participant
    team_size INT,
    proof_url TEXT, -- Devpost, Devfolio, Unstop link
    certificate_url TEXT,
    verification_status verification_status NOT NULL DEFAULT 'unverified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_past_hackathons_profile ON public.past_hackathons(profile_id);

-- ------------------------------------------------------------------------------
-- 6. VERIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- github, linkedin, college_email, certificate
    status verification_status NOT NULL DEFAULT 'unverified',
    proof_data JSONB DEFAULT '{}'::jsonb,
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_profile ON public.verifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.verifications(status);

-- ------------------------------------------------------------------------------
-- 7. HACKATHONS (External hackathons directory)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hackathons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    organizer VARCHAR(255) NOT NULL,
    mode hackathon_mode NOT NULL DEFAULT 'offline',
    city_id UUID REFERENCES public.cities(id),
    venue TEXT,
    location GEOGRAPHY(Point, 4326),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ NOT NULL,
    prize_pool VARCHAR(100),
    theme VARCHAR(255),
    description TEXT,
    website_url TEXT NOT NULL,
    min_team_size INT NOT NULL DEFAULT 2,
    max_team_size INT NOT NULL DEFAULT 4,
    logo_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathons_deadline ON public.hackathons(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_hackathons_city ON public.hackathons(city_id);
CREATE INDEX IF NOT EXISTS idx_hackathons_mode ON public.hackathons(mode);
CREATE INDEX IF NOT EXISTS idx_hackathons_location ON public.hackathons USING GIST (location);

-- ------------------------------------------------------------------------------
-- 8. HACKATHON PARTICIPANTS ("I'm going")
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hackathon_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'going', -- going, seeking_team, has_team
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hackathon_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_hp_hackathon ON public.hackathon_participants(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_hp_profile ON public.hackathon_participants(profile_id);

-- ------------------------------------------------------------------------------
-- 9. TEAMS & OPEN SLOTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    github_repo_url TEXT,
    idea_board TEXT,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_hackathon ON public.teams(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_teams_lead ON public.teams(lead_id);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_name VARCHAR(100),
    status team_member_status NOT NULL DEFAULT 'joined',
    confirmed_lock BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_profile ON public.team_members(profile_id);

CREATE TABLE IF NOT EXISTS public.team_open_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL, -- e.g., "Need 1 ML / AI Engineer"
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_filled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_slots_team ON public.team_open_slots(team_id);

-- ------------------------------------------------------------------------------
-- 10. PRECOMPUTED MATCH CANDIDATES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, candidate_id, hackathon_id)
);

CREATE INDEX IF NOT EXISTS idx_match_candidates_user ON public.match_candidates(user_id, hackathon_id);
CREATE INDEX IF NOT EXISTS idx_match_candidates_score ON public.match_candidates(score DESC);

-- ------------------------------------------------------------------------------
-- 11. MATCH REQUESTS (Mutual Accept)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    note VARCHAR(500),
    status match_request_status NOT NULL DEFAULT 'pending',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_requests_sender ON public.match_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_receiver ON public.match_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_hackathon ON public.match_requests(hackathon_id);

-- ------------------------------------------------------------------------------
-- 12. CONVERSATIONS & REALTIME MESSAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hackathon_id UUID REFERENCES public.hackathons(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_part_profile ON public.conversation_participants(profile_id);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 13. REVIEWS & RELIABILITY EVENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    tags TEXT[] DEFAULT '{}', -- "Communicates well", "Delivers on time", "Fast debugger"
    private_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(reviewer_id, reviewee_id, hackathon_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);

CREATE TABLE IF NOT EXISTS public.reliability_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type reliability_event_type NOT NULL,
    delta_score INT NOT NULL,
    reason TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reliability_profile ON public.reliability_events(profile_id);

-- ------------------------------------------------------------------------------
-- 14. REPORTS & BLOCKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    admin_id UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);

-- ------------------------------------------------------------------------------
-- 15. NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- match_request, match_accepted, team_locked, review_received, system
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_profile ON public.notifications(profile_id, is_read);

-- ------------------------------------------------------------------------------
-- 16. WAITLIST, INVITE CODES & REFERRALS (Cold-Start Growth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waitlist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    city_id UUID NOT NULL REFERENCES public.cities(id),
    college VARCHAR(255),
    referral_code VARCHAR(50) NOT NULL UNIQUE,
    referred_by_code VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_city ON public.waitlist_entries(city_id);

CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_ambassador BOOLEAN NOT NULL DEFAULT false,
    max_uses INT NOT NULL DEFAULT 10,
    used_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_code_id UUID NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
    referrer_id UUID REFERENCES public.profiles(id),
    referee_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(referrer_id, referee_id)
);

-- ------------------------------------------------------------------------------
-- 17. LUCKY SPIN SESSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.spin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hackathon_id UUID NOT NULL REFERENCES public.hackathons(id) ON DELETE CASCADE,
    selected_candidate_id UUID NOT NULL REFERENCES public.profiles(id),
    status VARCHAR(20) NOT NULL DEFAULT 'spun', -- spun, accepted, skipped
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spin_sessions_user ON public.spin_sessions(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 18. ADMIN AUDIT LOG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON public.admin_audit_log(admin_id, created_at DESC);
