"use client";

/**
 * Messages Tab - Optimized for Performance
 *
 * User-to-user messaging with real-time updates.
 * Shows conversation list when no conversation is selected,
 * or the conversation view when one is selected.
 *
 * Performance optimizations (v0.92.0):
 * - Subscription pooling via RealtimeContext (50% fewer connections)
 * - Broadcast for typing indicators (7.6x faster: 6ms vs 46ms)
 * - No DB writes for typing (reduced latency)
 * - Auto-reconnection with exponential backoff
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { useUnifiedChat } from "../unified-chat-provider";
import { useSession } from "@/lib/auth-client";
import { AvatarWithStatus } from "@/components/presence";
import { ConversationE2EEBadge } from "@/components/messaging/e2ee-indicator";
import { DeviceVerificationModal } from "@/components/e2ee/device-verification-modal";
import { useE2EEContext } from "@/components/providers/e2ee-provider";
import { VirtualizedMessageList } from "@/components/messaging/virtualized-message-list";
import {
  MentionAutocomplete,
  useMentionDetection,
  type MentionUser,
} from "@/components/messaging/mention-autocomplete";
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationAsRead,
  searchUsersForMention,
  type Conversation,
  type Message,
} from "@/app/actions/messaging";
import { useConversationRealtime, type MessagePayload } from "@/lib/realtime/realtime-context";

// ============================================================================
// Component
// ============================================================================

export function MessagesTab() {
  const { selectedConversationId, selectConversation, unreadCount, setUnreadCount, targetMessageId, clearTargetMessage, pendingVerificationId, clearPendingVerification } = useUnifiedChat();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPendingVerificationModal, setShowPendingVerificationModal] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{
    verificationId: string;
    initiatorUserId: string;
    initiatorName: string;
  } | null>(null);

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

  // Handle pending verification from deep link
  useEffect(() => {
    if (!pendingVerificationId) return;

    // Fetch verification details from the server
    const fetchVerification = async () => {
      try {
        const response = await fetch(`/api/e2ee/verification/${pendingVerificationId}`);
        if (response.ok) {
          const data = await response.json();
          setPendingVerification({
            verificationId: pendingVerificationId,
            initiatorUserId: data.initiatorUserId,
            initiatorName: data.initiatorName || "Someone",
          });
          setShowPendingVerificationModal(true);
        }
      } catch (error) {
        console.error("Failed to fetch verification:", error);
      }
    };

    fetchVerification();
  }, [pendingVerificationId]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const participant = conv.participants[0];
    const name = participant?.displayName || participant?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle conversation selection - mark as read and update unread count
  const handleSelectConversation = useCallback((conversation: Conversation | null) => {
    if (conversation && conversation.unreadCount > 0) {
      // Optimistically decrement global unread count
      setUnreadCount(Math.max(0, unreadCount - conversation.unreadCount));

      // Update local conversation state to mark as read
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, unreadCount: 0 } : c
        )
      );

      // Mark as read in database (non-blocking)
      markConversationAsRead(conversation.id);
    }

    selectConversation(conversation?.id || null);
  }, [selectConversation, setUnreadCount, unreadCount]);

  // Show conversation view if one is selected
  if (selectedConversationId && currentUserId) {
    const conversation = conversations.find((c) => c.id === selectedConversationId);
    if (conversation) {
      return (
        <ConversationView
          conversationId={selectedConversationId}
          currentUserId={currentUserId}
          participants={conversation.participants}
          isGroupChat={conversation.type === "group"}
          onBack={() => handleSelectConversation(null)}
          targetMessageId={targetMessageId}
          onTargetMessageScrolled={clearTargetMessage}
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
                  onClick={() => handleSelectConversation(conversation)}
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

      {/* Pending E2EE Verification Modal (from notification deep link) */}
      {pendingVerification && (
        <DeviceVerificationModal
          isOpen={showPendingVerificationModal}
          onClose={() => {
            setShowPendingVerificationModal(false);
            setPendingVerification(null);
            clearPendingVerification();
          }}
          targetUserId={pendingVerification.initiatorUserId}
          targetUserName={pendingVerification.initiatorName}
          onSuccess={() => {
            setShowPendingVerificationModal(false);
            setPendingVerification(null);
            clearPendingVerification();
          }}
        />
      )}
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
  isGroupChat: boolean;
  onBack: () => void;
  targetMessageId?: string | null;
  onTargetMessageScrolled?: () => void;
}

