import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WaitlistEntry } from "@/types/models";

/**
 * City cold-start waitlist. The progress numbers are counted from the
 * database (waitlist entries and onboarded profiles) - never hardcoded.
 */

export interface WaitlistStats {
  cityId: string;
  cityName: string;
  currentCount: number;
  targetCount: number;
  remaining: number;
  percentage: number;
  isActive: boolean;
}

export async function getCityWaitlistStats(
  cityId: string
): Promise<WaitlistStats> {
  const supabase = createServerSupabaseClient();

  const { data: city } = await supabase
    .from("cities")
    .select("id, name, is_active, target_members")
    .eq("id", cityId)
    .maybeSingle();

  const { count: waitlistCount } = await supabase
    .from("waitlist_entries")
    .select("id", { count: "exact", head: true })
    .eq("city_id", cityId);

  const { count: builderCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("city_id", cityId)
    .eq("is_onboarded", true)
    .eq("is_banned", false);

  // A builder counts once, even when they also signed up for the waitlist.
  const currentCount = Math.max(waitlistCount ?? 0, builderCount ?? 0);
  const targetCount = city?.target_members ?? 50;

  return {
    cityId,
    cityName: city?.name ?? "Unknown city",
    currentCount,
    targetCount,
    remaining: Math.max(0, targetCount - currentCount),
    percentage:
      targetCount > 0
        ? Math.min(100, Math.round((currentCount / targetCount) * 100))
        : 0,
    isActive: Boolean(city?.is_active),
  };
}

export async function listCities(): Promise<
  Array<{ id: string; name: string; state: string; is_active: boolean; target_members: number }>
> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("cities")
    .select("id, name, state, is_active, target_members")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("[data/waitlist] cities failed:", error.message);
    return [];
  }

  return data ?? [];
}

function buildReferralCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "USER";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

export async function joinWaitlist(input: {
  name: string;
  email: string;
  cityId: string;
  college?: string;
  referredByCode?: string;
}): Promise<{ entry: WaitlistEntry; referralLink: string } | null> {
  const supabase = createServerSupabaseClient();

  const { data: city } = await supabase
    .from("cities")
    .select("name")
    .eq("id", input.cityId)
    .maybeSingle();

  const code = buildReferralCode(input.name);

  const { data, error } = await supabase
    .from("waitlist_entries")
    .insert({
      name: input.name,
      email: input.email,
      city_id: input.cityId,
      college: input.college ?? null,
      referral_code: code,
      referred_by_code: input.referredByCode ?? null,
    })
    .select("id, name, email, city_id, college, referral_code, referred_by_code, created_at")
    .single();

  if (error || !data) {
    console.error("[data/waitlist] join failed:", error.message);
    return null;
  }

  const { data: referrer } = input.referredByCode
    ? await supabase
        .from("waitlist_entries")
        .select("id")
        .eq("referral_code", input.referredByCode)
        .maybeSingle()
    : { data: null };

  if (referrer) {
    await supabase.from("referrals").insert({
      referrer_id: referrer.id,
      referee_id: data.id,
    });
  }

  const entry: WaitlistEntry = {
    id: data.id,
    name: data.name,
    email: data.email,
    city_id: data.city_id,
    city_name: city?.name,
    college: data.college ?? undefined,
    referral_code: data.referral_code,
    referred_by_code: data.referred_by_code ?? undefined,
    created_at: data.created_at,
  };

  return {
    entry,
    referralLink: `/waitlist?ref=${encodeURIComponent(code)}`,
  };
}
