import webpush from "web-push";

/**
 * Web Push delivery for Phase 3 notifications.
 *
 * VAPID keys are read from the environment so nothing secret is bundled into
 * the client bundle. When the keys are absent the sender degrades to a no-op
 * instead of throwing, so local development and CI stay green.
 */

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export type PushResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "expired" }
  | { status: "failed"; reason: string };

let configured = false;

function isConfigured(): boolean {
  if (configured) {
    return Boolean(
      process.env.VAPID_PUBLIC_KEY ||
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    );
  }

  const publicKey =
    process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    configured = true;
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Sends one push message to one subscription.
 * A `404`/`410` response means the browser dropped the subscription and the
 * row should be deleted; the caller handles that cleanup.
 */
export async function sendPush(
  subscription: PushSubscriptionRecord,
  payload: PushPayload
): Promise<PushResult> {
  if (!isConfigured()) {
    return { status: "skipped", reason: "VAPID keys are not configured" };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth_key,
        },
      },
      JSON.stringify(payload)
    );
    return { status: "sent" };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;

    if (statusCode === 404 || statusCode === 410) {
      return { status: "expired" };
    }

    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "unknown push error",
    };
  }
}
