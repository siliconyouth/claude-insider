/**
 * Real-time Messages Hook
 *
 * Subscribes to Supabase Realtime for instant message updates.
 * Automatically pushes browser notifications for new messages.
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/lib/auth-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    name: string;
    username: string;
    image?: string;
  };
}

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    name: string;
    username: string;
    image?: string;
  };
}

interface _Conversation {
  id: string;
  user_id_1: string;
  user_id_2: string;
  latest_message_at: string;
  unread_count_1: number;
  unread_count_2: number;
}

interface UseRealtimeMessagesOptions {
  /** Specific conversation ID to watch (optional) */
  conversationId?: string;
  /** Specific group ID to watch (optional) */
  groupId?: string;
  /** Called when a new message is received */
  onNewMessage?: (message: Message | GroupMessage) => void;
  /** Called when unread count changes */
  onUnreadCountChange?: (count: number) => void;
  /** Whether to show browser push notifications (default: true) */
  showBrowserNotifications?: boolean;
  /** Whether realtime is enabled */
  enabled?: boolean;
}

interface UseRealtimeMessagesReturn {
  /** Whether realtime is connected */
  isConnected: boolean;
  /** Total unread message count */
  unreadCount: number;
  /** Recent messages received via realtime */
  recentMessages: (Message | GroupMessage)[];
  /** Manually refresh unread count */
  refreshCount: () => Promise<void>;
  /** Connection error if any */
  error: Error | null;
}

export function useRealtimeMessages(
  options: UseRealtimeMessagesOptions = {}
): UseRealtimeMessagesReturn {
  const {
    conversationId,
    groupId,
    onNewMessage,
    onUnreadCountChange,
    showBrowserNotifications = true, // Always push by default
    enabled = true,
  } = options;

  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState<(Message | GroupMessage)[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch current unread count
  const refreshCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/inbox?countOnly=true");
      if (response.ok) {
        const data = await response.json();
        const newCount = data.unreadCount || 0;
        setUnreadCount(newCount);
        onUnreadCountChange?.(newCount);
      }
    } catch (err) {
      console.error("[Realtime Messages] Failed to fetch count:", err);
    }
  }, [session?.user?.id, onUnreadCountChange]);

  // Show browser push notification for new message
  const showPushNotification = useCallback(
    (message: Message | GroupMessage, senderName: string) => {
      if (!showBrowserNotifications) return;
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      // Don't notify for own messages
      if (message.sender_id === session?.user?.id) return;

      try {
        const isGroup = "group_id" in message;
        const title = isGroup ? `New message in group` : `Message from ${senderName}`;
        const body =
          message.content.length > 100
            ? message.content.substring(0, 100) + "..."
            : message.content;

        const browserNotif = new Notification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          tag: `message-${message.id}`,
          requireInteraction: false,
          data: {
            conversationId: "conversation_id" in message ? message.conversation_id : undefined,
            groupId: "group_id" in message ? message.group_id : undefined,
          },
        });

        // Click to open chat
        browserNotif.onclick = () => {
          window.focus();
          if ("conversation_id" in message) {
            window.location.href = `/inbox?conversation=${message.conversation_id}`;
          } else if ("group_id" in message) {
            window.location.href = `/inbox?group=${message.group_id}`;
          }
          browserNotif.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => browserNotif.close(), 5000);
      } catch (err) {
        console.error("[Realtime Messages] Push notification error:", err);
      }
    },
    [showBrowserNotifications, session?.user?.id]
  );

  // Subscribe to realtime messages
  useEffect(() => {
    if (!enabled || !session?.user?.id) {
      setIsConnected(false);
      return;
    }

    const supabase = createClient();
    const userId = session.user.id;

    const setupSubscription = async () => {
      try {
        // Initial count fetch
        await refreshCount();

        // Build channel name based on what we're watching
        const channelName = conversationId
          ? `messages:${conversationId}`
          : groupId
            ? `group_messages:${groupId}`
            : `user_messages:${userId}`;

        const channel = supabase.channel(channelName);

        // Subscribe to direct messages
        if (!groupId) {
          channel.on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: conversationId
                ? `conversation_id=eq.${conversationId}`
                : undefined,
            },
            async (payload) => {
              const message = payload.new as Message;

              // Only process messages for conversations we're part of
              if (!conversationId) {
                // Check if this message is for us
                const convResponse = await fetch(
                  `/api/inbox/conversations/${message.conversation_id}`
                );
                if (!convResponse.ok) return;
              }

              // Update recent messages
              setRecentMessages((prev) => [message, ...prev.slice(0, 19)]);

              // Update unread count if not our message
              if (message.sender_id !== userId) {
                setUnreadCount((prev) => {
                  const newCount = prev + 1;
                  onUnreadCountChange?.(newCount);
                  return newCount;
                });

                // Push notification
                const senderName = message.sender?.name || "Someone";
                showPushNotification(message, senderName);
              }

              // Trigger callback
              onNewMessage?.(message);
            }
          );
        }

        // Subscribe to group messages
        if (!conversationId) {
          channel.on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "group_messages",
              filter: groupId ? `group_id=eq.${groupId}` : undefined,
            },
            async (payload) => {
              const message = payload.new as GroupMessage;

              // Update recent messages
              setRecentMessages((prev) => [message, ...prev.slice(0, 19)]);

              // Update unread count if not our message
              if (message.sender_id !== userId) {
                setUnreadCount((prev) => {
                  const newCount = prev + 1;
                  onUnreadCountChange?.(newCount);
                  return newCount;
                });

                // Push notification
                const senderName = message.sender?.name || "Someone";
                showPushNotification(message, senderName);
              }

              // Trigger callback
              onNewMessage?.(message);
            }
          );
        }

        // Subscribe to conversation updates (for read receipts)
        channel.on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "conversations",
          },
          () => {
            // Refresh count when conversations update
            refreshCount();
          }
        );

        channelRef.current = channel;

        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            setError(null);
          } else if (status === "CHANNEL_ERROR") {
            setIsConnected(false);
            setError(new Error("Failed to subscribe to messages channel"));
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
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [
    enabled,
    session?.user?.id,
    conversationId,
    groupId,
    refreshCount,
    onNewMessage,
    onUnreadCountChange,
    showPushNotification,
  ]);

  return {
    isConnected,
    unreadCount,
    recentMessages,
    refreshCount,
    error,
  };
}

/**
 * Hook for watching a specific conversation
 */
export function useConversationMessages(conversationId: string) {
  return useRealtimeMessages({
    conversationId,
    enabled: !!conversationId,
  });
}

/**
 * Hook for watching a specific group chat
 */
export function useGroupMessages(groupId: string) {
  return useRealtimeMessages({
    groupId,
    enabled: !!groupId,
  });
}

/**
 * Lightweight hook for just the unread message count
 */
export function useUnreadMessageCount(): {
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { unreadCount, refreshCount } = useRealtimeMessages({
    onUnreadCountChange: setCount,
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
