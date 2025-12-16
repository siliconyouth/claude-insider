"use client";

/**
 * Blocked Users Management Component
 *
 * View and manage blocked users list.
 */

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  getBlockedUsers,
  unblockUser,
  type BlockedUser,
} from "@/app/actions/users";

export function BlockedUsers() {
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const toast = useToast();

  const loadBlockedUsers = async () => {
    setIsLoading(true);
    const result = await getBlockedUsers();
    if (result.users) {
      setUsers(result.users);
    }
    setIsLoading(false);
  };

  useEffect(() => {
     
    loadBlockedUsers();
  }, []);



  const handleUnblock = (userId: string) => {
    setUnblockingId(userId);
    startTransition(async () => {
      const result = await unblockUser(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("User unblocked");
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
      setUnblockingId(null);
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              "bg-gray-50 dark:bg-[#111111]",
              "animate-pulse"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#262626]" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-gray-200 dark:bg-[#262626] rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-[#262626] rounded mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        className={cn(
          "p-8 rounded-xl text-center",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          You haven&apos;t blocked any users
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Blocked users won&apos;t be able to interact with you
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div
          key={user.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          {/* Avatar */}
          <Link
            href={user.username ? `/users/${user.username}` : "#"}
            className="flex-shrink-0"
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
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
          <div className="flex-1 min-w-0">
            <Link
              href={user.username ? `/users/${user.username}` : "#"}
              className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 truncate block"
            >
              {user.name}
            </Link>
            {user.username && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                @{user.username}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Blocked {new Date(user.blockedAt).toLocaleDateString()}
            </p>
          </div>

          {/* Unblock button */}
          <button
            onClick={() => handleUnblock(user.id)}
            disabled={isPending && unblockingId === user.id}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {isPending && unblockingId === user.id ? "..." : "Unblock"}
          </button>
        </div>
      ))}
    </div>
  );
}
