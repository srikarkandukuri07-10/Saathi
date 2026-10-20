-- ==============================================================================
-- HACKPACT / SAATHI - FULL SCHEMA (single paste for the Supabase SQL Editor)
--
-- Generated from supabase/migrations/ in order:
--   20261020000001_initial_schema.sql   (tables, enums, indexes)
--   20261020000002_rls_policies.sql     (Row Level Security)
--   20261020000003_seed_data.sql        (cities, skills, external hackathons)
--   20261020000004_phase3_tables.sql    (push subscriptions, matching prefs)
--
-- Usage: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
-- ==============================================================================

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


-- ==============================================================================
-- HACKPACT / SAATHI: ROW LEVEL SECURITY POLICIES
-- Strict Zero-Trust Data Isolation on EVERY Table
-- ==============================================================================

-- Helper function: Is Current User Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_banned = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 1. CITIES (Public read, admin write)
-- ------------------------------------------------------------------------------
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone"
    ON public.cities FOR SELECT
    USING (true);

CREATE POLICY "Cities are insertable by admins only"
    ON public.cities FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "Cities are updatable by admins only"
    ON public.cities FOR UPDATE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. PROFILES
-- Public read for onboarded, non-banned profiles (location coordinate excluded at view/API level)
-- Users can update only their own profile; admins can update any
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated' AND (is_banned = false OR id = auth.uid() OR public.is_admin()));

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. SKILLS & PROFILE SKILLS
-- ------------------------------------------------------------------------------
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills are viewable by everyone"
    ON public.skills FOR SELECT
    USING (true);

CREATE POLICY "Skills are manageable by admins"
    ON public.skills FOR ALL
    USING (public.is_admin());

ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile skills viewable by authenticated"
    ON public.profile_skills FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage their own skills"
    ON public.profile_skills FOR ALL
    USING (auth.uid() = profile_id OR public.is_admin())
    WITH CHECK (auth.uid() = profile_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. PROJECTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects viewable by authenticated"
    ON public.projects FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage their own projects"
    ON public.projects FOR ALL
    USING (auth.uid() = profile_id OR public.is_admin())
    WITH CHECK (auth.uid() = profile_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. PAST HACKATHONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.past_hackathons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Past hackathons viewable by authenticated"
    ON public.past_hackathons FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage their own past hackathons"
    ON public.past_hackathons FOR ALL
    USING (auth.uid() = profile_id OR public.is_admin())
    WITH CHECK (auth.uid() = profile_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. VERIFICATIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own verifications"
    ON public.verifications FOR SELECT
    USING (auth.uid() = profile_id OR public.is_admin());

CREATE POLICY "Users can insert their own verification requests"
    ON public.verifications FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can update verification status"
    ON public.verifications FOR UPDATE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. HACKATHONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.hackathons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published hackathons viewable by all"
    ON public.hackathons FOR SELECT
    USING (is_published = true OR public.is_admin());

CREATE POLICY "Hackathons manageable by admin"
    ON public.hackathons FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. HACKATHON PARTICIPANTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.hackathon_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants viewable by authenticated"
    ON public.hackathon_participants FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage their own participation"
    ON public.hackathon_participants FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- ------------------------------------------------------------------------------
-- 9. TEAMS, MEMBERS & SLOTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams viewable by authenticated"
    ON public.teams FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create teams"
    ON public.teams FOR INSERT
    WITH CHECK (auth.uid() = lead_id);

CREATE POLICY "Team lead or admin can update team"
    ON public.teams FOR UPDATE
    USING (auth.uid() = lead_id OR public.is_admin());

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members viewable by authenticated"
    ON public.team_members FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Team leads manage members or users leave"
    ON public.team_members FOR ALL
    USING (
        auth.uid() = profile_id OR
        EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND lead_id = auth.uid()) OR
        public.is_admin()
    );

ALTER TABLE public.team_open_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open slots viewable by authenticated"
    ON public.team_open_slots FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Team leads manage open slots"
    ON public.team_open_slots FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND lead_id = auth.uid()) OR
        public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 10. MATCH CANDIDATES (Precomputed scores)
-- ------------------------------------------------------------------------------
ALTER TABLE public.match_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view only their own match candidates"
    ON public.match_candidates FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 11. MATCH REQUESTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view requests where they are sender or receiver"
    ON public.match_requests FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

CREATE POLICY "Users create requests as sender"
    ON public.match_requests FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can accept or decline request"
    ON public.match_requests FOR UPDATE
    USING (auth.uid() = receiver_id OR auth.uid() = sender_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 12. CONVERSATIONS & MESSAGES
-- ------------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view conversations they participate in"
    ON public.conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = id AND profile_id = auth.uid()
        ) OR public.is_admin()
    );

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view their conversation links"
    ON public.conversation_participants FOR SELECT
    USING (
        conversation_id IN (
            SELECT cp.conversation_id FROM public.conversation_participants cp
            WHERE cp.profile_id = auth.uid()
        ) OR public.is_admin()
    );

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view messages in conversations they belong to"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id AND profile_id = auth.uid()
        ) OR public.is_admin()
    );

