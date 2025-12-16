"use client";

/**
 * Conversation View Component
 *
 * Displays a conversation thread with:
 * - Real-time message updates via Supabase
 * - Auto-scroll to newest messages
 * - Message input with @mention support
 * - Typing indicators
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { createBrowserClient } from "@supabase/ssr";
import { MessageBubble, TypingIndicator, DateSeparator } from "./message-bubble";
import { AvatarWithStatus } from "@/components/presence";
import { MentionInput } from "@/components/chat/mention-input";
import { ProfileHoverCard } from "@/components/users/profile-hover-card";
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
  type Message,
  type ConversationParticipant,
} from "@/app/actions/messaging";
import { setTyping } from "@/app/actions/presence";
import { generateAIChatResponse } from "@/app/actions/ai-chat-response";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";

interface ConversationViewProps {
  conversationId: string;
  currentUserId: string;
  participants: ConversationParticipant[];
  onBack?: () => void;
  className?: string;
}

// Type for realtime message payload
interface RealtimeMessagePayload {
  sender_id: string;
}

export function ConversationView({
  conversationId,
  currentUserId,
  participants,
  onBack,
  className,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [_hasMore, setHasMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get other participant for DM header
  const otherParticipant = participants.find((p) => p.userId !== currentUserId);

  // Get participant IDs for mention autocomplete prioritization (WhatsApp-style)
  const participantIds = useMemo(
    () => participants.map((p) => p.userId).filter((id) => id !== currentUserId),
    [participants, currentUserId]
  );

  // Create Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    const result = await getMessages(conversationId);
    if (result.success && result.messages) {
      setMessages(result.messages);
      setHasMore(result.hasMore || false);
      // Mark as read
      await markConversationAsRead(conversationId);
    }
    setIsLoading(false);
  }, [conversationId]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Add new message to state
          const newMsg = payload.new as RealtimeMessagePayload;
          if (newMsg.sender_id !== currentUserId) {
            // Fetch full message with sender info
            const result = await getMessages(conversationId, 1);
            if (result.success && result.messages && result.messages.length > 0) {
              const latestMsg = result.messages[result.messages.length - 1];
              if (latestMsg) {
                setMessages((prev) => {
                  // Avoid duplicates
                  if (prev.some((m) => m.id === latestMsg.id)) return prev;
                  return [...prev, latestMsg];
                });
              }
            }
            // Mark as read
            await markConversationAsRead(conversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, currentUserId]);

  // Subscribe to typing indicators
  useEffect(() => {
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dm_typing_indicators",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          // Refresh typing users (simplified - could optimize)
          const { data } = await supabase
            .from("dm_typing_indicators")
            .select("user_id")
            .eq("conversation_id", conversationId)
            .neq("user_id", currentUserId);

          setTypingUsers(data?.map((d) => d.user_id) || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, currentUserId]);

  // Handle input change with typing indicator
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);

    // Update typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setTyping(conversationId, true);

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(conversationId, false);
    }, 3000);
  }, [conversationId]);

  // Send message
  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    await setTyping(conversationId, false);

    // Send message
    const result = await sendMessage(conversationId, content);

    if (result.success && result.message) {
      // Add message to state immediately
      setMessages((prev) => [...prev, result.message!]);
      scrollToBottom();

      // If AI was mentioned, trigger AI response
      if (result.aiMentioned) {
        // Generate AI response (async, will appear via realtime)
        await generateAIChatResponse(conversationId, result.message.id);
        // Refresh to get AI message
        const refreshResult = await getMessages(conversationId, 10);
        if (refreshResult.success && refreshResult.messages) {
          setMessages(refreshResult.messages);
        }
      }
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  // Get typing user names
  const typingUserNames = typingUsers
    .map((id) => {
      if (id === AI_ASSISTANT_USER_ID) return "Claude Insider";
      const participant = participants.find((p) => p.userId === id);
      return participant?.displayName || participant?.name || "Someone";
    })
    .filter(Boolean);

  // Group messages by date
  const messagesByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-[#262626]">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {otherParticipant && (
          (() => {
            const isAI = otherParticipant.userId === AI_ASSISTANT_USER_ID;
            const participantUser = !isAI ? {
              id: otherParticipant.userId,
              name: otherParticipant.displayName || otherParticipant.name || "Unknown",
              username: otherParticipant.username,
              image: otherParticipant.avatarUrl,
            } : null;

            const avatarElement = (
              <AvatarWithStatus
                src={otherParticipant.avatarUrl}
                name={otherParticipant.displayName || otherParticipant.name}
                status={otherParticipant.status || "offline"}
                size="md"
              />
            );

            const nameElement = (
              <h2 className={cn(
                "font-medium text-gray-900 dark:text-white truncate",
                !isAI && "hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer"
              )}>
                {otherParticipant.displayName || otherParticipant.name || "Unknown"}
              </h2>
            );

            return (
              <>
                {participantUser ? (
                  <ProfileHoverCard user={participantUser} side="bottom">
                    {avatarElement}
                  </ProfileHoverCard>
                ) : avatarElement}
                <div className="flex-1 min-w-0">
                  {participantUser ? (
                    <ProfileHoverCard user={participantUser} side="bottom">
                      {nameElement}
                    </ProfileHoverCard>
                  ) : nameElement}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {otherParticipant.status === "online"
                      ? "Online"
                      : otherParticipant.status === "idle"
                      ? "Away"
                      : "Offline"}
                  </p>
                </div>
              </>
            );
          })()
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-4xl mb-2">👋</div>
            <p>Start the conversation!</p>
            {otherParticipant?.userId === AI_ASSISTANT_USER_ID && (
              <p className="text-sm mt-1">Ask me anything about Claude Code</p>
            )}
          </div>
        ) : (
          Object.entries(messagesByDate).map(([date, dateMessages]) => (
            <div key={date}>
              <DateSeparator date={date} />
              <div className="space-y-2">
                {dateMessages.map((msg, idx) => {
                  const prevMsg = dateMessages[idx - 1];
                  const showSender =
                    !prevMsg ||
                    prevMsg.senderId !== msg.senderId ||
                    new Date(msg.createdAt).getTime() -
                      new Date(prevMsg.createdAt).getTime() >
                      60000;

                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwnMessage={msg.senderId === currentUserId}
                      showSender={showSender}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUserNames.length > 0 && (
          <TypingIndicator names={typingUserNames} className="ml-10" />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input with mention autocomplete */}
      <div className="p-4 border-t border-gray-200 dark:border-[#262626]">
        <div className="flex items-end gap-2">
          <MentionInput
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onSubmit={handleSend}
            placeholder="Type a message... (@ to mention)"
            disabled={isSending}
            participantIds={participantIds}
            className="flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className={cn(
              "p-2.5 rounded-xl transition-colors flex-shrink-0",
              inputValue.trim() && !isSending
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 dark:bg-[#262626] text-gray-400 cursor-not-allowed"
            )}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 ml-1">
          Type @claudeinsider to get AI help • Chat members appear first
        </p>
      </div>
    </div>
  );
}

export default ConversationView;
