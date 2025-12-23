/**
 * Chat Message Styles
 *
 * Centralized style constants for consistent message rendering
 * across all chat interfaces (unified chat, full-screen, modal).
 *
 * Design System Compliance:
 * - User messages: Primary gradient (violet → blue → cyan)
 * - AI messages: Emerald accent (semantic AI distinction)
 * - Animations: fade-in-up entrance
 */

import { cn } from "@/lib/design-system";

/**
 * Chat message style constants
 */
export const chatMessageStyles = {
  // Container alignment with consistent spacing
  container: {
    base: "flex px-4 py-2",
    user: "justify-end",
    assistant: "justify-start",
  },

  // Message bubble styles
  bubble: {
    base: "max-w-[85%] rounded-2xl px-4 py-3",
    user: cn(
      "rounded-br-sm", // Tail cutoff on bottom-right
      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
      "text-white"
    ),
    assistant: cn(
      "rounded-bl-sm", // Tail cutoff on bottom-left
      "bg-emerald-50 dark:bg-emerald-900/20",
      "border border-emerald-200 dark:border-emerald-800",
      "text-gray-900 dark:text-white"
    ),
  },

  // AI Avatar styles
  avatar: {
    container: cn(
      "flex-shrink-0 w-7 h-7 rounded-full",
      "bg-emerald-100 dark:bg-emerald-900/30",
      "border border-emerald-200 dark:border-emerald-800",
      "flex items-center justify-center"
    ),
    icon: "w-4 h-4 text-emerald-600 dark:text-emerald-400",
  },

  // Animation classes
  animation: {
    entrance: "animate-fade-in-up",
    // Reduced motion support handled via CSS media query
  },

  // Loading state styles
  loading: {
    bubble: cn(
      "rounded-2xl rounded-bl-sm px-4 py-3",
      "bg-emerald-50 dark:bg-emerald-900/20",
      "border border-emerald-200 dark:border-emerald-800"
    ),
    dot: "h-2 w-2 animate-bounce rounded-full bg-emerald-500 dark:bg-emerald-400",
    dotDelays: [
      "[animation-delay:-0.3s]",
      "[animation-delay:-0.15s]",
      "", // No delay for third dot
    ],
  },

  // Prose styling for message content
  content: {
    prose: "prose prose-sm dark:prose-invert max-w-none",
    // Link colors within messages
    link: "text-blue-600 dark:text-cyan-400 hover:underline",
  },

  // Action buttons (TTS, Copy)
  actions: {
    container: "flex items-center gap-2 mt-2",
    button: cn(
      "flex items-center gap-1 px-2 py-1 rounded text-sm",
      "text-gray-500 dark:text-gray-400",
      "hover:text-gray-700 dark:hover:text-gray-300",
      "hover:bg-gray-100 dark:hover:bg-gray-700",
      "transition-all duration-200"
    ),
    buttonActive: cn(
      "text-white dark:text-white",
      "bg-emerald-500 dark:bg-emerald-600",
      "scale-105 shadow-sm",
      "hover:bg-emerald-500 dark:hover:bg-emerald-600",
      "hover:text-white dark:hover:text-white"
    ),
  },
} as const;

/**
 * Helper to get bubble classes based on role
 */
export function getBubbleClasses(
  role: "user" | "assistant",
  options?: { animate?: boolean; isStreaming?: boolean }
) {
  const { animate = true, isStreaming = false } = options || {};

  return cn(
    chatMessageStyles.bubble.base,
    chatMessageStyles.bubble[role],
    animate && !isStreaming && chatMessageStyles.animation.entrance
  );
}

/**
 * Helper to get container classes based on role
 */
export function getContainerClasses(role: "user" | "assistant") {
  return cn(chatMessageStyles.container.base, chatMessageStyles.container[role]);
}
