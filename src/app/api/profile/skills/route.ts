import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/data/common";
import { refreshCompleteness } from "@/lib/data/profiles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const skillsSchema = z.object({
  skills: z
    .array(
      z.object({
        skillId: z.string().uuid(),
        proficiency: z.number().int().min(1).max(5),
        isPrimary: z.boolean().default(false),
      })
    )
    .min(1)
    .max(30),
});

/**
 * PUT /api/profile/skills
 * Replaces the signed-in user's skill set. `skill_id` references the
 * `skills` catalog, so the ids must be real catalog rows.
 */
export async function PUT(request: NextRequest) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = skillsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid skills", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  const { error: deleteError } = await supabase
    .from("profile_skills")
    .delete()
    .eq("profile_id", viewerId);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to clear the skill set", detail: deleteError.message },
      { status: 500 }
    );
  }

  const rows = parsed.data.skills.map((skill, index) => ({
    profile_id: viewerId,
    skill_id: skill.skillId,
    proficiency: skill.proficiency,
    is_primary: skill.isPrimary || index === 0,
  }));

  const { error: insertError } = await supabase
    .from("profile_skills")
    .insert(rows);

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to save the skill set", detail: insertError.message },
      { status: 500 }
    );
  }

  await refreshCompleteness(viewerId);

  return NextResponse.json({ ok: true });
}
