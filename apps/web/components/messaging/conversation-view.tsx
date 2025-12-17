"use client";

/**
 * Conversation View Component (v2.0)
 *
 * Redesigned to match the Messages Tab in the unified chat window.
 * Displays a conversation thread with:
 * - Virtual scrolling for performance (VirtualizedMessageList)
 * - Optimized real-time via Broadcast (7.6x faster typing indicators)
 * - E2EE badge with device verification
 * - @mention autocomplete with global user search
 * - Message highlighting for deep linking
 * - Consistent gradient styling
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { useSound } from "@/hooks/use-sound-effects";
import { AvatarWithStatus } from "@/components/presence";
import { ConversationE2EEBadge } from "@/components/messaging/e2ee-indicator";
import { DeviceVerificationModal } from "@/components/e2ee/device-verification-modal";
import { useE2EEContext } from "@/components/providers/e2ee-provider";
import { VirtualizedMessageList } from "@/components/messaging/virtualized-message-list";
import { ProfileHoverCard } from "@/components/users/profile-hover-card";
import {
  MentionAutocomplete,
  useMentionDetection,
  type MentionUser,
} from "@/components/messaging/mention-autocomplete";
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
  markMessagesAsRead,
  getReadReceipts,
  searchUsersForMention,
  type Message,
  type ConversationParticipant,
  type ReadReceipt,
} from "@/app/actions/messaging";
import { generateAIChatResponse } from "@/app/actions/ai-chat-response";
import {
  useConversationRealtime,
  type MessagePayload,
  type ReadReceiptPayload,
} from "@/lib/realtime/realtime-context";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";

interface ConversationViewProps {
  conversationId: string;
  currentUserId: string;
  participants: ConversationParticipant[];
  onBack?: () => void;
  targetMessageId?: string | null;
  onTargetMessageScrolled?: () => void;
  className?: string;
}

export function ConversationView({
  conversationId,
  currentUserId,
  participants,
  onBack,
  targetMessageId,
  onTargetMessageScrolled,
  className,
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
  // Read receipts state: messageId -> ReadReceipt[]
  const [readReceipts, setReadReceipts] = useState<Record<string, ReadReceipt[]>>({});

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevTypingUsersCount = useRef(0);
  // Queue for messages that need read receipt broadcast (to avoid circular dependency)
  const pendingReadReceiptIdsRef = useRef<string[]>([]);

  // Sound effects for chat
  const { playMessageReceived, playMessageSent, playTyping, playMention } = useSound();

  // E2EE context for encryption status
  const e2ee = useE2EEContext();

  // Get other participant for DM header
  const otherParticipant = participants.find((p) => p.userId !== currentUserId);
  const isAIConversation = otherParticipant?.userId === AI_ASSISTANT_USER_ID;

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
  const handleMentionSearch = useCallback(
    async (query: string): Promise<MentionUser[]> => {
      const result = await searchUsersForMention(query, 10);
      if (!result.success || !result.users) return [];

      return result.users.map((u) => ({
        id: u.id,
        name: u.displayName || u.name || "Unknown",
        username: u.username,
        avatarUrl: u.avatarUrl,
      }));
    },
    []
  );

  // Use mention detection hook
  const { mentionQuery, mentionStart } = useMentionDetection(
    inputValue,
    cursorPosition
  );

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
      let isNew = false;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;

        isNew = true;

        // Get sender info from participants
        const participant = participants.find(
          (p) => p.userId === payload.sender_id
        );

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

      // Play sound for new messages from others
      if (isNew && payload.sender_id !== currentUserId) {
        // Check if current user is mentioned
        const mentions = payload.mentions as Array<{ userId: string }> | undefined;
        const isMentioned = mentions?.some((m) => m.userId === currentUserId);
        if (isMentioned) {
          playMention();
        } else {
          playMessageReceived();
        }
      }

      // Mark as read in background (non-blocking)
      markConversationAsRead(conversationId);
      // Also mark messages as read for read receipts
      markMessagesAsRead(conversationId, payload.id);
      // Queue read receipt broadcast (processed by useEffect to avoid circular dependency)
      pendingReadReceiptIdsRef.current.push(payload.id);
    },
    [conversationId, participants, currentUserId, playMessageReceived, playMention]
  );

  // Handle typing indicator changes - play sound once when typing starts
  const handleTypingChange = useCallback((userIds: string[]) => {
    // Play sound when typing users goes from 0 to 1+ (once, not continuous)
    if (userIds.length > 0 && prevTypingUsersCount.current === 0) {
      playTyping();
    }
    prevTypingUsersCount.current = userIds.length;
    setTypingUsers(userIds);
  }, [playTyping]);

  // Handle incoming read receipts from realtime subscription
  const handleReadReceipt = useCallback((payload: ReadReceiptPayload) => {
    // Update read receipts state for the messages that were read
    setReadReceipts((prev) => {
      const updated = { ...prev };
      for (const messageId of payload.messageIds) {
        const existing = updated[messageId] || [];
        // Avoid duplicate read receipts from the same user
        if (!existing.some((r) => r.userId === payload.userId)) {
          updated[messageId] = [
            ...existing,
            {
              userId: payload.userId,
              userName: payload.userName,
              userAvatar: payload.userAvatar,
              readAt: payload.readAt,
            },
          ];
        }
      }
      return updated;
    });
  }, []);

  // Use optimized realtime hook - pools subscriptions, uses Broadcast for typing
  // This replaces the old postgres_changes subscriptions (7.6x faster for typing)
  const { sendTyping, sendReadReceipt } = useConversationRealtime({
    conversationId,
    currentUserId,
    onMessage: handleRealtimeMessage,
    onTypingChange: handleTypingChange,
    onReadReceipt: handleReadReceipt,
    enabled: !isLoading, // Only subscribe after initial load
  });

  // Get current user's profile info for read receipt broadcasts
  const currentUserProfile = useMemo(() => {
    // Try to find current user in participants (they might be there as a member)
    const self = participants.find((p) => p.userId === currentUserId);
    return {
      name: self?.displayName || self?.name,
      avatar: self?.avatarUrl,
    };
  }, [participants, currentUserId]);

  // Process pending read receipt broadcasts (avoids circular dependency with handleRealtimeMessage)
  // This useEffect runs after new messages are added and broadcasts read receipts to other participants
  useEffect(() => {
    if (pendingReadReceiptIdsRef.current.length > 0 && !isLoading) {
      const pendingIds = [...pendingReadReceiptIdsRef.current];
      pendingReadReceiptIdsRef.current = []; // Clear the queue
      sendReadReceipt(pendingIds, currentUserProfile.name, currentUserProfile.avatar);
    }
  }, [messages.length, isLoading, sendReadReceipt, currentUserProfile]);

  // Load initial messages and read receipts
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      const result = await getMessages(conversationId, 50);
      if (result.success && result.messages) {
        setMessages(result.messages);
        setHasMore(result.hasMore || false);

        // Fetch read receipts for the sender's own messages
        const ownMessageIds = result.messages
          .filter((m) => m.senderId === currentUserId)
          .map((m) => m.id);

        if (ownMessageIds.length > 0) {
          const receiptsResult = await getReadReceipts(ownMessageIds);
          if (receiptsResult.success && receiptsResult.receipts) {
            setReadReceipts(receiptsResult.receipts);
          }
        }

        // Mark messages as read and broadcast to others
        const otherMessageIds = result.messages
          .filter((m) => m.senderId !== currentUserId)
          .map((m) => m.id);

        if (otherMessageIds.length > 0) {
          await markMessagesAsRead(conversationId);
          // Broadcast read receipt to other participants
          sendReadReceipt(otherMessageIds, currentUserProfile.name, currentUserProfile.avatar);
        }

        await markConversationAsRead(conversationId);
      }
      setIsLoading(false);
    };

    loadMessages();
  }, [conversationId, currentUserId, currentUserProfile, sendReadReceipt]);

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
        const messageElement = document.querySelector(
          `[data-message-id="${targetMessageId}"]`
        );
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
      // Message not in current page - clear target
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
      // Play sent sound on success
      playMessageSent();

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Don't intercept keys when mention autocomplete is open
    if (isMentionOpen) {
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Get typing user names
  const typingUserNames = typingUsers.map((id) => {
    if (id === AI_ASSISTANT_USER_ID) return "Claude Insider";
    const participant = participants.find((p) => p.userId === id);
    return participant?.displayName || participant?.name || "Someone";
  });

  return (
    <div className={cn("flex flex-col h-full min-h-0 overflow-hidden", className)}>
      {/* Header - flex-shrink-0 ensures this stays fixed at top */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <BackIcon className="w-5 h-5" />
          </button>
        )}

        {otherParticipant && (
          <>
            {isAIConversation ? (
              <AvatarWithStatus
                src={otherParticipant.avatarUrl}
                name={otherParticipant.displayName || otherParticipant.name}
                status={otherParticipant.status || "offline"}
                size="sm"
              />
            ) : (
              <ProfileHoverCard
                user={{
                  id: otherParticipant.userId,
                  name:
                    otherParticipant.displayName ||
                    otherParticipant.name ||
                    "Unknown",
                  username: otherParticipant.username,
                  image: otherParticipant.avatarUrl,
                }}
                side="bottom"
              >
                <AvatarWithStatus
                  src={otherParticipant.avatarUrl}
                  name={otherParticipant.displayName || otherParticipant.name}
                  status={otherParticipant.status || "offline"}
                  size="sm"
                />
              </ProfileHoverCard>
            )}
            <div className="flex-1 min-w-0">
              {isAIConversation ? (
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {otherParticipant.displayName ||
                    otherParticipant.name ||
                    "Unknown"}
                </h3>
              ) : (
                <ProfileHoverCard
                  user={{
                    id: otherParticipant.userId,
                    name:
                      otherParticipant.displayName ||
                      otherParticipant.name ||
                      "Unknown",
                    username: otherParticipant.username,
                    image: otherParticipant.avatarUrl,
                  }}
                  side="bottom"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-cyan-400 cursor-pointer">
                    {otherParticipant.displayName ||
                      otherParticipant.name ||
                      "Unknown"}
                  </h3>
                </ProfileHoverCard>
              )}
              {otherParticipant.status === "online" ? (
                <p className="text-xs text-green-600 dark:text-green-400">Online</p>
              ) : otherParticipant.status === "idle" ? (
                <p className="text-xs text-orange-500">Away</p>
              ) : null}
            </div>
          </>
        )}

        {/* E2EE badge - shows encryption status and enables verification */}
        {!isAIConversation && (
          <ConversationE2EEBadge
            e2eeEnabled={e2ee.isInitialized}
            allParticipantsHaveE2EE={e2ee.isInitialized}
            isVerified={isVerified}
            size="sm"
            onVerifyClick={() => setShowVerificationModal(true)}
            targetUserId={otherParticipant?.userId}
            targetUserName={otherParticipant?.displayName || otherParticipant?.name}
          />
        )}

        {/* AI badge for AI conversations */}
        {isAIConversation && (
          <span className="px-2 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            AI Assistant
          </span>
        )}
      </div>

      {/* Device Verification Modal */}
      {!isAIConversation && (
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
      )}

      {/* Messages - Virtualized for performance */}
      <VirtualizedMessageList
        messages={messages}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        typingUserNames={typingUserNames}
        isLoading={isLoading || isLoadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isGroupChat={false}
        highlightedMessageId={highlightedMessageId}
        readReceipts={readReceipts}
        participantCount={participants.length - 1}
        className="p-4"
      />

      {/* Input - flex-shrink-0 ensures this stays fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-[#262626]">
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
            placeholder={
              isAIConversation
                ? "Ask Claude anything..."
                : "Type a message... Use @ to mention"
            }
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
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SendIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {!isAIConversation && (
          <p className="text-xs text-gray-400 mt-2 ml-1">
            Type @claudeinsider to get AI help • Chat members appear first
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      />
    </svg>
  );
}

export default ConversationView;
