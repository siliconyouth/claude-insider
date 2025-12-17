"use client";

/**
 * Unified Chat Provider
 *
 * Global context for the unified chat window.
 * Manages state for both AI Assistant and Messages tabs.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

// ============================================================================
// Types
// ============================================================================

export interface AIContext {
  page?: {
    path: string;
    title?: string;
    section?: string;
    category?: string;
  };
  content?: {
    type: string;
    title?: string;
    code?: string;
    language?: string;
  };
}

export interface OpenOptions {
  // AI options
  context?: AIContext;
  question?: string;

  // Messages options
  conversationId?: string;
  userId?: string;
  messageId?: string; // For deep linking to a specific message
}

export interface UnifiedChatState {
  isOpen: boolean;
  isFullscreen: boolean;
  activeTab: "ai" | "messages";

  // AI Assistant state
  aiContext: AIContext | null;
  aiQuestion: string;

  // Messages state
  selectedConversationId: string | null;
  selectedUserId: string | null;
  targetMessageId: string | null; // For scrolling to a specific message
  pendingVerificationId: string | null; // For E2EE verification from notification
}

interface UnifiedChatContextType extends UnifiedChatState {
  // Opening methods
  openUnifiedChat: (mode: "ai" | "messages", options?: OpenOptions) => void;
  openAIAssistant: (options?: { context?: AIContext; question?: string }) => void;
  openMessages: (options?: { conversationId?: string; userId?: string }) => void;

  // Navigation
  switchTab: (tab: "ai" | "messages") => void;
  close: () => void;
  toggleFullscreen: () => void;

  // AI-specific
  setAIContext: (context: AIContext | null) => void;
  setAIQuestion: (question: string) => void;
  clearAIContext: () => void;

  // Messages-specific
  selectConversation: (conversationId: string | null) => void;
  startConversationWithUser: (userId: string) => void;
  clearTargetMessage: () => void;
  clearPendingVerification: () => void;

  // Unread count for badge
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

// ============================================================================
// Context
// ============================================================================

const UnifiedChatContext = createContext<UnifiedChatContextType | null>(null);

// Global functions for external access (e.g., openAssistant())
let globalOpenUnifiedChat: ((mode: "ai" | "messages", options?: OpenOptions) => void) | null = null;
let globalOpenAIAssistant: ((options?: { context?: AIContext; question?: string }) => void) | null = null;
let globalOpenMessages: ((options?: { conversationId?: string; userId?: string; messageId?: string }) => void) | null = null;

export function openUnifiedChat(mode: "ai" | "messages", options?: OpenOptions) {
  if (globalOpenUnifiedChat) {
    globalOpenUnifiedChat(mode, options);
  }
}

export function openAIAssistant(options?: { context?: AIContext; question?: string }) {
  if (globalOpenAIAssistant) {
    globalOpenAIAssistant(options);
  }
}

export function openMessages(options?: { conversationId?: string; userId?: string; messageId?: string }) {
  if (globalOpenMessages) {
    globalOpenMessages(options);
  }
}

// Legacy export for compatibility with existing code
export function openAssistant() {
  openAIAssistant();
}

// ============================================================================
// Provider
// ============================================================================

export function UnifiedChatProvider({ children }: { children: ReactNode }) {
  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "messages">("ai");

  // AI state
  const [aiContext, setAIContext] = useState<AIContext | null>(null);
  const [aiQuestion, setAIQuestion] = useState("");

  // Messages state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);
  const [pendingVerificationId, setPendingVerificationId] = useState<string | null>(null);

  // Unread count for badge
  const [unreadCount, setUnreadCount] = useState(0);

  // ============================================================================
  // Opening Methods
  // ============================================================================

  const openUnifiedChatFn = useCallback((mode: "ai" | "messages", options?: OpenOptions) => {
    setActiveTab(mode);
    setIsOpen(true);

    if (mode === "ai") {
      if (options?.context) setAIContext(options.context);
      if (options?.question) setAIQuestion(options.question);
    } else {
      if (options?.conversationId) setSelectedConversationId(options.conversationId);
      if (options?.userId) setSelectedUserId(options.userId);
      if (options?.messageId) setTargetMessageId(options.messageId);
    }
  }, []);

  const openAIAssistantFn = useCallback((options?: { context?: AIContext; question?: string }) => {
    setActiveTab("ai");
    setIsOpen(true);
    if (options?.context) setAIContext(options.context);
    if (options?.question) setAIQuestion(options.question);
  }, []);

  const openMessagesFn = useCallback((options?: { conversationId?: string; userId?: string; messageId?: string }) => {
    setActiveTab("messages");
    setIsOpen(true);
    if (options?.conversationId) setSelectedConversationId(options.conversationId);
    if (options?.userId) setSelectedUserId(options.userId);
    if (options?.messageId) setTargetMessageId(options.messageId);
  }, []);

  // Register global functions on mount
  useEffect(() => {
    globalOpenUnifiedChat = openUnifiedChatFn;
    globalOpenAIAssistant = openAIAssistantFn;
    globalOpenMessages = openMessagesFn;
  }, [openUnifiedChatFn, openAIAssistantFn, openMessagesFn]);

  // Handle URL parameters for deep linking (e.g., from notification clicks)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const openChat = params.get("openChat");
    const conversation = params.get("conversation");
    const message = params.get("message");
    const verify = params.get("verify");

    if (openChat === "messages" && conversation) {
      // Open the messages tab with the specified conversation and message
      openMessagesFn({
        conversationId: conversation,
        messageId: message || undefined,
      });

      // Clean up URL parameters after handling
      const url = new URL(window.location.href);
      url.searchParams.delete("openChat");
      url.searchParams.delete("conversation");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.pathname + url.search);
    } else if (openChat === "ai") {
      openAIAssistantFn();

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("openChat");
      window.history.replaceState({}, "", url.pathname + url.search);
    } else if (verify) {
      // Handle E2EE verification deep link from notification
      // Set pending verification and open messages tab
      setPendingVerificationId(verify);
      openMessagesFn();

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("verify");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [openMessagesFn, openAIAssistantFn]);

  // ============================================================================
  // Navigation
  // ============================================================================

  const switchTab = useCallback((tab: "ai" | "messages") => {
    setActiveTab(tab);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Don't clear state on close - preserve for when reopened
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // ============================================================================
  // AI Methods
  // ============================================================================

  const clearAIContext = useCallback(() => {
    setAIContext(null);
    setAIQuestion("");
  }, []);

  // ============================================================================
  // Messages Methods
  // ============================================================================

  const selectConversation = useCallback((conversationId: string | null) => {
    setSelectedConversationId(conversationId);
    setSelectedUserId(null);
  }, []);

  const startConversationWithUser = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setSelectedConversationId(null);
  }, []);

  const clearTargetMessage = useCallback(() => {
    setTargetMessageId(null);
  }, []);

  const clearPendingVerification = useCallback(() => {
    setPendingVerificationId(null);
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: UnifiedChatContextType = {
    // State
    isOpen,
    isFullscreen,
    activeTab,
    aiContext,
    aiQuestion,
    selectedConversationId,
    selectedUserId,
    targetMessageId,
    pendingVerificationId,
    unreadCount,

    // Methods
    openUnifiedChat: openUnifiedChatFn,
    openAIAssistant: openAIAssistantFn,
    openMessages: openMessagesFn,
    switchTab,
    close,
    toggleFullscreen,
    setAIContext,
    setAIQuestion,
    clearAIContext,
    selectConversation,
    startConversationWithUser,
    clearTargetMessage,
    clearPendingVerification,
    setUnreadCount,
  };

  return (
    <UnifiedChatContext.Provider value={value}>
      {children}
    </UnifiedChatContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useUnifiedChat(): UnifiedChatContextType {
  const context = useContext(UnifiedChatContext);
  if (!context) {
    throw new Error("useUnifiedChat must be used within UnifiedChatProvider");
  }
  return context;
}