CREATE POLICY "Users send messages only to their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants
            WHERE conversation_id = messages.conversation_id AND profile_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 13. REVIEWS & RELIABILITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aggregated review tags visible to authenticated; feedback private"
    ON public.reviews FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Teammates can submit reviews post-hackathon"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

ALTER TABLE public.reliability_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own reliability history"
    ON public.reliability_events FOR SELECT
    USING (auth.uid() = profile_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 14. REPORTS & BLOCKS
-- ------------------------------------------------------------------------------
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins view and manage all reports"
    ON public.reports FOR ALL
    USING (public.is_admin());

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view and manage their own blocks"
    ON public.blocks FOR ALL
    USING (auth.uid() = blocker_id)
    WITH CHECK (auth.uid() = blocker_id);

-- ------------------------------------------------------------------------------
-- 15. NOTIFICATIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view and update their own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- ------------------------------------------------------------------------------
-- 16. WAITLIST, INVITES & REFERRALS
-- ------------------------------------------------------------------------------
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
    ON public.waitlist_entries FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Waitlist counts viewable for progress bar"
    ON public.waitlist_entries FOR SELECT
    USING (true);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invite codes viewable by all for validation"
    ON public.invite_codes FOR SELECT
    USING (true);

CREATE POLICY "Admins or ambassadors create invite codes"
    ON public.invite_codes FOR INSERT
    WITH CHECK (public.is_admin() OR auth.uid() = owner_id);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrals viewable by involved users or admin"
    ON public.referrals FOR SELECT
    USING (auth.uid() = referrer_id OR auth.uid() = referee_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 17. SPIN SESSIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.spin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own spin sessions"
    ON public.spin_sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 18. ADMIN AUDIT LOG
-- ------------------------------------------------------------------------------
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit log"
    ON public.admin_audit_log FOR SELECT
    USING (public.is_admin());


-- ==============================================================================
-- HACKPACT / SAATHI: SEED DATA
-- Pre-seeding Cities, External Hackathons, Structured Skills
-- ==============================================================================

-- 1. CITIES (Starting with Hyderabad as the cold-start launch city)
INSERT INTO public.cities (id, name, state, country, location, is_active, target_members) VALUES
('c0000000-0000-0000-0000-000000000001', 'Hyderabad', 'Telangana', 'India', ST_SetSRID(ST_MakePoint(78.4867, 17.3850), 4326)::geography, true, 50),
('c0000000-0000-0000-0000-000000000002', 'Bengaluru', 'Karnataka', 'India', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography, false, 50),
('c0000000-0000-0000-0000-000000000003', 'Pune', 'Maharashtra', 'India', ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326)::geography, false, 50),
('c0000000-0000-0000-0000-000000000004', 'Delhi NCR', 'Delhi', 'India', ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)::geography, false, 50),
('c0000000-0000-0000-0000-000000000005', 'Mumbai', 'Maharashtra', 'India', ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326)::geography, false, 50)
ON CONFLICT (name) DO NOTHING;

