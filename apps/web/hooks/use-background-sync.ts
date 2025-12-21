"use client";

/**
 * Background Sync Hook
 *
 * Provides offline-first functionality by queuing operations when offline
 * and automatically syncing when connectivity is restored.
 */

import { useCallback, useEffect, useState } from "react";

// Sync tags must match those in sw.js
export const SYNC_TAGS = {
  FAVORITES: "sync-favorites",
  RATINGS: "sync-ratings",
  MESSAGES: "sync-messages",
  PREFERENCES: "sync-preferences",
} as const;

export type SyncTag = (typeof SYNC_TAGS)[keyof typeof SYNC_TAGS];

interface SyncRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

interface PendingSyncRequest extends SyncRequest {
  id: number;
  tag: string;
  timestamp: number;
}

interface UseBackgroundSyncReturn {
  /** Whether background sync is supported */
  isSupported: boolean;
  /** Whether the device is online */
  isOnline: boolean;
  /** Queue a request for background sync */
  queueSync: (tag: SyncTag, request: SyncRequest) => Promise<void>;
  /** Get pending sync requests for a tag */
  getPendingSyncs: (tag: SyncTag) => Promise<PendingSyncRequest[]>;
  /** Clear pending syncs for a tag */
  clearPendingSyncs: (tag: SyncTag) => Promise<void>;
  /** Manually trigger sync (when coming online) */
  triggerSync: (tag: SyncTag) => Promise<void>;
  /** Number of pending sync operations */
  pendingCount: number;
}

export function useBackgroundSync(): UseBackgroundSyncReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  // Check for background sync support
  useEffect(() => {
    const checkSupport = async () => {
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          setIsSupported("sync" in registration);
        } catch {
          setIsSupported(false);
        }
      }
    };
    checkSupport();
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger syncs for all tags when coming online
      Object.values(SYNC_TAGS).forEach((tag) => {
        navigator.serviceWorker?.controller?.postMessage({
          type: "TRIGGER_SYNC",
          payload: { tag },
        });
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Listen for sync completion messages from service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, tag } = event.data || {};

      if (type === "SYNC_COMPLETE") {
        console.log(`[BackgroundSync] Completed sync for ${tag}`);
        // Update pending count
        updatePendingCount();
      } else if (type === "SYNC_QUEUED") {
        console.log(`[BackgroundSync] Queued sync for ${tag}`);
        setPendingCount((prev) => prev + 1);
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  // Update pending count on mount
  const updatePendingCount = useCallback(async () => {
    if (!navigator.serviceWorker?.controller) return;

    let total = 0;
    for (const tag of Object.values(SYNC_TAGS)) {
      const syncs = await getPendingSyncs(tag);
      total += syncs.length;
    }
    setPendingCount(total);
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  const queueSync = useCallback(
    async (tag: SyncTag, request: SyncRequest): Promise<void> => {
      if (!navigator.serviceWorker?.controller) {
        // No service worker - try to execute directly
        if (isOnline) {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body ? JSON.stringify(request.body) : undefined,
          });
          if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
          }
          return;
        }
        throw new Error("No service worker available and device is offline");
      }

      const controller = navigator.serviceWorker.controller;
      return new Promise((resolve, reject) => {
        const channel = new MessageChannel();

        channel.port1.onmessage = (event) => {
          if (event.data.type === "SYNC_QUEUED") {
            resolve();
          } else if (event.data.type === "SYNC_QUEUE_ERROR") {
            reject(new Error(event.data.error));
          }
        };

        controller.postMessage(
          {
            type: "QUEUE_SYNC",
            payload: {
              tag,
              request: {
                url: request.url,
                method: request.method,
                headers: request.headers,
                _body: request.body,
              },
            },
          },
          [channel.port2]
        );
      });
    },
    [isOnline]
  );

  const getPendingSyncs = useCallback(
    async (tag: SyncTag): Promise<PendingSyncRequest[]> => {
      const controller = navigator.serviceWorker?.controller;
      if (!controller) {
        return [];
      }

      return new Promise((resolve) => {
        const channel = new MessageChannel();

        // Set timeout in case service worker doesn't respond
        const timeout = setTimeout(() => resolve([]), 3000);

        channel.port1.onmessage = (event) => {
          clearTimeout(timeout);
          if (event.data.type === "PENDING_SYNCS") {
            resolve(event.data.requests || []);
          }
        };

        controller.postMessage(
          {
            type: "GET_PENDING_SYNCS",
            payload: { tag },
          },
          [channel.port2]
        );
      });
    },
    []
  );

  const clearPendingSyncs = useCallback(
    async (tag: SyncTag): Promise<void> => {
      const controller = navigator.serviceWorker?.controller;
      if (!controller) {
        return;
      }

      return new Promise((resolve) => {
        const channel = new MessageChannel();

        channel.port1.onmessage = (event) => {
          if (event.data.type === "SYNCS_CLEARED") {
            updatePendingCount();
            resolve();
          }
        };

        controller.postMessage(
          {
            type: "CLEAR_PENDING_SYNCS",
            payload: { tag },
          },
          [channel.port2]
        );
      });
    },
    [updatePendingCount]
  );

  const triggerSync = useCallback(async (tag: SyncTag): Promise<void> => {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) {
      return;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        if (event.data.type === "SYNC_TRIGGERED") {
          resolve();
        }
      };

      controller.postMessage(
        {
          type: "TRIGGER_SYNC",
          payload: { tag },
        },
        [channel.port2]
      );
    });
  }, []);

  return {
    isSupported,
    isOnline,
    queueSync,
    getPendingSyncs,
    clearPendingSyncs,
    triggerSync,
    pendingCount,
  };
}

/**
 * Helper to create a sync-enabled fetch function
 * Falls back to background sync when offline
 */
export function createSyncFetch(tag: SyncTag) {
  return async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response | null> => {
    const { method = "GET", headers = {}, body } = options;

    // If online, try normal fetch
    if (navigator.onLine) {
      try {
        return await fetch(url, options);
      } catch (error) {
        console.warn("[SyncFetch] Request failed, queueing for sync:", error);
      }
    }

    // Queue for background sync
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "QUEUE_SYNC",
        payload: {
          tag,
          request: {
            url,
            method,
            headers:
              headers instanceof Headers
                ? Object.fromEntries(headers.entries())
                : (headers as Record<string, string>),
            _body: body ? JSON.parse(body as string) : undefined,
          },
        },
      });
    }

    // Return null to indicate request was queued
    return null;
  };
}
