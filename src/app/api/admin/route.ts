import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/data/common";
import {
  createConciergeIntroduction,
  importHackathons,
  listAdminProfiles,
  listReports,
  listVerificationQueue,
  resolveReport,
  reviewVerification,
  setProfileBanned,
} from "@/lib/data/admin";

export const dynamic = "force-dynamic";

/**
 * Superadmin console API. Every route requires an admin session; the RLS
 * policies on the underlying tables enforce the same rule.
 */

async function requireAdmin(): Promise<string | null> {
  const viewerId = await getSessionUserId();
  if (!viewerId) return null;

  const { listAdminProfiles } = await import("@/lib/data/admin");
  const profiles = await listAdminProfiles();
  const me = profiles.find((profile) => profile.id === viewerId);

  return me && !me.isBanned ? viewerId : null;
}

const reviewSchema = z.object({
  verificationId: z.string().uuid(),
  decision: z.enum(["verified", "rejected"]),
  adminNotes: z.string().max(1000).optional(),
});

const reportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["resolved", "dismissed"]),
});

const banSchema = z.object({
  profileId: z.string().uuid(),
  banned: z.boolean(),
});

const importSchema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string().min(2).max(200),
        slug: z.string().min(2).max(200),
        organizer: z.string().min(2).max(200),
        mode: z.enum(["online", "offline", "hybrid"]),
        cityId: z.string().uuid().optional(),
        venue: z.string().max(200).optional(),
        startDate: z.string().min(4),
        endDate: z.string().min(4),
        registrationDeadline: z.string().min(4),
        prizePool: z.string().max(100).optional(),
        theme: z.string().max(200).optional(),
        description: z.string().max(4000).optional(),
        websiteUrl: z.string().url(),
        minTeamSize: z.number().int().min(1).max(20),
        maxTeamSize: z.number().int().min(1).max(20),
        isPublished: z.boolean().default(true),
      })
    )
    .min(1)
    .max(500),
});

const conciergeSchema = z.object({
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  hackathonId: z.string().uuid(),
  note: z.string().min(3).max(500),
});

/**
 * GET /api/admin
 * The full admin console payload: verification queue, reports and the
 * builder pool.
 */
export async function GET(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status") ?? "pending";

  const [verifications, reports, profiles] = await Promise.all([
    listVerificationQueue(status),
    listReports(),
    listAdminProfiles(request.nextUrl.searchParams.get("search") ?? undefined),
  ]);

  return NextResponse.json({ verifications, reports, profiles });
}

/**
 * PATCH /api/admin
 * Admin actions: review a verification, resolve a report, or ban a builder.
 */
export async function PATCH(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (body?.verificationId) {
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    }

    const result = await reviewVerification(
      parsed.data.verificationId,
      parsed.data.decision,
      parsed.data.adminNotes
    );
    return NextResponse.json(result);
  }

  if (body?.reportId) {
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid report action" }, { status: 400 });
    }

    const result = await resolveReport(parsed.data.reportId, parsed.data.status);
    return NextResponse.json(result);
  }

  if (body?.profileId) {
    const parsed = banSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });
    }

    const result = await setProfileBanned(parsed.data.profileId, parsed.data.banned);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

/**
 * POST /api/admin
 * Admin actions: bulk import hackathons or send a concierge introduction.
 */
export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (body?.rows) {
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid import", detail: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await importHackathons(parsed.data.rows);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ imported: result.imported }, { status: 201 });
  }

  if (body?.senderId && body?.receiverId) {
    const parsed = conciergeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid introduction", detail: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createConciergeIntroduction(parsed.data);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
