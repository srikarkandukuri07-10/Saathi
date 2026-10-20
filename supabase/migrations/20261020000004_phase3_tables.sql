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
