import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/data/common";
import { addProject, listProjects } from "@/lib/data/profiles";

export const dynamic = "force-dynamic";

const projectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  techStack: z.array(z.string().min(1).max(50)).min(1).max(20),
  repoUrl: z.string().url().optional().or(z.literal("")),
  demoUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * GET /api/profile/projects
 */
export async function GET() {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await listProjects(viewerId);

  return NextResponse.json({ projects });
}

/**
 * POST /api/profile/projects
 */
export async function POST(request: NextRequest) {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await addProject(viewerId, {
    title: parsed.data.title,
    description: parsed.data.description,
    techStack: parsed.data.techStack,
    repoUrl: parsed.data.repoUrl || undefined,
    demoUrl: parsed.data.demoUrl || undefined,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Failed to add project", detail: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
