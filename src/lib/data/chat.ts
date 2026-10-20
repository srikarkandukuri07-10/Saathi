import { createServerSupabaseClient } from "@/lib/supabase/server";
import { relationRecord } from "@/lib/matching/candidateGenerator";
import type { Conversation, Message, Profile } from "@/types/models";

/**
 * Mutual-accept 1:1 chat. Conversations, participants and messages live in
 * Postgres; nothing is kept in memory.
 */

interface ConversationRow {
  id: string;
  hackathon_id?: string | null;
  hackathon?: { name: string } | null;
  updated_at: string;
  participants?: Array<{ profile_id: string; profile?: unknown }> | null;
  messages?: Array<{
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read_at?: string | null;
    sender?: unknown;
  }> | null;
}

const CONVERSATION_SELECT = `
  id, hackathon_id, hackathon:hackathons(name), updated_at,
  participants:conversation_participants(profile_id,
    profile:profiles(id, name, avatar_url, college, branch, year, goals, intensity, availability, reliability_score, city_id, area)),
  messages:messages(id, conversation_id, sender_id, content, created_at, read_at,
    sender:profiles(id, name, avatar_url))
`;

function toConversation(row: ConversationRow): Conversation {
  const participants: Profile[] = (row.participants ?? []).map((entry) => {
    const profile = relationRecord<Partial<Profile>>(entry.profile);
    return {
      id: profile?.id ?? entry.profile_id,
      role: "user",
      name: profile?.name ?? "Unknown builder",
      email: "",
      avatar_url: profile?.avatar_url ?? undefined,
      college: profile?.college ?? undefined,
      branch: profile?.branch ?? undefined,
      year: profile?.year ?? undefined,
      goals: profile?.goals ?? "balanced",
      intensity: profile?.intensity ?? "serious",
      availability: profile?.availability ?? "offline_city",
      reliability_score: profile?.reliability_score ?? 0,
      completeness_score: 0,
      is_onboarded: true,
      is_banned: false,
      city_id: profile?.city_id ?? undefined,
      area: profile?.area ?? undefined,
      created_at: "",
      updated_at: "",
    };
  });

  const messages = (row.messages ?? []).map(
    (message): Message => {
      const sender = relationRecord<{ name?: string; avatar_url?: string }>(
        message.sender
      );
      return {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        sender_name: sender?.name,
        sender_avatar: sender?.avatar_url,
        content: message.content,
        is_read: Boolean(message.read_at),
        created_at: message.created_at,
      };
    }
  );

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  return {
    id: row.id,
    hackathon_id: row.hackathon_id ?? undefined,
    hackathon_name: row.hackathon?.name,
    participants,
    last_message: lastMessage,
    unread_count: messages.filter(
      (message) => !message.is_read && message.sender_id !== row.id
    ).length,
    updated_at: row.updated_at,
  };
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const supabase = createServerSupabaseClient();

  const { data: participations, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", userId);

  if (error || !participations || participations.length === 0) {
    return [];
  }

  const ids = participations.map((row) => row.conversation_id);

  const { data, error: listError } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .in("id", ids)
    .order("updated_at", { ascending: false });

  if (listError) {
    console.error("[data/chat] conversations failed:", listError.message);
    return [];
  }

  return ((data ?? []) as unknown as ConversationRow[]).map(toConversation);
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, content, created_at, read_at, sender:profiles(id, name, avatar_url)"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[data/chat] messages failed:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as Array<{
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read_at?: string | null;
    sender?: unknown;
  }>).map((message) => {
    const sender = relationRecord<{ name?: string; avatar_url?: string }>(
      message.sender
    );
    return {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      sender_name: sender?.name,
      sender_avatar: sender?.avatar_url,
      content: message.content,
      is_read: Boolean(message.read_at),
      created_at: message.created_at,
    };
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message | null> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select("id, conversation_id, sender_id, content, created_at, read_at")
    .single();

  if (error || !data) {
    console.error("[data/chat] send failed:", error.message);
    return null;
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return {
    id: data.id,
    conversation_id: data.conversation_id,
    sender_id: data.sender_id,
    content: data.content,
    is_read: false,
    created_at: data.created_at,
  };
}

export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createServerSupabaseClient();

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

export async function reportUser(input: {
  reporterId: string;
  reportedUserId: string;
  conversationId?: string;
  reason: string;
  description?: string;
}): Promise<{ success: boolean }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from("reports").insert({
    reporter_id: input.reporterId,
    reported_user_id: input.reportedUserId,
    conversation_id: input.conversationId ?? null,
    reason: input.reason,
    description: input.description ?? null,
    status: "pending",
  });

  return { success: !error };
}

export async function blockUser(
  blockerId: string,
  blockedId: string
): Promise<{ success: boolean }> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from("blocks")
    .upsert({ blocker_id: blockerId, blocked_id: blockedId });

  return { success: !error };
}
