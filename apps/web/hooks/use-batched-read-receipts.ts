/**
 * Batched Read Receipts Hook
 *
 * Matrix SDK pattern - broadcast read receipts immediately for real-time UI,
 * but batch database writes to reduce load.
 *
 * Flow:
 * 1. markAsRead(messageId) → broadcast instantly via realtime
 * 2. Queue messageId for DB persist
 * 3. Flush queue to DB every BATCH_INTERVAL_MS or on unmount
 *
 * This reduces DB writes from N (per message) to 1 (per batch).
 */

import { useCallback, useRef, useEffect } from "react";
import { markMessagesAsRead } from "@/app/actions/messaging";

const BATCH_INTERVAL_MS = 30000; // 30 seconds

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

  // Schedule next flush
  const scheduleFlush = useCallback(() => {
    if (flushTimeoutRef.current) return; // Already scheduled

    flushTimeoutRef.current = setTimeout(async () => {
      flushTimeoutRef.current = null;
      await flushPending();

      // If there are still pending IDs (from re-queue on error), schedule again
      if (pendingIdsRef.current.size > 0) {
        scheduleFlush();
      }
    }, BATCH_INTERVAL_MS);
  }, [flushPending]);

  // Mark a single message as read
  const markAsRead = useCallback(
    (messageId: string) => {
      if (!enabled || !messageId) return;

      // Broadcast immediately for real-time "Seen" indicator
      broadcastReadReceipt([messageId], userName, userAvatar);

      // Queue for batched DB write
      pendingIdsRef.current.add(messageId);
      scheduleFlush();
    },
    [enabled, broadcastReadReceipt, userName, userAvatar, scheduleFlush]
  );

  // Mark multiple messages as read
  const markMultipleAsRead = useCallback(
    (messageIds: string[]) => {
      if (!enabled || messageIds.length === 0) return;

      // Broadcast immediately
      broadcastReadReceipt(messageIds, userName, userAvatar);

      // Queue all for batched DB write
      messageIds.forEach((id) => pendingIdsRef.current.add(id));
      scheduleFlush();
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
