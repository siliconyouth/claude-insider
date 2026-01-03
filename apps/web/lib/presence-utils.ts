/**
 * Presence Utilities
 *
 * Pure functions for computing presence status.
 * Separated from server actions to allow synchronous exports.
 */

// ============================================
// PRESENCE THRESHOLDS (Matrix SDK Pattern)
// ============================================

/** User is online if active within this time (2 minutes) */
export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

/** User is idle if active within this time but not recent (1 hour) */
export const IDLE_THRESHOLD_MS = 60 * 60 * 1000;

// ============================================
// TYPES
// ============================================

export type PresenceStatus = "online" | "offline" | "idle";

// ============================================
// UTILITIES
// ============================================

/**
 * Compute presence status from last_active_at timestamp.
 * Uses Matrix SDK pattern: compute at query time for reliability.
 *
 * @param lastActiveAt - ISO timestamp of last activity, or null
 * @param now - Current timestamp in ms (defaults to Date.now())
 * @returns PresenceStatus: "online", "idle", or "offline"
 */
export function computePresenceStatus(
  lastActiveAt: string | null | undefined,
  now: number = Date.now()
): PresenceStatus {
  if (!lastActiveAt) return "offline";
  const lastActive = new Date(lastActiveAt).getTime();
  const diff = now - lastActive;
  if (diff < ONLINE_THRESHOLD_MS) return "online";
  if (diff < IDLE_THRESHOLD_MS) return "idle";
  return "offline";
}
