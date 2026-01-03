"use client";

/**
 * Message List Component
 *
 * Simple, reliable message list using native document flow (Matrix SDK pattern).
 *
 * Why NOT virtualization:
 * - TanStack Virtual uses absolute positioning which causes timing issues
 *   with dynamic heights (measurements update → positions shift → overlap)
 * - Chat applications paginate older messages, so we never have 10,000+ items
 * - Modern browsers handle 100-200 DOM elements easily
 * - CSS overflow-anchor handles scroll position preservation natively
 *
 * Features:
 * - Native flexbox layout (no positioning bugs)
 * - Auto-scroll to bottom for new messages
 * - CSS overflow-anchor for scroll preservation
 * - Reverse infinite scroll (load older at top)
 * - Unfilling: removes messages far off-screen for memory efficiency
 */

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle, useMemo } from "react";
import { cn } from "@/lib/design-system";
import { MessageBubble, TypingIndicator, DateSeparator, type MentionedUser } from "./message-bubble";
import type { Message, ReadReceipt } from "@/app/actions/messaging";

// ============================================================================
// Constants
// ============================================================================

/** Minimum messages to keep in memory */
const MIN_MESSAGES_TO_KEEP = 50;

/** Debounce for unfill requests */
const UNFILL_DEBOUNCE_MS = 200;

/** Threshold for "at bottom" detection */
const BOTTOM_THRESHOLD = 100;

// ============================================================================
// Types
// ============================================================================

export interface VirtualizedMessageListHandle {
  scrollToBottom: () => void;
  scrollToMessage: (messageId: string) => boolean;
}

interface QueuedMessageInfo {
  tempId: string;
  status: "sending" | "failed";
}

interface VirtualizedMessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUsers: string[];
  typingUserNames?: string[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isGroupChat?: boolean;
  highlightedMessageId?: string | null;
  readReceipts?: Record<string, ReadReceipt[]>;
  participantCount?: number;
  mentionedUsers?: Record<string, MentionedUser>;
  onEdit?: (messageId: string, newContent: string) => Promise<void>;
  queuedMessages?: Map<string, QueuedMessageInfo>;
  onRetryMessage?: (tempId: string) => void;
  onRemoveMessage?: (tempId: string) => void;
  onUnfill?: (backwards: boolean, messageCount: number) => void;
  onReply?: (message: Message) => void;
  reactionsMap?: Record<string, import("@/app/actions/messaging").Reaction[]>;
  onReact?: (messageId: string, emoji: string) => void;
  className?: string;
}

interface MessageGroup {
  type: "date" | "message";
  date?: Date;
  message?: Message;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

// ============================================================================
// Helper: Group messages by date with sender grouping
// ============================================================================

function groupMessagesWithDates(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentDateKey = "";
  let previousSenderId = "";

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg) continue;

    const msgDate = new Date(msg.createdAt);
    const dateKey = msgDate.toDateString();

    if (dateKey !== currentDateKey) {
      currentDateKey = dateKey;
      previousSenderId = "";
      groups.push({ type: "date", date: msgDate });
    }

    const isFirstInGroup = msg.senderId !== previousSenderId;
    const nextMsg = messages[i + 1];
    const nextMsgDate = nextMsg ? new Date(nextMsg.createdAt).toDateString() : "";
    const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId || nextMsgDate !== dateKey;

    groups.push({
      type: "message",
      message: msg,
      isFirstInGroup,
      isLastInGroup,
    });

    previousSenderId = msg.senderId;
  }

  return groups;
}

// ============================================================================
// Component
// ============================================================================

