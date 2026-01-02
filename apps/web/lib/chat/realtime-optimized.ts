/**
 * Optimized Realtime Utilities
 *
 * Performance optimizations for Supabase Realtime:
 * - Batched updates to reduce re-renders
 * - Debounced typing indicators
 * - Connection pooling
 * - Efficient subscription management
 *
 * Usage:
 * ```typescript
 * import { useBatchedUpdates, useOptimizedPresence } from '@/lib/chat/realtime-optimized';
 *
 * const { messages, addMessage } = useBatchedUpdates<Message>({
 *   batchWindow: 50,
 *   maxBatchSize: 20,
 * });
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// BATCHED UPDATES
// ============================================================================

interface BatchConfig {
  /** Time window to collect updates (ms) */
  batchWindow: number;
  /** Maximum updates before forcing flush */
  maxBatchSize: number;
  /** Deduplicate by key function */
  getKey?: (item: unknown) => string;
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchWindow: 50, // 50ms batching window
  maxBatchSize: 20, // Force flush at 20 items
};

/**
 * Batches rapid updates to reduce re-renders
 */
export function useBatchedUpdates<T>(config: Partial<BatchConfig> = {}) {
  const { batchWindow, maxBatchSize, getKey } = {
    ...DEFAULT_BATCH_CONFIG,
    ...config,
  };

  const [items, setItems] = useState<T[]>([]);
  const pendingRef = useRef<T[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const flush = useCallback(() => {
    if (pendingRef.current.length === 0) return;

    const pending = pendingRef.current;
    pendingRef.current = [];

    setItems((prev) => {
      // Deduplicate if key function provided
      if (getKey) {
        const seen = new Set(prev.map((item) => getKey(item)));
        const newItems = pending.filter((item) => !seen.has(getKey(item)));
        return [...prev, ...newItems];
      }
      return [...prev, ...pending];
    });
  }, [getKey]);

  const addItem = useCallback(
    (item: T) => {
      pendingRef.current.push(item);

      // Force flush if batch is full
      if (pendingRef.current.length >= maxBatchSize) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        flush();
        return;
      }

      // Schedule flush
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          flush();
        }, batchWindow);
      }
    },
    [batchWindow, maxBatchSize, flush]
  );

  const addItems = useCallback(
    (newItems: T[]) => {
      for (const item of newItems) {
        addItem(item);
      }
    },
    [addItem]
  );

  const updateItem = useCallback(
    (key: string, updater: (item: T) => T) => {
      if (!getKey) {
        console.warn("updateItem requires getKey function");
        return;
      }

      setItems((prev) =>
        prev.map((item) => (getKey(item) === key ? updater(item) : item))
      );
    },
    [getKey]
  );

  const removeItem = useCallback(
    (key: string) => {
      if (!getKey) {
        console.warn("removeItem requires getKey function");
        return;
      }

      setItems((prev) => prev.filter((item) => getKey(item) !== key));
    },
    [getKey]
  );

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = [];
    setItems([]);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    items,
    addItem,
    addItems,
    updateItem,
    removeItem,
    clear,
    setItems,
  };
}

// ============================================================================
// DEBOUNCED TYPING INDICATOR
// ============================================================================

interface TypingConfig {
  /** Debounce delay for sending typing status */
  debounceMs: number;
  /** Auto-stop typing after this duration */
  autoStopMs: number;
}

const DEFAULT_TYPING_CONFIG: TypingConfig = {
  debounceMs: 300,
  autoStopMs: 5000,
};

/**
 * Manages typing indicator with debouncing
 */
export function useDebouncedTyping(
  onTypingChange: (isTyping: boolean) => void,
  config: Partial<TypingConfig> = {}
) {
  const { debounceMs, autoStopMs } = { ...DEFAULT_TYPING_CONFIG, ...config };

  const isTypingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    // Clear existing timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
    }

    // Debounce the start signal
    debounceTimerRef.current = setTimeout(() => {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingChange(true);
      }

      // Set auto-stop timer
      autoStopTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingChange(false);
      }, autoStopMs);
    }, debounceMs);
  }, [debounceMs, autoStopMs, onTypingChange]);

  const stopTyping = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange(false);
    }
  }, [onTypingChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    };
  }, []);

  return { startTyping, stopTyping };
}

// ============================================================================
// OPTIMIZED PRESENCE
// ============================================================================

interface PresenceState {
  userId: string;
  status: "online" | "idle" | "offline";
  lastSeen: string;
  metadata?: Record<string, unknown>;
}

interface PresenceConfig {
  /** Heartbeat interval (ms) */
  heartbeatInterval: number;
  /** Consider user idle after this duration (ms) */
  idleTimeout: number;
  /** Batch presence updates */
  batchUpdates: boolean;
}

const DEFAULT_PRESENCE_CONFIG: PresenceConfig = {
  heartbeatInterval: 30000, // 30 seconds
  idleTimeout: 120000, // 2 minutes
  batchUpdates: true,
};

/**
 * Optimized presence tracking with batching
 */
