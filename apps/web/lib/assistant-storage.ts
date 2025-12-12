/**
 * Assistant Storage Module
 *
 * Manages localStorage for:
 * - Custom assistant name
 * - Multiple conversations with IDs and titles
 * - Active conversation tracking
 */

import type { Message } from "./claude-utils";

// Storage keys
const STORAGE_KEYS = {
  ASSISTANT_NAME: "claude-insider-assistant-name",
  CONVERSATIONS: "claude-insider-conversations",
  ACTIVE_CONVERSATION: "claude-insider-active-conversation",
  // Legacy key for migration
  LEGACY_HISTORY: "claude-insider-assistant-history",
} as const;

// Default assistant name
export const DEFAULT_ASSISTANT_NAME = "Claude Insider Assistant";

// Maximum conversations to keep
const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES_PER_CONVERSATION = 50;

// Conversation interface
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// =============================================================================
// ASSISTANT NAME MANAGEMENT
// =============================================================================

/**
 * Get the custom assistant name from localStorage
 */
export function getAssistantName(): string {
  if (typeof window === "undefined") return DEFAULT_ASSISTANT_NAME;

  try {
    const name = localStorage.getItem(STORAGE_KEYS.ASSISTANT_NAME);
    return name && name.trim() ? name.trim() : DEFAULT_ASSISTANT_NAME;
  } catch {
    return DEFAULT_ASSISTANT_NAME;
  }
}

/**
 * Set a custom assistant name
 */
export function setAssistantName(name: string): void {
  if (typeof window === "undefined") return;

  try {
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEYS.ASSISTANT_NAME, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ASSISTANT_NAME);
    }
  } catch {
    // Silently fail if localStorage is full
  }
}

/**
 * Clear custom assistant name (revert to default)
 */
export function clearAssistantName(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEYS.ASSISTANT_NAME);
  } catch {
    // Silently fail
  }
}

// =============================================================================
// CONVERSATION MANAGEMENT
// =============================================================================

/**
 * Generate a unique conversation ID
 */
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a title from the first user message
 */
function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    // Truncate to ~50 chars at word boundary
    if (content.length <= 50) return content;
    const truncated = content.substring(0, 50);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated) + "...";
  }
  return "New conversation";
}

/**
 * Get all conversations from localStorage
 */
export function getAllConversations(): Conversation[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!stored) {
      // Check for legacy data and migrate
      const legacyHistory = localStorage.getItem(STORAGE_KEYS.LEGACY_HISTORY);
      if (legacyHistory) {
        const messages = JSON.parse(legacyHistory) as Message[];
        if (messages.length > 0) {
          // Migrate legacy conversation
          const conversation: Conversation = {
            id: generateConversationId(),
            title: generateTitle(messages),
            messages,
            createdAt: Date.now() - 1000, // Slightly in the past
            updatedAt: Date.now(),
          };
          saveConversation(conversation);
          // Clear legacy storage after migration
          localStorage.removeItem(STORAGE_KEYS.LEGACY_HISTORY);
          return [conversation];
        }
      }
      return [];
    }
    const conversations = JSON.parse(stored) as Conversation[];
    // Sort by updatedAt descending (most recent first)
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/**
 * Get a specific conversation by ID
 */
export function getConversation(id: string): Conversation | null {
  const conversations = getAllConversations();
  return conversations.find((c) => c.id === id) || null;
}

/**
 * Get the active conversation ID
 */
export function getActiveConversationId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
  } catch {
    return null;
  }
}

/**
 * Set the active conversation ID
 */
export function setActiveConversationId(id: string | null): void {
  if (typeof window === "undefined") return;

  try {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Save a conversation (create or update)
 */
export function saveConversation(conversation: Conversation): void {
  if (typeof window === "undefined") return;

  try {
    const conversations = getAllConversations();
    const existingIndex = conversations.findIndex((c) => c.id === conversation.id);

    // Update title based on messages if it's the default
    if (conversation.title === "New conversation" && conversation.messages.length > 0) {
      conversation.title = generateTitle(conversation.messages);
    }

    // Trim messages if too many
    if (conversation.messages.length > MAX_MESSAGES_PER_CONVERSATION) {
      conversation.messages = conversation.messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
    }

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.unshift(conversation);
    }

    // Trim to max conversations
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(trimmed));
  } catch {
    // Silently fail if localStorage is full
  }
}

/**
 * Create a new conversation
 */
export function createConversation(): Conversation {
  const conversation: Conversation = {
    id: generateConversationId(),
    title: "New conversation",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveConversation(conversation);
  setActiveConversationId(conversation.id);
  return conversation;
}

/**
 * Update messages in a conversation
 */
export function updateConversationMessages(id: string, messages: Message[]): void {
  const conversation = getConversation(id);
  if (conversation) {
    conversation.messages = messages;
    conversation.updatedAt = Date.now();
    // Update title if it was default
    if (conversation.title === "New conversation" && messages.length > 0) {
      conversation.title = generateTitle(messages);
    }
    saveConversation(conversation);
  }
}

/**
 * Delete a specific conversation
 */
export function deleteConversation(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const conversations = getAllConversations();
    const filtered = conversations.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));

    // Clear active if it was the deleted one
    if (getActiveConversationId() === id) {
      setActiveConversationId(null);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Clear all conversations
 */
export function clearAllConversations(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    // Also clear legacy storage
    localStorage.removeItem(STORAGE_KEYS.LEGACY_HISTORY);
  } catch {
    // Silently fail
  }
}

/**
 * Get conversation count
 */
export function getConversationCount(): number {
  return getAllConversations().length;
}

/**
 * Format a timestamp for display
 */
export function formatConversationTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return new Date(timestamp).toLocaleDateString();
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
}
