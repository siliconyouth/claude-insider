/**
 * Achievement Queue Utility
 *
 * Manages a queue of achievements in localStorage so they can persist
 * across page reloads. This is essential because:
 * 1. Achievements may unlock during actions that trigger navigation/reload
 * 2. Multiple achievements might unlock simultaneously
 * 3. We want achievements to show even if unlocked during SSR/hydration
 *
 * Flow:
 * 1. Action triggers achievement → queueAchievement("achievement_id")
 * 2. Page loads → getPendingAchievements() returns queued achievements
 * 3. After showing → clearAchievement(id) or clearAllAchievements()
 */

const ACHIEVEMENT_QUEUE_KEY = "claude_insider_pending_achievements";

export interface QueuedAchievement {
  id: string;
  timestamp: number;
}

/**
 * Add an achievement to the queue for display
 */
export function queueAchievement(achievementId: string): void {
  if (typeof window === "undefined") return;

  const queue = getPendingAchievements();

  // Don't add duplicates
  if (queue.some((a) => a.id === achievementId)) return;

  queue.push({
    id: achievementId,
    timestamp: Date.now(),
  });

  localStorage.setItem(ACHIEVEMENT_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Queue multiple achievements at once
 */
export function queueAchievements(achievementIds: string[]): void {
  achievementIds.forEach(queueAchievement);
}

/**
 * Get all pending achievements, sorted by timestamp (oldest first)
 */
export function getPendingAchievements(): QueuedAchievement[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(ACHIEVEMENT_QUEUE_KEY);
    if (!stored) return [];

    const queue: QueuedAchievement[] = JSON.parse(stored);

    // Filter out achievements older than 1 hour (cleanup stale entries)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return queue
      .filter((a) => a.timestamp > oneHourAgo)
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return [];
  }
}

/**
 * Remove a specific achievement from the queue
 */
export function clearAchievement(achievementId: string): void {
  if (typeof window === "undefined") return;

  const queue = getPendingAchievements();
  const filtered = queue.filter((a) => a.id !== achievementId);
  localStorage.setItem(ACHIEVEMENT_QUEUE_KEY, JSON.stringify(filtered));
}

/**
 * Clear all pending achievements
 */
export function clearAllAchievements(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACHIEVEMENT_QUEUE_KEY);
}

/**
 * Check if a specific achievement is pending
 */
export function isAchievementPending(achievementId: string): boolean {
  return getPendingAchievements().some((a) => a.id === achievementId);
}
