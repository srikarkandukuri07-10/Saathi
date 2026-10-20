import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush } from "@/lib/notifications/push";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 200;

/**
 * POST /api/notifications/push
 *
 * Cron-style job that delivers queued `notifications` rows to the browser
 * through Web Push and marks them as sent. Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: notifications, error: fetchError } = await supabase
    .from("notifications")
    .select("id, profile_id, type, title, body, action_url, push_sent_at")
    .is("push_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch notifications", detail: fetchError.message },
      { status: 500 }
    );
  }

  if (!notifications || notifications.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, sent: 0, expired: 0, failed: 0 });
  }

  let sent = 0;
  let expired = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of notifications) {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", notification.profile_id);

    if (!subscriptions || subscriptions.length === 0) {
      skipped++;
      // Nothing to deliver to: mark as handled so the queue does not grow.
      await supabase
        .from("notifications")
        .update({ push_sent_at: new Date().toISOString() })
        .eq("id", notification.id);
      continue;
    }

    let delivered = false;

    for (const subscription of subscriptions) {
      const result = await sendPush(subscription, {
        title: notification.title,
        body: notification.body,
        url: notification.action_url ?? undefined,
        tag: notification.type,
      });

      if (result.status === "sent") {
        sent++;
        delivered = true;
      } else if (result.status === "expired") {
        expired++;
        // The browser dropped this subscription: remove the dead endpoint.
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", notification.profile_id)
          .eq("endpoint", subscription.endpoint);
      } else if (result.status === "failed") {
        failed++;
      }
    }

    if (delivered || expired > 0) {
      await supabase
        .from("notifications")
        .update({ push_sent_at: new Date().toISOString() })
        .eq("id", notification.id);
    }
  }

  return NextResponse.json({
    ok: true,
    processed: notifications.length,
    sent,
    expired,
    failed,
    skipped,
  });
}
