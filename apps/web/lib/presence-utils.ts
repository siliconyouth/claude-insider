/**
 * Presence Utilities
 *
 * Pure functions for computing presence status.
 * Separated from server actions to allow synchronous exports.
 */

// ============================================
// PRESENCE THRESHOLDS
// ============================================

/**
 * User is online ONLY if active within this time.
 * Set to 45 seconds (1.5x heartbeat interval of 30s).
 * This means missing just one heartbeat = offline.
 *
 * Philosophy: Default to offline, only show online with active signal.
 */
export const ONLINE_THRESHOLD_MS = 45 * 1000; // 45 seconds

/**
 * User is idle if active between online threshold and this time.
 * After this, user is completely offline.
 */
export const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes (was 1 hour)

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
