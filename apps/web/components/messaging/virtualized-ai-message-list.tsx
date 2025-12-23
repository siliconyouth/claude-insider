"use client";

/**
 * Virtualized AI Message List
 *
 * High-performance AI chat message list using TanStack Virtual for efficient rendering
 * of long AI conversations. Optimized for the AI Assistant tab with streaming support.
 *
 * Features:
 * - Dynamic height measurement for variable-length messages (including code blocks)
 * - Auto-scroll to bottom for new messages and streaming content
 * - Supports streaming content, loading indicators, and error states
 * - Actions (Listen, Copy) for assistant messages
 */

import { useRef, useEffect, useCallback, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/design-system";
import {
  ChatMessage,
  ChatMessageLoading,
  ChatMessageStreaming,
} from "@/components/chat/chat-message";

// ============================================================================
// Types
// ============================================================================

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

interface Recommendation {
  text: string;
  onClick: () => void;
}

interface VirtualizedAIMessageListProps {
  messages: AIMessage[];
  streamingContent?: string;
  isLoading?: boolean;
  error?: string | null;
  renderActions?: (message: AIMessage, index: number) => ReactNode;
  className?: string;
  /** Inline recommendations shown after the last AI message */
  recommendations?: Recommendation[];
  /** Callback when "Something else" is clicked */
  onSomethingElse?: () => void;
  /** Whether there are more recommendations available */
  hasMoreRecommendations?: boolean;
  /** Whether TTS is currently speaking (for streaming message Stop button) */
  isSpeaking?: boolean;
  /** Callback to stop TTS playback */
  onStopSpeaking?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function VirtualizedAIMessageList({
  messages,
  streamingContent = "",
  isLoading = false,
  error = null,
  renderActions,
  className,
  recommendations = [],
  onSomethingElse,
  hasMoreRecommendations = false,
  isSpeaking = false,
  onStopSpeaking,
}: VirtualizedAIMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessagesLengthRef = useRef(messages.length);
  const prevStreamingRef = useRef(streamingContent);

  // Calculate total items: messages + streaming + loading + error + recommendations
  const hasStreaming = streamingContent.length > 0;
  const hasLoading = isLoading && !hasStreaming;
  const hasError = error !== null;
  const hasRecommendations = recommendations.length > 0 && !isLoading && !hasStreaming;

  const extraItems = (hasStreaming ? 1 : 0) + (hasLoading ? 1 : 0) + (hasError ? 1 : 0) + (hasRecommendations ? 1 : 0);
  const totalCount = messages.length + extraItems;

  // Initialize virtualizer
  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => parentRef.current,
    // Estimate: user messages ~60px, assistant messages ~120px (longer with code)
    estimateSize: (index) => {
      if (index >= messages.length) {
        // Extra items (streaming, loading, error, recommendations)
        if (hasStreaming && index === messages.length) return 100;
        if (hasLoading) return 60;
        if (hasError) return 50;
        if (hasRecommendations) return 80; // Recommendations row
        return 60;
      }
      const msg = messages[index];
      // Assistant messages tend to be longer
      return msg?.role === "assistant" ? 120 : 60;
    },
    overscan: 5, // Fewer overscan items since AI chats are typically shorter
    // Enable dynamic measurement for accurate heights
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Check if scrolled to bottom
  const checkIfAtBottom = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;

    const threshold = 100;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
  }, []);

  // Handle scroll for bottom detection
  const handleScroll = useCallback(() => {
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  // Scroll to bottom when new messages arrive or streaming updates (if at bottom)
  useEffect(() => {
    const newMessagesAdded = messages.length > prevMessagesLengthRef.current;
    const streamingUpdated = streamingContent !== prevStreamingRef.current;

    prevMessagesLengthRef.current = messages.length;
    prevStreamingRef.current = streamingContent;

    if ((newMessagesAdded || streamingUpdated) && isAtBottom) {
      virtualizer.scrollToIndex(totalCount - 1, { align: "end", behavior: "smooth" });
    }
  }, [messages.length, streamingContent, isAtBottom, totalCount, virtualizer]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(totalCount - 1, { align: "end", behavior: "auto" });
      setIsAtBottom(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Scroll to bottom when loading starts (user sent a message)
  useEffect(() => {
    if (isLoading && isAtBottom) {
      virtualizer.scrollToIndex(totalCount - 1, { align: "end", behavior: "smooth" });
    }
  }, [isLoading, isAtBottom, totalCount, virtualizer]);

  // Scroll to bottom when recommendations appear
  useEffect(() => {
    if (hasRecommendations) {
      // Small delay to let the recommendations render and be measured
      setTimeout(() => {
        virtualizer.scrollToIndex(totalCount - 1, { align: "end", behavior: "smooth" });
      }, 100);
    }
  }, [hasRecommendations, totalCount, virtualizer]);

  return (
    <div
      ref={parentRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden",
        className
      )}
    >
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

          // Determine what to render at this index
          const isMessageIndex = index < messages.length;
          const extraIndex = index - messages.length;

          // Message
          if (isMessageIndex) {
            const msg = messages[index];
            if (!msg) return null;

            return (
              <div
                key={`msg-${index}`}
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
                <ChatMessage
                  role={msg.role}
                  content={msg.content}
                  actions={renderActions?.(msg, index)}
                />
              </div>
            );
          }

          // Streaming content
          if (hasStreaming && extraIndex === 0) {
            return (
              <div
                key="streaming"
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
                <ChatMessageStreaming content={streamingContent} />
                {/* Stop button when auto-speaking during fake-stream */}
                {isSpeaking && onStopSpeaking && (
                  <div className="flex justify-end px-4 -mt-2 mb-2">
                    <button
                      onClick={onStopSpeaking}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
                        "bg-red-500/10 text-red-600 dark:text-red-400",
                        "hover:bg-red-500/20 transition-colors"
                      )}
                      aria-label="Stop speaking"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                      Stop
                    </button>
                  </div>
                )}
              </div>
            );
          }

          // Loading indicator - animated typing dots while waiting for response
          const loadingIndex = hasStreaming ? 1 : 0;
          if (hasLoading && extraIndex === loadingIndex) {
            return (
              <div
                key="loading"
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
                <ChatMessageLoading />
              </div>
            );
          }

          // Error message
          const errorIndex = (hasStreaming ? 1 : 0) + (hasLoading ? 1 : 0);
          if (hasError && extraIndex === errorIndex) {
            return (
              <div
                key="error"
                data-index={index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex justify-center py-2"
              >
                <div className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              </div>
            );
          }

          // Inline recommendations
          const recsIndex = (hasStreaming ? 1 : 0) + (hasLoading ? 1 : 0) + (hasError ? 1 : 0);
          if (hasRecommendations && extraIndex === recsIndex) {
            return (
              <div
                key="recommendations"
                data-index={index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="px-4 py-3"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Suggested follow-ups:
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendations.map((rec, i) => (
                    <button
                      key={i}
                      onClick={rec.onClick}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm",
                        "bg-gray-100 dark:bg-gray-800",
                        "text-gray-700 dark:text-gray-300",
                        "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                        "border border-transparent hover:border-blue-300 dark:hover:border-blue-700",
                        "transition-all duration-200"
                      )}
                    >
                      {rec.text}
                    </button>
                  ))}
                  {hasMoreRecommendations && onSomethingElse && (
                    <button
                      onClick={onSomethingElse}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm",
                        "bg-gradient-to-r from-violet-100 to-blue-100",
                        "dark:from-violet-900/30 dark:to-blue-900/30",
                        "text-violet-700 dark:text-violet-300",
                        "hover:from-violet-200 hover:to-blue-200",
                        "dark:hover:from-violet-800/40 dark:hover:to-blue-800/40",
                        "transition-all duration-200"
                      )}
                    >
                      Something else →
                    </button>
                  )}
                </div>
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
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-lg",
            "flex items-center justify-center",
            "hover:shadow-xl hover:shadow-blue-500/25 transition-all",
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
