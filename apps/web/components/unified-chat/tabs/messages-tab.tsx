"use client";

/**
 * Messages Tab
 *
 * User-to-user messaging with real-time updates.
 * Shows conversation list when no conversation is selected,
 * or delegates to ConversationView when one is selected.
 *
 * The conversation logic has been consolidated into ConversationView
 * to avoid code duplication. See: components/messaging/conversation-view.tsx
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useUnifiedChat } from "../unified-chat-provider";
import { useSession } from "@/lib/auth-client";
import { AvatarWithStatus } from "@/components/presence";
import { DeviceVerificationModal } from "@/components/e2ee/device-verification-modal";
import { ConversationView } from "@/components/messaging/conversation-view";
import {
  getConversations,
  markConversationAsRead,
  type Conversation,
} from "@/app/actions/messaging";

// ============================================================================
// Component
// ============================================================================

export function MessagesTab() {
  const { selectedConversationId, selectConversation, unreadCount, setUnreadCount, targetMessageId, clearTargetMessage, pendingVerificationId, clearPendingVerification } = useUnifiedChat();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPendingVerificationModal, setShowPendingVerificationModal] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{
    verificationId: string;
    initiatorUserId: string;
    initiatorName: string;
  } | null>(null);

  // Load conversations
  useEffect(() => {
    if (!currentUserId) return;

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      const result = await getConversations();
      if (result.success && result.conversations) {
        setConversations(result.conversations);
        // Update unread count
        const totalUnread = result.conversations.reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadCount(totalUnread);
      }
      setIsLoadingConversations(false);
    };

    loadConversations();
  }, [currentUserId, setUnreadCount]);

  // Handle pending verification from deep link
  useEffect(() => {
    if (!pendingVerificationId) return;

    // Fetch verification details from the server
    const fetchVerification = async () => {
      try {
        const response = await fetch(`/api/e2ee/verification/${pendingVerificationId}`);
        if (response.ok) {
          const data = await response.json();
          setPendingVerification({
            verificationId: pendingVerificationId,
            initiatorUserId: data.initiatorUserId,
            initiatorName: data.initiatorName || "Someone",
          });
          setShowPendingVerificationModal(true);
        }
      } catch (error) {
        console.error("Failed to fetch verification:", error);
      }
    };

    fetchVerification();
  }, [pendingVerificationId]);

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const participant = conv.participants[0];
    const name = participant?.displayName || participant?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handle conversation selection - mark as read and update unread count
  const handleSelectConversation = useCallback((conversation: Conversation | null) => {
    if (conversation && conversation.unreadCount > 0) {
      // Optimistically decrement global unread count
      setUnreadCount(Math.max(0, unreadCount - conversation.unreadCount));

      // Update local conversation state to mark as read
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversation.id ? { ...c, unreadCount: 0 } : c
        )
      );

      // Mark as read in database (non-blocking)
      markConversationAsRead(conversation.id);
    }

    selectConversation(conversation?.id || null);
  }, [selectConversation, setUnreadCount, unreadCount]);

  // Show conversation view if one is selected
  if (selectedConversationId && currentUserId) {
    const conversation = conversations.find((c) => c.id === selectedConversationId);
    if (conversation) {
      return (
        <ConversationView
          conversationId={selectedConversationId}
          currentUserId={currentUserId}
          participants={conversation.participants}
          isGroupChat={conversation.type === "group"}
          onBack={() => handleSelectConversation(null)}
          targetMessageId={targetMessageId}
          onTargetMessageScrolled={clearTargetMessage}
        />
      );
    }
  }

  // Not authenticated
  if (!currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <LockIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Sign in to message
        </h3>
        <p className="text-sm text-gray-500">
          Sign in to send and receive messages
        </p>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-[#262626]">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={cn(
              "w-full pl-9 pr-4 py-2 rounded-lg text-sm",
              "bg-gray-100 dark:bg-gray-800",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500",
              "border-0 focus:ring-2 focus:ring-blue-500"
            )}
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <MessageIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Start a conversation from a user profile
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
            {filteredConversations.map((conversation) => {
              const participant = conversation.participants[0];
              const isUnread = conversation.unreadCount > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                    isUnread && "bg-blue-50/50 dark:bg-blue-900/10"
                  )}
                >
                  {/* Avatar */}
                  <AvatarWithStatus
                    src={participant?.avatarUrl}
                    name={participant?.displayName || participant?.name}
                    status={participant?.status || "offline"}
                    size="md"
                  />

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
                        {participant?.displayName || participant?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
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
                        {conversation.lastMessagePreview || "No messages yet"}
                      </p>
                      {isUnread && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium text-white bg-blue-600 rounded-full">
                          {conversation.unreadCount}
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

      {/* Pending E2EE Verification Modal (from notification deep link) */}
      {pendingVerification && (
        <DeviceVerificationModal
          isOpen={showPendingVerificationModal}
          onClose={() => {
            setShowPendingVerificationModal(false);
            setPendingVerification(null);
            clearPendingVerification();
          }}
          targetUserId={pendingVerification.initiatorUserId}
          targetUserName={pendingVerification.initiatorName}
          onSuccess={() => {
            setShowPendingVerificationModal(false);
            setPendingVerification(null);
            clearPendingVerification();
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

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

// ============================================================================
// Icons
// ============================================================================

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
