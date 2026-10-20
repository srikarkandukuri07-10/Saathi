import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/data/common";
import { createTeam, listTeams } from "@/lib/data/teams";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  hackathonId: z.string().uuid(),
  name: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  githubRepoUrl: z.string().url().optional().or(z.literal("")),
  ideaBoard: z.string().max(4000).optional(),
  openSlots: z
    .array(
      z.object({
        title: z.string().min(2).max(150),
        category: z.string().min(2).max(50),
        description: z.string().max(1000).optional(),
      })
    )
    .max(10)
    .default([]),
});

/**
 * GET /api/teams
 * Squads, optionally scoped to one hackathon.
 */
export async function GET(request: NextRequest) {
  const hackathonId = request.nextUrl.searchParams.get("hackathonId") ?? undefined;
  const teams = await listTeams(hackathonId);

  return NextResponse.json({ teams });
}

/**
 * POST /api/teams
 * Creates a squad with the signed-in user as lead.
 */
export async function POST(request: NextRequest) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid team", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const team = await createTeam({
    hackathonId: parsed.data.hackathonId,
    leadId: viewerId,
    name: parsed.data.name,
    description: parsed.data.description,
    githubRepoUrl: parsed.data.githubRepoUrl || undefined,
    ideaBoard: parsed.data.ideaBoard,
    openSlots: parsed.data.openSlots,
  });

  if (!team) {
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }

  return NextResponse.json({ team }, { status: 201 });
}