export const VirtualizedMessageList = forwardRef<VirtualizedMessageListHandle, VirtualizedMessageListProps>(
  function VirtualizedMessageList({
    messages,
    currentUserId,
    typingUsers,
    typingUserNames = [],
    isLoading = false,
    hasMore = false,
    onLoadMore,
    isGroupChat = false,
    highlightedMessageId,
    readReceipts = {},
    participantCount = 1,
    mentionedUsers = {},
    onEdit,
    queuedMessages,
    onRetryMessage,
    onRemoveMessage,
    onUnfill,
    onReply,
    reactionsMap = {},
    onReact,
    className,
  }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const prevMessagesLengthRef = useRef(messages.length);
    const isLoadingMoreRef = useRef(false);
    const unfillDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Group messages with date separators
    const items = useMemo(() => groupMessagesWithDates(messages), [messages]);
    const showTyping = typingUsers.length > 0;

    /**
     * Scroll to bottom - simple and direct.
     * Works reliably because we use normal document flow (not absolute positioning).
     */
    const scrollToBottom = useCallback(() => {
      const el = containerRef.current;
      if (!el) return;

      // Direct assignment - instant, no animation
      el.scrollTop = el.scrollHeight;
      setIsAtBottom(true);
    }, []);

    /**
     * Scroll to a specific message by ID.
     */
    const scrollToMessage = useCallback((messageId: string): boolean => {
      const el = containerRef.current;
      if (!el) return false;

      const messageEl = el.querySelector(`[data-message-id="${messageId}"]`);
      if (!messageEl) return false;

      messageEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      scrollToBottom,
      scrollToMessage,
    }), [scrollToBottom, scrollToMessage]);

    /**
     * Check if scrolled to bottom
     */
    const checkIfAtBottom = useCallback(() => {
      const el = containerRef.current;
      if (!el) return;

      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
      setIsAtBottom(atBottom);
    }, []);

    /**
     * Check if we should unfill messages far off-screen
     */
    const checkUnfill = useCallback(() => {
      const el = containerRef.current;
      if (!el || !onUnfill || messages.length <= MIN_MESSAGES_TO_KEEP) return;

      const excessAbove = el.scrollTop;

      // If more than 6000px above viewport, unfill top
      if (excessAbove > 6000) {
        const countToRemove = Math.min(
          Math.floor((excessAbove - 3000) / 80),
          messages.length - MIN_MESSAGES_TO_KEEP
        );

        if (countToRemove > 0) {
          if (unfillDebounceRef.current) clearTimeout(unfillDebounceRef.current);
          unfillDebounceRef.current = setTimeout(() => {
            onUnfill(true, countToRemove);
          }, UNFILL_DEBOUNCE_MS);
        }
      }
    }, [messages.length, onUnfill]);

    /**
     * Handle scroll events
     */
    const handleScroll = useCallback(() => {
      const el = containerRef.current;
      if (!el) return;

      checkIfAtBottom();
      checkUnfill();

      // Load more when near top
      if (
        el.scrollTop < 200 &&
        hasMore &&
        !isLoading &&
        !isLoadingMoreRef.current &&
        onLoadMore
      ) {
        isLoadingMoreRef.current = true;
        const scrollHeightBefore = el.scrollHeight;

        onLoadMore();

        // Restore scroll position after loading
        requestAnimationFrame(() => {
          const scrollHeightAfter = el.scrollHeight;
          el.scrollTop += scrollHeightAfter - scrollHeightBefore;
          isLoadingMoreRef.current = false;
        });
      }
    }, [hasMore, isLoading, onLoadMore, checkIfAtBottom, checkUnfill]);

    /**
     * Scroll to bottom when new messages arrive (if already at bottom)
     */
    useEffect(() => {
      const newMessagesAdded = messages.length > prevMessagesLengthRef.current;
      prevMessagesLengthRef.current = messages.length;

      if (newMessagesAdded && isAtBottom) {
        // Use rAF to ensure DOM has updated
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }, [messages.length, isAtBottom, scrollToBottom]);

    /**
     * Initial scroll to bottom
     */
    useEffect(() => {
      if (messages.length > 0 && !isLoading) {
        scrollToBottom();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);

    // Cleanup
    useEffect(() => {
      return () => {
        if (unfillDebounceRef.current) {
          clearTimeout(unfillDebounceRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          className
        )}
        // CSS scroll anchoring - browser preserves scroll position automatically
        style={{ overflowAnchor: "auto" }}
      >
        {/* Loading indicator at top */}
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Load more indicator */}
        {hasMore && messages.length > 0 && (
          <div className="flex items-center justify-center py-3">
            {isLoading ? (
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            ) : (
              <button
                onClick={onLoadMore}
                className="text-xs text-blue-500 hover:text-blue-600 dark:text-cyan-400 dark:hover:text-cyan-300"
              >
                Load earlier messages
              </button>
            )}
          </div>
        )}

        {/* Messages - simple flexbox layout */}
        <div className="flex flex-col">
          {items.map((item, _index) => {
            // Date separator
            if (item.type === "date" && item.date) {
              return (
                <DateSeparator
                  key={`date-${item.date.toISOString()}`}
                  date={item.date.toISOString()}
                />
              );
            }

            // Message bubble
            if (item.type === "message" && item.message) {
              const msg = item.message;
              const isOwn = msg.senderId === currentUserId;
              const isHighlighted = msg.id === highlightedMessageId;

              return (
                <div
                  key={`${msg.id}-${msg.editedAt || ""}`}
                  data-message-id={msg.id}
                  className={cn(isHighlighted && "animate-highlight-message")}
                >
                  <MessageBubble
                    message={msg}
                    isOwnMessage={isOwn}
                    showSender={!isOwn && item.isFirstInGroup && isGroupChat}
                    showAvatar={isGroupChat}
                    isFirstInGroup={item.isFirstInGroup}
                    isLastInGroup={item.isLastInGroup}
                    readReceipts={isOwn ? readReceipts[msg.id] : undefined}
                    conversationType={isGroupChat ? "group" : "direct"}
                    participantCount={participantCount}
                    mentionedUsers={mentionedUsers}
                    onEdit={onEdit}
                    sendStatus={queuedMessages?.get(msg.id)?.status}
                    onRetry={onRetryMessage ? () => onRetryMessage(msg.id) : undefined}
                    onRemove={onRemoveMessage ? () => onRemoveMessage(msg.id) : undefined}
                    onReply={onReply ? () => onReply(msg) : undefined}
                    onScrollToMessage={scrollToMessage}
                    reactions={reactionsMap[msg.id]}
                    onReact={onReact ? (emoji) => onReact(msg.id, emoji) : undefined}
                  />
                </div>
              );
            }

            return null;
          })}

          {/* Typing indicator */}
          {showTyping && (
            <div className="px-4 py-2">
              <TypingIndicator
                names={typingUserNames.length > 0 ? typingUserNames : ["Someone"]}
              />
            </div>
          )}
        </div>

        {/* Bottom padding for read receipts visibility */}
        <div className="h-8" />

        {/* Scroll to bottom button */}
        {!isAtBottom && messages.length > 0 && (
          <button
            onClick={scrollToBottom}
            className={cn(
              "fixed bottom-24 right-8 z-10",
              "w-10 h-10 rounded-full",
              "bg-blue-600 text-white shadow-lg",
              "flex items-center justify-center",
              "hover:bg-blue-700 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
            aria-label="Scroll to bottom"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
