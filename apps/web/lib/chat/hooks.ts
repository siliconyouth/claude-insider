"use client";

/**
 * Chat Bridge Hooks
 *
 * These hooks provide a bridge between the old messaging system and the new
 * ChatEngine. They attempt to use the ChatEngine when available, falling back
 * to server actions otherwise.
 *
 * This enables gradual migration:
 * 1. Components can switch to these hooks immediately
 * 2. When ChatProvider is ready, hooks use the engine (offline-first, optimistic)
 * 3. When not ready, hooks fall back to direct server actions (current behavior)
 *
 * Usage:
 * ```tsx
 * import { useChatMessages, useChatConversations } from '@/lib/chat/hooks';
 *
 * function MyComponent({ conversationId }) {
 *   const { messages, sendMessage, isLoading } = useChatMessages(conversationId);
 *   // Works with both old and new systems
 * }
 * ```
 */

import { useContext, createContext, useState, useEffect, useCallback } from "react";
import type { Conversation, Message, SendMessageOptions } from "./types";

// Try to import the new chat context - if it fails, we're in legacy mode
let ChatContextModule: { useChat: () => unknown } | null = null;
try {
  // Dynamic import to avoid errors when module doesn't exist yet
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ChatContextModule = require("./provider");
} catch {
  ChatContextModule = null;
}

// ============================================================================
// Types
// ============================================================================

interface ChatMessagesState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}

interface ChatConversationsState {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Context for detecting if ChatProvider is available
// ============================================================================

const ChatAvailableContext = createContext<boolean>(false);

export function useChatAvailable(): boolean {
  return useContext(ChatAvailableContext);
}

// ============================================================================
// useChatMessages - Messages for a conversation
// ============================================================================

export function useChatMessages(conversationId: string | null) {
  const [state, setState] = useState<ChatMessagesState>({
    messages: [],
    isLoading: true,
    error: null,
    hasMore: true,
  });

  // Try to use new chat engine
  const chatEngine = useTryChatEngine();

  // Load messages
  useEffect(() => {
    if (!conversationId) {
      setState({ messages: [], isLoading: false, error: null, hasMore: false });
      return;
    }

    const loadMessages = async () => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        // Try ChatEngine first, but fall back to server action if it returns no messages
        // This handles the case where ChatEngine exists but hasn't synced messages yet
        let useServerFallback = true;

        if (chatEngine) {
          // New system - get from engine
          const msgs = chatEngine.getMessages(conversationId);
          if (msgs.length > 0) {
            // Engine has messages - use them
            setState({
              messages: msgs,
              isLoading: false,
              error: null,
              hasMore: msgs.length >= 50,
            });
            useServerFallback = false;
          }
          // If msgs.length === 0, fall through to server action
          // This handles: new conversation, engine not synced, IndexedDB empty, etc.
        }

        if (useServerFallback) {
          // Fall back to server action (legacy system or engine returned empty)
          const { getMessages } = await import("@/app/actions/messaging");
          const result = await getMessages(conversationId);

          if (result.success && result.messages) {
            // Transform to new Message type
            const msgs = result.messages.map(transformLegacyMessage);
            setState({
              messages: msgs,
              isLoading: false,
              error: null,
              hasMore: result.hasMore ?? false,
            });
          } else {
            setState({
              messages: [],
              isLoading: false,
              error: result.error || "Failed to load messages",
              hasMore: false,
            });
          }
        }
      } catch (error) {
        setState({
          messages: [],
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
          hasMore: false,
        });
      }
    };

    loadMessages();
  }, [conversationId, chatEngine]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      if (!conversationId) {
        return { success: false, error: "No conversation selected" };
      }