-- 2. STRUCTURED SKILLS
INSERT INTO public.skills (id, name, category) VALUES
-- Frontend
('10000000-0000-0000-0000-000000000001', 'Next.js / React', 'frontend'),
('10000000-0000-0000-0000-000000000002', 'Tailwind CSS', 'frontend'),
('10000000-0000-0000-0000-000000000003', 'TypeScript', 'frontend'),
('10000000-0000-0000-0000-000000000004', 'Vue.js / Nuxt', 'frontend'),
-- Backend
('10000000-0000-0000-0000-000000000005', 'Node.js / Express', 'backend'),
('10000000-0000-0000-0000-000000000006', 'Python / FastAPI', 'backend'),
('10000000-0000-0000-0000-000000000007', 'Go (Golang)', 'backend'),
('10000000-0000-0000-0000-000000000008', 'PostgreSQL / SQL', 'backend'),
('10000000-0000-0000-0000-000000000009', 'Rust', 'backend'),
-- ML / AI
('10000000-0000-0000-0000-000000000010', 'LLMs & AI Agents', 'ml_ai'),
('10000000-0000-0000-0000-000000000011', 'PyTorch / Deep Learning', 'ml_ai'),
('10000000-0000-0000-0000-000000000012', 'Computer Vision (OpenCV)', 'ml_ai'),
('10000000-0000-0000-0000-000000000013', 'NLP & Embeddings', 'ml_ai'),
-- Mobile
('10000000-0000-0000-0000-000000000014', 'Flutter / Dart', 'mobile'),
('10000000-0000-0000-0000-000000000015', 'React Native', 'mobile'),
('10000000-0000-0000-0000-000000000016', 'Kotlin (Android)', 'mobile'),
-- Hardware / IoT
('10000000-0000-0000-0000-000000000017', 'Arduino & ESP32', 'hardware_iot'),
('10000000-0000-0000-0000-000000000018', 'Raspberry Pi / Robotics', 'hardware_iot'),
('10000000-0000-0000-0000-000000000019', 'Embedded C / C++', 'hardware_iot'),
-- Design
('10000000-0000-0000-0000-000000000020', 'Figma UI/UX', 'design'),
('10000000-0000-0000-0000-000000000021', 'Product Prototyping', 'design'),
('10000000-0000-0000-0000-000000000022', '3D / Spline / Motion', 'design'),
-- Product
('10000000-0000-0000-0000-000000000023', 'Product Management', 'product'),
('10000000-0000-0000-0000-000000000024', 'User Research & Wireframing', 'product'),
-- DevOps
('10000000-0000-0000-0000-000000000025', 'Docker & Kubernetes', 'devops'),
('10000000-0000-0000-0000-000000000026', 'AWS / Cloud Infrastructure', 'devops'),
-- Blockchain
('10000000-0000-0000-0000-000000000027', 'Solidity & Smart Contracts', 'blockchain'),
('10000000-0000-0000-0000-000000000028', 'Web3.js / Ethers', 'blockchain'),
-- Pitching & Storytelling
('10000000-0000-0000-0000-000000000029', 'Pitch Deck & Storytelling', 'pitching'),
('10000000-0000-0000-0000-000000000030', 'Demo Delivery & Presentation', 'pitching')
ON CONFLICT (name) DO NOTHING;

