/**
 * Batched Read Receipts Hook
 *
 * Matrix SDK pattern - broadcast read receipts immediately for real-time UI,
 * with smart database persistence for consistency.
 *
 * Flow:
 * 1. markAsRead(messageId) → broadcast instantly via realtime for live "Seen" status
 * 2. Queue messageId for DB persist
 * 3. First read triggers IMMEDIATE DB flush (eager persist for instant consistency)
 * 4. Subsequent reads within BATCH_INTERVAL_MS are batched together
 * 5. Queue also flushes on unmount or conversation change
 *
 * This provides:
 * - Instant UI feedback via realtime broadcast
 * - Instant DB consistency for the first read (no "Seen" missing when reopening)
 * - Efficient batching when scrolling through many messages
 */

import { useCallback, useRef, useEffect } from "react";
import { markMessagesAsRead } from "@/app/actions/messaging";

const BATCH_INTERVAL_MS = 3000; // 3 seconds - fast enough for consistency, still batches multiple reads

interface UseBatchedReadReceiptsOptions {
  conversationId: string;
  currentUserId: string;
  /** Broadcast function from realtime context */
  broadcastReadReceipt: (
    messageIds: string[],
    userName?: string,
    userAvatar?: string
  ) => void;
  /** Current user's display info for broadcasts */
  userName?: string;
  userAvatar?: string;
  enabled?: boolean;
}

interface UseBatchedReadReceiptsReturn {
  /** Mark a message as read - broadcasts immediately, queues DB write */
  markAsRead: (messageId: string) => void;
  /** Mark multiple messages as read */
  markMultipleAsRead: (messageIds: string[]) => void;
  /** Force flush pending reads to DB (for cleanup) */
  flushPending: () => Promise<void>;
}

export function useBatchedReadReceipts({
  conversationId,
  currentUserId: _currentUserId,
  broadcastReadReceipt,
  userName,
  userAvatar,
  enabled = true,
}: UseBatchedReadReceiptsOptions): UseBatchedReadReceiptsReturn {
  // Queue of message IDs pending DB write
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFlushing = useRef(false);

  // Flush pending reads to database
  const flushPending = useCallback(async () => {
    if (pendingIdsRef.current.size === 0 || isFlushing.current) return;

    isFlushing.current = true;
    const ids = Array.from(pendingIdsRef.current);
    pendingIdsRef.current.clear();

    try {
      // Get the latest message ID for the "up to" parameter
      // The DB function will mark all messages up to and including this one
      const latestId = ids[ids.length - 1];
      await markMessagesAsRead(conversationId, latestId);
    } catch (error) {
      // On error, re-queue the IDs for next flush
      console.warn("[BatchedReadReceipts] Flush failed, re-queuing:", error);
      ids.forEach((id) => pendingIdsRef.current.add(id));
    } finally {
      isFlushing.current = false;
    }
  }, [conversationId]);

  // Schedule next flush (with optional immediate mode for first read)
  const scheduleFlush = useCallback((immediate = false) => {
    if (flushTimeoutRef.current) return; // Already scheduled

    const delay = immediate ? 0 : BATCH_INTERVAL_MS;

    flushTimeoutRef.current = setTimeout(async () => {
      flushTimeoutRef.current = null;
      await flushPending();

      // If there are still pending IDs (from re-queue on error), schedule again
      if (pendingIdsRef.current.size > 0) {
        scheduleFlush();
      }
    }, delay);
  }, [flushPending]);

  // Mark a single message as read
  const markAsRead = useCallback(
    (messageId: string) => {
      if (!enabled || !messageId) return;

      // Broadcast immediately for real-time "Seen" indicator
      broadcastReadReceipt([messageId], userName, userAvatar);

      // Check if queue was empty (first read = eager persist for instant DB consistency)
      const wasEmpty = pendingIdsRef.current.size === 0;

      // Queue for batched DB write
      pendingIdsRef.current.add(messageId);

      // Flush immediately for first read, batch subsequent ones
      scheduleFlush(wasEmpty);
    },
    [enabled, broadcastReadReceipt, userName, userAvatar, scheduleFlush]
  );

  // Mark multiple messages as read
  const markMultipleAsRead = useCallback(
    (messageIds: string[]) => {
      if (!enabled || messageIds.length === 0) return;

      // Broadcast immediately
      broadcastReadReceipt(messageIds, userName, userAvatar);

      // Check if queue was empty (first batch = eager persist for instant DB consistency)
      const wasEmpty = pendingIdsRef.current.size === 0;

      // Queue all for batched DB write
      messageIds.forEach((id) => pendingIdsRef.current.add(id));

      // Flush immediately for first batch, delay subsequent ones
      scheduleFlush(wasEmpty);
    },
    [enabled, broadcastReadReceipt, userName, userAvatar, scheduleFlush]
  );

  // Flush on unmount or conversation change
  useEffect(() => {
    // Capture refs for cleanup
    const pendingIds = pendingIdsRef.current;
    const flushTimeout = flushTimeoutRef;

    return () => {
      // Clear timeout
      if (flushTimeout.current) {
        clearTimeout(flushTimeout.current);
        flushTimeout.current = null;
      }

      // Flush any pending reads synchronously (fire-and-forget)
      if (pendingIds.size > 0) {
        const ids = Array.from(pendingIds);
        const latestId = ids[ids.length - 1];
        // Fire and forget - we're unmounting so can't await
        markMessagesAsRead(conversationId, latestId).catch(() => {
          // Ignore errors on unmount
        });
        pendingIds.clear();
      }
    };
  }, [conversationId]);

  // Also flush when conversation changes
  useEffect(() => {
    // Capture ref for cleanup
    const pendingIds = pendingIdsRef.current;

    // When conversation changes, flush the previous conversation's pending reads
    return () => {
      if (pendingIds.size > 0) {
        flushPending();
      }
    };
  }, [conversationId, flushPending]);

  return {
    markAsRead,
    markMultipleAsRead,
    flushPending,
  };
}
