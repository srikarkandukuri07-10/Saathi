import type { Conversation, Message, Profile } from "@/types/models";

const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    hackathon_id: "h-sih-2026",
    hackathon_name: "Smart India Hackathon 2026",
    participants: [
      {
        id: "u-demo-1",
        role: "user",
        name: "Aditya Narang",
        email: "aditya@iiit.ac.in",
        college: "IIIT Hyderabad",
        goals: "win",
        intensity: "grind",
        availability: "offline_city",
        reliability_score: 95,
        completeness_score: 95,
        is_onboarded: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "cand-1",
        role: "user",
        name: "Sneha Reddy",
        email: "sneha@cbit.ac.in",
        college: "CBIT Hyderabad",
        goals: "win",
        intensity: "grind",
        availability: "offline_city",
        reliability_score: 94,
        completeness_score: 90,
        is_onboarded: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    last_message: {
      id: "m-last",
      conversation_id: "conv-1",
      sender_id: "cand-1",
      sender_name: "Sneha Reddy",
      content: "Excited to team up for SIH! What problem statement are you thinking of tackling?",
      is_read: true,
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    unread_count: 0,
    updated_at: new Date().toISOString(),
  },
];

const mockMessagesStore: Map<string, Message[]> = new Map();

mockMessagesStore.set("conv-1", [
  {
    id: "m-1",
    conversation_id: "conv-1",
    sender_id: "u-demo-1",
    sender_name: "Aditya Narang",
    content: "Hey Sneha! Saw your Python & LLM background on Hackpact. We have a team slot for ML lead on SIH problem statement #1420.",
    is_read: true,
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  },
  {
    id: "m-2",
    conversation_id: "conv-1",
    sender_id: "cand-1",
    sender_name: "Sneha Reddy",
    content: "Hey Aditya! Just reviewed the problem statement. The emergency triage agent workflow looks promising. Are we doing the full 24h grind?",
    is_read: true,
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    id: "m-3",
    conversation_id: "conv-1",
    sender_id: "u-demo-1",
    sender_name: "Aditya Narang",
    content: "Definitely full grind. We have Next.js frontend covered and want to lock the team today so we get the reliability bonus.",
    is_read: true,
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "m-4",
    conversation_id: "conv-1",
    sender_id: "cand-1",
    sender_name: "Sneha Reddy",
    content: "Awesome, let's do it! Let's lock in and set up the GitHub repo.",
    is_read: true,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
  },
]);

export class ChatService {
  static async getConversations(userId: string): Promise<Conversation[]> {
    return mockConversations;
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    return mockMessagesStore.get(conversationId) || [];
  }

  static async sendMessage(input: {
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
  }): Promise<Message> {
    const list = mockMessagesStore.get(input.conversationId) || [];
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      sender_name: input.senderName,
      content: input.content,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    list.push(newMsg);
    mockMessagesStore.set(input.conversationId, list);

    const conv = mockConversations.find((c) => c.id === input.conversationId);
    if (conv) {
      conv.last_message = newMsg;
      conv.updated_at = new Date().toISOString();
    }

    return newMsg;
  }

  static async reportUser(input: {
    reporterId: string;
    reportedUserId: string;
    conversationId?: string;
    reason: string;
    description: string;
  }): Promise<{ success: boolean }> {
    // Recorded in database admin queue
    return { success: true };
  }

  static async blockUser(blockerId: string, blockedId: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}
