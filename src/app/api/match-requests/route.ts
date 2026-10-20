import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  receiver_id: z.string().uuid(),
  hackathon_id: z.string().uuid(),
  team_id: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});

const respondSchema = z.object({
  request_id: z.string().uuid(),
  status: z.enum(["accepted", "declined"]),
});

/**
 * GET /api/match-requests
 * Lists the requests the viewer sent or received, newest first.
 */
export async function GET() {
  const supabase = await createRouteClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("match_requests")
    .select(
      "id, sender_id, receiver_id, hackathon_id, team_id, note, status, responded_at, created_at, hackathon:hackathons(name, mode)"
    )
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

/**
 * POST /api/match-requests
 * Sends a match request. Chat stays locked until both sides accept.
 */
export async function POST(request: NextRequest) {
  const supabase = await createRouteClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { receiver_id, hackathon_id, team_id, note } = parsed.data;

  if (receiver_id === user.id) {
    return NextResponse.json(
      { error: "You cannot send a match request to yourself" },
      { status: 400 }
    );
  }

  // Reject duplicates while one is still pending.
  const { data: existing } = await supabase
    .from("match_requests")
    .select("id")
    .eq("sender_id", user.id)
    .eq("receiver_id", receiver_id)
    .eq("hackathon_id", hackathon_id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "A pending request already exists for this teammate" },
      { status: 409 }
    );
  }

  const { data: created, error } = await supabase
    .from("match_requests")
    .insert({
      sender_id: user.id,
      receiver_id,
      hackathon_id,
      team_id: team_id ?? null,
      note: note ?? null,
      status: "pending",
    })
    .select("id, sender_id, receiver_id, hackathon_id, team_id, note, status, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to send request", detail: error.message },
      { status: 500 }
    );
  }

  // Queue a notification for the receiver (system insert via service role).
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    profile_id: receiver_id,
    type: "match_request",
    title: "New teammate request",
    body: note?.slice(0, 140) ?? "A builder wants to team up with you.",
    action_url: "/matches",
  });

  return NextResponse.json({ request: created }, { status: 201 });
}

/**
 * PATCH /api/match-requests
 * Accepts or declines a request. On mutual accept the 1:1 chat unlocks.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createRouteClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = respondSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid response", detail: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { request_id, status } = parsed.data;

  const { data: existing, error: lookupError } = await supabase
    .from("match_requests")
    .select("id, sender_id, receiver_id, hackathon_id, status")
    .eq("id", request_id)
    .maybeSingle();

  if (lookupError || !existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (existing.sender_id !== user.id && existing.receiver_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("match_requests")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", request_id)
    .select("id, sender_id, receiver_id, hackathon_id, status, responded_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update request", detail: error.message },
      { status: 500 }
    );
  }

  let conversationId: string | null = null;

  if (status === "accepted") {
    const admin = createAdminClient();
    conversationId = await ensureConversation(
      admin,
      existing.sender_id,
      existing.receiver_id,
      existing.hackathon_id
    );

    const otherParty = existing.sender_id === user.id ? existing.receiver_id : existing.sender_id;

    await admin.from("notifications").insert({
      profile_id: otherParty,
      type: "match_accepted",
      title: "Match accepted",
      body: "You are now connected. Say hello to your new teammate.",
      action_url: conversationId ? `/chat?conversation=${conversationId}` : "/chat",
    });
  }

  return NextResponse.json({ request: updated, conversationId });
}

/**
 * Finds the existing conversation between two builders or creates one.
 * Runs with the service role because conversation creation is a system action
 * triggered by a mutual accept, not a user-inserted row.
 */
async function ensureConversation(
  admin: ReturnType<typeof createAdminClient>,
  senderId: string,
  receiverId: string,
  hackathonId: string
): Promise<string | null> {
  const { data: existing } = await admin
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", senderId);

  const candidateIds = (existing ?? []).map((row) => row.conversation_id);

  if (candidateIds.length > 0) {
    const { data: shared } = await admin
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", receiverId)
      .in("conversation_id", candidateIds);

    const sharedId = (shared ?? [])[0]?.conversation_id;
    if (sharedId) return sharedId;
  }

  const { data: conversation, error } = await admin
    .from("conversations")
    .insert({ hackathon_id: hackathonId })
    .select("id")
    .single();

  if (error || !conversation) return null;

  await admin.from("conversation_participants").insert([
    { conversation_id: conversation.id, profile_id: senderId },
    { conversation_id: conversation.id, profile_id: receiverId },
  ]);

  return conversation.id;
}
