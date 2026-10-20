import { NextResponse } from "next/server";
import { listSkills } from "@/lib/data/skills";

export const dynamic = "force-dynamic";

/**
 * GET /api/skills
 * The structured skill catalog used by the onboarding picker.
 */
export async function GET() {
  const skills = await listSkills();

  return NextResponse.json({ skills });
}
