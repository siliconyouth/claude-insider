/**
 * Retry Queue Hook
 *
 * Matrix SDK pattern - queues failed messages for automatic retry with
 * exponential backoff, and persists across page reloads.
 *
 * When a message fails to send:
 * 1. It's added to the retry queue with status "failed"
 * 2. Auto-retry attempts with exponential backoff (1s, 2s, 4s, 8s...)
 * 3. After max retries, message stays in queue for manual retry
 * 4. Queue persists in localStorage to survive page reloads
 *
 * This ensures users never lose messages due to network issues.
 */

import { useCallback, useRef, useEffect, useState } from "react";

interface QueuedMessage {
  /** Temporary client-side ID */
  tempId: string;
  /** Conversation ID */
  conversationId: string;
  /** Message content */
  content: string;
  /** Number of retry attempts */
  retryCount: number;
  /** Current status */
  status: "pending" | "sending" | "failed";
  /** Timestamp of last attempt */
  lastAttempt: number;
  /** Error message if failed */
  error?: string;
  /** Timestamp when queued */
  queuedAt: number;
}

interface UseRetryQueueOptions {
  conversationId: string;
  /** Function to send a message */
  sendMessage: (content: string) => Promise<{ success: boolean; error?: string }>;
  /** Callback when a queued message is successfully sent */
  onMessageSent?: (tempId: string, message: unknown) => void;
  /** Max retry attempts before giving up */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms */
  baseDelay?: number;
  /** Whether to enable auto-retry */
  autoRetry?: boolean;
  enabled?: boolean;
}

interface UseRetryQueueReturn {
  /** Messages in the retry queue for this conversation */
  queuedMessages: QueuedMessage[];
  /** Add a message to the queue */
  queueMessage: (content: string) => string;
  /** Manually retry a specific message */
  retryMessage: (tempId: string) => Promise<boolean>;
  /** Retry all failed messages */
  retryAll: () => Promise<void>;
  /** Remove a message from the queue (give up) */
  removeMessage: (tempId: string) => void;
  /** Clear all messages from the queue */
  clearQueue: () => void;
  /** Whether any messages are currently being sent */
  isSending: boolean;
}

const STORAGE_KEY_PREFIX = "msg_retry_queue_";
const MAX_RETRY_DELAY = 30000; // 30 seconds max delay

