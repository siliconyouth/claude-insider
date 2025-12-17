"use client";

/**
 * Virtualized Message List
 *
 * High-performance message list using TanStack Virtual for efficient rendering
 * of large conversation histories. Only renders visible messages + overscan.
 *
 * Features:
 * - Dynamic height measurement for variable-length messages
 * - Reverse infinite scroll (load older messages at top)
 * - Auto-scroll to bottom for new messages
 * - Maintains scroll position when loading older messages
 */

import { useRef, useEffect, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/design-system";
import { MessageBubble, TypingIndicator, DateSeparator } from "./message-bubble";
import type { Message } from "@/app/actions/messaging";

// ============================================================================
// Types
// ============================================================================

interface VirtualizedMessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUsers: string[];
  typingUserNames?: string[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** Whether this is a group chat (shows avatars) or 1:1 DM (hides avatars) */
  isGroupChat?: boolean;
  /** Message ID to highlight (for deep linking) */
  highlightedMessageId?: string | null;
  className?: string;
}

interface MessageGroup {
  type: "date" | "message";
  date?: Date;
  message?: Message;
  /** Whether this is the first message in a consecutive sequence from the same sender */
  isFirstInGroup?: boolean;
  /** Whether this is the last message in a consecutive sequence from the same sender */
  isLastInGroup?: boolean;
}

// ============================================================================
// Helper: Group messages by date with sender grouping
// ============================================================================

/**
 * Groups messages by date AND by consecutive sender.
 * This enables a cleaner UI where avatar/name only shows once per sender group.
 *
 * Example:
 * - Alice sends 3 messages → only first shows avatar/name
 * - Bob sends 2 messages → only first shows avatar/name
 * - Alice sends 1 message → shows avatar/name (different group)
 */
function groupMessagesWithDates(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let currentDateKey = "";
  let previousSenderId = "";

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    // Guard against undefined (TypeScript strict mode)
    if (!msg) continue;

    const msgDate = new Date(msg.createdAt);
    const dateKey = msgDate.toDateString();

    // Add date separator if new day (also resets sender grouping)
    if (dateKey !== currentDateKey) {
      currentDateKey = dateKey;
      previousSenderId = ""; // Reset sender tracking on new day
      groups.push({ type: "date", date: msgDate });
    }

    // Check if this is first message in a sender group
    const isFirstInGroup = msg.senderId !== previousSenderId;

    // Look ahead to check if this is the last message from this sender
    const nextMsg = messages[i + 1];
    const nextMsgDate = nextMsg ? new Date(nextMsg.createdAt).toDateString() : "";
    const isLastInGroup =
      !nextMsg || // No next message
      nextMsg.senderId !== msg.senderId || // Different sender
      nextMsgDate !== dateKey; // Different day

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

export function VirtualizedMessageList({
  messages,
  currentUserId,
  typingUsers,
  typingUserNames = [],
  isLoading = false,
  hasMore = false,
  onLoadMore,
  isGroupChat = false,
  highlightedMessageId,
  className,
}: VirtualizedMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessagesLengthRef = useRef(messages.length);
  const isLoadingMoreRef = useRef(false);

  // Group messages with date separators
  const items = groupMessagesWithDates(messages);

  // Add typing indicator as a virtual item if someone is typing
  const showTyping = typingUsers.length > 0;
  const totalCount = items.length + (showTyping ? 1 : 0);

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => parentRef.current,
    // Estimate: date separators are ~40px, messages average ~80px
    estimateSize: (index) => {
      if (index >= items.length) return 40; // Typing indicator
      const item = items[index];
      return item?.type === "date" ? 40 : 80;
    },
    overscan: 10, // Render 10 extra items for smooth scrolling
    // Enable dynamic measurement for accurate heights
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Check if scrolled to bottom
  const checkIfAtBottom = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;

    const threshold = 100; // Consider "at bottom" if within 100px
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
  }, []);

  // Handle scroll for infinite loading and bottom detection
  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;

    checkIfAtBottom();

    // Load more when scrolled near top (reverse infinite scroll)
    if (
      el.scrollTop < 200 &&
      hasMore &&
      !isLoading &&
      !isLoadingMoreRef.current &&
      onLoadMore
    ) {
      isLoadingMoreRef.current = true;
      // Store current scroll position to restore after loading
      const scrollHeightBefore = el.scrollHeight;

      onLoadMore();

      // Restore scroll position after new messages are added
      requestAnimationFrame(() => {
        const scrollHeightAfter = el.scrollHeight;
        const diff = scrollHeightAfter - scrollHeightBefore;
        el.scrollTop += diff;
        isLoadingMoreRef.current = false;
      });
    }
  }, [hasMore, isLoading, onLoadMore, checkIfAtBottom]);

  // Scroll to bottom when new messages arrive (if already at bottom)
  useEffect(() => {
    const newMessagesAdded = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (newMessagesAdded && isAtBottom) {
      // Use scrollToIndex for smooth scroll to last item
      virtualizer.scrollToIndex(totalCount - 1, { align: "end", behavior: "smooth" });
    }
  }, [messages.length, isAtBottom, totalCount, virtualizer]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      virtualizer.scrollToIndex(totalCount - 1, { align: "end", behavior: "auto" });
      setIsAtBottom(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]); // Only on initial load

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden",
        className
      )}
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

      {/* Virtual list container */}
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const index = virtualRow.index;

          // Typing indicator (always at the end)
          if (index >= items.length) {
            return (
              <div
                key="typing-indicator"
                data-index={index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="px-4 py-2"
              >
                <TypingIndicator
                  names={typingUserNames.length > 0 ? typingUserNames : ["Someone"]}
                />
              </div>
            );
          }

          const item = items[index];

          // Guard against undefined items
          if (!item) return null;

          // Date separator
          if (item.type === "date" && item.date) {
            return (
              <div
                key={`date-${item.date.toISOString()}`}
                data-index={index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <DateSeparator date={item.date.toISOString()} />
              </div>
            );
          }

          // Message bubble
          if (item.type === "message" && item.message) {
            const msg = item.message;
            const isOwn = msg.senderId === currentUserId;
            const isHighlighted = msg.id === highlightedMessageId;
            return (
              <div
                key={msg.id}
                data-index={index}
                data-message-id={msg.id}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                  isHighlighted && "animate-highlight-message",
                  "transition-all duration-300"
                )}
              >
                <MessageBubble
                  message={msg}
                  isOwnMessage={isOwn}
                  // Only show sender info for first message in a consecutive group (and only in group chats)
                  showSender={!isOwn && item.isFirstInGroup && isGroupChat}
                  // Show avatars only in group chats
                  showAvatar={isGroupChat}
                  // Use tighter spacing for grouped messages
                  isFirstInGroup={item.isFirstInGroup}
                  isLastInGroup={item.isLastInGroup}
                />
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && messages.length > 0 && (
        <button
          onClick={() => {
            virtualizer.scrollToIndex(totalCount - 1, { align: "end", behavior: "smooth" });
            setIsAtBottom(true);
          }}
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