      if (chatEngine) {
        // New system
        try {
          const message = await chatEngine.sendMessage(conversationId, content, options);
          return { success: true, message };
        } catch (error) {
          return { success: false, error: error instanceof Error ? error.message : "Failed to send" };
        }
      } else {
        // Legacy system
        const { sendMessage: legacySend } = await import("@/app/actions/messaging");
        const result = await legacySend(conversationId, content, options?.replyToMessageId);
        if (result.success && result.message) {
          // DON'T add to internal state here!
          // The caller (ConversationView) handles optimistic updates and temp→real replacement.
          // Adding here would trigger sync useEffect and cause a race condition where
          // the message appears briefly then disappears.
          return { success: true, message: transformLegacyMessage(result.message) };
        }
        return { success: false, error: result.error || "Failed to send" };
      }
    },
    [conversationId, chatEngine]
  );

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!conversationId || !state.hasMore || state.isLoading) return;

    const oldestMessage = state.messages[0];
    if (!oldestMessage) return;

    setState((s) => ({ ...s, isLoading: true }));

    try {
      if (chatEngine) {
        const olderMsgs = chatEngine.getMessages(conversationId, {
          before: oldestMessage.createdAt,
          limit: 50,
        });
        setState((s) => ({
          ...s,
          messages: [...olderMsgs, ...s.messages],
          isLoading: false,
          hasMore: olderMsgs.length >= 50,
        }));
      } else {
        const { getMessages } = await import("@/app/actions/messaging");
        const result = await getMessages(conversationId, 50, oldestMessage.createdAt);

        if (result.success && result.messages) {
          const olderMsgs = result.messages.map(transformLegacyMessage);
          setState((s) => ({
            ...s,
            messages: [...olderMsgs, ...s.messages],
            isLoading: false,
            hasMore: result.hasMore ?? false,
          }));
        }
      }
    } catch (error) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [conversationId, chatEngine, state.messages, state.hasMore, state.isLoading]);

  return {
    ...state,
    sendMessage,
    loadMore,
    isUsingEngine: !!chatEngine,
  };
}

// ============================================================================
// useChatConversations - All conversations
// ============================================================================

export function useChatConversations() {
  const [state, setState] = useState<ChatConversationsState>({
    conversations: [],
    isLoading: true,
    error: null,
  });

  const chatEngine = useTryChatEngine();

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        // Try ChatEngine first, but fall back to server action if it returns no conversations
        // This handles the case where ChatEngine exists but hasn't synced conversations yet
        let useServerFallback = true;

        if (chatEngine) {
          // New system
          const convs = chatEngine.getConversations();
          if (convs.length > 0) {
            // Engine has conversations - use them
            setState({
              conversations: convs,
              isLoading: false,
              error: null,
            });
            useServerFallback = false;
          }
          // If convs.length === 0, fall through to server action
          // This handles: new user, engine not synced, IndexedDB empty, etc.
        }

        if (useServerFallback) {
          // Fall back to server action (legacy system or engine returned empty)
          const { getConversations } = await import("@/app/actions/messaging");
          const result = await getConversations();

          if (result.success && result.conversations) {
            const convs = result.conversations.map(transformLegacyConversation);
            setState({
              conversations: convs,
              isLoading: false,
              error: null,
            });
          } else {
            setState({
              conversations: [],
              isLoading: false,
              error: result.error || "Failed to load conversations",
            });
          }
        }
      } catch (error) {
        setState({
          conversations: [],
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    loadConversations();
  }, [chatEngine]);

  // Refresh conversations
  const refresh = useCallback(async () => {
    // Try engine first, fall back to server if engine returns empty
    let useServerFallback = true;

    if (chatEngine) {
      // Engine handles refresh via sync
      const convs = chatEngine.getConversations();
      if (convs.length > 0) {
        setState({ conversations: convs, isLoading: false, error: null });
        useServerFallback = false;
      }
    }

    if (useServerFallback) {
      // Reload from server
      setState((s) => ({ ...s, isLoading: true }));
      const { getConversations } = await import("@/app/actions/messaging");
      const result = await getConversations();
      if (result.success && result.conversations) {
        setState({
          conversations: result.conversations.map(transformLegacyConversation),
          isLoading: false,
          error: null,
        });
      }
    }
  }, [chatEngine]);

  return {
    ...state,
    refresh,
    isUsingEngine: !!chatEngine,
  };
}

