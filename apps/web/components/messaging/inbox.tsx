"use client";

/**
 * Inbox Component
 *
 * Main messaging interface with:
 * - Conversation list sidebar
 * - User search for new conversations
 * - Active conversation view
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { AvatarWithStatus } from "@/components/presence";
import { ConversationView } from "./conversation-view";
import {
  getConversations,
  getUsersForMessaging,
  startConversation,
  type Conversation,
} from "@/app/actions/messaging";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";

interface InboxProps {
  currentUserId: string;
  initialConversationId?: string;
  className?: string;
}

export function Inbox({
  currentUserId,
  initialConversationId,
  className,
}: InboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <div className={cn("flex h-full", className)}>
      {/* Sidebar - Conversation List */}
      <div
        className={cn(
          "w-full lg:w-80 flex-shrink-0 border-r border-gray-200 dark:border-[#262626]",
          "flex flex-col",
          selectedConversation ? "hidden lg:flex" : "flex"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#262626]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Messages
            </h1>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showNewChat
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
              )}
              title="New message"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Search */}
          {showNewChat && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-gray-100 dark:bg-[#1a1a1a]",
                "border border-gray-200 dark:border-[#262626]",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-500"
              )}
              autoFocus
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showNewChat ? (
            // User search results
            <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery ? "No users found" : "Search for users to message"}
                </div>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartConversation(user.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3",
                      "hover:bg-gray-50 dark:hover:bg-[#111111]",
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
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            // Empty state
            <div className="p-4 text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-2 text-sm text-blue-600 dark:text-cyan-400 hover:underline"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            // Conversation list
            <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
              {conversations.map((conv) => {
                const otherParticipant = conv.participants[0];
                const isSelected = selectedConversation?.id === conv.id;
                const isAI = otherParticipant?.userId === AI_ASSISTANT_USER_ID;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3",
                      "transition-colors text-left",
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-[#111111]"
                    )}
                  >
                    <AvatarWithStatus
                      src={otherParticipant?.avatarUrl}
                      name={otherParticipant?.displayName || otherParticipant?.name}
                      status={otherParticipant?.status || "offline"}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "font-medium truncate",
                              conv.unreadCount > 0
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-700 dark:text-gray-300"
                            )}
                          >
                            {otherParticipant?.displayName ||
                              otherParticipant?.name ||
                              "Unknown"}
                          </p>
                          {isAI && (
                            <span className="px-1.5 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded">
                              AI
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatConversationTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            "text-sm truncate",
                            conv.unreadCount > 0
                              ? "text-gray-600 dark:text-gray-300"
                              : "text-gray-500 dark:text-gray-400"
                          )}
                        >
                          {conv.lastMessagePreview || "No messages yet"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
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
          "flex-1 flex flex-col",
          !selectedConversation ? "hidden lg:flex" : "flex"
        )}
      >
        {selectedConversation ? (
          <ConversationView
            conversationId={selectedConversation.id}
            currentUserId={currentUserId}
            participants={selectedConversation.participants}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Choose a conversation from the sidebar or start a new one
              </p>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inbox;
