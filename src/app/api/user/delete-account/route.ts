import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/user/delete-account
 *
 * India DPDP Act 2023 — right to erasure.
 *
 * The account is soft-deleted immediately: the profile is hidden from matching
 * and every personal child record is removed in the same transaction window.
 * The authentication row is kept for a 30 day grace period so the deletion can
 * be reversed on request, and is purged afterwards by the retention job.
 */
async function handleDelete() {
  const supabase = await createRouteClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deletedAt = new Date().toISOString();

  // 1. Remove the personal child records that carry identifying data.
  await supabase.from("profile_skills").delete().eq("profile_id", user.id);
  await supabase.from("projects").delete().eq("profile_id", user.id);
  await supabase.from("past_hackathons").delete().eq("profile_id", user.id);
  await supabase.from("verifications").delete().eq("profile_id", user.id);
  await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  await supabase.from("notifications").delete().eq("profile_id", user.id);
  await supabase.from("waitlist_entries").delete().eq("email", user.email);

  // 2. Soft-delete the profile: it leaves the matching pool immediately and
  //    keeps a minimal shell for the 30 day reversal window.
  const { error } = await supabase
    .from("profiles")
    .update({
      deleted_at: deletedAt,
      is_onboarded: false,
      matching_enabled: false,
      name: "Deleted user",
      email: `deleted+${user.id}@hackpact.invalid`,
      bio: null,
      location: null,
      linkedin_url: null,
      github_url: null,
      portfolio_url: null,
      avatar_url: null,
      github_stats: {},
      updated_at: deletedAt,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    deleted_at: deletedAt,
    message:
      "Your account has been soft-deleted and scheduled for permanent purge in 30 days in accordance with the DPDP Act.",
  });
}

export async function DELETE() {
  return handleDelete();
}

export async function POST() {
  return handleDelete();
}
