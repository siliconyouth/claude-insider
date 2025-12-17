"use client";

/**
 * Inbox Dropdown Component
 *
 * Shows inbox icon with dropdown of recent conversations.
 * Clicking a conversation opens an inline chat modal.
 *
 * Features:
 * - Real-time unread count badge
 * - Conversation list with avatars, names, previews
 * - Online status indicators
 * - Opens chat in modal (not full page)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { getConversations, type Conversation } from "@/app/actions/messaging";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useIsAuthenticated } from "@/lib/auth-client";
import { AvatarWithStatus } from "@/components/presence";
import { openMessages, useUnifiedChat } from "@/components/unified-chat";
import Link from "next/link";

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Truncate message preview
function truncatePreview(text: string | undefined, maxLength: number = 50): string {
  if (!text) return "No messages yet";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

export function InboxDropdown() {
  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const { setUnreadCount } = useUnifiedChat();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Real-time message updates
  const { unreadCount, refreshCount } = useRealtimeMessages({
    enabled: isAuthenticated,
    onNewMessage: () => {
      // Refresh conversations when new message arrives
      loadConversations();
    },
  });

  // Sync unread count with unified chat provider
  useEffect(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount, setUnreadCount]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingConversations(true);
    const result = await getConversations();
    if (result.success && result.conversations) {
      setConversations(result.conversations);
    }
    setIsLoadingConversations(false);
  }, [isAuthenticated]);

  // Load conversations when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Handle conversation click - open in unified chat window
  const handleConversationClick = (conversation: Conversation) => {
    openMessages({ conversationId: conversation.id });
    setIsOpen(false);
    // The unified chat will handle refreshing after close
  };

  // Note: loadConversations and refreshCount are exposed for potential use by unified chat
  void loadConversations;
  void refreshCount;

  // Don't render if not authenticated
  if (authLoading || !isAuthenticated) {
    return null;
  }

  // Calculate total unread
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const displayUnread = unreadCount > 0 ? unreadCount : totalUnread;

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {/* Inbox Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative p-2 rounded-lg transition-colors",
            "text-gray-600 dark:text-gray-400",
            "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
            "hover:text-gray-900 dark:hover:text-white",
            isOpen && "bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
          )}
          title="Messages"
          aria-label={`Messages${displayUnread > 0 ? `, ${displayUnread} unread` : ""}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {/* Message icon */}
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>

          {/* Unread badge */}
          {displayUnread > 0 && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center",
                "min-w-[18px] h-[18px] px-1",
                "text-xs font-medium text-white",
                "bg-blue-600 rounded-full",
                "animate-pulse"
              )}
            >
              {displayUnread > 99 ? "99+" : displayUnread}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            className={cn(
              "absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)]",
              "bg-white dark:bg-[#111111]",
              "rounded-xl border border-gray-200 dark:border-[#262626]",
              "shadow-xl shadow-black/10",
              "overflow-hidden",
              "z-50",
              "animate-fade-in"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Messages
              </h3>
              <div className="flex items-center gap-2">
                {displayUnread > 0 && (
                  <span className="text-xs text-blue-600 dark:text-cyan-400 font-medium">
                    {displayUnread} unread
                  </span>
                )}
                <Link
                  href="/inbox"
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setIsOpen(false)}
                >
                  View all
                </Link>
              </div>
            </div>

            {/* Conversation List */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No conversations yet
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Start a conversation from a user profile
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                  {conversations.map((conversation) => {
                    const otherParticipant = conversation.participants[0];
                    const isUnread = conversation.unreadCount > 0;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => handleConversationClick(conversation)}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                          "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                          isUnread && "bg-blue-50/50 dark:bg-blue-900/10"
                        )}
                      >
                        {/* Avatar with online status */}
                        <div className="relative flex-shrink-0">
                          <AvatarWithStatus
                            src={otherParticipant?.avatarUrl}
                            name={otherParticipant?.displayName || otherParticipant?.name}
                            status={otherParticipant?.status || "offline"}
                            size="md"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "font-medium truncate",
                                isUnread
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-700 dark:text-gray-300"
                              )}
                            >
                              {otherParticipant?.displayName ||
                                otherParticipant?.name ||
                                "Unknown"}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {conversation.lastMessageAt
                                ? formatRelativeTime(conversation.lastMessageAt)
                                : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p
                              className={cn(
                                "text-sm truncate",
                                isUnread
                                  ? "text-gray-700 dark:text-gray-300 font-medium"
                                  : "text-gray-500 dark:text-gray-400"
                              )}
                            >
                              {truncatePreview(conversation.lastMessagePreview)}
                            </p>
                            {isUnread && (
                              <span
                                className={cn(
                                  "flex-shrink-0 flex items-center justify-center",
                                  "min-w-[20px] h-5 px-1.5",
                                  "text-xs font-medium text-white",
                                  "bg-blue-600 rounded-full"
                                )}
                              >
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          {/* Online indicator text */}
                          {otherParticipant?.status === "online" && (
                            <span className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                              Online
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {conversations.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-[#262626]">
                <Link
                  href="/inbox"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "w-full flex items-center justify-center gap-1 py-2 px-4",
                    "text-sm font-medium",
                    "text-blue-600 dark:text-cyan-400",
                    "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                    "rounded-lg transition-colors"
                  )}
                >
                  Open Inbox
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

    </>
  );
}

export default InboxDropdown;
