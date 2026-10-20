"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { ChatService } from "@/lib/services/chat";
import { APP_CONFIG } from "@/config/site";
import type { Conversation, Message } from "@/types/models";
import {
  Send,
  ShieldCheck,
  Flag,
  UserX,
  MessageSquare,
  Lock,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function ChatPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = React.useState<string>("conv-1");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Safety Modal
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("unresponsive");
  const [reportDetails, setReportDetails] = React.useState("");
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function load() {
      const convs = await ChatService.getConversations("u-demo-1");
      setConversations(convs);
      if (convs.length > 0) {
        const msgs = await ChatService.getMessages(convs[0].id);
        setMessages(msgs);
      }
      setLoading(false);
    }
    load();
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const otherParticipant = activeConversation?.participants.find((p) => p.id !== "u-demo-1");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvId) return;

    const content = newMessage;
    setNewMessage("");

    const sent = await ChatService.sendMessage({
      conversationId: activeConvId,
      senderId: "u-demo-1",
      senderName: "Aditya Narang",
      content,
    });

    setMessages((prev) => [...prev, sent]);

    // Simulate typing feedback from peer
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }, 1000);
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otherParticipant) return;

    await ChatService.reportUser({
      reporterId: "u-demo-1",
      reportedUserId: otherParticipant.id,
      conversationId: activeConvId,
      reason: reportReason,
      description: reportDetails,
    });

    setReportModalOpen(false);
    setActionNotice(`Report logged for moderation review. Thank you for keeping ${APP_CONFIG.name} safe.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-6 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header Alert */}
        {actionNotice && (
          <Alert status="info" title="Moderation Action">
            {actionNotice}
          </Alert>
        )}

        <div className="rounded-[20px] border-2 border-[#0A0A0A] bg-[#FFFFFF] shadow-[6px_6px_0px_#0A0A0A] overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[750px]">
          {/* Left: Conversations List */}
          <div className="border-r-2 border-[#0A0A0A] flex flex-col bg-[#FFFFFF]">
            <div className="p-4 border-b border-[#0A0A0A]/10 bg-[#0A0A0A]/[0.02]">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold tracking-tight">Direct Messages</h2>
                <Badge variant="green" size="sm">Mutual Accept Only</Badge>
              </div>
              <p className="text-[11px] text-[#0A0A0A]/60">
                Spam-free channels opened upon mutual interest.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#0A0A0A]/10">
              {conversations.map((conv) => {
                const partner = conv.participants.find((p) => p.id !== "u-demo-1");
                const isActive = conv.id === activeConvId;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-4 cursor-pointer transition-colors flex items-start gap-3 ${
                      isActive ? "bg-[#B8F2C9]/40 border-l-4 border-l-[#0A0A0A]" : "hover:bg-[#0A0A0A]/5"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full border border-[#0A0A0A] bg-[#B8F2C9] flex items-center justify-center font-bold text-sm shrink-0">
                      {partner?.name.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#0A0A0A] truncate">
                          {partner?.name || "Peer"}
                        </span>
                        <span className="text-[10px] text-[#0A0A0A]/50">
                          {conv.last_message ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#0A0A0A]/60 block truncate">
                        {conv.hackathon_name}
                      </span>
                      <p className="text-xs text-[#0A0A0A]/70 truncate mt-1">
                        {conv.last_message?.content || "Channel unlocked"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Message Stream */}
          <div className="md:col-span-2 flex flex-col h-full bg-[#FFFFFF]">
            {/* Chat Room Header */}
            {otherParticipant && (
              <div className="p-4 border-b-2 border-[#0A0A0A] flex items-center justify-between bg-[#FFFFFF]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border border-[#0A0A0A] bg-[#B8F2C9] flex items-center justify-center font-bold text-sm">
                    {otherParticipant.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/p/${otherParticipant.id}`} className="hover:underline">
                        <h3 className="font-bold text-sm text-[#0A0A0A]">{otherParticipant.name}</h3>
                      </Link>
                      <Badge variant="green" size="sm">
                        {otherParticipant.reliability_score}/100 Trust
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#0A0A0A]/60">
                      {otherParticipant.college} &bull; {activeConversation?.hackathon_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/teams">
                    <Button variant="secondary" size="sm" className="font-bold text-xs">
                      <Lock className="h-3 w-3 mr-1" /> Lock Team
                    </Button>
                  </Link>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="p-2 rounded-[8px] text-[#0A0A0A]/60 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5"
                    title="Report or Block User"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A0A0A]/[0.01]">
              <div className="text-center py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/40 bg-[#0A0A0A]/[0.05] px-2.5 py-1 rounded-full border border-[#0A0A0A]/10">
                  Mutual Match Accepted &bull; End-to-End Logged
                </span>
              </div>

              {messages.map((msg) => {
                const isMe = msg.sender_id === "u-demo-1";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-md rounded-[16px] p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm border ${
                        isMe
                          ? "bg-[#B8F2C9] text-[#0A0A0A] border-[#0A0A0A] rounded-tr-none font-medium"
                          : "bg-[#FFFFFF] text-[#0A0A0A] border-[#0A0A0A]/20 rounded-tl-none font-normal"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-[#0A0A0A]/40 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#0A0A0A]/50 italic pl-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#0A0A0A] animate-pulse" />
                  <span>{otherParticipant?.name} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-[#0A0A0A] bg-[#FFFFFF] flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message... Discuss idea, stack, or call link"
                className="flex-1 h-11 rounded-[12px] border border-[#0A0A0A]/20 bg-[#FFFFFF] px-4 text-xs sm:text-sm text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="font-bold shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
              >
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Report / Block Dialog */}
      <Dialog
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report or Block User"
        description="Help us maintain a dedicated, respectful community for serious hackathon builders."
      >
        <form onSubmit={handleReport} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[#0A0A0A] block mb-1.5">
              Reason for Report
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="flex h-11 w-full rounded-[12px] border border-[#0A0A0A]/20 bg-[#FFFFFF] px-3.5 py-2 text-sm text-[#0A0A0A]"
            >
              <option value="unresponsive">Unresponsive / Ghosting after accepting</option>
              <option value="harassment">Inappropriate or unprofessional behavior</option>
              <option value="fake_profile">Misrepresented skills or fake profile</option>
              <option value="spam">Commercial spam or solicitations</option>
            </select>
          </div>

          <Textarea
            label="Provide Specific Details"
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            placeholder="Describe what occurred. Chat logs are securely reviewed by Hackpact moderators."
            required
          />

          <div className="pt-2 flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                ChatService.blockUser("u-demo-1", otherParticipant?.id || "");
                setReportModalOpen(false);
                setActionNotice("User blocked from your matching feed.");
              }}
              className="font-bold text-xs"
            >
              <UserX className="h-3.5 w-3.5 mr-1" /> Block User
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="font-bold">
                Submit Report
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
