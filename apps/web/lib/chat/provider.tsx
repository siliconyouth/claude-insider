"use client";

/**
 * Chat Provider
 *
 * React context that wraps the ChatEngine and provides hooks for components.
 * Follows Matrix SDK patterns with optimistic UI and offline-first design.
 *
 * Usage:
 * ```tsx
 * // In layout.tsx
 * <ChatProvider userId={user.id}>
 *   <YourChatComponents />
 * </ChatProvider>
 *
 * // In components
 * const { conversations, sendMessage } = useChat();
 * const { messages, loadMore } = useConversation(conversationId);
 * ```
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import type {
  Conversation,
  Message,
  SyncState,
  ConnectionInfo,
  ChatEvent,
  SendMessageOptions,
} from "./types";
import {
  initializeChatEngine,
  getChatEngine,
  resetChatEngine,
  type ChatEngine,
} from "./engine";

// ============================================================================
// Types
// ============================================================================

interface ChatContextValue {
  // State
  conversations: Conversation[];
  isLoading: boolean;
  isInitialized: boolean;
  syncState: SyncState;
  connectionInfo: ConnectionInfo;
  pendingCount: number;

  // Conversation Actions
  selectConversation: (id: string | null) => void;
  selectedConversationId: string | null;
  refreshConversations: () => Promise<void>;

  // Message Actions
  sendMessage: (
    conversationId: string,
    content: string,
    options?: SendMessageOptions
  ) => Promise<{ success: boolean; message?: Message; error?: string }>;
  editMessage: (
    messageId: string,
    newContent: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteMessage: (
    messageId: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Typing Indicators
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  getTypingUsers: (conversationId: string) => string[];

  // Read Receipts
  markAsRead: (conversationId: string) => Promise<void>;

  // Reactions
  toggleReaction: (
    messageId: string,
    emoji: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Engine Access (for advanced use)
  engine: ChatEngine | null;
}

interface ConversationContextValue {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  hasMoreMessages: boolean;
  loadMoreMessages: () => Promise<void>;
  typingUsers: string[];
  unreadCount: number;
}

// ============================================================================
// Contexts
// ============================================================================

const ChatContext = createContext<ChatContextValue | null>(null);
const ConversationContext = createContext<ConversationContextValue | null>(null);

// ============================================================================
// Provider Props
// ============================================================================

interface ChatProviderProps {
  children: React.ReactNode;
  userId: string;
  debug?: boolean;
}

// ============================================================================
// Main Provider
// ============================================================================

export function ChatProvider({ children, userId, debug = false }: ChatProviderProps) {
  // Engine reference
  const engineRef = useRef<ChatEngine | null>(null);

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>({
    initialSyncComplete: false,
    isSyncing: false,
  });
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    state: "connecting",
    reconnectAttempts: 0,
  });

  // Initialize engine
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const engine = await initializeChatEngine({
          userId,
          offlineEnabled: true,
          e2eeDefaultForDMs: true,
          syncIntervalMs: 10_000,
          maxMessagesPerConversation: 500,
          maxConversations: 100,
          debug,
        });

        if (!mounted) return;

        engineRef.current = engine;

        // Subscribe to events
        engine.on("conversation_updated", handleConversationUpdated);
        engine.on("conversation_added", handleConversationAdded);
        engine.on("conversation_removed", handleConversationRemoved);
        engine.on("typing_started", handleTypingStarted);
        engine.on("typing_stopped", handleTypingStopped);
        engine.on("sync_started", () => setSyncState((s) => ({ ...s, isSyncing: true })));
        engine.on("sync_completed", () =>
          setSyncState((s) => ({ ...s, isSyncing: false, initialSyncComplete: true }))
        );
        engine.on("sync_error", (event) =>
          setSyncState((s) => ({ ...s, isSyncing: false, syncError: String(event.payload) }))
        );
        engine.on("connection_changed", handleConnectionChanged);
        engine.on("offline_queue_changed", handleOfflineQueueChanged);

        // Load initial conversations
        const convs = await engine.getConversations();
        if (mounted) {
          setConversations(convs);
          setIsLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("[ChatProvider] Initialization failed:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (engineRef.current) {
        // Unsubscribe from events
        engineRef.current.off("conversation_updated", handleConversationUpdated);
        engineRef.current.off("conversation_added", handleConversationAdded);
        engineRef.current.off("conversation_removed", handleConversationRemoved);
        engineRef.current.off("typing_started", handleTypingStarted);
        engineRef.current.off("typing_stopped", handleTypingStopped);
        resetChatEngine();
        engineRef.current = null;
      }
    };
  }, [userId, debug]);

  // Event Handlers
  const handleConversationUpdated = useCallback((event: ChatEvent) => {
    if (!event.payload) return;
    const updated = event.payload as Conversation;
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }, []);

  const handleConversationAdded = useCallback((event: ChatEvent) => {
    if (!event.payload) return;
    const added = event.payload as Conversation;
    setConversations((prev) => [added, ...prev]);
  }, []);

  const handleConversationRemoved = useCallback((event: ChatEvent) => {
    if (!event.conversationId) return;
    setConversations((prev) =>
      prev.filter((c) => c.id !== event.conversationId)
    );
  }, []);

  const handleTypingStarted = useCallback((event: ChatEvent) => {
    if (!event.conversationId || !event.userId) return;
    setTypingUsers((prev) => {
      const current = prev[event.conversationId!] || [];
      if (current.includes(event.userId!)) return prev;
      return {
        ...prev,
        [event.conversationId!]: [...current, event.userId!],
      };
    });
  }, []);

  const handleTypingStopped = useCallback((event: ChatEvent) => {
    if (!event.conversationId || !event.userId) return;
    setTypingUsers((prev) => {
      const current = prev[event.conversationId!] || [];
      return {
        ...prev,
        [event.conversationId!]: current.filter((id) => id !== event.userId),
      };
    });
  }, []);

  const handleConnectionChanged = useCallback((event: ChatEvent) => {
    if (!event.payload) return;
    setConnectionInfo(event.payload as ConnectionInfo);
  }, []);

  const handleOfflineQueueChanged = useCallback((event: ChatEvent) => {
    if (typeof event.payload === "number") {
      setPendingCount(event.payload);
    }
  }, []);

  // Actions
  const selectConversation = useCallback((id: string | null) => {
    setSelectedConversationId(id);
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!engineRef.current) return;
    const convs = await engineRef.current.getConversations();
    setConversations(convs);
  }, []);

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      options?: SendMessageOptions
    ) => {
      if (!engineRef.current) {
        return { success: false, error: "Chat not initialized" };
      }
      try {
        const message = await engineRef.current.sendMessage(conversationId, content, options);
        return { success: true, message };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to send message" };
      }
    },
    []
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!engineRef.current) {
        return { success: false, error: "Chat not initialized" };
      }
      try {
        await engineRef.current.editMessage(messageId, newContent);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to edit message" };
      }
    },
    []
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!engineRef.current) {
      return { success: false, error: "Chat not initialized" };
    }
    try {
      await engineRef.current.deleteMessage(messageId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete message" };
    }
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    engineRef.current?.sendTyping(conversationId, true);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    engineRef.current?.sendTyping(conversationId, false);
  }, []);

  const getTypingUsers = useCallback(
    (conversationId: string) => {
      return typingUsers[conversationId] || [];
    },
    [typingUsers]
  );

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!engineRef.current) return;
    await engineRef.current.markAsRead(conversationId);
  }, []);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!engineRef.current) {
        return { success: false, error: "Chat not initialized" };
      }
      try {
        await engineRef.current.toggleReaction(messageId, emoji);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to toggle reaction" };
      }
    },
    []
  );

  // Context value
  const value = useMemo<ChatContextValue>(
    () => ({
      conversations,
      isLoading,
      isInitialized,
      syncState,
      connectionInfo,
      pendingCount,
      selectConversation,
      selectedConversationId,
      refreshConversations,
      sendMessage,
      editMessage,
      deleteMessage,
      startTyping,
      stopTyping,
      getTypingUsers,
      markAsRead,
      toggleReaction,
      engine: engineRef.current,
    }),
    [
      conversations,
      isLoading,
      isInitialized,
      syncState,
      connectionInfo,
      pendingCount,
      selectConversation,
      selectedConversationId,
      refreshConversations,
      sendMessage,
      editMessage,
      deleteMessage,
      startTyping,
      stopTyping,
      getTypingUsers,
      markAsRead,
      toggleReaction,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ============================================================================
// Conversation Provider (per-conversation state)
// ============================================================================

interface ConversationProviderProps {
  children: React.ReactNode;
  conversationId: string;
}

export function ConversationProvider({
  children,
  conversationId,
}: ConversationProviderProps) {
  const chat = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Find conversation from chat context
  const conversation = useMemo(
    () => chat.conversations.find((c) => c.id === conversationId) || null,
    [chat.conversations, conversationId]
  );

  // Load messages
  useEffect(() => {
    let mounted = true;

    const loadMessages = () => {
      if (!chat.engine) return;

      setIsLoading(true);
      try {
        const msgs = chat.engine.getMessages(conversationId);
        if (mounted) {
          setMessages(msgs);
          setHasMoreMessages(msgs.length >= 50); // Assume more if full page
        }
      } catch (error) {
        console.error("[ConversationProvider] Failed to load messages:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadMessages();

    // Subscribe to message events
    const handleMessageAdded = (event: ChatEvent) => {
      if (event.conversationId !== conversationId || !event.payload) return;
      const newMsg = event.payload as Message;
      setMessages((prev) => [...prev, newMsg]);
    };

    const handleMessageUpdated = (event: ChatEvent) => {
      if (event.conversationId !== conversationId || !event.payload) return;
      const updated = event.payload as Message;
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
    };

    const handleMessageRemoved = (event: ChatEvent) => {
      if (event.conversationId !== conversationId || !event.messageId) return;
      setMessages((prev) => prev.filter((m) => m.id !== event.messageId));
    };

    if (chat.engine) {
      chat.engine.on("message_added", handleMessageAdded);
      chat.engine.on("message_updated", handleMessageUpdated);
      chat.engine.on("message_removed", handleMessageRemoved);
    }

    return () => {
      mounted = false;
      if (chat.engine) {
        chat.engine.off("message_added", handleMessageAdded);
        chat.engine.off("message_updated", handleMessageUpdated);
        chat.engine.off("message_removed", handleMessageRemoved);
      }
    };
  }, [chat.engine, conversationId]);

  // Mark as read when conversation is opened
  useEffect(() => {
    if (chat.engine && conversationId) {
      chat.markAsRead(conversationId);
    }
  }, [chat, conversationId]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!chat.engine || !hasMoreMessages || isLoading) return;

    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    setIsLoading(true);
    try {
      const olderMessages = await chat.engine.getMessages(conversationId, {
        before: oldestMessage.createdAt,
        limit: 50,
      });

      if (olderMessages.length < 50) {
        setHasMoreMessages(false);
      }

      setMessages((prev) => [...olderMessages, ...prev]);
    } catch (error) {
      console.error("[ConversationProvider] Failed to load more:", error);
    } finally {
      setIsLoading(false);
    }
  }, [chat.engine, conversationId, hasMoreMessages, isLoading, messages]);

  // Get typing users for this conversation
  const typingUsers = useMemo(
    () => chat.getTypingUsers(conversationId),
    [chat, conversationId]
  );

  // Get unread count
  const unreadCount = conversation?.unreadCount || 0;

  const value = useMemo<ConversationContextValue>(
    () => ({
      conversation,
      messages,
      isLoading,
      hasMoreMessages,
      loadMoreMessages,
      typingUsers,
      unreadCount,
    }),
    [
      conversation,
      messages,
      isLoading,
      hasMoreMessages,
      loadMoreMessages,
      typingUsers,
      unreadCount,
    ]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the chat context
 */
