/**
 * Cache Utility Library
 *
 * Provides Redis-backed caching via Vercel KV for high-traffic endpoints.
 * Falls back to in-memory cache when KV is unavailable.
 *
 * Features:
 * - Automatic TTL management
 * - Cache invalidation helpers
 * - Namespace prefixing for organization
 * - Fallback to in-memory cache
 */

import { kv } from "@vercel/kv";

// In-memory fallback cache
const memoryCache = new Map<string, { value: unknown; expires: number }>();

// Cache configuration
export const CACHE_TTL = {
  /** User profiles - relatively static */
  USER_PROFILE: 3600, // 1 hour
  /** Notification counts - frequently read */
  NOTIFICATION_COUNT: 300, // 5 minutes
  /** Notifications list */
  NOTIFICATIONS: 300, // 5 minutes
  /** Collections list */
  COLLECTIONS: 1800, // 30 minutes
  /** Dashboard stats - moderate refresh */
  DASHBOARD_STATS: 600, // 10 minutes
  /** Favorites list */
  FAVORITES: 900, // 15 minutes
  /** User followers/following counts */
  FOLLOW_COUNTS: 600, // 10 minutes
  /** Resources list (public, rarely changes) */
  RESOURCES: 3600, // 1 hour
  /** Search results */
  SEARCH_RESULTS: 300, // 5 minutes
  /** Rate limit data */
  RATE_LIMIT: 3600, // 1 hour window
  /** Short-lived session data */
  SESSION: 1800, // 30 minutes
} as const;

// Cache key prefixes for namespacing
export const CACHE_PREFIX = {
  USER: "user:",
  NOTIFICATIONS: "notif:",
  COLLECTIONS: "coll:",
  FAVORITES: "fav:",
  DASHBOARD: "dash:",
  FOLLOW: "follow:",
  RESOURCES: "res:",
  SEARCH: "search:",
  RATE_LIMIT: "rl:",
} as const;

/**
 * Check if Vercel KV is available
 */
