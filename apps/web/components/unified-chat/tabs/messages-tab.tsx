"use client";

/**
 * Messages Tab
 *
 * User-to-user messaging with real-time updates.
 * Shows conversation list when no conversation is selected,
 * or the conversation view when one is selected.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { createBrowserClient } from "@supabase/ssr";
import { useUnifiedChat } from "../unified-chat-provider";
import { useSession } from "@/lib/auth-client";
import { AvatarWithStatus } from "@/components/presence";
import { MessageBubble, TypingIndicator, DateSeparator } from "@/components/messaging/message-bubble";
import { E2EEIndicator } from "@/components/messaging/e2ee-indicator";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
  type Conversation,
  type Message,
} from "@/app/actions/messaging";
import { setTyping } from "@/app/actions/presence";

// ============================================================================
// Component
// ============================================================================

export function MessagesTab() {
  const { selectedConversationId, selectConversation, setUnreadCount } = useUnifiedChat();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load conversations
  useEffect(() => {
    if (!currentUserId) return;

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      const result = await getConversations();
      if (result.success && result.conversations) {
        setConversations(result.conversations);
        // Update unread count
        const totalUnread = result.conversations.reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadCount(totalUnread);
      }
      setIsLoadingConversations(false);
    };

    loadConversations();
  }, [currentUserId, setUnreadCount]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const participant = conv.participants[0];
    const name = participant?.displayName || participant?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Show conversation view if one is selected
  if (selectedConversationId && currentUserId) {
    const conversation = conversations.find((c) => c.id === selectedConversationId);
    if (conversation) {
      return (
        <ConversationView
          conversationId={selectedConversationId}
          currentUserId={currentUserId}
          participants={conversation.participants}
          onBack={() => selectConversation(null)}
        />
      );
    }
  }

  // Not authenticated
  if (!currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <LockIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Sign in to message
        </h3>
        <p className="text-sm text-gray-500">
          Sign in to send and receive messages
        </p>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-[#262626]">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={cn(
              "w-full pl-9 pr-4 py-2 rounded-lg text-sm",
              "bg-gray-100 dark:bg-gray-800",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500",
              "border-0 focus:ring-2 focus:ring-blue-500"
            )}
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <MessageIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Start a conversation from a user profile
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
            {filteredConversations.map((conversation) => {
              const participant = conversation.participants[0];
              const isUnread = conversation.unreadCount > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                    isUnread && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                >
                  {/* Avatar */}
                  <AvatarWithStatus
                    src={participant?.avatarUrl}
                    name={participant?.displayName || participant?.name}
                    status={participant?.status || "offline"}
                    size="md"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "font-medium truncate",
                          isUnread
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        {participant?.displayName || participant?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {conversation.lastMessageAt
                          ? formatRelativeTime(conversation.lastMessageAt)
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p
                        className={cn(
                          "text-sm truncate",
                          isUnread
                            ? "text-gray-700 dark:text-gray-300 font-medium"
                            : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {conversation.lastMessagePreview || "No messages yet"}
                      </p>
                      {isUnread && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium text-white bg-blue-600 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Conversation View
// ============================================================================

interface ConversationViewProps {
  conversationId: string;
  currentUserId: string;
  participants: Conversation["participants"];
  onBack: () => void;
}

function ConversationView({
  conversationId,
  currentUserId,
  participants,
  onBack,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get other participant
  const otherParticipant = participants.find((p) => p.userId !== currentUserId);

  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      const result = await getMessages(conversationId);
      if (result.success && result.messages) {
        setMessages(result.messages);
        await markConversationAsRead(conversationId);
      }
      setIsLoading(false);
    };

    loadMessages();
  }, [conversationId]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to new messages - APPEND instead of full reload for performance
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newMsg = payload.new as any;

          // Skip if message already exists (deduplication)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            // Get sender info from participants or fetch minimal profile
            const participant = participants.find((p) => p.userId === newMsg.sender_id);

            // Construct message object from payload (no API call needed!)
            const message: Message = {
              id: newMsg.id,
              conversationId: newMsg.conversation_id,
              senderId: newMsg.sender_id,
              senderName: participant?.displayName || participant?.name || "Unknown",
              senderUsername: participant?.username,
              senderAvatar: participant?.avatarUrl,
              content: newMsg.content,
              mentions: newMsg.mentions || [],
              isAiGenerated: newMsg.is_ai_generated || false,
              aiResponseTo: newMsg.ai_response_to,
              metadata: newMsg.metadata,
              createdAt: newMsg.created_at,
              editedAt: newMsg.edited_at,
              deletedAt: newMsg.deleted_at,
              encryptedContent: newMsg.encrypted_content,
              isEncrypted: newMsg.is_encrypted || false,
              encryptionAlgorithm: newMsg.encryption_algorithm,
              senderDeviceId: newMsg.sender_device_id,
              senderKey: newMsg.sender_key,
              sessionId: newMsg.session_id,
            };

            return [...prev, message];
          });

          // Mark as read in background (non-blocking)
          markConversationAsRead(conversationId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, participants]);

  // Subscribe to typing
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

  // Handle input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setTyping(conversationId, true);

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(conversationId, false);
    }, 3000);
  };

  // Send message
  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    await setTyping(conversationId, false);

    const result = await sendMessage(conversationId, content);

    if (result.success && result.message) {
      setMessages((prev) => [...prev, result.message!]);
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <BackIcon className="w-5 h-5" />
        </button>
        <AvatarWithStatus
          src={otherParticipant?.avatarUrl}
          name={otherParticipant?.displayName || otherParticipant?.name}
          status={otherParticipant?.status || "offline"}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {otherParticipant?.displayName || otherParticipant?.name || "Unknown"}
          </h3>
          {otherParticipant?.status === "online" && (
            <p className="text-xs text-green-600 dark:text-green-400">Online</p>
          )}
        </div>
        {/* E2EE indicator - we assume encrypted if messages exist */}
        <E2EEIndicator isEncrypted={messages.length > 0} decryptionSuccess={true} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                <DateSeparator date={group.date.toISOString()} />
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwnMessage={msg.senderId === currentUserId}
                    showSender={msg.senderId !== currentUserId}
                  />
                ))}
              </div>
            ))}

            {typingUsers.length > 0 && (
              <TypingIndicator
                names={[otherParticipant?.displayName || otherParticipant?.name || "Someone"]}
              />
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-[#262626]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-xl px-4 py-3",
              "bg-gray-100 dark:bg-gray-800",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500",
              "border-0 focus:ring-2 focus:ring-blue-500",
              "max-h-32"
            )}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className={cn(
              "p-3 rounded-xl transition-all",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:shadow-lg hover:shadow-blue-500/25"
            )}
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface MessageGroup {
  date: Date;
  messages: Message[];
}

function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const msg of messages) {
    const msgDate = new Date(msg.createdAt);
    const dateKey = msgDate.toDateString();

    const existingGroup = groups.find(
      (g) => g.date.toDateString() === dateKey
    );

    if (existingGroup) {
      existingGroup.messages.push(msg);
    } else {
      groups.push({ date: msgDate, messages: [msg] });
    }
  }

  return groups;
}

// ============================================================================
// Icons
// ============================================================================

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
