import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  getCityWaitlistStats,
  joinWaitlist,
  listCities,
} from "@/lib/data/waitlist";

export const dynamic = "force-dynamic";

const joinSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  cityId: z.string().uuid(),
  college: z.string().max(150).optional(),
  referredByCode: z.string().max(50).optional(),
});

/**
 * GET /api/waitlist
 * Live cold-start progress for a city, counted from the database.
 */
export async function GET(request: NextRequest) {
  const cityId =
    request.nextUrl.searchParams.get("cityId") ??
    "c0000000-0000-0000-0000-000000000001";

  const [stats, cities] = await Promise.all([
    getCityWaitlistStats(cityId),
    listCities(),
  ]);

  return NextResponse.json({ stats, cities });
}

/**
 * POST /api/waitlist
 * Joins the city waitlist and returns the personal referral code.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid waitlist entry", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await joinWaitlist(parsed.data);

  if (!result) {
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }

  return NextResponse.json(result, { status: 201 });
}