// ============================================================================
// Helper: Try to get ChatEngine
// ============================================================================

interface ChatEngineInterface {
  getConversations(): Conversation[];
  getMessages(id: string, opts?: { before?: string; limit?: number }): Message[];
  sendMessage(id: string, content: string, opts?: SendMessageOptions): Promise<Message>;
}

function useTryChatEngine(): ChatEngineInterface | null {
  const [engine, setEngine] = useState<ChatEngineInterface | null>(null);

  useEffect(() => {
    // Try to get the chat engine if the provider is available
    if (ChatContextModule) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chatContext = (ChatContextModule as any).useChat?.();
        if (chatContext?.engine) {
          setEngine(chatContext.engine as ChatEngineInterface);
        }
      } catch {
        // Provider not available yet
      }
    }
  }, []);

  return engine;
}

// ============================================================================
// Transform Functions (Legacy -> New)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformLegacyMessage(msg: any): Message {
  return {
    id: msg.id,
    conversationId: msg.conversationId || msg.conversation_id,
    senderId: msg.senderId || msg.sender_id,
    // Preserve sender info for display (needed for reply previews, hovercards, etc.)
    senderName: msg.senderName || msg.sender_name,
    senderUsername: msg.senderUsername || msg.sender_username,
    senderAvatar: msg.senderAvatar || msg.sender_avatar,
    content: msg.content,
    createdAt: msg.createdAt || msg.created_at,
    editedAt: msg.editedAt || msg.edited_at,
    deletedAt: msg.deletedAt || msg.deleted_at,
    replyToMessageId: msg.replyToMessageId || msg.reply_to_message_id,
    replyToMessage: msg.replyToMessage, // Preserve reply preview data
    mentions: msg.mentions,
    isEncrypted: msg.isEncrypted || msg.is_encrypted || false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformLegacyConversation(conv: any): Conversation {
  return {
    id: conv.id,
    type: conv.type,
    name: conv.name,
    avatarUrl: conv.avatarUrl || conv.avatar_url,
    createdAt: conv.createdAt || conv.created_at,
    createdBy: conv.createdBy || conv.created_by,
    lastMessageAt: conv.lastMessageAt || conv.last_message_at,
    lastMessagePreview: conv.lastMessagePreview || conv.last_message_preview,
    participants: (conv.participants || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      odierUserId: (p.odierUserId || p.odier_user_id) as string | undefined,
      userId: (p.userId || p.user_id) as string,
      name: (p.name || p.displayName || p.display_name) as string,
      username: p.username as string | undefined,
      avatar: (p.avatar || p.avatarUrl || p.avatar_url) as string | undefined,
      role: (p.role || "member") as "owner" | "admin" | "member",
      unreadCount: (p.unreadCount || p.unread_count || 0) as number,
      isMuted: (p.isMuted || p.is_muted || false) as boolean,
      lastReadAt: (p.lastReadAt || p.last_read_at) as string | undefined,
      status: p.status as "online" | "idle" | "offline" | undefined,
    })),
    unreadCount: conv.unreadCount || conv.unread_count || 0,
    isMuted: conv.isMuted || conv.is_muted || false,
    isEncrypted: conv.isEncrypted || conv.is_encrypted || false,
  };
}

// ============================================================================
// MESSAGE INPUT HOOK
// ============================================================================

import { useDebouncedTyping } from "./realtime-optimized";

interface UseMessageInputOptions {
  /** Save draft to localStorage */
  saveDraft?: boolean;
  /** Max message length */
  maxLength?: number;
  /** Typing indicator debounce */
  typingDebounce?: number;
}

interface UseMessageInputResult {
  /** Current text value */
  text: string;
  /** Set text value */
  setText: (text: string) => void;
  /** Send message */
  send: (options?: { replyTo?: string }) => Promise<{ success: boolean; message?: Message; error?: string }>;
  /** Whether sending is in progress */
  sending: boolean;
  /** Clear input */
  clear: () => void;
  /** Whether user is typing */
  isTyping: boolean;
  /** Remaining characters */
  remaining: number;
  /** Whether input is valid */
  isValid: boolean;
}

