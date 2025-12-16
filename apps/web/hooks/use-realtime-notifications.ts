/**
 * Real-time Notifications Hook
 *
 * Subscribes to Supabase Realtime for instant notification updates.
 * Automatically updates notification count badge without polling.
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
  actor_id?: string;
  resource_type?: string;
  resource_id?: string;
}

interface UseRealtimeNotificationsOptions {
  /** Called when a new notification is received */
  onNewNotification?: (notification: Notification) => void;
  /** Called when notification count changes */
  onCountChange?: (count: number) => void;
  /** Whether to show browser push notifications (default: true) */
  showBrowserNotifications?: boolean;
  /** Whether realtime is enabled */
  enabled?: boolean;
}

interface UseRealtimeNotificationsReturn {
  /** Whether realtime is connected */
  isConnected: boolean;
  /** Current unread count */
  unreadCount: number;
  /** Recent notifications received via realtime */
  recentNotifications: Notification[];
  /** Manually refresh the count */
  refreshCount: () => Promise<void>;
  /** Connection error if any */
  error: Error | null;
}

export function useRealtimeNotifications(
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn {
  const {
    onNewNotification,
    onCountChange,
    showBrowserNotifications = true, // Always push to browser notifications by default
    enabled = true,
  } = options;

  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Store callback refs to avoid triggering effect re-runs when callbacks change
  // This prevents memory leaks from repeated subscription/cleanup cycles
  const onNewNotificationRef = useRef(onNewNotification);
  const onCountChangeRef = useRef(onCountChange);

  // Sync refs when callbacks change (no effect re-run needed)
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  // Fetch current unread count - uses ref to avoid circular dependency
  const refreshCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/notifications?limit=1&fresh=true");
      if (response.ok) {
        const data = await response.json();
        const newCount = data.unreadCount || 0;
        setUnreadCount(newCount);
        onCountChangeRef.current?.(newCount);
      }
    } catch (err) {
      console.error("[Realtime Notifications] Failed to fetch count:", err);
    }
  }, [session?.user?.id]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!showBrowserNotifications) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: "/icons/icon-192x192.png",
        tag: `notification-${notification.id}`,
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => browserNotif.close(), 5000);
    } catch (err) {
      console.error("[Realtime Notifications] Browser notification error:", err);
    }
  }, [showBrowserNotifications]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!enabled || !session?.user?.id) {
      setIsConnected(false);
      return;
    }

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      try {
        // Initial count fetch
        await refreshCount();

        // Subscribe to notifications table changes
        channel = supabase
          .channel(`notifications:${session.user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${session.user.id}`,
            },
            (payload) => {
              const notification = payload.new as Notification;

              // Update recent notifications
              setRecentNotifications((prev) => [notification, ...prev.slice(0, 9)]);

              // Update unread count
              if (!notification.read) {
                setUnreadCount((prev) => {
                  const newCount = prev + 1;
                  onCountChangeRef.current?.(newCount);
                  return newCount;
                });
              }

              // Trigger callbacks (using refs for stability)
              onNewNotificationRef.current?.(notification);
              showBrowserNotification(notification);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${session.user.id}`,
            },
            (payload) => {
              const notification = payload.new as Notification;
              const oldNotification = payload.old as Notification;

              // If marked as read, decrement count
              if (!oldNotification.read && notification.read) {
                setUnreadCount((prev) => {
                  const newCount = Math.max(0, prev - 1);
                  onCountChangeRef.current?.(newCount);
                  return newCount;
                });
              }

              // Update in recent list
              setRecentNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? notification : n))
              );
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${session.user.id}`,
            },
            (payload) => {
              const deletedNotification = payload.old as Notification;

              // Remove from recent list
              setRecentNotifications((prev) =>
                prev.filter((n) => n.id !== deletedNotification.id)
              );

              // Refresh count to be accurate
              refreshCount();
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setIsConnected(true);
              setError(null);
            } else if (status === "CHANNEL_ERROR") {
              setIsConnected(false);
              setError(new Error("Failed to subscribe to notifications channel"));
            } else if (status === "TIMED_OUT") {
              setIsConnected(false);
              setError(new Error("Subscription timed out"));
            }
          });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to setup realtime"));
        setIsConnected(false);
      }
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      setIsConnected(false);
    };
  }, [
    enabled,
    session?.user?.id,
    refreshCount,
    showBrowserNotification,
    // Note: onNewNotification and onCountChange are accessed via refs
    // to prevent subscription churn when parent re-renders with new callbacks
  ]);

  return {
    isConnected,
    unreadCount,
    recentNotifications,
    refreshCount,
    error,
  };
}

/**
 * Lightweight hook for just the notification count
 * Uses realtime updates when available
 */
export function useNotificationCount(): {
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { unreadCount, refreshCount } = useRealtimeNotifications({
    onCountChange: setCount,
    enabled: true,
  });

  useEffect(() => {
    setCount(unreadCount);
    setIsLoading(false);
  }, [unreadCount]);

  return {
    count,
    isLoading,
    refresh: refreshCount,
  };
}
