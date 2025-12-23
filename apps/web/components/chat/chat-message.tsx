/**
 * ChatMessage Component
 *
 * Shared message component for consistent rendering across all chat interfaces.
 * Features:
 * - User messages: Right-aligned with primary gradient
 * - AI messages: Left-aligned with emerald accent + Claude icon
 * - Entrance animations (respects reduced motion)
 * - Action buttons slot (TTS, Copy)
 */

"use client";

import { cn } from "@/lib/design-system";
import {
  chatMessageStyles as styles,
  getBubbleClasses,
  getContainerClasses,
} from "./chat-message-styles";
import { MarkdownContent } from "./markdown-content";

// ============================================================================
// TYPES
// ============================================================================

export interface ChatMessageProps {
  /** Message role - determines styling and alignment */
  role: "user" | "assistant";
  /** Message content (markdown supported for assistant) */
  content: string;
  /** Whether the message is currently streaming */
  isStreaming?: boolean;
  /** Whether to show the AI avatar (default: true for assistant) */
  showAvatar?: boolean;
  /** Whether to animate entrance (default: true) */
  animate?: boolean;
  /** Action buttons to render below message (TTS, Copy, etc.) */
  actions?: React.ReactNode;
  /** Additional className for the container */
  className?: string;
}

// ============================================================================
// CLAUDE ICON
// ============================================================================

/**
 * Claude-style sparkle icon for AI messages
 * Represents intelligence/AI with a 4-point star design
 */
export function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* 4-point sparkle star */}
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

// ============================================================================
// CHAT MESSAGE
// ============================================================================

/**
 * Main message component
 *
 * @example
 * // User message
 * <ChatMessage role="user" content="Hello!" />
 *
 * @example
 * // AI message with actions
 * <ChatMessage
 *   role="assistant"
 *   content="I can help with that!"
 *   actions={<CopyButton onClick={handleCopy} />}
 * />
 */
export function ChatMessage({
  role,
  content,
  isStreaming = false,
  showAvatar = true,
  animate = true,
  actions,
  className,
}: ChatMessageProps) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <div className={cn(getContainerClasses(role), className)}>
      {/* AI Avatar - only shown for assistant messages */}
      {isAssistant && showAvatar && (
        <div className={styles.avatar.container} aria-label="Claude AI">
          <ClaudeIcon className={styles.avatar.icon} />
        </div>
      )}

      {/* Message content wrapper */}
      <div className={cn("flex flex-col", isAssistant && showAvatar && "ml-3")}>
        {/* Message bubble */}
        <div className={getBubbleClasses(role, { animate, isStreaming })}>
          {isUser ? (
            // User messages: plain text
            <span>{content}</span>
          ) : (
            // Assistant messages: properly rendered markdown with links
            <MarkdownContent content={content} />
          )}
        </div>

        {/* Action buttons (TTS, Copy) - only for assistant messages */}
        {actions && isAssistant && (
          <div className={styles.actions.container}>{actions}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

/**
 * Loading indicator for when AI is thinking
 * Shows emerald-themed bouncing dots with Claude avatar
 */
export function ChatMessageLoading({
  showAvatar = true,
  className,
}: {
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(getContainerClasses("assistant"), className)}>
      {/* AI Avatar */}
      {showAvatar && (
        <div className={styles.avatar.container} aria-label="Claude AI thinking">
          <ClaudeIcon className={styles.avatar.icon} />
        </div>
      )}

      {/* Loading bubble */}
      <div className={cn(styles.loading.bubble, showAvatar && "ml-3")}>
        <div className="flex space-x-1" role="status" aria-label="Loading">
          {styles.loading.dotDelays.map((delay, i) => (
            <div key={i} className={cn(styles.loading.dot, delay)} />
          ))}
          <span className="sr-only">Claude is thinking...</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STREAMING STATE
// ============================================================================

/**
 * Streaming message component for real-time AI responses
 * Same as ChatMessage but without entrance animation
 */
export function ChatMessageStreaming({
  content,
  showAvatar = true,
  className,
}: {
  content: string;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <ChatMessage
      role="assistant"
      content={content}
      isStreaming={true}
      showAvatar={showAvatar}
      animate={false}
      className={className}
    />
  );
}

// ============================================================================
// ACTION BUTTON
// ============================================================================

/**
 * Reusable action button for message actions (TTS, Copy)
 */
export function ChatMessageAction({
  onClick,
  isActive = false,
  children,
  ariaLabel,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(styles.actions.button, isActive && styles.actions.buttonActive)}
      aria-label={ariaLabel}
      type="button"
    >
      {children}
    </button>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { chatMessageStyles, getBubbleClasses, getContainerClasses } from "./chat-message-styles";
