/**
 * Rate Limiter
 *
 * Token bucket algorithm for API rate limiting.
 * Supports per-user and per-IP limiting with configurable windows.
 *
 * Uses Redis (Vercel KV) for distributed rate limiting across serverless instances.
 * Falls back to in-memory store when KV is unavailable.
 */

import "server-only";
import { kv } from "@vercel/kv";

// In-memory fallback store for rate limits
const rateLimitStore = new Map<
  string,
  {
    tokens: number;
    lastRefill: number;
  }
>();

// Check if Vercel KV is available
function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export interface RateLimitConfig {
  /** Maximum tokens in bucket */
  maxTokens: number;
  /** Tokens to refill per window */
  refillRate: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining tokens */
  remaining: number;
  /** Total limit */
  limit: number;
  /** Reset time (Unix timestamp in seconds) */
  resetTime: number;
  /** Retry after (seconds) - only set if not allowed */
  retryAfter?: number;
}

// Default rate limit configurations by endpoint type
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Discovery - expensive operation (AI + scraping)
  discover: {
    maxTokens: 10,
    refillRate: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Scraping - external API calls
  scrape: {
    maxTokens: 20,
    refillRate: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // AI Analysis - API costs
  analyze: {
    maxTokens: 30,
    refillRate: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Queue operations - relatively cheap
  queue: {
    maxTokens: 100,
    refillRate: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Bulk operations - more expensive
  bulk: {
    maxTokens: 20,
    refillRate: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Import operations
  import: {
    maxTokens: 5,
    refillRate: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Default fallback
  default: {
    maxTokens: 60,
    refillRate: 60,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Generate a unique key for rate limiting
 */
export function getRateLimitKey(
  identifier: string,
  endpoint: string
): string {
  return `ratelimit:${endpoint}:${identifier}`;
}

/**
 * Check and consume a rate limit token (async for Redis support)
 */
export async function checkRateLimit(
  identifier: string | number,
  endpoint: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const id = String(identifier);
  const key = getRateLimitKey(id, endpoint);
  const limitConfig = config || RATE_LIMITS[endpoint] || RATE_LIMITS.default!;
  const now = Date.now();
  const windowSeconds = Math.ceil(limitConfig.windowMs / 1000);

  // Use Redis if available
  if (isKvAvailable()) {
    try {
      // Use Redis INCR with expiry for atomic rate limiting
      const count = await kv.incr(key);

      // Set expiry on first request
      if (count === 1) {
        await kv.expire(key, windowSeconds);
      }

      // Get TTL for reset time
      const ttl = await kv.ttl(key);
      const resetTime = Math.ceil(now / 1000) + (ttl > 0 ? ttl : windowSeconds);

      if (count <= limitConfig.maxTokens) {
        return {
          allowed: true,
          remaining: limitConfig.maxTokens - count,
          limit: limitConfig.maxTokens,
          resetTime,
        };
      }

      return {
        allowed: false,
        remaining: 0,
        limit: limitConfig.maxTokens,
        resetTime,
        retryAfter: ttl > 0 ? ttl : windowSeconds,
      };
    } catch (error) {
      console.warn("[Rate Limiter] Redis error, falling back to memory:", error);
      // Fall through to in-memory implementation
    }
  }

  // In-memory fallback
  let bucket = rateLimitStore.get(key);

  if (!bucket) {
    // New bucket - start with max tokens
    bucket = {
      tokens: limitConfig.maxTokens,
      lastRefill: now,
    };
    rateLimitStore.set(key, bucket);
  } else {
    // Refill tokens based on time elapsed
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(
      (elapsed / limitConfig.windowMs) * limitConfig.refillRate
    );

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(
        limitConfig.maxTokens,
        bucket.tokens + tokensToAdd
      );
      bucket.lastRefill = now;
    }
  }

  // Calculate reset time
  const resetTime = Math.ceil(
    (bucket.lastRefill + limitConfig.windowMs) / 1000
  );

  // Check if request is allowed
  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    rateLimitStore.set(key, bucket);

    return {
      allowed: true,
      remaining: bucket.tokens,
      limit: limitConfig.maxTokens,
      resetTime,
    };
  }

  // Calculate retry after
  const timeUntilRefill = bucket.lastRefill + limitConfig.windowMs - now;
  const retryAfter = Math.ceil(timeUntilRefill / 1000);

  return {
    allowed: false,
    remaining: 0,
    limit: limitConfig.maxTokens,
    resetTime,
    retryAfter: Math.max(1, retryAfter),
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: HeadersInit = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create a rate-limited response (429 Too Many Requests)
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Please retry after ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...getRateLimitHeaders(result),
      },
    }
  );
}

/**
 * Rate limit middleware wrapper for API routes
 */
export function withRateLimit(
  endpoint: string,
  handler: (request: Request, identifier: string) => Promise<Response>,
  getIdentifier?: (request: Request) => string
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    // Get identifier (user ID from auth, or IP address as fallback)
    const identifier = getIdentifier
      ? getIdentifier(request)
      : request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "anonymous";

    // Check rate limit (now async for Redis support)
    const result = await checkRateLimit(identifier, endpoint);

    if (!result.allowed) {
      return createRateLimitResponse(result);
    }

    // Execute handler and add rate limit headers to response
    const response = await handler(request, identifier);

    // Clone response to add headers
    const headers = new Headers(response.headers);
    Object.entries(getRateLimitHeaders(result)).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * Get current rate limit status for a user/endpoint
 */
export function getRateLimitStatus(
  identifier: string | number,
  endpoint: string
): RateLimitResult {
  const id = String(identifier);
  const key = getRateLimitKey(id, endpoint);
  const limitConfig = RATE_LIMITS[endpoint] || RATE_LIMITS.default!;
  const now = Date.now();

  const bucket = rateLimitStore.get(key);

  if (!bucket) {
    return {
      allowed: true,
      remaining: limitConfig.maxTokens,
      limit: limitConfig.maxTokens,
      resetTime: Math.ceil((now + limitConfig.windowMs) / 1000),
    };
  }

  // Calculate current tokens after refill
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(
    (elapsed / limitConfig.windowMs) * limitConfig.refillRate
  );
  const currentTokens = Math.min(
    limitConfig.maxTokens,
    bucket.tokens + tokensToAdd
  );

  return {
    allowed: currentTokens > 0,
    remaining: currentTokens,
    limit: limitConfig.maxTokens,
    resetTime: Math.ceil((bucket.lastRefill + limitConfig.windowMs) / 1000),
  };
}

/**
 * Reset rate limit for a specific user/endpoint (admin only)
 */
export function resetRateLimit(identifier: string, endpoint: string): void {
  const key = getRateLimitKey(identifier, endpoint);
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (for testing/maintenance)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get all active rate limit entries (for monitoring)
 */
export function getAllRateLimits(): Array<{
  key: string;
  tokens: number;
  lastRefill: Date;
}> {
  const entries: Array<{
    key: string;
    tokens: number;
    lastRefill: Date;
  }> = [];

  rateLimitStore.forEach((value, key) => {
    entries.push({
      key,
      tokens: value.tokens,
      lastRefill: new Date(value.lastRefill),
    });
  });

  return entries;
}
