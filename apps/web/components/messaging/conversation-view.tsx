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
import { useDraftMessage } from "@/hooks/use-draft-message";
import { useBatchedReadReceipts } from "@/hooks/use-batched-read-receipts";
import { useGapDetection } from "@/hooks/use-gap-detection";
import { useReactions } from "@/hooks/use-reactions";
import { AvatarWithStatus } from "@/components/presence";
import { ConversationE2EEBadge } from "@/components/messaging/e2ee-indicator";
import { DeviceVerificationModal } from "@/components/e2ee/device-verification-modal";
import { E2EESetupModal } from "@/components/e2ee/e2ee-setup-modal";
import { useE2EEContext } from "@/components/providers/e2ee-provider";
import { useDeferredLoading } from "@/components/providers/deferred-loading-context";
import { VirtualizedMessageList, type VirtualizedMessageListHandle } from "@/components/messaging/virtualized-message-list";
import { ProfileHoverCard } from "@/components/users/profile-hover-card";
import { ReplyPreview } from "@/components/messaging/reply-preview";
import { MessageSearchBar, SearchToggleButton } from "@/components/messaging/message-search";
import {
  MentionAutocomplete,
  useMentionDetection,
  type MentionUser,
} from "@/components/messaging/mention-autocomplete";
import { VoiceRecorderButton } from "@/components/chat/voice-recorder";
import type { VoiceRecorderResult } from "@/lib/chat/voice";
import {
  PinnedMessagesBadge,
  PinnedMessagesPanel,
} from "@/components/chat/pinned-messages";
import { getPinnedMessages } from "@/app/actions/pinning";
import {
  getMessages,
  editMessage,
  markConversationAsRead,
  getReadReceipts,
  searchUsersForMention,
  getProfilesByUsernames,
  sendVoiceMessage,
  sendFileMessage,
  type Message,
  type ConversationParticipant,
  type ReadReceipt,
  type Reaction,
} from "@/app/actions/messaging";
import { useChatMessages } from "@/lib/chat/hooks";
import { extractMentions } from "@/lib/mentions";
import type { MentionedUser } from "@/components/messaging/message-bubble";
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
  isGroupChat?: boolean;
  onBack?: () => void;
  targetMessageId?: string | null;
  onTargetMessageScrolled?: () => void;
  className?: string;
}