-- 3. EXTERNAL HACKATHONS
INSERT INTO public.hackathons (
    id, name, slug, organizer, mode, city_id, venue, start_date, end_date,
    registration_deadline, prize_pool, theme, description, website_url,
    min_team_size, max_team_size, is_published
) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'Smart India Hackathon 2026',
    'smart-india-hackathon-2026',
    'Ministry of Education & AICTE',
    'offline',
    'c0000000-0000-0000-0000-000000000001',
    'Nodal Centres across Hyderabad & India',
    NOW() + INTERVAL '25 days',
    NOW() + INTERVAL '27 days',
    NOW() + INTERVAL '12 days',
    'â‚¹1,00,000 / Problem Statement',
    'GovTech, Smart Automation, Healthcare & Agriculture',
    'The premier nationwide innovation challenge to solve real-world problems facing government ministries and public sectors.',
    'https://sih.gov.in',
    6, 6, true
),
(
    '20000000-0000-0000-0000-000000000002',
    'HackHyderabad 2026',
    'hackhyderabad-2026',
    'T-Hub & Hyderabad Tech Community',
    'offline',
    'c0000000-0000-0000-0000-000000000001',
    'T-Hub Phase 2, Knowledge City, Hyderabad',
    NOW() + INTERVAL '18 days',
    NOW() + INTERVAL '20 days',
    NOW() + INTERVAL '7 days',
    'â‚¹5,00,000',
    'AI Agents, FinTech & Smart Cities',
    'Hyderabad''s flagship 36-hour external builder hackathon bringing together the top 500 collegiate hackers across Telangana and Andhra Pradesh.',
    'https://hackhyderabad.org',
    2, 4, true
),
(
    '20000000-0000-0000-0000-000000000003',
    'EthIndia 2026',
    'ethindia-2026',
    'Devfolio & Ethereum Foundation',
    'hybrid',
    'c0000000-0000-0000-0000-000000000002',
    'KTPO Bengaluru & Hyderabad Satellite Hub',
    NOW() + INTERVAL '40 days',
    NOW() + INTERVAL '42 days',
    NOW() + INTERVAL '20 days',
    'â‚¹65,00,000+',
    'Web3 Infrastructure, Zero-Knowledge & DeFi',
    'Asia''s largest Ethereum hackathon. Gather with global protocol builders, core devs, and venture funds to build the decentralized web.',
    'https://ethindia.co',
    2, 4, true
),
(
    '20000000-0000-0000-0000-000000000004',
    'Google Solution Challenge 2026',
    'google-solution-challenge-2026',
    'Google Developer Student Clubs',
    'online',
    NULL,
    'Online (Global)',
    NOW() + INTERVAL '30 days',
    NOW() + INTERVAL '35 days',
    NOW() + INTERVAL '15 days',
    '$100,000 in Mentorship & Prizes',
    '17 UN Sustainable Development Goals',
    'Build a solution for a local community problem using one or more Google technologies: Gemini, Firebase, Android, Google Cloud, or Flutter.',
    'https://developers.google.com/community/gdsc-solution-challenge',
    2, 4, true
),
(
    '20000000-0000-0000-0000-000000000005',
    'Devpost Global Agentic AI Hackathon',
    'devpost-agentic-ai-2026',
    'Devpost',
    'online',
    NULL,
    'Online (Devpost)',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '17 days',
    NOW() + INTERVAL '5 days',
    '$50,000',
    'Autonomous AI Agents & Tool Calling',
    'Build multi-agent workflows that run autonomously, execute complex tool calls, and solve end-to-end knowledge worker problems.',
    'https://devpost.com',
    1, 4, true
)
ON CONFLICT (slug) DO NOTHING;


-- Migration: phase 3 (matching engine + push notifications)
--
-- NOTE: `match_candidates` is already created by
-- 20261020000001_initial_schema.sql with the per-hackathon shape
-- (user_id, candidate_id, hackathon_id, score, breakdown, reasons).
-- This migration therefore EXTENDS the existing table instead of creating a
-- second, incompatible one.

-- ------------------------------------------------------------------------------
-- push_subscriptions: stores Web Push endpoint + keys per user
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- match_candidates: precomputed scores (table created in migration 1)
-- The precompute job writes with the service role, which bypasses RLS.
-- Users may only read their own rows (policy defined in migration 2).
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_match_candidates_candidate
  ON public.match_candidates(candidate_id, hackathon_id);

-- ------------------------------------------------------------------------------
-- profiles: matching preferences added in phase 3 (idempotent)
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'matching_enabled') THEN
    ALTER TABLE public.profiles ADD COLUMN matching_enabled BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'open_to_remote') THEN
    ALTER TABLE public.profiles ADD COLUMN open_to_remote BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_team_size') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_team_size SMALLINT NOT NULL DEFAULT 4 CHECK (preferred_team_size BETWEEN 2 AND 6);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'looking_for_skills') THEN
    ALTER TABLE public.profiles ADD COLUMN looking_for_skills TEXT[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- notifications: realtime delivery preferences for the push worker
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'push_sent_at') THEN
    ALTER TABLE public.notifications ADD COLUMN push_sent_at TIMESTAMPTZ;
  END IF;
END $$;