export function useOptimizedPresence(
  userId: string,
  onPresenceChange: (presences: Map<string, PresenceState>) => void,
  config: Partial<PresenceConfig> = {}
) {
  const { heartbeatInterval, idleTimeout, batchUpdates } = {
    ...DEFAULT_PRESENCE_CONFIG,
    ...config,
  };

  const presencesRef = useRef<Map<string, PresenceState>>(new Map());
  const lastActivityRef = useRef<number>(Date.now());
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Map<string, PresenceState>>(new Map());

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, []);

  // Flush batched updates
  const flushUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.size === 0) return;

    for (const [id, state] of pendingUpdatesRef.current) {
      presencesRef.current.set(id, state);
    }
    pendingUpdatesRef.current.clear();

    onPresenceChange(new Map(presencesRef.current));
  }, [onPresenceChange]);

  // Update presence
  const updatePresence = useCallback(
    (state: PresenceState) => {
      if (batchUpdates) {
        pendingUpdatesRef.current.set(state.userId, state);

        if (!batchTimerRef.current) {
          batchTimerRef.current = setTimeout(() => {
            batchTimerRef.current = null;
            flushUpdates();
          }, 100); // 100ms batch window for presence
        }
      } else {
        presencesRef.current.set(state.userId, state);
        onPresenceChange(new Map(presencesRef.current));
      }
    },
    [batchUpdates, flushUpdates, onPresenceChange]
  );

  // Remove presence
  const removePresence = useCallback(
    (removedUserId: string) => {
      presencesRef.current.delete(removedUserId);
      pendingUpdatesRef.current.delete(removedUserId);
      onPresenceChange(new Map(presencesRef.current));
    },
    [onPresenceChange]
  );

  // Get current status
  const getCurrentStatus = useCallback((): "online" | "idle" => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    return timeSinceActivity > idleTimeout ? "idle" : "online";
  }, [idleTimeout]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current);
      }
    };
  }, []);

  return {
    presences: presencesRef.current,
    updatePresence,
    removePresence,
    getCurrentStatus,
    heartbeatInterval,
  };
}

// ============================================================================
// SUBSCRIPTION MANAGER
// ============================================================================

type UnsubscribeFn = () => void;

interface Subscription {
  id: string;
  channel: string;
  refCount: number;
  unsubscribe: UnsubscribeFn;
  createdAt: number;
}

/**
 * Manages realtime subscriptions with reference counting
 */
class SubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private static instance: SubscriptionManager | null = null;

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  /**
   * Subscribe to a channel (reuses existing subscription if available)
   */
  subscribe(
    channel: string,
    subscribeFn: () => UnsubscribeFn
  ): { id: string; unsubscribe: () => void } {
    const existing = this.subscriptions.get(channel);

    if (existing) {
      existing.refCount++;
      return {
        id: existing.id,
        unsubscribe: () => this.unsubscribe(channel),
      };
    }

    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const unsubscribeFn = subscribeFn();

    this.subscriptions.set(channel, {
      id,
      channel,
      refCount: 1,
      unsubscribe: unsubscribeFn,
      createdAt: Date.now(),
    });

    return {
      id,
      unsubscribe: () => this.unsubscribe(channel),
    };
  }

  /**
   * Unsubscribe from a channel (only actually unsubscribes when refCount hits 0)
   */
  unsubscribe(channel: string): void {
    const subscription = this.subscriptions.get(channel);
    if (!subscription) return;

    subscription.refCount--;

    if (subscription.refCount <= 0) {
      subscription.unsubscribe();
      this.subscriptions.delete(channel);
    }
  }

  /**
   * Get subscription stats
   */
  getStats(): {
    total: number;
    channels: Array<{ channel: string; refCount: number; age: number }>;
  } {
    const now = Date.now();
    return {
      total: this.subscriptions.size,
      channels: Array.from(this.subscriptions.values()).map((sub) => ({
        channel: sub.channel,
        refCount: sub.refCount,
        age: now - sub.createdAt,
      })),
    };
  }

  /**
   * Force unsubscribe all
   */
  unsubscribeAll(): void {
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
  }
}

export const subscriptionManager = SubscriptionManager.getInstance();

// ============================================================================
// OPTIMIZED CHANNEL HOOK
// ============================================================================

/**
 * Hook for optimized channel subscription with batching
 */
export function useOptimizedChannel<T>(
  channelName: string,
  onMessage: (payload: T) => void,
  options: {
    batchWindow?: number;
    enabled?: boolean;
  } = {}
) {
  const { batchWindow = 50, enabled = true } = options;

  const pendingRef = useRef<T[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(onMessage);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  const flush = useCallback(() => {
    if (pendingRef.current.length === 0) return;

    const pending = pendingRef.current;
    pendingRef.current = [];

    for (const payload of pending) {
      callbackRef.current(payload);
    }
  }, []);

  const handleMessage = useCallback(
    (payload: T) => {
      if (batchWindow <= 0) {
        callbackRef.current(payload);
        return;
      }

      pendingRef.current.push(payload);

      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          flush();
        }, batchWindow);
      }
    },
    [batchWindow, flush]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    handleMessage,
    enabled,
    channelName,
  };
}

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

/**
 * Deduplicates concurrent requests for the same resource
 */
export class RequestDeduplicator<T> {
  private pending: Map<string, PendingRequest<T>> = new Map();
  private maxAge: number;

  constructor(maxAge: number = 5000) {
    this.maxAge = maxAge;
  }

  /**
   * Execute request, deduplicating if same request is pending
   */
  async execute(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);

    // Return existing if not expired
    if (existing && Date.now() - existing.timestamp < this.maxAge) {
      return existing.promise;
    }

    // Create new request
    const promise = fetcher().finally(() => {
      // Clean up after completion
      setTimeout(() => {
        const current = this.pending.get(key);
        if (current?.promise === promise) {
          this.pending.delete(key);
        }
      }, 100);
    });

    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pending.clear();
  }
}

// Global deduplicator instances
export const messageDeduplicator = new RequestDeduplicator();
export const conversationDeduplicator = new RequestDeduplicator();
export const presenceDeduplicator = new RequestDeduplicator();
