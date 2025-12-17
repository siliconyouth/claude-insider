"use client";

/**
 * Notification Bell Component
 *
 * Shows unread notification count and dropdown preview.
 * Used in the header for quick access to notifications.
 * Integrates with browser push notifications when enabled.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { useBrowserNotifications } from "@/hooks/use-browser-notifications";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { useSound } from "@/hooks/use-sound-effects";
import { NotificationContent } from "./notification-content";

interface NotificationPreview {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
  resource_type: string | null;
  resource_id: string | null;
  data: Record<string, unknown> | null;
  actor?: {
    name: string;
    username: string | null;
  } | null;
}

/**
 * Get the appropriate deep link URL for a notification
 * Best practice: Link directly to the relevant content, not a generic notifications page
 */
function getNotificationUrl(notification: NotificationPreview): string {
  const { type, resource_type, resource_id, data, actor } = notification;

  switch (type) {
    case "follow":
      // Link to the follower's profile
      if (actor?.username) {
        return `/users/${actor.username}`;
      }
      if (data?.actorUsername) {
        return `/users/${data.actorUsername}`;
      }
      return "/notifications";

    case "comment":
    case "reply":
      // Link to the content where the comment was made
      if (resource_type === "doc" && resource_id) {
        return `/docs/${resource_id}#comments`;
      }
      return "/notifications";

    case "suggestion_approved":
    case "suggestion_rejected":
    case "suggestion_merged":
      // Link to user's suggestions page
      return "/profile/suggestions";

    case "mention":
      // Link to the content where mentioned
      if (resource_type === "dm_message" && data?.conversationId) {
        // Deep link to message in chat - will be handled by unified chat
        return `/?openChat=messages&conversation=${data.conversationId}&message=${data.messageId || resource_id}`;
      }
      if (resource_type === "doc" && resource_id) {
        return `/docs/${resource_id}#comments`;
      }
      return "/notifications";

    case "system":
      // Achievement notifications go to profile
      if (resource_type === "achievement") {
        return "/profile#achievements";
      }
      return "/notifications";

    default:
      return "/notifications";
  }
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sound effects
  const { playNotification, playComplete } = useSound();

  // Browser notifications integration
  const { isEnabled: browserNotifsEnabled, sendNotification } = useBrowserNotifications();
  const prevUnreadCountRef = useRef<number>(-1); // -1 = uninitialized
  const browserNotifsSettingRef = useRef<boolean>(false);
  const isInitializedRef = useRef(false);

  // Real-time notifications - replaces polling for live updates
  // Note: recentNotifications available for future dropdown enhancement
  const { unreadCount, recentNotifications: _recentNotifications, refreshCount } = useRealtimeNotifications({
    enabled: isAuthenticated,
    showBrowserNotifications: false, // We handle browser notifications separately with deep links
    onNewNotification: (notification) => {
      // Dispatch event for NotificationPopup component
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("notification:new", { detail: notification })
        );
      }
    },
  });

  // Fetch browser notification preference
  const fetchBrowserNotifSetting = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        browserNotifsSettingRef.current = data.browser_notifications ?? false;
      }
    } catch (error) {
      console.error("[NotificationBell] Preferences fetch error:", error);
    }
  }, [isAuthenticated]);

  // Fetch latest notification for browser notification
  const fetchLatestNotification = useCallback(async (): Promise<NotificationPreview | null> => {
    try {
      const res = await fetch("/api/notifications?limit=1&unread=true");
      if (res.ok) {
        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          return data.notifications[0];
        }
      }
    } catch (error) {
      console.error("[NotificationBell] Latest notification fetch error:", error);
    }
    return null;
  }, []);

  // Send browser notification for new notification
  const sendBrowserNotification = useCallback(
    async (newCount: number) => {
      // Only send if browser notifications are enabled (both browser permission and user setting)
      if (!browserNotifsEnabled || !browserNotifsSettingRef.current) return;

      // Only send if count increased (new notification arrived)
      if (newCount <= prevUnreadCountRef.current) return;

      // Fetch the latest notification to show in browser notification
      const latestNotif = await fetchLatestNotification();
      if (!latestNotif) return;

      // Use deep linking for browser notifications too
      const targetUrl = getNotificationUrl(latestNotif);

      sendNotification({
        title: "Claude Insider",
        body: latestNotif.title,
        tag: `notification-${latestNotif.id}`,
        data: { notificationId: latestNotif.id, url: targetUrl },
        onClick: () => {
          window.focus();
          window.location.href = targetUrl;
        },
      });
    },
    [browserNotifsEnabled, fetchLatestNotification, sendNotification]
  );

  // Handle browser notifications when unread count changes
  // Uses a ref to track initialization and prevent duplicate notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    // Skip sending browser notification on initial load
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      prevUnreadCountRef.current = unreadCount;
      return;
    }

    // Send browser notification and play sound if count increased (new notification arrived)
    if (unreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current !== -1) {
      sendBrowserNotification(unreadCount);
      // Play notification sound for new notification
      playNotification();
    }

    prevUnreadCountRef.current = unreadCount;
  }, [isAuthenticated, unreadCount, sendBrowserNotification, playNotification]);

  // Fetch notifications for preview
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=5");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        // Note: unreadCount is managed by useRealtimeNotifications hook
      }
    } catch (error) {
      console.error("[NotificationBell] Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (res.ok) {
        // Refresh count from server to sync with realtime state
        await refreshCount();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        // Play completion sound
        playComplete();
      }
    } catch (error) {
      console.error("[NotificationBell] Mark read error:", error);
    }
  };

  // Mark single notification as read when clicked
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (res.ok) {
        // Optimistically update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        // Refresh count from server (realtime will also update)
        await refreshCount();
      }
    } catch (error) {
      console.error("[NotificationBell] Mark single read error:", error);
    }
  };

  // Fetch browser notification preference on mount (no polling needed - realtime handles updates)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchBrowserNotifSetting();
  }, [isAuthenticated, fetchBrowserNotifSetting]);

  // Fetch when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
      case "reply":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "suggestion_rejected":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case "follow":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-lg transition-colors",
          "text-gray-600 dark:text-gray-400",
          "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1",
              "flex items-center justify-center",
              "text-[10px] font-bold text-white",
              "bg-gradient-to-r from-violet-600 to-blue-600",
              "rounded-full"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)]",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "rounded-xl shadow-xl",
            "z-50",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-cyan-400 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#262626]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 dark:bg-[#262626] rounded" />
                      <div className="h-3 w-1/2 bg-gray-200 dark:bg-[#262626] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationUrl(notification)}
                    onClick={() => {
                      setIsOpen(false);
                      // Mark as read if unread (fire and forget - don't block navigation)
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors",
                      "hover:bg-gray-50 dark:hover:bg-[#0a0a0a]",
                      !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        notification.read
                          ? "bg-gray-100 dark:bg-[#1a1a1a] text-gray-500"
                          : "bg-gradient-to-br from-violet-600 to-blue-600 text-white"
                      )}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm line-clamp-2",
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
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#262626]">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-blue-600 dark:text-cyan-400 hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
