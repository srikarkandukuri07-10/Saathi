'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ArrowLeft, Circle, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatDistanceToNow } from '@/lib/utils'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ConversationUser {
  id: string
  name: string
  avatar?: string
  isOnline: boolean
  lastSeen?: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

interface Conversation {
  id: string
  other_user: ConversationUser
  last_message?: string
  last_message_at?: string
  unread_count: number
}

// ── Mock data for dev mode ─────────────────────────────────────────────────
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    other_user: { id: 'u2', name: 'Priya Krishnan', avatar: undefined, isOnline: true },
    last_message: 'Are you joining the ETHIndia hackathon?',
    last_message_at: new Date(Date.now() - 5 * 60000).toISOString(),
    unread_count: 2,
  },
  {
    id: 'conv-2',
    other_user: { id: 'u3', name: 'Arjun Mehta', avatar: undefined, isOnline: false, lastSeen: new Date(Date.now() - 2 * 3600000).toISOString() },
    last_message: 'Sent you my GitHub profile 🔗',
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
    unread_count: 0,
  },
]

const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm1', conversation_id: 'conv-1', sender_id: 'u2', content: 'Hey! Saw your profile. Solid React work.', created_at: new Date(Date.now() - 30 * 60000).toISOString(), read_at: new Date().toISOString() },
    { id: 'm2', conversation_id: 'conv-1', sender_id: 'me', content: 'Thanks! Love your ML projects.', created_at: new Date(Date.now() - 25 * 60000).toISOString(), read_at: new Date().toISOString() },
    { id: 'm3', conversation_id: 'conv-1', sender_id: 'u2', content: 'Are you joining the ETHIndia hackathon?', created_at: new Date(Date.now() - 5 * 60000).toISOString(), read_at: null },
  ],
  'conv-2': [
    { id: 'm4', conversation_id: 'conv-2', sender_id: 'me', content: 'Hey Arjun, checked out your profile. Backend + ML is rare 🔥', created_at: new Date(Date.now() - 4 * 3600000).toISOString(), read_at: new Date().toISOString() },
    { id: 'm5', conversation_id: 'conv-2', sender_id: 'u3', content: 'Sent you my GitHub profile 🔗', created_at: new Date(Date.now() - 3600000).toISOString(), read_at: null },
  ],
}

