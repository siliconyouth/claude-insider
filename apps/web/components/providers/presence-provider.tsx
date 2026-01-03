"use client";
/* eslint-disable react-hooks/purity */

/**
 * Presence Provider (Matrix SDK Pattern)
 *
 * Manages user online/idle/offline status with:
 *
 * 1. **Heartbeat Loop** - Sends heartbeat every 30 seconds while ACTIVE
 * 2. **User Activity Detection** - Tracks mouse/keyboard to detect idle
 * 3. **Browser Close Handler** - Sets offline on beforeunload
 * 4. **Visibility Change Handler** - Tracks when tab becomes hidden/visible
 *
 * The Matrix SDK doesn't trust stored status - it computes presence at query time.
 * This provider sends regular heartbeats so the server can compute accurate status.
 *
 * IMPORTANT: Heartbeats are PAUSED when user is idle (no interaction for 2+ minutes).
 * This allows the server-side presence computation to correctly show "idle" or "offline".
 */

import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./auth-provider";
import { heartbeat, updatePresence } from "@/app/actions/presence";

// ============================================
// CONSTANTS (Matrix SDK timing patterns)
// ============================================

// Send heartbeat every 30 seconds while active
const HEARTBEAT_INTERVAL_MS = 30000;

// Stop sending heartbeats after 45 seconds of no user activity
// This matches ONLINE_THRESHOLD_MS - if no activity, user goes offline
const IDLE_AFTER_INACTIVE_MS = 45 * 1000;

// Mark as idle after 2 minutes of tab hidden
const IDLE_AFTER_HIDDEN_MS = 2 * 60 * 1000;

// Minimum time between heartbeats to prevent hammering
const MIN_HEARTBEAT_INTERVAL_MS = 10000;

// ============================================
// CONTEXT
// ============================================

interface PresenceContextValue {
  /** Force send a heartbeat (useful after user interaction) */
  sendHeartbeat: () => Promise<void>;
  /** Manually set status (rarely needed) */
  setStatus: (status: "online" | "offline") => Promise<void>;
}

const PresenceContext = createContext<PresenceContextValue>({
  sendHeartbeat: async () => {},
  setStatus: async () => {},
});

export function usePresence() {
  return useContext(PresenceContext);
}

// ============================================
// PROVIDER
// ============================================

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const lastHeartbeatRef = useRef<number>(0);
  const lastUserActivityRef = useRef<number>(Date.now());
  const hiddenSinceRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Check if user is currently active (had interaction within threshold)
  const isUserActive = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastUserActivityRef.current;
    return timeSinceActivity < IDLE_AFTER_INACTIVE_MS;
  }, []);

  // Update last activity timestamp (called on user interaction)
  const recordUserActivity = useCallback(() => {
    lastUserActivityRef.current = Date.now();
  }, []);

  // Send heartbeat with throttling - ONLY if user is active
  const sendHeartbeat = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Don't send heartbeat if user has been idle
    if (!isUserActive()) {
      return;
    }

    const now = Date.now();
    if (now - lastHeartbeatRef.current < MIN_HEARTBEAT_INTERVAL_MS) {
      return; // Throttle heartbeats
    }

    lastHeartbeatRef.current = now;

    try {
      await heartbeat();
    } catch (error) {
      // Silently fail - don't break the app for presence issues
      console.warn("[Presence] Heartbeat failed:", error);
    }
  }, [isUserActive]);

  // Set status explicitly
  const setStatus = useCallback(async (status: "online" | "offline") => {
    try {
      await updatePresence(status);
    } catch (error) {
      console.warn("[Presence] Status update failed:", error);
    }
  }, []);

  // Start heartbeat loop when authenticated
  useEffect(() => {
    if (!isAuthenticated || isLoading || !user?.id) {
      // Clear any existing interval if user logs out
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Send initial heartbeat
    sendHeartbeat();

    // Start periodic heartbeat
    heartbeatIntervalRef.current = setInterval(() => {
      // Only send if tab is visible
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, isLoading, user?.id, sendHeartbeat]);

  // Handle tab visibility changes
  useEffect(() => {
    if (!isAuthenticated || isLoading || !user?.id) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Track when tab became hidden
        hiddenSinceRef.current = Date.now();
      } else {
        // Tab became visible again
        const hiddenDuration = hiddenSinceRef.current
          ? Date.now() - hiddenSinceRef.current
          : 0;
        hiddenSinceRef.current = null;

        if (hiddenDuration > IDLE_AFTER_HIDDEN_MS) {
          // User was away for a while
          console.log("[Presence] Tab visible after long hidden, refreshing status");
        }

        // Record activity and send heartbeat when tab becomes visible
        // This ensures user appears online when they return to the tab
        recordUserActivity();
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, isLoading, user?.id, sendHeartbeat, recordUserActivity]);

  // Track user activity (mouse, keyboard, touch, scroll)
  useEffect(() => {
    if (!isAuthenticated || isLoading || !user?.id) return;

    // Throttle activity recording to prevent excessive updates
    let activityTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledRecordActivity = () => {
      if (activityTimeout) return;
      recordUserActivity();
      activityTimeout = setTimeout(() => {
        activityTimeout = null;
      }, 1000); // Only record activity once per second max
    };

    // Listen for user interaction events
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => {
      document.addEventListener(event, throttledRecordActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledRecordActivity);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [isAuthenticated, isLoading, user?.id, recordUserActivity]);

  // Handle browser close/navigate away
  useEffect(() => {
    if (!isAuthenticated || isLoading || !user?.id) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery on page close
      // This is more reliable than fetch() in beforeunload
      try {
        const data = JSON.stringify({ status: "offline" });
        navigator.sendBeacon("/api/presence/offline", data);
      } catch {
        // Fallback: try sync XHR (not recommended but works)
        // This is a best-effort - we can't guarantee delivery on page close
      }
    };

    // Also handle pagehide for mobile browsers
    const handlePageHide = (event: PageTransitionEvent) => {
      // Only trigger if page is being unloaded (not just hidden)
      if (event.persisted) return;

      try {
        const data = JSON.stringify({ status: "offline" });
        navigator.sendBeacon("/api/presence/offline", data);
      } catch {
        // Best effort
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isAuthenticated, isLoading, user?.id]);

  // Track mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const value: PresenceContextValue = {
    sendHeartbeat,
    setStatus,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}
