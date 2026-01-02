"use client";

/**
 * New Chat Modal
 *
 * Modal for starting a new direct message conversation.
 * Shows a searchable list of users to select from.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { AccessibleModal } from "@/components/accessible-modal";
import { AvatarWithStatus } from "@/components/presence";

interface User {
  id: string;
  name: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  status?: "online" | "offline" | "idle";
}

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  currentUserId?: string;
}

export function NewChatModal({
  isOpen,
  onClose,
  onSelectUser,
  currentUserId,
}: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}&limit=20`
      );

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();
      // Filter out current user
      const filteredUsers = (data.users || []).filter(
        (user: User) => user.id !== currentUserId
      );
      setUsers(filteredUsers);
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search users");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setUsers([]);
      setError(null);
    }
  }, [isOpen]);

  const handleSelectUser = (userId: string) => {
    onSelectUser(userId);
    onClose();
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="New Message"
      size="md"
      description="Search for a user to start a conversation"
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username..."
            autoFocus
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg text-sm",
              "bg-gray-100 dark:bg-gray-800",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500",
              "border-0 focus:ring-2 focus:ring-blue-500"
            )}
          />
        </div>

        {/* Results */}
        <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : !searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <SearchIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                Search for someone to message
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <UserIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No users found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 text-left",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                    "transition-colors rounded-lg"
                  )}
                >
                  <AvatarWithStatus
                    src={user.avatarUrl}
                    name={user.displayName || user.name}
                    status={user.status || "offline"}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {user.displayName || user.name}
                    </p>
                    {user.username && (
                      <p className="text-sm text-gray-500 truncate">
                        @{user.username}
                      </p>
                    )}
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AccessibleModal>
  );
}

// ============================================================================
// Icons
// ============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