export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

/**
 * Hook to access conversation-specific context
 */
export function useConversation(): ConversationContextValue {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
}

/**
 * Hook to get a specific conversation by ID
 */
export function useChatConversation(conversationId: string) {
  const chat = useChat();
  return useMemo(
    () => chat.conversations.find((c) => c.id === conversationId) || null,
    [chat.conversations, conversationId]
  );
}

/**
 * Hook to check if chat is ready
 */
export function useChatReady(): boolean {
  const chat = useChat();
  return chat.isInitialized && !chat.isLoading;
}

/**
 * Hook to get sync status
 */
export function useChatSync() {
  const chat = useChat();
  return {
    isSyncing: chat.syncState.isSyncing,
    isOnline: chat.connectionInfo.state === "connected",
    pendingCount: chat.pendingCount,
    lastSyncAt: chat.syncState.lastSyncAt,
    syncError: chat.syncState.syncError,
  };
}

/**
 * Hook for typing indicator management
 */
export function useTypingIndicator(conversationId: string) {
  const chat = useChat();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    chat.startTyping(conversationId);

    // Auto-stop after 3 seconds of inactivity
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      chat.stopTyping(conversationId);
    }, 3000);
  }, [chat, conversationId]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    chat.stopTyping(conversationId);
  }, [chat, conversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { startTyping, stopTyping };
}

/**
 * Hook to trigger Service Worker chat sync
 */
export function useChatBackgroundSync() {
  const triggerSync = useCallback(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CHAT_TRIGGER_SYNC",
      });
    }
  }, []);

  const getPendingCount = useCallback((): Promise<number> => {
    return new Promise((resolve) => {
      if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
        resolve(0);
        return;
      }

      const handler = (event: MessageEvent) => {
        if (event.data?.type === "CHAT_PENDING_COUNT") {
          navigator.serviceWorker.removeEventListener("message", handler);
          resolve(event.data.count || 0);
        }
      };

      navigator.serviceWorker.addEventListener("message", handler);
      navigator.serviceWorker.controller.postMessage({
        type: "CHAT_GET_PENDING_COUNT",
      });

      // Timeout after 1 second
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener("message", handler);
        resolve(0);
      }, 1000);
    });
  }, []);

  return { triggerSync, getPendingCount };
}