function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (isKvAvailable()) {
      return await kv.get<T>(key);
    }

    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.value as T;
    }
    memoryCache.delete(key);
    return null;
  } catch (error) {
    console.warn("[Cache] Get error:", error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  try {
    if (isKvAvailable()) {
      await kv.set(key, value, { ex: ttlSeconds });
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        value,
        expires: Date.now() + ttlSeconds * 1000,
      });
    }
  } catch (error) {
    console.warn("[Cache] Set error:", error);
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    if (isKvAvailable()) {
      await kv.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    console.warn("[Cache] Delete error:", error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    if (isKvAvailable()) {
      // Vercel KV supports SCAN for pattern matching
      const keys = await kv.keys(pattern);
      if (keys.length > 0) {
        await kv.del(...keys);
      }
    } else {
      // Memory cache pattern delete
      for (const key of memoryCache.keys()) {
        if (key.startsWith(pattern.replace("*", ""))) {
          memoryCache.delete(key);
        }
      }
    }
  } catch (error) {
    console.warn("[Cache] Delete pattern error:", error);
  }
}

/**
 * Get or set cache with automatic fetch
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache the result (don't await to not block response)
  cacheSet(key, data, ttlSeconds).catch(() => {});

  return data;
}

/**
 * Increment a counter in cache (for rate limiting)
 */
export async function cacheIncrement(
  key: string,
  ttlSeconds: number = 3600
): Promise<number> {
  try {
    if (isKvAvailable()) {
      const count = await kv.incr(key);
      // Set expiry on first increment
      if (count === 1) {
        await kv.expire(key, ttlSeconds);
      }
      return count;
    }

    // Memory cache fallback
    const cached = memoryCache.get(key);
    const now = Date.now();

    if (cached && cached.expires > now) {
      cached.value = (cached.value as number) + 1;
      return cached.value as number;
    }

    memoryCache.set(key, {
      value: 1,
      expires: now + ttlSeconds * 1000,
    });
    return 1;
  } catch (error) {
    console.warn("[Cache] Increment error:", error);
    return 1;
  }
}

// ============================================
// Cache Key Builders
// ============================================

/**
 * Build cache key for user profile
 */
export function userProfileKey(userId: string): string {
  return `${CACHE_PREFIX.USER}profile:${userId}`;
}

/**
 * Build cache key for user by username
 */
export function userByUsernameKey(username: string): string {
  return `${CACHE_PREFIX.USER}username:${username.toLowerCase()}`;
}

/**
 * Build cache key for notification count
 */
export function notificationCountKey(userId: string): string {
  return `${CACHE_PREFIX.NOTIFICATIONS}count:${userId}`;
}

/**
 * Build cache key for notifications list
 */
export function notificationsKey(userId: string, page: number = 1): string {
  return `${CACHE_PREFIX.NOTIFICATIONS}list:${userId}:${page}`;
}

/**
 * Build cache key for collections list
 */
export function collectionsKey(userId: string): string {
  return `${CACHE_PREFIX.COLLECTIONS}list:${userId}`;
}

/**
 * Build cache key for favorites
 */
export function favoritesKey(userId: string, type?: string): string {
  return `${CACHE_PREFIX.FAVORITES}${userId}${type ? `:${type}` : ""}`;
}

/**
 * Build cache key for follow counts
 */
export function followCountsKey(userId: string): string {
  return `${CACHE_PREFIX.FOLLOW}counts:${userId}`;
}

/**
 * Build cache key for dashboard stats
 */
export function dashboardStatsKey(): string {
  return `${CACHE_PREFIX.DASHBOARD}stats`;
}

/**
 * Build cache key for rate limiting
 */
export function rateLimitKey(identifier: string, action: string): string {
  return `${CACHE_PREFIX.RATE_LIMIT}${action}:${identifier}`;
}

// ============================================
// Cache Invalidation Helpers
// ============================================

/**
 * Invalidate all caches for a user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    cacheDelete(userProfileKey(userId)),
    cacheDeletePattern(`${CACHE_PREFIX.USER}*${userId}*`),
    cacheDelete(notificationCountKey(userId)),
    cacheDeletePattern(`${CACHE_PREFIX.NOTIFICATIONS}*${userId}*`),
    cacheDelete(collectionsKey(userId)),
    cacheDelete(favoritesKey(userId)),
    cacheDelete(followCountsKey(userId)),
  ]);
}

/**
 * Invalidate notification cache for a user
 */
export async function invalidateNotificationCache(userId: string): Promise<void> {
  await Promise.all([
    cacheDelete(notificationCountKey(userId)),
    cacheDeletePattern(`${CACHE_PREFIX.NOTIFICATIONS}list:${userId}:*`),
  ]);
}

/**
 * Invalidate collections cache for a user
 */
export async function invalidateCollectionsCache(userId: string): Promise<void> {
  await cacheDelete(collectionsKey(userId));
}

/**
 * Invalidate favorites cache for a user
 */
export async function invalidateFavoritesCache(userId: string): Promise<void> {
  await cacheDeletePattern(`${CACHE_PREFIX.FAVORITES}${userId}*`);
}

/**
 * Invalidate follow counts cache for a user
 */
export async function invalidateFollowCache(userId: string): Promise<void> {
  await cacheDelete(followCountsKey(userId));
}

/**
 * Invalidate dashboard stats cache
 */
export async function invalidateDashboardStats(): Promise<void> {
  await cacheDeletePattern(`${CACHE_PREFIX.DASHBOARD}*`);
}

// ============================================
// Debug & Monitoring
// ============================================

/**
 * Get cache stats (for diagnostics)
 */
export async function getCacheStats(): Promise<{
  provider: "vercel-kv" | "memory";
  memorySize: number;
  kvAvailable: boolean;
}> {
  return {
    provider: isKvAvailable() ? "vercel-kv" : "memory",
    memorySize: memoryCache.size,
    kvAvailable: isKvAvailable(),
  };
}

/**
 * Clear all memory cache (for testing)
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
}

/**
 * Cleanup expired entries from memory cache
 */
export function cleanupMemoryCache(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of memoryCache.entries()) {
    if (value.expires <= now) {
      memoryCache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Run cleanup every 5 minutes in development
if (process.env.NODE_ENV === "development") {
  setInterval(cleanupMemoryCache, 5 * 60 * 1000);
}
