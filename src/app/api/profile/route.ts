import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/data/common";
import { getProfileRow, updateProfile } from "@/lib/data/profiles";
import { toPublicProfile } from "@/lib/data/common";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  college: z.string().max(150).optional(),
  year: z.number().int().min(1).max(5).optional(),
  branch: z.string().max(150).optional(),
  cityId: z.string().uuid().optional(),
  area: z.string().max(150).optional(),
  bio: z.string().max(2000).optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  goals: z.enum(["win", "learn", "balanced"]).optional(),
  intensity: z.enum(["casual", "serious", "grind"]).optional(),
  availability: z
    .enum(["online_only", "offline_city", "willing_to_travel"])
    .optional(),
  travelCities: z.array(z.string().max(100)).max(20).optional(),
  lookingForSkills: z.array(z.string().max(100)).max(20).optional(),
  preferredTeamSize: z.number().int().min(2).max(6).optional(),
  openToRemote: z.boolean().optional(),
  matchingEnabled: z.boolean().optional(),
});

/**
 * GET /api/profile
 * The signed-in user's own profile.
 */
export async function GET() {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await getProfileRow(viewerId);
  if (!row) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: toPublicProfile(row) });
}

/**
 * PATCH /api/profile
 * Updates the signed-in user's profile.
 */
export async function PATCH(request: NextRequest) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile update", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateProfile(viewerId, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to update profile", detail: result.error },
      { status: 500 }
    );
  }

  const row = await getProfileRow(viewerId);

  return NextResponse.json({
    profile: row ? toPublicProfile(row) : null,
  });
}
