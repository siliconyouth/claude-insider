"use client";

/**
 * Inbox Component (v2.0)
 *
 * Redesigned to match the Messages Tab in the unified chat window.
 * Main messaging interface with:
 * - Conversation list sidebar with search
 * - User search for new conversations
 * - Active conversation view with all v2 features
 * - Deep linking support for notifications
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { AvatarWithStatus } from "@/components/presence";
import { ConversationView } from "./conversation-view";
import {
  getConversations,
  getUsersForMessaging,
  startConversation,
  markConversationAsRead,
  type Conversation,
} from "@/app/actions/messaging";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";

interface InboxProps {
  currentUserId: string;
  initialConversationId?: string;
  targetMessageId?: string | null;
  className?: string;
}

export function Inbox({
  currentUserId,
  initialConversationId,
  targetMessageId: initialTargetMessageId,
  className,
}: InboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationSearchQuery, setConversationSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      name?: string;
      displayName?: string;
      avatarUrl?: string;
      status: "online" | "offline" | "idle";
      isAiAssistant: boolean;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [targetMessageId, setTargetMessageId] = useState<string | null>(
    initialTargetMessageId || null
  );

  // Load conversations
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    const result = await getConversations();
    if (result.success && result.conversations) {
      setConversations(result.conversations);

      // Auto-select initial conversation
      if (initialConversationId) {
        const initial = result.conversations.find(
          (c) => c.id === initialConversationId
        );
        if (initial) setSelectedConversation(initial);
      }
    }
    setIsLoading(false);
  }, [initialConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Search users for new conversation
  useEffect(() => {
    const searchUsers = async () => {
      if (!showNewChat) return;

      setIsSearching(true);
      const result = await getUsersForMessaging(searchQuery || undefined, 20);
      if (result.success && result.users) {
        setSearchResults(result.users);
      }
      setIsSearching(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, showNewChat]);

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) => {
    if (!conversationSearchQuery.trim()) return true;
    const participant = conv.participants[0];
    const name =
      participant?.displayName || participant?.name || "";
    return name.toLowerCase().includes(conversationSearchQuery.toLowerCase());
  });

  // Start new conversation
  const handleStartConversation = async (userId: string) => {
    const result = await startConversation(userId);
    if (result.success && result.conversationId) {
      setShowNewChat(false);
      setSearchQuery("");
      await loadConversations();

      // Select the new conversation
      const newConv = conversations.find((c) => c.id === result.conversationId);
      if (newConv) {
        setSelectedConversation(newConv);
      } else {
        // Reload to get fresh data
        const reloadResult = await getConversations();
        if (reloadResult.success && reloadResult.conversations) {
          const conv = reloadResult.conversations.find(
            (c) => c.id === result.conversationId
          );
          if (conv) {
            setConversations(reloadResult.conversations);
            setSelectedConversation(conv);
          }
        }
      }
    }
  };

  // Format time for conversation list
  const formatConversationTime = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Handle target message scrolled (clear deep link)
  const handleTargetMessageScrolled = useCallback(() => {
    setTargetMessageId(null);
  }, []);

  // Handle conversation selection - mark as read and update local state
  const handleSelectConversation = useCallback((conversation: Conversation | null) => {
    if (conversation && conversation.unreadCount > 0) {
      // Update local conversations state to mark as read
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, unreadCount: 0 } : c
        )
      );

      // Mark as read in database (non-blocking)
      markConversationAsRead(conversation.id);
    }

    setSelectedConversation(conversation);
  }, []);

  return (
    <div className={cn("flex h-full overflow-hidden", className)}>
      {/* Sidebar - Conversation List */}
      <div
        className={cn(
          "w-full lg:w-80 flex-shrink-0 border-r border-gray-200 dark:border-[#262626]",
          "flex flex-col min-h-0 bg-white dark:bg-[#0a0a0a]",
          selectedConversation ? "hidden lg:flex" : "flex"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#262626]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                showNewChat
                  ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                  : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
              )}
              title="New message"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Search conversations or users */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={showNewChat ? searchQuery : conversationSearchQuery}
              onChange={(e) =>
                showNewChat
                  ? setSearchQuery(e.target.value)
                  : setConversationSearchQuery(e.target.value)
              }
              placeholder={showNewChat ? "Search users..." : "Search conversations..."}
              className={cn(
                "w-full pl-9 pr-4 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "placeholder-gray-500",
                "border-0 focus:ring-2 focus:ring-blue-500"
              )}
              autoFocus={showNewChat}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showNewChat ? (
            // User search results
            <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <SearchIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? "No users found" : "Search for users to message"}
                  </p>
                </div>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartConversation(user.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3",
                      "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                      "transition-colors text-left"
                    )}
                  >
                    <AvatarWithStatus
                      src={user.avatarUrl}
                      name={user.displayName || user.name}
                      status={user.status}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {user.displayName || user.name || "Unknown"}
                        </p>
                        {user.isAiAssistant && (
                          <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded">
                            AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {user.status === "online"
                          ? "Online"
                          : user.status === "idle"
                          ? "Away"
                          : "Offline"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : isLoading ? (
            // Loading state
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-600/10 via-blue-600/10 to-cyan-600/10 flex items-center justify-center mb-4">
                <MessageIcon className="w-8 h-8 text-blue-600 dark:text-cyan-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {conversationSearchQuery ? "No conversations found" : "No conversations yet"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {conversationSearchQuery
                  ? "Try a different search term"
                  : "Start a conversation to get going"}
              </p>
              {!conversationSearchQuery && (
                <button
                  onClick={() => setShowNewChat(true)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white",
                    "hover:shadow-lg hover:shadow-blue-500/25",
                    "transition-all duration-200"
                  )}
                >
                  New Message
                </button>
              )}
            </div>
          ) : (
            // Conversation list
            <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
              {filteredConversations.map((conv) => {
                const otherParticipant = conv.participants[0];
                const isSelected = selectedConversation?.id === conv.id;
                const isAI = otherParticipant?.userId === AI_ASSISTANT_USER_ID;
                const isUnread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3",
                      "transition-colors text-left",
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : isUnread
                        ? "bg-blue-50/50 dark:bg-blue-900/10"
                        : "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                    )}
                  >
                    <AvatarWithStatus
                      src={otherParticipant?.avatarUrl}
                      name={otherParticipant?.displayName || otherParticipant?.name}
                      status={otherParticipant?.status || "offline"}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
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
                          {isAI && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded">
                              AI
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatConversationTime(conv.lastMessageAt)}
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
                          {conv.lastMessagePreview || "No messages yet"}
                        </p>
                        {isUnread && (
                          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium text-white bg-blue-600 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Conversation View */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0a0a0a]",
          !selectedConversation ? "hidden lg:flex" : "flex"
        )}
      >
        {selectedConversation ? (
          <ConversationView
            conversationId={selectedConversation.id}
            currentUserId={currentUserId}
            participants={selectedConversation.participants}
            onBack={() => handleSelectConversation(null)}
            targetMessageId={targetMessageId}
            onTargetMessageScrolled={handleTargetMessageScrolled}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm mx-auto px-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-violet-600/10 via-blue-600/10 to-cyan-600/10 flex items-center justify-center mb-6">
                <MessageIcon className="w-10 h-10 text-blue-600 dark:text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Your Messages
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Select a conversation from the sidebar or start a new one to begin
                chatting
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className={cn(
                  "px-6 py-3 rounded-lg text-sm font-semibold",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white",
                  "shadow-lg shadow-blue-500/25",
                  "hover:-translate-y-0.5 transition-all duration-200"
                )}
              >
                Start a Conversation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

export default Inbox;
