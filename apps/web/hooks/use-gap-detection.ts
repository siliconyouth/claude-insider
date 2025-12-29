/**
 * Gap Detection Hook (Matrix SDK Pattern)
 *
 * Ensures message integrity across browsers/devices with multiple strategies:
 *
 * 1. **Periodic Sync Polling** (NEW - Matrix SDK pattern)
 *    - Polls every 10 seconds for new messages
 *    - Doesn't rely solely on push events which can be unreliable
 *    - Essential for cross-browser/device sync
 *
 * 2. **Reconnection Detection**
 *    - Fetches missed messages after network reconnects
 *
 * 3. **Tab Visibility**
 *    - Syncs when tab becomes visible after being hidden
 *
 * 4. **Online/Offline Events**
 *    - Syncs when network comes back online
 *
 * This ensures message integrity even with unreliable realtime connections.
 */

import { useCallback, useRef, useEffect } from "react";
import { getMessagesSince, type Message } from "@/app/actions/messaging";

// Matrix SDK-style sync interval (10 seconds)
// Balances freshness with network efficiency
const SYNC_INTERVAL_MS = 10000;

// Minimum time between syncs to prevent hammering the server
const MIN_SYNC_INTERVAL_MS = 3000;

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
  // Track last sync time to prevent too-frequent syncs
  const lastSyncTimeRef = useRef(0);
  // Keep callback ref updated to avoid stale closure in interval
  const onMissingMessagesRef = useRef(onMissingMessages);
  const messagesRef = useRef(messages);

  // Keep refs updated
  useEffect(() => {
    onMissingMessagesRef.current = onMissingMessages;
  }, [onMissingMessages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
  const fetchMissingMessages = useCallback(async (silent = false) => {
    if (!lastKnownTimestampRef.current || isFetchingRef.current) return;

    // Throttle syncs to prevent hammering the server
    const now = Date.now();
    if (now - lastSyncTimeRef.current < MIN_SYNC_INTERVAL_MS) {
      return;
    }

    isFetchingRef.current = true;
    lastSyncTimeRef.current = now;

    try {
      const result = await getMessagesSince(
        conversationId,
        lastKnownTimestampRef.current
      );

      if (result.success && result.messages && result.messages.length > 0) {
        // Filter out messages we already have (use ref for latest value)
        const existingIds = new Set(messagesRef.current.map((m) => m.id));
        const newMessages = result.messages.filter(
          (m) => !existingIds.has(m.id)
        );

        if (newMessages.length > 0) {
          if (!silent) {
            console.log(
              `[GapDetection] Found ${newMessages.length} missing messages`
            );
          }
          onMissingMessagesRef.current(newMessages);
        }
      }
    } catch (error) {
      console.warn("[GapDetection] Failed to fetch missing messages:", error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [conversationId]);

  // MATRIX SDK PATTERN: Periodic sync polling
  // This is the key addition - don't rely solely on push events
  useEffect(() => {
    if (!enabled || !isConnected) return;

    // Initial sync after a short delay to let realtime settle
    const initialSyncTimeout = setTimeout(() => {
      fetchMissingMessages(true); // silent = true for periodic syncs
    }, 2000);

    // Periodic sync interval
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMissingMessages(true); // silent = true for periodic syncs
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      clearTimeout(initialSyncTimeout);
      clearInterval(intervalId);
    };
  }, [enabled, isConnected, fetchMissingMessages]);

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
