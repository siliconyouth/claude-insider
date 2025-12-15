/**
 * Push Subscription API
 *
 * Manages Web Push subscriptions for background notifications.
 * - GET: Returns VAPID public key for client-side subscription
 * - POST: Saves a new push subscription
 * - DELETE: Removes a push subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getVapidPublicKey,
  savePushSubscription,
  removePushSubscription,
  isWebPushConfigured,
} from "@/lib/web-push";
import { PushSubscription } from "web-push";

/**
 * GET /api/push/subscribe
 * Returns the VAPID public key needed for client-side subscription
 */
export async function GET() {
  try {
    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { error: "Push notifications not configured" },
        { status: 503 }
      );
    }

    const publicKey = getVapidPublicKey();

    if (!publicKey) {
      return NextResponse.json(
        { error: "VAPID public key not available" },
        { status: 503 }
      );
    }

    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error("[Push API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to get VAPID key" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/push/subscribe
 * Save a new push subscription for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isWebPushConfigured()) {
      return NextResponse.json(
        { error: "Push notifications not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { subscription, deviceName } = body as {
      subscription: PushSubscription;
      deviceName?: string;
    };

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Get user agent for device identification
    const userAgent = request.headers.get("user-agent") || undefined;

    const result = await savePushSubscription(
      session.user.id,
      subscription,
      userAgent,
      deviceName
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to save subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Remove a push subscription for the current user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 }
      );
    }

    const result = await removePushSubscription(session.user.id, endpoint);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to remove subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push API] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
