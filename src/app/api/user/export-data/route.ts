import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/route";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/export-data
 *
 * India DPDP Act 2023 — right to access and portability.
 * Exports everything Hackpact stores about the authenticated caller only.
 */
export async function GET() {
  const supabase = await createRouteClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profileResult, skillsResult, projectsResult, hackathonsResult, notificationsResult] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("profile_skills").select("*").eq("profile_id", user.id),
      supabase.from("projects").select("*").eq("profile_id", user.id),
      supabase.from("past_hackathons").select("*").eq("profile_id", user.id),
      supabase.from("notifications").select("*").eq("profile_id", user.id),
    ]);

  const profile = profileResult.data;

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Exact coordinates are removed from the export as well: the data principal
  // gets their own data, but the archive is a portable copy that must not
  // silently spread precise location to any other system.
  const { location: _location, ...profileWithoutLocation } = profile as Record<
    string,
    unknown
  > & { location?: unknown };

  const exportArchive = {
    exportDate: new Date().toISOString(),
    complianceStandard: "India DPDP Act 2023 - Data Principal Portability",
    userProfile: profileWithoutLocation,
    skills: skillsResult.data ?? [],
    projects: projectsResult.data ?? [],
    pastHackathons: hackathonsResult.data ?? [],
    notifications: notificationsResult.data ?? [],
    disclaimer:
      "This export contains all personal identifying data, technical skills, verified links, and participation logs stored by Hackpact. Exact GPS coordinates are excluded from the portable archive.",
  };

  return new NextResponse(JSON.stringify(exportArchive, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="hackpact-user-data-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