export function useMessageInput(
  conversationId: string | null,
  options: UseMessageInputOptions = {}
): UseMessageInputResult {
  const { saveDraft = true, maxLength = 10000, typingDebounce = 300 } = options;

  const [text, setTextState] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const draftKey = `chat-draft:${conversationId}`;

  // Load draft on mount
  useEffect(() => {
    if (saveDraft && conversationId) {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        setTextState(draft);
      }
    }
  }, [draftKey, saveDraft, conversationId]);

  // Typing indicator
  const { startTyping, stopTyping } = useDebouncedTyping(
    useCallback(
      async (typing: boolean) => {
        setIsTyping(typing);
        if (!conversationId) return;
        // Send typing status to server
        try {
          await fetch("/api/chat/typing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId, isTyping: typing }),
          });
        } catch {
          // Ignore typing indicator errors
        }
      },
      [conversationId]
    ),
    { debounceMs: typingDebounce }
  );

  const setText = useCallback(
    (newText: string) => {
      setTextState(newText);

      // Save draft
      if (saveDraft && conversationId) {
        if (newText) {
          localStorage.setItem(draftKey, newText);
        } else {
          localStorage.removeItem(draftKey);
        }
      }

      // Update typing indicator
      if (newText) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [draftKey, saveDraft, conversationId, startTyping, stopTyping]
  );

  const send = useCallback(
    async (_sendOptions?: { replyTo?: string }): Promise<{ success: boolean; message?: Message; error?: string }> => {
      if (!text.trim() || sending || !conversationId) {
        return { success: false, error: "Invalid state" };
      }

      setSending(true);
      stopTyping();

      try {
        // Use legacy system
        const { sendMessage: legacySend } = await import("@/app/actions/messaging");
        const result = await legacySend(conversationId, text.trim());

        if (result.success && result.message) {
          // Clear input
          setTextState("");
          if (saveDraft) {
            localStorage.removeItem(draftKey);
          }
          return { success: true, message: transformLegacyMessage(result.message) };
        }

        return { success: false, error: result.error || "Failed to send" };
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "Failed to send" };
      } finally {
        setSending(false);
      }
    },
    [conversationId, text, sending, draftKey, saveDraft, stopTyping]
  );

  const clear = useCallback(() => {
    setTextState("");
    if (saveDraft && conversationId) {
      localStorage.removeItem(draftKey);
    }
    stopTyping();
  }, [draftKey, saveDraft, conversationId, stopTyping]);

  const remaining = maxLength - text.length;
  const isValid = text.trim().length > 0 && remaining >= 0;

  return {
    text,
    setText,
    send,
    sending,
    clear,
    isTyping,
    remaining,
    isValid,
  };
}

// ============================================================================
// MESSAGE ACTIONS HOOK
// ============================================================================

import { getMessageCache } from "./cache";
import type { DeliveryStatus } from "./types";

interface UseMessageActionsResult {
  /** Add reaction to message */
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  /** Remove reaction from message */
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  /** Pin message */
  pinMessage: (messageId: string, note?: string) => Promise<void>;
  /** Unpin message */
  unpinMessage: (messageId: string) => Promise<void>;
  /** Delete message */
  deleteMessage: (messageId: string) => Promise<void>;
  /** Edit message */
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  /** Copy message content */
  copyMessage: (messageId: string) => Promise<void>;
  /** Reply to message (returns replyTo ID for input) */
  setReplyTo: (messageId: string | null) => void;
  /** Current reply target */
  replyTo: string | null;
  /** Whether an action is in progress */
  loading: boolean;
}

