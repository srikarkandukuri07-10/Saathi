import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/data/common";
import {
  listNotifications,
  markAllNotificationsRead,
} from "@/lib/data/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 */
export async function GET() {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await listNotifications(viewerId);

  return NextResponse.json({ notifications });
}

/**
 * PATCH /api/notifications
 * Marks every notification as read.
 */
export async function PATCH() {
  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllNotificationsRead(viewerId);

  return NextResponse.json({ ok: true });
}
