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
