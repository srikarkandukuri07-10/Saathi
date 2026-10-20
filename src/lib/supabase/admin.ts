import { createClient } from "@supabase/supabase-js";

/**
 * Service Role Admin Supabase client.
 * Strictly used for background matching jobs, admin concierge actions, and system automation.
 * NEVER expose this to the browser tier!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-service-role-key";

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