function ConversationView({
  conversationId,
  currentUserId,
  participants,
  isGroupChat,
  onBack,
  targetMessageId,
  onTargetMessageScrolled,
}: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  // E2EE context for encryption status
  const e2ee = useE2EEContext();

  // Get other participant
  const otherParticipant = participants.find((p) => p.userId !== currentUserId);

  // Build mentionable users list from participants (memoized for performance)
  const mentionableUsers: MentionUser[] = useMemo(() => {
    return participants
      .filter((p) => p.userId !== currentUserId)
      .map((p) => ({
        id: p.userId,
        name: p.displayName || p.name || "Unknown",
        username: p.username,
        avatarUrl: p.avatarUrl,
      }));
  }, [participants, currentUserId]);

  // Search ALL users (like Telegram) - called when query is 2+ chars
  // Prioritizes: exact match > following > followers > other users
  const handleMentionSearch = useCallback(async (query: string): Promise<MentionUser[]> => {
    const result = await searchUsersForMention(query, 10);
    if (!result.success || !result.users) return [];

    return result.users.map((u) => ({
      id: u.id,
      name: u.displayName || u.name || "Unknown",
      username: u.username,
      avatarUrl: u.avatarUrl,
    }));
  }, []);

  // Use mention detection hook
  const { mentionQuery, mentionStart } = useMentionDetection(inputValue, cursorPosition);

  // Handle mention selection - insert @username at the mention position
  const handleMentionSelect = useCallback(
    (user: MentionUser, mentionText: string) => {
      if (mentionStart < 0) return;

      // Replace from @ to cursor with mention text + space
      const before = inputValue.slice(0, mentionStart);
      const after = inputValue.slice(cursorPosition);
      const newValue = `${before}${mentionText} ${after}`;

      setInputValue(newValue);

      // Move cursor after the mention
      const newCursorPos = mentionStart + mentionText.length + 1;
      setCursorPosition(newCursorPos);

      // Focus and set cursor position
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    },
    [inputValue, cursorPosition, mentionStart]
  );

  // Handle incoming messages from realtime subscription
  const handleRealtimeMessage = useCallback(
    (payload: MessagePayload) => {
      // Skip if message already exists (deduplication)
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;

        // Get sender info from participants
        const participant = participants.find((p) => p.userId === payload.sender_id);

        // Construct message object from payload
        const message: Message = {
          id: payload.id,
          conversationId: payload.conversation_id,
          senderId: payload.sender_id,
          senderName: participant?.displayName || participant?.name || "Unknown",
          senderUsername: participant?.username,
          senderAvatar: participant?.avatarUrl,
          content: payload.content,
          mentions: payload.mentions || [],
          isAiGenerated: payload.is_ai_generated || false,
          aiResponseTo: payload.ai_response_to,
          metadata: payload.metadata,
          createdAt: payload.created_at,
          editedAt: payload.edited_at,
          deletedAt: payload.deleted_at,
          encryptedContent: payload.encrypted_content,
          isEncrypted: payload.is_encrypted || false,
          encryptionAlgorithm: payload.encryption_algorithm,
          senderDeviceId: payload.sender_device_id,
          senderKey: payload.sender_key,
          sessionId: payload.session_id,
        };

        return [...prev, message];
      });

      // Mark as read in background (non-blocking)
      markConversationAsRead(conversationId);
    },
    [conversationId, participants]
  );

  // Handle typing indicator changes
  const handleTypingChange = useCallback((userIds: string[]) => {
    setTypingUsers(userIds);
  }, []);

  // Use optimized realtime hook - pools subscriptions, uses Broadcast for typing
  // This replaces the old postgres_changes subscriptions (7.6x faster for typing)
  const { sendTyping } = useConversationRealtime({
    conversationId,
    currentUserId,
    onMessage: handleRealtimeMessage,
    onTypingChange: handleTypingChange,
    enabled: !isLoading, // Only subscribe after initial load
  });

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      const result = await getMessages(conversationId, 50);
      if (result.success && result.messages) {
        setMessages(result.messages);
        setHasMore(result.hasMore || false);
        await markConversationAsRead(conversationId);
      }
      setIsLoading(false);
    };

    loadMessages();
  }, [conversationId]);

  // Scroll to target message when deep linking from notifications
  useEffect(() => {
    if (!targetMessageId || isLoading || messages.length === 0) return;

    // Find the target message index
    const targetIndex = messages.findIndex((m) => m.id === targetMessageId);

    if (targetIndex >= 0) {
      // Highlight the message
      setHighlightedMessageId(targetMessageId);

      // Scroll to the message element
      setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${targetMessageId}"]`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);

      // Clear highlight and target after animation
      setTimeout(() => {
        setHighlightedMessageId(null);
        onTargetMessageScrolled?.();
      }, 3000);
    } else {
      // Message not in current page - it might be older
      // Clear target for now (could implement loading older messages until found)
      onTargetMessageScrolled?.();
    }
  }, [targetMessageId, isLoading, messages, onTargetMessageScrolled]);

  // Load more (older) messages - for pagination
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setIsLoadingMore(true);
    // Get the oldest message's created_at as cursor
    const result = await getMessages(conversationId, 50, oldestMessage.createdAt);

    if (result.success && result.messages) {
      // Prepend older messages
      setMessages((prev) => [...result.messages!, ...prev]);
      setHasMore(result.hasMore || false);
    }
    setIsLoadingMore(false);
  }, [conversationId, messages, hasMore, isLoadingMore]);

  // Handle input with optimized typing indicator (no DB write!)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing via Broadcast (6ms) instead of DB write (46ms)
    sendTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 3000);
  };

  // Track cursor position on selection change (click, arrow keys)
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart || 0);
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
    // Clear typing indicator immediately via Broadcast
    sendTyping(false);

    const result = await sendMessage(conversationId, content);

    if (result.success && result.message) {
      setMessages((prev) => [...prev, result.message!]);
    }

    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't intercept keys when mention autocomplete is open
    // The autocomplete handles Enter/Escape/Arrow keys
    if (isMentionOpen) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
        {/* E2EE badge - shows encryption status and enables verification */}
        <ConversationE2EEBadge
          e2eeEnabled={e2ee.isInitialized}
          allParticipantsHaveE2EE={e2ee.isInitialized}
          isVerified={isVerified}
          size="sm"
          onVerifyClick={() => setShowVerificationModal(true)}
          targetUserId={otherParticipant?.userId}
          targetUserName={otherParticipant?.displayName || otherParticipant?.name}
        />
      </div>

      {/* Device Verification Modal */}
      <DeviceVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        targetUserId={otherParticipant?.userId}
        targetUserName={otherParticipant?.displayName || otherParticipant?.name}
        onSuccess={() => {
          setIsVerified(true);
          setShowVerificationModal(false);
        }}
      />

      {/* Messages - Virtualized for performance */}
      <VirtualizedMessageList
        messages={messages}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        typingUserNames={
          typingUsers.length > 0
            ? [otherParticipant?.displayName || otherParticipant?.name || "Someone"]
            : []
        }
        isLoading={isLoading || isLoadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isGroupChat={isGroupChat}
        highlightedMessageId={highlightedMessageId}
        className="p-4"
      />

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-[#262626]">
        <div ref={inputWrapperRef} className="relative flex items-end gap-2">
          {/* Mention Autocomplete - positioned above input */}
          <MentionAutocomplete
            inputValue={inputValue}
            cursorPosition={cursorPosition}
            users={mentionableUsers}
            isOpen={isMentionOpen}
            onOpenChange={setIsMentionOpen}
            onSelect={handleMentionSelect}
            onSearch={handleMentionSearch}
            position={{ top: 8, left: 0 }}
          />

          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            placeholder="Type a message... Use @ to mention"
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
