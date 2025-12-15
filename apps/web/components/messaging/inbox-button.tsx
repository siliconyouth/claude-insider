"use client";

/**
 * Inbox Button Component
 *
 * Shows inbox icon with unread message count badge.
 * Used in the header for quick access to messages.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { getTotalUnreadCount } from "@/app/actions/messaging";
import { useIsAuthenticated } from "@/lib/auth-client";

export function InboxButton() {
  const { isAuthenticated, isLoading } = useIsAuthenticated();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnread = async () => {
      const result = await getTotalUnreadCount();
      if (result.success) {
        setUnreadCount(result.count || 0);
      }
    };

    fetchUnread();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Link
      href="/inbox"
      className={cn(
        "relative p-2 rounded-lg transition-colors",
        "text-gray-600 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
        "hover:text-gray-900 dark:hover:text-white"
      )}
      title="Messages"
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
      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center",
            "min-w-[18px] h-[18px] px-1",
            "text-xs font-medium text-white",
            "bg-blue-600 rounded-full"
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

export default InboxButton;
