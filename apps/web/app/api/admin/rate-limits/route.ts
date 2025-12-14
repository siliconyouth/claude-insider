/**
 * Rate Limits Status API
 *
 * GET /api/admin/rate-limits
 *
 * Returns current rate limit status for the authenticated user.
 * Admin/moderator only.
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";
import {
  getRateLimitStatus,
  RATE_LIMITS,
  resetRateLimit,
  getAllRateLimits,
} from "@/lib/rate-limiter";

export async function GET() {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Verify the user
    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin", "moderator"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const userId = user.id;

    // Get rate limit status for all endpoints
    const endpoints = Object.keys(RATE_LIMITS);
    const status: Record<
      string,
      {
        remaining: number;
        limit: number;
        resetTime: number;
        resetIn: string;
      }
    > = {};

    const now = Math.floor(Date.now() / 1000);

    for (const endpoint of endpoints) {
      const result = getRateLimitStatus(userId, endpoint);
      const secondsUntilReset = Math.max(0, result.resetTime - now);
      const minutes = Math.floor(secondsUntilReset / 60);
      const seconds = secondsUntilReset % 60;

      status[endpoint] = {
        remaining: result.remaining,
        limit: result.limit,
        resetTime: result.resetTime,
        resetIn:
          secondsUntilReset > 0
            ? `${minutes}m ${seconds}s`
            : "Now",
      };
    }

    return NextResponse.json({
      userId,
      limits: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Rate limits status error:", error);
    return NextResponse.json(
      { error: "Failed to get rate limit status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/rate-limits
 *
 * Reset rate limits for a user/endpoint (admin only).
 */
export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Verify the user is admin
    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin"])) {
      return NextResponse.json(
        { error: "Forbidden - admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userId, endpoint } = body;

    if (action === "reset") {
      if (!userId || !endpoint) {
        return NextResponse.json(
          { error: "userId and endpoint are required" },
          { status: 400 }
        );
      }

      resetRateLimit(userId, endpoint);

      return NextResponse.json({
        success: true,
        message: `Rate limit reset for user ${userId} on endpoint ${endpoint}`,
      });
    }

    if (action === "list") {
      // Admin can view all active rate limits
      const allLimits = getAllRateLimits();

      return NextResponse.json({
        success: true,
        activeLimits: allLimits,
        count: allLimits.length,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "reset" or "list"' },
      { status: 400 }
    );
  } catch (error) {
    console.error("Rate limits action error:", error);
    return NextResponse.json(
      { error: "Failed to perform rate limit action" },
      { status: 500 }
    );
  }
}
