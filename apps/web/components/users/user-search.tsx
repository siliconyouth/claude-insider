"use client";

/**
 * User Search Component
 *
 * Search for users by name or username with real-time results.
 */

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { searchUsers, type SearchUserResult } from "@/app/actions/users";
import { FollowButton } from "@/components/users/follow-button";
import { BlockButton } from "@/components/users/block-button";

interface UserSearchProps {
  onSelect?: (user: SearchUserResult) => void;
  showActions?: boolean;
  placeholder?: string;
  className?: string;
}

export function UserSearch({
  onSelect,
  showActions = true,
  placeholder = "Search users...",
  className,
}: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        startTransition(async () => {
          const result = await searchUsers(query);
          if (result.users) {
            setResults(result.users);
            setIsOpen(true);
          }
        });
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (user: SearchUserResult) => {
    if (onSelect) {
      onSelect(user);
    }
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white placeholder-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors"
          )}
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-full mt-2 rounded-xl overflow-hidden",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "shadow-lg max-h-80 overflow-y-auto"
          )}
        >
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No users found
            </div>
          ) : (
            <ul>
              {results.map((user) => (
                <li
                  key={user.id}
                  className={cn(
                    "flex items-center gap-3 p-3",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                    "border-b border-gray-100 dark:border-[#262626] last:border-0",
                    "transition-colors"
                  )}
                >
                  {/* Avatar */}
                  <Link
                    href={user.username ? `/users/${user.username}` : "#"}
                    onClick={() => handleSelect(user)}
                    className="flex-shrink-0"
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <Link
                    href={user.username ? `/users/${user.username}` : "#"}
                    onClick={() => handleSelect(user)}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    {user.username && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </p>
                    )}
                  </Link>

                  {/* Actions */}
                  {showActions && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <FollowButton
                        userId={user.id}
                        isFollowing={user.isFollowing ?? false}
                        size="sm"
                      />
                      <BlockButton userId={user.id} size="sm" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
