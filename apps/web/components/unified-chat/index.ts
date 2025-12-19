/**
 * Unified Chat Window
 *
 * Consolidates AI Assistant, Ask AI, and Messaging into a single window.
 */

export { UnifiedChatProvider, useUnifiedChat } from "./unified-chat-provider";
export { UnifiedChatWindow } from "./unified-chat-window";
export { FloatingChatButton } from "./floating-chat-button";
export { LazyChatWrapper } from "./lazy-chat-wrapper";
export { openUnifiedChat, openAIAssistant, openMessages, openAssistant } from "./unified-chat-provider";
export type { UnifiedChatState, AIContext, OpenOptions } from "./unified-chat-provider";