export function ConversationView({
  conversationId,
  currentUserId,
  participants: participantsProp,
  isGroupChat = false,
  onBack,
  targetMessageId,
  onTargetMessageScrolled,
  className,
}: ConversationViewProps) {
  // DEFENSIVE: Ensure participants is always an array (fixes "Display Error" when prop is undefined)
  const participants = Array.isArray(participantsProp) ? participantsProp : [];

  // Use the new chat bridge hook for messages (uses ChatEngine when available, falls back to server actions)
  const {
    messages: hookMessages,
    isLoading: hookIsLoading,
    hasMore: hookHasMore,
    sendMessage: hookSendMessage,
    loadMore: hookLoadMore,
    isUsingEngine, // eslint-disable-line @typescript-eslint/no-unused-vars -- Used for debugging when ChatEngine is active
  } = useChatMessages(conversationId);

  // Local state for messages - allows realtime updates and optimistic updates to work
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [isSendingFile, setIsSendingFile] = useState(false);

  // Message drafts - persisted to localStorage per conversation
  const { draft: inputValue, setDraft: setInputValue, clearDraft } = useDraftMessage({
    conversationId,
  });
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  // Read receipts state: messageId -> ReadReceipt[]
  const [readReceipts, setReadReceipts] = useState<Record<string, ReadReceipt[]>>({});
  // Reply state - message being replied to
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Pinned messages state
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [pinnedCount, setPinnedCount] = useState(0);
  // Mentioned users cache for displaying @mentions with display names
  const [mentionedUsers, setMentionedUsers] = useState<Record<string, MentionedUser>>({});

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevTypingUsersCount = useRef(0);
  // Queue for messages that need read receipt broadcast (to avoid circular dependency)
  const pendingReadReceiptIdsRef = useRef<string[]>([]);
  // Reference to the message list for scroll control
  const messageListRef = useRef<VirtualizedMessageListHandle>(null);

  // Sound effects for chat
  const { playMessageReceived, playMessageSent, playTyping, playMention } = useSound();

  // E2EE context for encryption status
  const e2ee = useE2EEContext();

  // Check if deferred providers have loaded (Matrix SDK pattern)
  // E2EE provider is deferred for 2 seconds, so we show "Initializing..." during this time
  const isDeferredReady = useDeferredLoading();
  const isE2EELoading = !isDeferredReady || e2ee.isLoading;

  // Get other participant for DM header
  const otherParticipant = participants.find((p) => p.userId !== currentUserId);
  const isAIConversation = otherParticipant?.userId === AI_ASSISTANT_USER_ID;

  // Get current user participant for optimistic messages
  const currentUserParticipant = participants.find((p) => p.userId === currentUserId);

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

  // Extract unique @mentioned usernames from all messages (for batch profile fetch)
  const mentionedUsernames = useMemo(() => {
    const allUsernames = new Set<string>();
    for (const msg of messages) {
      const usernames = extractMentions(msg.content);
      usernames.forEach((u) => allUsernames.add(u));
    }
    return Array.from(allUsernames);
  }, [messages]);

  // Fetch profile data for mentioned usernames (batch fetch)
  useEffect(() => {
    if (mentionedUsernames.length === 0) return;

    // Filter out usernames we already have
    const newUsernames = mentionedUsernames.filter(
      (u) => !mentionedUsers[u.toLowerCase()]
    );
    if (newUsernames.length === 0) return;

    const fetchProfiles = async () => {
      const result = await getProfilesByUsernames(newUsernames);
      if (result.success && result.profiles) {
        // Convert MentionProfile to MentionedUser and merge with existing
        const newUsers: Record<string, MentionedUser> = {};
        for (const [username, profile] of Object.entries(result.profiles)) {
          newUsers[username] = {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            image: profile.image,
            bio: profile.bio,
            isOnline: profile.isOnline,
          };
        }
        setMentionedUsers((prev) => ({ ...prev, ...newUsers }));
      }
    };

    fetchProfiles();
  }, [mentionedUsernames]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch pinned messages count on mount
  useEffect(() => {
    if (!conversationId || isAIConversation) return;

    const fetchPinnedCount = async () => {
      const result = await getPinnedMessages(conversationId);
      if (result.success && result.pins) {
        setPinnedCount(result.pins.length);
      }
    };

    fetchPinnedCount();
  }, [conversationId, isAIConversation]);

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
  const { mentionQuery: _mentionQuery, mentionStart } = useMentionDetection(
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
    [inputValue, cursorPosition, mentionStart, setInputValue]
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

        // Resolve reply-to message details from existing messages
        let replyToMessage: Message["replyToMessage"] | undefined;
        const replyToMessageId = payload.reply_to_message_id as string | undefined;
        if (replyToMessageId) {
          const originalMessage = prev.find((m) => m.id === replyToMessageId);
          if (originalMessage) {
            replyToMessage = {
              id: originalMessage.id,
              senderId: originalMessage.senderId,
              senderName: originalMessage.senderName || "Unknown",
              content: originalMessage.content,
              isDeleted: !!originalMessage.deletedAt,
            };
          } else {
            // Original message not in current list - show minimal info
            replyToMessage = {
              id: replyToMessageId,
              senderId: "",
              senderName: "Unknown",
              content: "[Message not loaded]",
              isDeleted: false,
            };
          }
        }

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
          // Reply threading
          replyToMessageId,
          replyToMessage,
        };

        return [...prev, message];
      });

      // Play sound for new messages from others
      if (isNew && payload.sender_id !== currentUserId) {
        // Check if current user is mentioned
        // mentions is a TEXT[] in the database - array of user ID strings
        const mentions = payload.mentions as string[] | undefined;
        const isMentioned = mentions?.includes(currentUserId);
        if (isMentioned) {
          playMention();
        } else {
          playMessageReceived();
        }
      }

      // Mark as read in background (non-blocking)
      markConversationAsRead(conversationId);
      // Queue read receipt for batched system (processed by useEffect)
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
  const { sendTyping, sendReadReceipt, isConnected } = useConversationRealtime({
    conversationId,
    currentUserId,
    onMessage: handleRealtimeMessage,
    onTypingChange: handleTypingChange,
    onReadReceipt: handleReadReceipt,
    enabled: !isLoading, // Only subscribe after initial load
  });

  // Handle missing messages found by gap detection
  const handleMissingMessages = useCallback((missingMessages: Message[]) => {
    setMessages((prev) => {
      // Merge and sort by createdAt
      const existingIds = new Set(prev.map((m) => m.id));
      const newMessages = missingMessages.filter((m) => !existingIds.has(m.id));
      if (newMessages.length === 0) return prev;

      const merged = [...prev, ...newMessages];
      merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return merged;
    });
  }, []);

  // Gap detection - fetches missed messages after reconnection
  useGapDetection({
    conversationId,
    currentUserId,
    messages,
    onMissingMessages: handleMissingMessages,
    isConnected,
    enabled: !isLoading,
  });

  // Message IDs for fetching reactions
  const messageIds = useMemo(() => messages.map((m) => m.id), [messages]);

  // Reactions hook - manages emoji reactions with optimistic updates
  const { reactions, react: reactAsync } = useReactions({
    conversationId,
    currentUserId,
    messageIds,
    enabled: !isLoading && messages.length > 0,
  });

  // DEFENSIVE: Wrap async react function to prevent any unhandled Promise errors
  // This ensures the Promise is always handled and won't accidentally be rendered
  const react = useCallback(
    (messageId: string, emoji: string) => {
      // Fire-and-forget pattern with error handling
      reactAsync(messageId, emoji).catch((error) => {
        console.error("[ConversationView] Reaction error:", error);
      });
    },
    [reactAsync]
  );

  // Convert reactions to the format expected by VirtualizedMessageList
  const reactionsMap = useMemo(() => {
    const map: Record<string, Reaction[]> = {};
    for (const [msgId, summary] of Object.entries(reactions)) {
      map[msgId] = summary.reactions;
    }
    return map;
  }, [reactions]);

  // Handle reply action
  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
    // Focus the input when replying
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // Handle scroll to message (for clicking on reply previews)
  const handleScrollToMessage = useCallback((messageId: string) => {
    const index = messages.findIndex((m) => m.id === messageId);
    if (index >= 0 && messageListRef.current) {
      // Highlight and scroll
      setHighlightedMessageId(messageId);
      const element = document.querySelector(`[data-message-id="${messageId}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Clear highlight after animation
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  }, [messages]);

  // Get current user's profile info for read receipt broadcasts
  const currentUserProfile = useMemo(() => {
    // Try to find current user in participants (they might be there as a member)
    const self = participants.find((p) => p.userId === currentUserId);
    return {
      name: self?.displayName || self?.name,
      avatar: self?.avatarUrl,
    };
  }, [participants, currentUserId]);

  // Batched read receipts - broadcasts immediately, batches DB writes every 30s
  // This reduces DB load while maintaining real-time "Seen" indicators
  const { markMultipleAsRead } = useBatchedReadReceipts({
    conversationId,
    currentUserId,
    broadcastReadReceipt: sendReadReceipt,
    userName: currentUserProfile.name,
    userAvatar: currentUserProfile.avatar,
    enabled: !isLoading,
  });

  // Process pending read receipt broadcasts (avoids circular dependency with handleRealtimeMessage)
  // This useEffect runs after new messages are added and marks them as read via batched system
  useEffect(() => {
    if (pendingReadReceiptIdsRef.current.length > 0 && !isLoading) {
      const pendingIds = [...pendingReadReceiptIdsRef.current];
      pendingReadReceiptIdsRef.current = []; // Clear the queue
      // Use batched system - broadcasts immediately, batches DB writes
      markMultipleAsRead(pendingIds);
    }
  }, [messages.length, isLoading, markMultipleAsRead]);

  // Sync messages from hook to local state
  // The hook handles initial loading via ChatEngine or server actions
  // IMPORTANT: We MERGE instead of REPLACE to preserve realtime messages
  useEffect(() => {
    // Transform hook messages to legacy Message format if needed
    const transformedMessages = hookMessages.map((msg) => {
      // The hook returns messages in the new format, we need to adapt for display
      // Most fields are compatible, but we may need to add sender info
      return msg as unknown as Message;
    });

    if (transformedMessages.length > 0 || !hookIsLoading) {
      // Merge hook messages with local state instead of replacing
      // This preserves realtime messages that the hook doesn't know about
      setMessages((prev) => {
        // Create a map of existing messages by ID for fast lookup
        const existingIds = new Set(prev.map((m) => m.id));
        const hookIds = new Set(transformedMessages.map((m) => m.id));

        // Keep local messages that aren't in hook (realtime additions)
        // Filter out temp IDs (start with 'temp-') that are placeholders
        const localOnly = prev.filter(
          (m) => !hookIds.has(m.id) && !m.id.startsWith("temp-")
        );

        // Add hook messages that aren't already local
        const hookOnly = transformedMessages.filter((m) => !existingIds.has(m.id));

        // Merge: keep all from hook (source of truth) + local-only realtime messages
        const merged = [...transformedMessages, ...localOnly];

        // Sort by createdAt to maintain order
        merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return merged;
      });
      setHasMore(hookHasMore);
      setIsLoading(hookIsLoading);
    }
  }, [hookMessages, hookIsLoading, hookHasMore]);

  // Track if we've already loaded read receipts for this conversation
  const loadedReceiptsRef = useRef<string | null>(null);

  // Load read receipts and mark as read after messages are loaded (once per conversation)
  useEffect(() => {
    if (isLoading || messages.length === 0) return;
    // Only load once per conversation to avoid repeated calls
    if (loadedReceiptsRef.current === conversationId) return;
    loadedReceiptsRef.current = conversationId;

    const loadReadReceipts = async () => {
      // Fetch read receipts for the sender's own messages
      const ownMessageIds = messages
        .filter((m) => m.senderId === currentUserId)
        .map((m) => m.id);

      if (ownMessageIds.length > 0) {
        const receiptsResult = await getReadReceipts(ownMessageIds);
        if (receiptsResult.success && receiptsResult.receipts) {
          setReadReceipts(receiptsResult.receipts);
        }
      }

      // Mark messages as read via batched system (broadcasts immediately, batches DB writes)
      const otherMessageIds = messages
        .filter((m) => m.senderId !== currentUserId)
        .map((m) => m.id);

      if (otherMessageIds.length > 0) {
        markMultipleAsRead(otherMessageIds);
      }

      await markConversationAsRead(conversationId);
    };

    loadReadReceipts();
  }, [conversationId, currentUserId, messages, isLoading, markMultipleAsRead]);

  // Scroll to target message when deep linking from notifications
  useEffect(() => {
    if (!targetMessageId || isLoading || messages.length === 0) return;

    // Find the target message in the messages array
    const targetIndex = messages.findIndex((m) => m.id === targetMessageId);

    if (targetIndex >= 0) {
      // Highlight the message
      setHighlightedMessageId(targetMessageId);

      // Use the virtualizer's scrollToMessage for proper virtual list scrolling
      // This ensures the message is scrolled into view even if not currently rendered
      setTimeout(() => {
        const scrolled = messageListRef.current?.scrollToMessage(targetMessageId);
        if (!scrolled) {
          // Fallback to DOM query if ref method didn't work
          const messageElement = document.querySelector(
            `[data-message-id="${targetMessageId}"]`
          );
          if (messageElement) {
            messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }, 150); // Slightly longer delay to ensure virtualizer is ready

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
  // Uses the hook's loadMore which handles ChatEngine/server action fallback
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    setIsLoadingMore(true);
    // The hook's loadMore handles pagination internally
    await hookLoadMore();
    setIsLoadingMore(false);
  }, [messages, hasMore, isLoadingMore, hookLoadMore]);

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

  /**
   * Send message with OPTIMISTIC UPDATES (Matrix SDK pattern)
   *
   * Key insight: Show the message IMMEDIATELY, don't wait for server.
   * 1. Create optimistic message with temp ID → add to state → message appears INSTANTLY
   * 2. Play sound → user hears confirmation
   * 3. Clear isSending immediately (user can type next message)
   * 4. Send to server in background (non-blocking)
   * 5. Server responds → replace temp ID with real ID (or realtime handles it)
   * 6. If error → show retry button on the message
   */
  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    // Set sending flag briefly to prevent double-clicks
    setIsSending(true);

    const content = inputValue.trim();
    const replyToId = replyingTo?.id;
    const replyToMessage = replyingTo ? {
      id: replyingTo.id,
      senderId: replyingTo.senderId,
      senderName: replyingTo.senderName || "Unknown",
      content: replyingTo.content,
      isDeleted: !!replyingTo.deletedAt,
    } : undefined;

    // Clear input IMMEDIATELY for snappy UX
    clearDraft();
    setReplyingTo(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping(false);

    // Generate temp ID for optimistic message
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create OPTIMISTIC MESSAGE - appears INSTANTLY!
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderId: currentUserId,
      senderName: currentUserParticipant?.displayName || currentUserParticipant?.name || "You",
      senderUsername: currentUserParticipant?.username,
      senderAvatar: currentUserParticipant?.avatarUrl,
      content,
      mentions: [],
      isAiGenerated: false,
      createdAt: new Date().toISOString(),
      replyToMessageId: replyToId,
      replyToMessage,
    };

    // Add to state IMMEDIATELY - message appears NOW!
    setMessages((prev) => [...prev, optimisticMessage]);

    // Play sound IMMEDIATELY - user hears + sees together
    playMessageSent();

    // Scroll to bottom IMMEDIATELY
    requestAnimationFrame(() => {
      messageListRef.current?.scrollToBottom();
    });

    // Re-focus input IMMEDIATELY - user can type next message right away!
    inputRef.current?.focus();

    // Clear sending flag NOW - user can send another message immediately!
    // The optimistic message is visible, no need to block the button.
    setIsSending(false);

    // Server sync happens in background - completely non-blocking
    // Use the hook's sendMessage which handles ChatEngine/server action fallback
    try {
      const result = await hookSendMessage(content, { replyToMessageId: replyToId });

      if (result.success && result.message) {
        // Replace temp message with real message from server
        const realMessage = result.message as unknown as Message;
        setMessages((prev) => {
          // Check if realtime already added the real message
          const hasRealMessage = prev.some((m) => m.id === realMessage.id);
          if (hasRealMessage) {
            // Remove the temp message, real one is already there
            return prev.filter((m) => m.id !== tempId);
          }
          // Replace temp with real
          return prev.map((m) => (m.id === tempId ? realMessage : m));
        });

        // Check if AI should respond - either @mentioned, or this is a 1-on-1 AI conversation
        const mentionedAI = content.includes("@claudeinsider") || content.includes("@ClaudeInsider");
        const shouldTriggerAI = mentionedAI || isAIConversation;
        if (shouldTriggerAI) {
          await generateAIChatResponse(conversationId, realMessage.id);
          // Refresh to get AI message - MERGE don't replace to preserve existing messages
          const refreshResult = await getMessages(conversationId, 10);
          if (refreshResult.success && refreshResult.messages) {
            setMessages((prev) => {
              // Add any new messages from refresh that we don't already have
              const existingIds = new Set(prev.map((m) => m.id));
              const newMessages = refreshResult.messages!.filter(
                (m) => !existingIds.has(m.id)
              );
              if (newMessages.length === 0) return prev;

              const merged = [...prev, ...newMessages];
              merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              return merged;
            });
            requestAnimationFrame(() => {
              messageListRef.current?.scrollToBottom();
            });
          }
          // Fetch read receipt for the user's message
          const receiptsResult = await getReadReceipts([realMessage.id]);
          if (receiptsResult.success && receiptsResult.receipts) {
            setReadReceipts((prev) => ({ ...prev, ...receiptsResult.receipts }));
          }
        }
      } else {
        // Failed - mark message as failed (could add retry UI here)
        console.error("[Chat] Failed to send message:", result.error);
        // For now, remove the optimistic message on failure
        // TODO: Add retry queue integration for failed messages
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (error) {
      console.error("[Chat] Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
    // Note: isSending is already cleared, input is already focused - nothing to do here!
  };

  // Handle message edit
  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    const result = await editMessage(messageId, newContent);
    if (result.success && result.message) {
      // Update the message in the local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: result.message!.content, editedAt: result.message!.editedAt }
            : m
        )
      );
    } else {
      throw new Error(result.error || "Failed to edit message");
    }
  }, []);

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

        {/* E2EE badge - shows encryption status and enables verification or setup */}
        {!isAIConversation && (
          <ConversationE2EEBadge
            e2eeEnabled={e2ee.isInitialized}
            allParticipantsHaveE2EE={e2ee.isInitialized}
            isVerified={isVerified}
            isLoading={isE2EELoading}
            size="sm"
            onVerifyClick={() => setShowVerificationModal(true)}
            onSetupClick={() => setShowSetupModal(true)}
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

        {/* Pinned messages badge - shows count and opens panel */}
        {!isAIConversation && (
          <PinnedMessagesBadge
            count={pinnedCount}
            onClick={() => setShowPinnedPanel(true)}
          />
        )}

        {/* Search toggle button */}
        <SearchToggleButton
          onClick={() => setIsSearchOpen((prev) => !prev)}
          isActive={isSearchOpen}
        />
      </div>

      {/* In-conversation search bar */}
      <MessageSearchBar
        conversationId={conversationId}
        onJumpToMessage={handleScrollToMessage}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

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

      {/* E2EE Setup Modal - for setting up E2EE when not initialized */}
      {!isAIConversation && (
        <E2EESetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onSuccess={() => setShowSetupModal(false)}
        />
      )}

      {/* Pinned Messages Panel - slide-out panel showing all pins */}
      {!isAIConversation && (
        <PinnedMessagesPanel
          conversationId={conversationId}
          isOpen={showPinnedPanel}
          onClose={() => setShowPinnedPanel(false)}
          onJumpToMessage={handleScrollToMessage}
          canUnpin={true}
        />
      )}

      {/* Messages - Virtualized for performance */}
      <VirtualizedMessageList
        ref={messageListRef}
        messages={messages}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
        typingUserNames={typingUserNames}
        isLoading={isLoading || isLoadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isGroupChat={isGroupChat}
        highlightedMessageId={highlightedMessageId}
        readReceipts={readReceipts}
        participantCount={participants.length - 1}
        onEdit={handleEditMessage}
        onReply={handleReply}
        reactionsMap={reactionsMap}
        onReact={react}
        mentionedUsers={mentionedUsers}
        className="p-4"
      />

      {/* Input - flex-shrink-0 ensures this stays fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#262626]">
        {/* Reply preview when replying to a message */}
        {replyingTo && (
          <div className="px-4 pt-3">
            <ReplyPreview
              senderName={replyingTo.senderName || "Unknown"}
              content={replyingTo.content}
              isDeleted={!!replyingTo.deletedAt}
              variant="composer"
              onDismiss={() => setReplyingTo(null)}
            />
          </div>
        )}

        {/* Upload progress indicator */}
        {(isSendingFile || isSendingVoice) && (
          <div className="px-4 py-2 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {isSendingVoice ? "Uploading voice message..." : "Uploading file..."}
            </span>
          </div>
        )}

        <div ref={inputWrapperRef} className="relative p-4 pt-3">
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

          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSelect={handleSelect}
              placeholder={
                isAIConversation
                  ? "Ask Claude anything..."
                  : "Text or @ to mention..."
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
            {/* Attachment button - always visible for non-AI chats */}
            {!isAIConversation && (
              <>
                <input
                  type="file"
                  id="chat-file-input"
                  className="hidden"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0 || isSendingFile) return;

                    setIsSendingFile(true);
                    try {
                      // Process files one at a time
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        if (!file) continue;

                        // Convert file to base64
                        const reader = new FileReader();
                        const base64Promise = new Promise<string>((resolve) => {
                          reader.onloadend = () => resolve(reader.result as string);
                          reader.readAsDataURL(file);
                        });
                        const fileData = await base64Promise;

                        // Get image dimensions if applicable
                        let width: number | undefined;
                        let height: number | undefined;
                        if (file.type.startsWith("image/")) {
                          const img = new Image();
                          const dimensionsPromise = new Promise<{ w: number; h: number }>((resolve) => {
                            img.onload = () => resolve({ w: img.width, h: img.height });
                            img.src = fileData;
                          });
                          const dims = await dimensionsPromise;
                          width = dims.w;
                          height = dims.h;
                        }

                        // Send file message
                        const response = await sendFileMessage({
                          conversationId,
                          fileData,
                          fileName: file.name,
                          fileSize: file.size,
                          fileType: file.type,
                          width,
                          height,
                        });

                        if (response.success && response.message) {
                          setMessages((prev) => [...prev, response.message!]);
                          playMessageSent?.();
                        } else {
                          console.error("File upload failed:", response.error);
                          alert(response.error || `Failed to send ${file.name}`);
                        }
                      }
                    } catch (error) {
                      console.error("File upload error:", error);
                      alert("Failed to send file(s)");
                    } finally {
                      setIsSendingFile(false);
                      e.target.value = ""; // Reset input
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("chat-file-input")?.click()}
                  disabled={isSendingFile}
                  className={cn(
                    "p-2 rounded-full shrink-0",
                    "text-gray-500 dark:text-gray-400",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    "hover:text-gray-700 dark:hover:text-gray-200",
                    "transition-colors",
                    isSendingFile && "opacity-50 cursor-not-allowed"
                  )}
                  title={isSendingFile ? "Uploading..." : "Attach file"}
                >
                  <AttachmentIcon className="w-5 h-5" />
                </button>
              </>
            )}
            {/* Voice recorder button - hidden when typing */}
            {!inputValue.trim() && !isAIConversation && (
              <VoiceRecorderButton
                onRecordingComplete={async (result: VoiceRecorderResult) => {
                  if (isSendingVoice) return;

                  setIsSendingVoice(true);
                  try {
                    // Convert blob to base64
                    const reader = new FileReader();
                    const base64Promise = new Promise<string>((resolve) => {
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.readAsDataURL(result.blob);
                    });
                    const audioData = await base64Promise;

                    // Send voice message
                    const response = await sendVoiceMessage({
                      conversationId,
                      audioData,
                      duration: result.duration,
                      waveform: result.waveform,
                      mimeType: result.blob.type || "audio/webm",
                    });

                    if (response.success && response.message) {
                      // Add to messages optimistically
                      setMessages((prev) => [...prev, response.message!]);
                      playMessageSent?.();
                    } else {
                      console.error("Voice message failed:", response.error);
                      alert(response.error || "Failed to send voice message");
                    }
                  } catch (error) {
                    console.error("Voice message error:", error);
                    alert("Failed to send voice message");
                  } finally {
                    setIsSendingVoice(false);
                  }
                }}
                size="md"
                className="shrink-0"
                disabled={isSendingVoice}
              />
            )}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
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

          {/* Helper text - properly spaced within the input area */}
          {!isAIConversation && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Type @claudeinsider to get AI help • Chat members appear first
            </p>
          )}
        </div>
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

function AttachmentIcon({ className }: { className?: string }) {
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
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
      />
    </svg>
  );
}

export default ConversationView;