export function useMessageActions(
  conversationId: string | null,
  _onMessageUpdate?: (messageId: string, updates: Partial<Message>) => void
): UseMessageActionsResult {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        await fetch("/api/chat/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, messageId, emoji }),
        });
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        await fetch("/api/chat/reactions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, messageId, emoji }),
        });
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const pinMessage = useCallback(
    async (messageId: string, note?: string) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        const { pinMessage: pin } = await import("@/app/actions/pinning");
        await pin(conversationId, messageId, note);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const unpinMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        const { unpinMessage: unpin } = await import("@/app/actions/pinning");
        await unpin(conversationId, messageId);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        const { deleteMessage: del } = await import("@/app/actions/messaging");
        await del(messageId);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!conversationId) return;
      setLoading(true);
      try {
        const { editMessage: edit } = await import("@/app/actions/messaging");
        await edit(messageId, newContent);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const copyMessage = useCallback(async (messageId: string) => {
    const cache = getMessageCache();
    const message = cache.getSync(messageId);
    if (message?.content) {
      await navigator.clipboard.writeText(message.content);
    }
  }, []);

  return {
    addReaction,
    removeReaction,
    pinMessage,
    unpinMessage,
    deleteMessage,
    editMessage,
    copyMessage,
    setReplyTo,
    replyTo,
    loading,
  };
}

// ============================================================================
// DELIVERY STATUS HOOK
// ============================================================================

import { useRef, useMemo } from "react";

interface UseDeliveryStatusResult {
  /** Get delivery status for a message */
  getStatus: (messageId: string) => DeliveryStatus;
  /** Get read receipts for a message */
  getReadBy: (messageId: string) => string[];
  /** Mark messages as read */
  markAsRead: (messageIds: string[]) => Promise<void>;
}

export function useDeliveryStatus(
  conversationId: string | null
): UseDeliveryStatusResult {
  const statusMapRef = useRef<Map<string, DeliveryStatus>>(new Map());
  const readByMapRef = useRef<Map<string, string[]>>(new Map());

  const getStatus = useCallback((messageId: string): DeliveryStatus => {
    return statusMapRef.current.get(messageId) ?? "sent";
  }, []);

  const getReadBy = useCallback((messageId: string): string[] => {
    return readByMapRef.current.get(messageId) ?? [];
  }, []);

  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      if (messageIds.length === 0 || !conversationId) return;

      try {
        await fetch("/api/chat/read-receipts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, messageIds }),
        });
      } catch {
        // Ignore read receipt errors
      }
    },
    [conversationId]
  );

  return {
    getStatus,
    getReadBy,
    markAsRead,
  };
}

// ============================================================================
// PRESENCE HOOK
// ============================================================================

import { getPresenceCache, type PresenceInfo } from "./cache";

interface UsePresenceResult {
  /** Get presence for a user */
  getPresence: (userId: string) => PresenceInfo | undefined;
  /** Get presence for multiple users */
  getPresences: (userIds: string[]) => Map<string, PresenceInfo | undefined>;
  /** Update own presence */
  updateOwnPresence: (status: "online" | "idle" | "offline") => Promise<void>;
  /** Online user count */
  onlineCount: number;
}

export function usePresence(userIds: string[] = []): UsePresenceResult {
  const [, forceUpdate] = useState({});
  const cache = useMemo(() => getPresenceCache(), []);

  // Subscribe to presence updates
  useEffect(() => {
    // Fetch initial presence
    if (userIds.length > 0) {
      fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds }),
      })
        .then((res) => res.json())
        .then((data: { presences: PresenceInfo[] }) => {
          cache.batchUpdate(data.presences);
          forceUpdate({});
        })
        .catch(() => {});
    }
  }, [userIds, cache]);

  const getPresence = useCallback(
    (userId: string) => cache.getSync(userId),
    [cache]
  );

  const getPresences = useCallback(
    (ids: string[]) => cache.getMany(ids),
    [cache]
  );

  const updateOwnPresence = useCallback(
    async (status: "online" | "idle" | "offline") => {
      await fetch("/api/chat/presence/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    []
  );

  const onlineCount = useMemo(() => {
    let count = 0;
    for (const userId of userIds) {
      const presence = cache.getSync(userId);
      if (presence?.status === "online") count++;
    }
    return count;
  }, [userIds, cache]);

  return {
    getPresence,
    getPresences,
    updateOwnPresence,
    onlineCount,
  };
}
