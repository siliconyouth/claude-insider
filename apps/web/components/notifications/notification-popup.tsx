"use client";

/**
 * Notification Popup Component
 *
 * Shows persistent popup notifications when new notifications arrive.
 * Notifications stay visible until dismissed or clicked.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { NotificationContent } from "./notification-content";

interface NotificationPopupData {
  id: string;
  type: string;
  title: string;
  message: string | null;
  created_at: string;
  resource_type: string | null;
  resource_id: string | null;
  data: Record<string, unknown> | null;
  actor?: {
    name: string;
    username: string | null;
  } | null;
}

interface PopupNotification extends NotificationPopupData {
  popupId: string; // Unique ID for the popup instance
  isExiting?: boolean;
}

/**
 * Get the appropriate deep link URL for a notification
 */
function getNotificationUrl(notification: NotificationPopupData): string {
  const { type, resource_type, resource_id, data, actor } = notification;

  switch (type) {
    case "follow":
      if (actor?.username) return `/users/${actor.username}`;
      if (data?.actorUsername) return `/users/${data.actorUsername}`;
      return "/notifications";

    case "comment":
    case "reply":
      if (resource_type === "doc" && resource_id) {
        return `/docs/${resource_id}#comments`;
      }
      return "/notifications";

    case "suggestion_approved":
    case "suggestion_rejected":
    case "suggestion_merged":
      return "/profile/suggestions";

    case "mention":
      if (resource_type === "dm_message" && data?.conversationId) {
        // Deep link to message in chat - will be handled by unified chat
        return `/?openChat=messages&conversation=${data.conversationId}&message=${data.messageId || resource_id}`;
      }
      if (resource_type === "doc" && resource_id) {
        return `/docs/${resource_id}#comments`;
      }
      return "/notifications";

    case "admin_notification":
      if (data?.link) return String(data.link);
      return "/notifications";

    case "version_update":
      return "/changelog";

    case "system":
      if (resource_type === "achievement") return "/profile#achievements";
      return "/notifications";

    default:
      return "/notifications";
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "comment":
    case "reply":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case "suggestion_rejected":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case "follow":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      );
    case "admin_notification":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      );
    case "version_update":
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      );
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function NotificationPopup() {
  const { isAuthenticated } = useAuth();
  const [popups, setPopups] = useState<PopupNotification[]>([]);
  const seenNotificationIds = useRef<Set<string>>(new Set());
  const lastCheckRef = useRef<string | null>(null);
  const isInitialLoad = useRef(true);

  // Dismiss a popup with animation
  const dismissPopup = useCallback((popupId: string) => {
    setPopups((prev) =>
      prev.map((p) => (p.popupId === popupId ? { ...p, isExiting: true } : p))
    );

    // Remove after animation
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.popupId !== popupId));
    }, 300);
  }, []);

  // Handle click on notification link
  const handleClick = useCallback((popupId: string) => {
    dismissPopup(popupId);
  }, [dismissPopup]);

  // Fetch new notifications and show popups
  const checkForNewNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await fetch("/api/notifications?limit=5&unread=true");
      if (!res.ok) return;

      const data = await res.json();
      const notifications: NotificationPopupData[] = data.notifications || [];

      // Skip initial load to avoid showing all existing notifications as popups
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        notifications.forEach((n) => seenNotificationIds.current.add(n.id));
        const firstNotif = notifications[0];
        if (firstNotif) {
          lastCheckRef.current = firstNotif.created_at;
        }
        return;
      }

      // Find new notifications we haven't seen yet
      const newNotifications = notifications.filter(
        (n) => !seenNotificationIds.current.has(n.id)
      );

      if (newNotifications.length > 0) {
        // Add to seen set
        newNotifications.forEach((n) => seenNotificationIds.current.add(n.id));

        // Update last check time
        const firstNewNotif = newNotifications[0];
        if (firstNewNotif) {
          lastCheckRef.current = firstNewNotif.created_at;
        }

        // Create popups for new notifications (max 3 at a time)
        const newPopups = newNotifications.slice(0, 3).map((n) => ({
          ...n,
          popupId: `${n.id}-${Date.now()}`,
        }));

        setPopups((prev) => {
          // Limit total popups to 5
          const combined = [...newPopups, ...prev];
          return combined.slice(0, 5);
        });
      }
    } catch (error) {
      console.error("[NotificationPopup] Check error:", error);
    }
  }, [isAuthenticated]);

  // Initial check for notifications on mount (no polling - realtime handles new ones via events)
  useEffect(() => {
    if (!isAuthenticated) return;
    // Fetch once on mount to initialize seenNotificationIds
    checkForNewNotifications();
    // Note: No polling interval - NotificationBell dispatches 'notification:new' events
    // via useRealtimeNotifications hook when new notifications arrive
  }, [isAuthenticated, checkForNewNotifications]);

  // Listen for custom notification events (e.g., from real-time updates)
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<NotificationPopupData>) => {
      const notification = event.detail;

      if (seenNotificationIds.current.has(notification.id)) return;

      seenNotificationIds.current.add(notification.id);

      setPopups((prev) => {
        const newPopup: PopupNotification = {
          ...notification,
          popupId: `${notification.id}-${Date.now()}`,
        };
        const combined = [newPopup, ...prev];
        return combined.slice(0, 5);
      });
    };

    window.addEventListener("notification:new" as string, handleNewNotification as EventListener);
    return () => {
      window.removeEventListener("notification:new" as string, handleNewNotification as EventListener);
    };
  }, []);

  if (!isAuthenticated || popups.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {popups.map((popup) => (
        <div
          key={popup.popupId}
          className={cn(
            "pointer-events-auto",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "rounded-xl shadow-2xl shadow-black/20",
            "overflow-hidden",
            "transform transition-all duration-300",
            popup.isExiting
              ? "translate-x-full opacity-0"
              : "translate-x-0 opacity-100 animate-in slide-in-from-right-full"
          )}
        >
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600" />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  "bg-gradient-to-br from-violet-600 to-blue-600 text-white"
                )}
              >
                {getNotificationIcon(popup.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <Link
                  href={getNotificationUrl(popup)}
                  onClick={() => handleClick(popup.popupId)}
                  className="block group"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                    <NotificationContent
                      content={popup.title}
                      actor={popup.actor}
                    />
                  </p>
                  {popup.message && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      <NotificationContent
                        content={popup.message}
                        actor={popup.actor}
                      />
                    </p>
                  )}
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTime(popup.created_at)}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => dismissPopup(popup.popupId)}
                className={cn(
                  "p-1.5 rounded-lg flex-shrink-0",
                  "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                  "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                  "transition-colors"
                )}
                aria-label="Dismiss notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Action link */}
            <Link
              href={getNotificationUrl(popup)}
              onClick={() => handleClick(popup.popupId)}
              className={cn(
                "mt-3 block w-full py-2 px-3 text-center text-sm font-medium rounded-lg",
                "bg-gradient-to-r from-violet-600/10 via-blue-600/10 to-cyan-600/10",
                "text-blue-600 dark:text-cyan-400",
                "hover:from-violet-600/20 hover:via-blue-600/20 hover:to-cyan-600/20",
                "transition-all"
              )}
            >
              View details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
