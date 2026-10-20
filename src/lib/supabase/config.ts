/**
 * Supabase connection detection.
 *
 * The repository ships with placeholder credentials so the app can be started
 * without a database. In that state the platform runs in DEMO MODE:
 * protected pages stay reachable, the seeded Hyderabad chapter backs the
 * match feed, and the UI states plainly that no real account exists.
 *
 * As soon as real credentials are present every auth path switches to the
 * normal Supabase flow with no code changes.
 */

const PLACEHOLDER_PATTERN = /mock|placeholder|your-project|your-anon/i;

export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
).trim();

/** True when real Supabase credentials are configured. */
export function isSupabaseConfigured(): boolean {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  if (PLACEHOLDER_PATTERN.test(SUPABASE_URL)) return false;
  if (PLACEHOLDER_PATTERN.test(SUPABASE_ANON_KEY)) return false;
  return true;
}

/** True when the app is running against placeholder credentials. */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}
