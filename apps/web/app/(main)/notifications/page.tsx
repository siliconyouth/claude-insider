"use client";

/**
 * Notifications Page
 *
 * Full list of user notifications with filtering and management.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useToast } from "@/components/toast";
import { NotificationContent } from "@/components/notifications/notification-content";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  read: boolean;
  read_at: string | null;
  created_at: string;
  actor_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  actor?: {
    name: string;
    username: string | null;
    image: string | null;
  } | null;
}

type FilterType = "all" | "unread" | "comments" | "suggestions" | "follows";

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading, showSignIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const toast = useToast();

  const LIMIT = 20;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      showSignIn();
    }
  }, [authLoading, isAuthenticated, showSignIn]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", LIMIT.toString());
      params.set("offset", ((page - 1) * LIMIT).toString());
      if (filter === "unread") {
        params.set("unread", "true");
      }

      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      let filtered = data.notifications || [];

      // Client-side type filtering
      if (filter === "comments") {
        filtered = filtered.filter((n: Notification) =>
          ["comment", "reply"].includes(n.type)
        );
      } else if (filter === "suggestions") {
        filtered = filtered.filter((n: Notification) =>
          n.type.startsWith("suggestion_")
        );
      } else if (filter === "follows") {
        filtered = filtered.filter((n: Notification) => n.type === "follow");
      }

      setNotifications(filtered);
      setTotal(data.total || 0);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("[Notifications] Fetch error:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, filter, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          notificationIds ? { notificationIds } : { markAll: true }
        ),
      });

      if (!res.ok) throw new Error("Failed to update");

      if (notificationIds) {
        setNotifications((prev) =>
          prev.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        );
        setUnreadCount((c) => Math.max(0, c - notificationIds.length));
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("[Notifications] Mark read error:", error);
      toast.error("Failed to mark as read");
    }
  };

  const deleteAllRead = async () => {
    if (!confirm("Delete all read notifications?")) return;

    try {
      const res = await fetch("/api/notifications?all=true", {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      const data = await res.json();
      setNotifications((prev) => prev.filter((n) => !n.read));
      toast.success(`Deleted ${data.count} notifications`);
    } catch (error) {
      console.error("[Notifications] Delete error:", error);
      toast.error("Failed to delete notifications");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.resource_type && notification.resource_id) {
      if (notification.resource_type === "doc") {
        return `/docs/${notification.resource_id}`;
      }
      if (notification.resource_type === "resource") {
        return `/resources?highlight=${notification.resource_id}`;
      }
      if (notification.resource_type === "suggestion") {
        return `/suggestions`;
      }
      if (notification.resource_type === "comment") {
        return `/docs/${notification.resource_id}#comments`;
      }
    }
    if (notification.type === "follow" && notification.actor?.username) {
      return `/users/${notification.actor.username}`;
    }
    return "#";
  };

  const getNotificationIcon = (type: string, read: boolean) => {
    const iconClass = cn(
      "w-5 h-5",
      read ? "text-gray-400" : "text-white"
    );

    switch (type) {
      case "comment":
      case "reply":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "suggestion_approved":
      case "suggestion_merged":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "suggestion_rejected":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case "follow":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        );
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
        <Header />
        <main id="main-content" className="flex-1">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 bg-gray-200 dark:bg-[#1a1a1a] rounded" />
              <div className="h-12 w-full bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: `Unread (${unreadCount})` },
    { id: "comments", label: "Comments" },
    { id: "suggestions", label: "Suggestions" },
    { id: "follows", label: "Follows" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Page Title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAsRead()}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg",
                "bg-gray-100 dark:bg-[#1a1a1a]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-200 dark:hover:bg-[#262626]",
                "transition-colors"
              )}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={deleteAllRead}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg",
              "text-gray-500 hover:text-red-600",
              "transition-colors"
            )}
          >
            Clear read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFilter(f.id);
              setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              filter === f.id
                ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#262626]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Settings Link */}
      <Link
        href="/settings#notifications"
        className="block mb-6 p-4 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626] hover:border-blue-500/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Notification Settings</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Customize what notifications you receive
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#262626] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {filter === "unread" ? "All caught up!" : "No notifications yet"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filter === "unread"
              ? "You've read all your notifications"
              : "Notifications will appear here when you have activity"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={getNotificationLink(notification)}
              onClick={() => {
                if (!notification.read) {
                  markAsRead([notification.id]);
                }
              }}
              className={cn(
                "flex gap-4 p-4 rounded-xl transition-all",
                "bg-white dark:bg-[#111111]",
                "border hover:border-blue-500/50",
                notification.read
                  ? "border-gray-200 dark:border-[#262626]"
                  : "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  notification.read
                    ? "bg-gray-100 dark:bg-[#1a1a1a]"
                    : "bg-gradient-to-br from-violet-600 to-blue-600"
                )}
              >
                {getNotificationIcon(notification.type, notification.read)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    notification.read
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-900 dark:text-white font-medium"
                  )}
                >
                  <NotificationContent
                    content={notification.title}
                    actor={notification.actor}
                  />
                </p>
                {notification.message && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    <NotificationContent
                      content={notification.message}
                      actor={notification.actor}
                    />
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(notification.created_at)}
                </p>
              </div>

              {/* Unread indicator */}
              {!notification.read && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
              )}
            </Link>
          ))}

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  "bg-gray-100 dark:bg-[#1a1a1a]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">
                Page {page} of {Math.ceil(total / LIMIT)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / LIMIT)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  "bg-gray-100 dark:bg-[#1a1a1a]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