function AvatarInitial({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${cls} bg-[#B8F2C9] text-black font-black flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  )
}

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS)
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = useRef(createClient())

  // ── Load messages when conversation changes ──────────────────────────────
  useEffect(() => {
    if (!selectedConv) return

    setLoadingMessages(true)

    const client = supabase.current

    // Unsubscribe from previous channel
    if (channelRef.current) {
      client.removeChannel(channelRef.current)
      channelRef.current = null
    }

    if (isAuthenticated && user) {
      // Real Supabase path
      const fetchMessages = async () => {
        const { data } = await supabase.current
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConv.id)
          .order('created_at', { ascending: true })
          .limit(100)

        if (data) setMessages(data)
        setLoadingMessages(false)

        // Mark messages as read
        await supabase.current
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', selectedConv.id)
          .neq('sender_id', user.id)
          .is('read_at', null)
      }

      fetchMessages()

      // Realtime subscription
      const channel = supabase.current
        .channel(`conv:${selectedConv.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConv.id}`,
          },
          (payload) => {
            const newMsg = payload.new as Message
            setMessages((prev) => [...prev, newMsg])
          },
        )
        .on('broadcast', { event: 'typing' }, (payload) => {
          if (payload.payload.user_id !== user.id) {
            setIsTyping(true)
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000)
          }
        })
        .subscribe()

      channelRef.current = channel
    } else {
      // Dev/mock mode
      const mockMsgs = MOCK_MESSAGES[selectedConv.id] ?? []
      setMessages(mockMsgs)
      setLoadingMessages(false)

      // Simulate typing after 2s
      const t = setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 2000)
      }, 2000)
      return () => clearTimeout(t)
    }

    return () => {
      if (channelRef.current) {
        client.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [selectedConv, isAuthenticated, user])

  // ── Auto-scroll to bottom ──────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Broadcast typing indicator ─────────────────────────────────────────
  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !user) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id },
    })
  }, [user])

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const content = draft.trim()
    if (!content || !selectedConv || sending) return

    setSending(true)
    setDraft('')

    const senderId = user?.id ?? 'me'
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversation_id: selectedConv.id,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    }

    // Optimistic update
    setMessages((prev) => [...prev, optimistic])

    if (isAuthenticated && user) {
      const { data, error } = await supabase.current
        .from('messages')
        .insert({
          conversation_id: selectedConv.id,
          sender_id: user.id,
          content,
        })
        .select()
        .single()

      if (!error && data) {
        // Replace optimistic with real message
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? (data as Message) : m)),
        )
      }
    }

    setSending(false)
  }, [draft, selectedConv, sending, user, isAuthenticated])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
    broadcastTyping()
  }

  const myId = user?.id ?? 'me'

  // ── Conversation list ──────────────────────────────────────────────────
  const ConversationList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-white font-black text-lg">Messages</h1>
        <p className="text-white/40 text-xs mt-0.5">
          Only mutual matches can message
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <Lock className="h-8 w-8 text-white/20 mb-3" />
            <p className="text-white/60 text-sm">No conversations yet</p>
            <p className="text-white/30 text-xs mt-1">
              Accept a match request to start chatting
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              className={`w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 ${selectedConv?.id === conv.id ? 'bg-white/10' : ''}`}
              onClick={() => setSelectedConv(conv)}
            >
              <div className="relative">
                <AvatarInitial name={conv.other_user.name} />
                {conv.other_user.isOnline && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-[#B8F2C9] text-[#B8F2C9]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm truncate">
                    {conv.other_user.name}
                  </span>
                  {conv.last_message_at && (
                    <span className="text-white/30 text-xs flex-shrink-0 ml-2">
                      {formatDistanceToNow(conv.last_message_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-white/40 text-xs truncate">{conv.last_message}</p>
                  {conv.unread_count > 0 && (
                    <Badge variant="green" className="flex-shrink-0 ml-2 text-xs px-1.5 py-0.5">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )

  // ── Message thread ─────────────────────────────────────────────────────
  const MessageThread = () => {
    if (!selectedConv) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <Lock className="h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/40 text-sm">Select a conversation</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <button
            className="lg:hidden text-white/60 hover:text-white mr-1"
            onClick={() => setSelectedConv(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <AvatarInitial name={selectedConv.other_user.name} size="sm" />
          <div>
            <p className="text-white font-medium text-sm">{selectedConv.other_user.name}</p>
            <p className="text-white/40 text-xs">
              {selectedConv.other_user.isOnline ? (
                <span className="text-[#B8F2C9]">Online</span>
              ) : (
                `Last seen ${selectedConv.other_user.lastSeen ? formatDistanceToNow(selectedConv.other_user.lastSeen) : 'a while ago'}`
              )}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className="text-xs border-white/20 text-white/40">
              <Lock className="h-2.5 w-2.5 mr-1" />
              Mutual match
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loadingMessages ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/30 text-sm">No messages yet. Say hi! 👋</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === myId
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2.5 text-sm ${
                      isMe
                        ? 'bg-[#B8F2C9] text-black font-medium'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-black/50' : 'text-white/30'} text-right`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && msg.read_at && ' ✓✓'}
                    </p>
                  </div>
                </div>
              )
            })
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#B8F2C9]/50 transition-colors"
              placeholder="Message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <Button
              variant="primary"
              size="icon"
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
              className="flex-shrink-0 h-[46px] w-[46px] p-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-white/20 text-xs mt-2 text-center">
            Keep it respectful. Harassment leads to an immediate ban.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-black flex overflow-hidden">
      {/* Sidebar — always visible on desktop, hidden on mobile when thread open */}
      <div
        className={`w-full lg:w-80 border-r border-white/10 flex-shrink-0 ${
          selectedConv ? 'hidden lg:flex' : 'flex'
        } flex-col`}
      >
        <ConversationList />
      </div>

      {/* Thread — full screen on mobile when selected */}
      <div
        className={`flex-1 ${
          selectedConv ? 'flex' : 'hidden lg:flex'
        } flex-col`}
      >
        <MessageThread />
      </div>
    </div>
  )
}