// Generate a temporary ID for optimistic messages
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function useRetryQueue({
  conversationId,
  sendMessage,
  onMessageSent,
  maxRetries = 5,
  baseDelay = 1000,
  autoRetry = true,
  enabled = true,
}: UseRetryQueueOptions): UseRetryQueueReturn {
  const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Refs for stable access in callbacks
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const sendMessageRef = useRef(sendMessage);
  const onMessageSentRef = useRef(onMessageSent);
  // Ref to hold attemptSend to avoid circular dependency with scheduleRetry
  const attemptSendRef = useRef<((tempId: string) => Promise<boolean>) | null>(null);

  // Keep refs updated
  useEffect(() => {
    sendMessageRef.current = sendMessage;
    onMessageSentRef.current = onMessageSent;
  }, [sendMessage, onMessageSent]);

  const storageKey = `${STORAGE_KEY_PREFIX}${conversationId}`;

  // Load queue from localStorage on mount/conversation change
  useEffect(() => {
    if (!enabled) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as QueuedMessage[];
        // Reset any "sending" status to "failed" on reload
        const recovered = parsed.map((m) => ({
          ...m,
          status: m.status === "sending" ? "failed" : m.status,
        })) as QueuedMessage[];
        setQueuedMessages(recovered);
      }
    } catch {
      // Invalid stored data, ignore
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, enabled]);

  // Persist queue to localStorage
  const persistQueue = useCallback(
    (messages: QueuedMessage[]) => {
      if (messages.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    },
    [storageKey]
  );

  // Calculate delay with exponential backoff
  const calculateDelay = useCallback(
    (retryCount: number): number => {
      const delay = baseDelay * Math.pow(2, retryCount);
      return Math.min(delay, MAX_RETRY_DELAY);
    },
    [baseDelay]
  );

  // Schedule auto-retry for a message
  const scheduleRetry = useCallback(
    (tempId: string, retryCount: number) => {
      if (!autoRetry || retryCount >= maxRetries) return;

      // Clear existing timeout for this message
      const existing = retryTimeoutsRef.current.get(tempId);
      if (existing) {
        clearTimeout(existing);
      }

      const delay = calculateDelay(retryCount);
      console.log(
        `[RetryQueue] Scheduling retry for ${tempId} in ${delay}ms (attempt ${retryCount + 1})`
      );

      const timeout = setTimeout(() => {
        retryTimeoutsRef.current.delete(tempId);
        // Use ref to avoid circular dependency
        attemptSendRef.current?.(tempId);
      }, delay);

      retryTimeoutsRef.current.set(tempId, timeout);
    },
    [autoRetry, maxRetries, calculateDelay]
  );

  // Attempt to send a message
  const attemptSend = useCallback(
    async (tempId: string): Promise<boolean> => {
      setQueuedMessages((prev) => {
        const updated = prev.map((m) =>
          m.tempId === tempId ? { ...m, status: "sending" as const } : m
        );
        persistQueue(updated);
        return updated;
      });

      setIsSending(true);

      // Get the current message
      let message: QueuedMessage | undefined;
      setQueuedMessages((prev) => {
        message = prev.find((m) => m.tempId === tempId);
        return prev;
      });

      if (!message) {
        setIsSending(false);
        return false;
      }

      try {
        const result = await sendMessageRef.current(message.content);

        if (result.success) {
          // Success! Remove from queue
          setQueuedMessages((prev) => {
            const updated = prev.filter((m) => m.tempId !== tempId);
            persistQueue(updated);
            return updated;
          });

          // Notify success
          if (onMessageSentRef.current) {
            onMessageSentRef.current(tempId, result);
          }

          console.log(`[RetryQueue] Message ${tempId} sent successfully`);
          setIsSending(false);
          return true;
        } else {
          // Failed - update status and schedule retry
          setQueuedMessages((prev) => {
            const updated = prev.map((m) =>
              m.tempId === tempId
                ? {
                    ...m,
                    status: "failed" as const,
                    retryCount: m.retryCount + 1,
                    lastAttempt: Date.now(),
                    error: result.error || "Failed to send",
                  }
                : m
            );
            persistQueue(updated);

            // Schedule retry if under max retries
            const updatedMsg = updated.find((m) => m.tempId === tempId);
            if (updatedMsg && updatedMsg.retryCount < maxRetries) {
              scheduleRetry(tempId, updatedMsg.retryCount);
            }

            return updated;
          });

          console.log(`[RetryQueue] Message ${tempId} failed: ${result.error}`);
          setIsSending(false);
          return false;
        }
      } catch (err) {
        // Error - update status and schedule retry
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        setQueuedMessages((prev) => {
          const updated = prev.map((m) =>
            m.tempId === tempId
              ? {
                  ...m,
                  status: "failed" as const,
                  retryCount: m.retryCount + 1,
                  lastAttempt: Date.now(),
                  error: errorMessage,
                }
              : m
          );
          persistQueue(updated);

          // Schedule retry if under max retries
          const updatedMsg = updated.find((m) => m.tempId === tempId);
          if (updatedMsg && updatedMsg.retryCount < maxRetries) {
            scheduleRetry(tempId, updatedMsg.retryCount);
          }

          return updated;
        });

        console.log(`[RetryQueue] Message ${tempId} error: ${errorMessage}`);
        setIsSending(false);
        return false;
      }
    },
    [persistQueue, maxRetries, scheduleRetry]
  );

  // Update ref for circular dependency resolution
  useEffect(() => {
    attemptSendRef.current = attemptSend;
  }, [attemptSend]);

  // Add a new message to the queue and attempt to send
  const queueMessage = useCallback(
    (content: string): string => {
      const tempId = generateTempId();
      const newMessage: QueuedMessage = {
        tempId,
        conversationId,
        content,
        retryCount: 0,
        status: "pending",
        lastAttempt: Date.now(),
        queuedAt: Date.now(),
      };

      setQueuedMessages((prev) => {
        const updated = [...prev, newMessage];
        persistQueue(updated);
        return updated;
      });

      // Attempt to send immediately
      setTimeout(() => attemptSend(tempId), 0);

      return tempId;
    },
    [conversationId, persistQueue, attemptSend]
  );

  // Manually retry a specific message
  const retryMessage = useCallback(
    async (tempId: string): Promise<boolean> => {
      // Clear any scheduled retry
      const existing = retryTimeoutsRef.current.get(tempId);
      if (existing) {
        clearTimeout(existing);
        retryTimeoutsRef.current.delete(tempId);
      }

      // Reset retry count for manual retry
      setQueuedMessages((prev) => {
        const updated = prev.map((m) =>
          m.tempId === tempId ? { ...m, retryCount: 0 } : m
        );
        persistQueue(updated);
        return updated;
      });

      return attemptSend(tempId);
    },
    [persistQueue, attemptSend]
  );

  // Retry all failed messages
  const retryAll = useCallback(async () => {
    const failedMessages = queuedMessages.filter((m) => m.status === "failed");
    for (const msg of failedMessages) {
      await retryMessage(msg.tempId);
    }
  }, [queuedMessages, retryMessage]);

  // Remove a message from the queue
  const removeMessage = useCallback(
    (tempId: string) => {
      // Clear any scheduled retry
      const existing = retryTimeoutsRef.current.get(tempId);
      if (existing) {
        clearTimeout(existing);
        retryTimeoutsRef.current.delete(tempId);
      }

      setQueuedMessages((prev) => {
        const updated = prev.filter((m) => m.tempId !== tempId);
        persistQueue(updated);
        return updated;
      });
    },
    [persistQueue]
  );

  // Clear all messages from the queue
  const clearQueue = useCallback(() => {
    // Clear all scheduled retries
    retryTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    retryTimeoutsRef.current.clear();

    setQueuedMessages([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    const timeouts = retryTimeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  // Auto-retry failed messages on mount (if they have retries left)
  useEffect(() => {
    if (!enabled || !autoRetry) return;

    queuedMessages.forEach((msg) => {
      if (msg.status === "failed" && msg.retryCount < maxRetries) {
        // Check if enough time has passed since last attempt
        const delay = calculateDelay(msg.retryCount);
        const timeSinceLastAttempt = Date.now() - msg.lastAttempt;

        if (timeSinceLastAttempt >= delay) {
          // Retry now
          attemptSend(msg.tempId);
        } else {
          // Schedule for remaining time
          scheduleRetry(msg.tempId, msg.retryCount);
        }
      }
    });
    // Only run once on mount per conversation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, enabled]);

  return {
    queuedMessages,
    queueMessage,
    retryMessage,
    retryAll,
    removeMessage,
    clearQueue,
    isSending,
  };
}
