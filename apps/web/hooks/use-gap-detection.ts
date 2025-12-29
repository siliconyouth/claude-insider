/**
 * Gap Detection Hook
 *
 * Matrix SDK pattern - detects and fills message gaps after reconnection.
 *
 * When a user goes offline (phone sleep, network drop, tab backgrounded),
 * they might miss messages that arrived via realtime. This hook:
 *
 * 1. Tracks the timestamp of the last received message
 * 2. Listens for reconnection events
 * 3. Fetches messages after the last known timestamp
 * 4. Inserts any missing messages into the list
 *
 * This ensures message integrity even with unreliable connections.
 */

import { useCallback, useRef, useEffect } from "react";
import { getMessagesSince, type Message } from "@/app/actions/messaging";

interface UseGapDetectionOptions {
  conversationId: string;
  currentUserId: string;
  /** Current messages array */
  messages: { id: string; createdAt: string }[];
  /** Callback when missing messages are found */
  onMissingMessages: (messages: Message[]) => void;
  /** Whether the realtime channel is connected */
  isConnected: boolean;
  enabled?: boolean;
}

export function useGapDetection({
  conversationId,
  currentUserId: _currentUserId,
  messages,
  onMissingMessages,
  isConnected,
  enabled = true,
}: UseGapDetectionOptions) {
  // Track the last known message timestamp
  const lastKnownTimestampRef = useRef<string | null>(null);
  // Track previous connection state to detect reconnection
  const wasConnectedRef = useRef(isConnected);
  // Prevent duplicate gap fills
  const isFetchingRef = useRef(false);

  // Update last known timestamp when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const latest = messages[messages.length - 1];
      if (latest?.createdAt) {
        lastKnownTimestampRef.current = latest.createdAt;
      }
    }
  }, [messages]);

  // Fetch missing messages since last known timestamp
  const fetchMissingMessages = useCallback(async () => {
    if (!lastKnownTimestampRef.current || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      const result = await getMessagesSince(
        conversationId,
        lastKnownTimestampRef.current
      );

      if (result.success && result.messages && result.messages.length > 0) {
        // Filter out messages we already have
        const existingIds = new Set(messages.map((m) => m.id));
        const newMessages = result.messages.filter(
          (m) => !existingIds.has(m.id)
        );

        if (newMessages.length > 0) {
          console.log(
            `[GapDetection] Found ${newMessages.length} missing messages after reconnect`
          );
          onMissingMessages(newMessages);
        }
      }
    } catch (error) {
      console.warn("[GapDetection] Failed to fetch missing messages:", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [conversationId, messages, onMissingMessages]);

  // Detect reconnection and fill gaps
  useEffect(() => {
    if (!enabled) return;

    // Check for reconnection (was disconnected, now connected)
    const wasDisconnected = !wasConnectedRef.current;
    const isNowConnected = isConnected;

    if (wasDisconnected && isNowConnected && lastKnownTimestampRef.current) {
      console.log("[GapDetection] Reconnection detected, checking for gaps...");
      fetchMissingMessages();
    }

    wasConnectedRef.current = isConnected;
  }, [isConnected, enabled, fetchMissingMessages]);

  // Also check for gaps when tab becomes visible after being hidden
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        lastKnownTimestampRef.current &&
        isConnected
      ) {
        console.log("[GapDetection] Tab visible, checking for gaps...");
        fetchMissingMessages();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, isConnected, fetchMissingMessages]);

  // Handle online/offline events
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      if (lastKnownTimestampRef.current) {
        console.log("[GapDetection] Network online, checking for gaps...");
        // Small delay to let realtime reconnect first
        setTimeout(fetchMissingMessages, 1000);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, fetchMissingMessages]);

  return {
    /** Manually trigger gap check (useful for pull-to-refresh) */
    checkForGaps: fetchMissingMessages,
  };
}
