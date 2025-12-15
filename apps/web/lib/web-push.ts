/**
 * Web Push Notifications
 *
 * Server-side library for sending push notifications to users
 * even when they're not on the website.
 *
 * Uses VAPID (Voluntary Application Server Identification) for authentication.
 */

import webPush, { PushSubscription } from "web-push";
import { pool } from "./db";

// Initialize web-push with VAPID keys
// VAPID keys should be generated once and stored as environment variables
// Generate with: npx web-push generate-vapid-keys
/* eslint-disable turbo/no-undeclared-env-vars */
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || "support@claudeinsider.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}
/* eslint-enable turbo/no-undeclared-env-vars */

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  actions?: Array<{ action: string; title: string }>;
  data?: Record<string, unknown>;
}

export interface StoredSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent?: string;
  device_name?: string;
}

/**
 * Get the public VAPID key for client-side subscription
 */
export function getVapidPublicKey(): string | null {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Save a push subscription for a user
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription,
  userAgent?: string,
  deviceName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const keys = subscription.keys as { p256dh: string; auth: string } | undefined;

    if (!keys?.p256dh || !keys?.auth) {
      return { success: false, error: "Invalid subscription keys" };
    }

    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent, device_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, endpoint)
       DO UPDATE SET
         p256dh_key = EXCLUDED.p256dh_key,
         auth_key = EXCLUDED.auth_key,
         user_agent = EXCLUDED.user_agent,
         device_name = EXCLUDED.device_name,
         updated_at = NOW()`,
      [userId, subscription.endpoint, keys.p256dh, keys.auth, userAgent, deviceName]
    );

    return { success: true };
  } catch (error) {
    console.error("[WebPush] Save subscription error:", error);
    return { success: false, error: "Failed to save subscription" };
  }
}

/**
 * Remove a push subscription
 */
export async function removePushSubscription(
  userId: string,
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await pool.query(
      `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
      [userId, endpoint]
    );
    return { success: true };
  } catch (error) {
    console.error("[WebPush] Remove subscription error:", error);
    return { success: false, error: "Failed to remove subscription" };
  }
}

/**
 * Get all push subscriptions for a user
 */
export async function getUserSubscriptions(userId: string): Promise<StoredSubscription[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM push_subscriptions WHERE user_id = $1`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error("[WebPush] Get subscriptions error:", error);
    return [];
  }
}

/**
 * Send a push notification to a specific subscription
 */
async function sendToSubscription(
  subscription: StoredSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; shouldRemove: boolean }> {
  const pushSubscription: PushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh_key,
      auth: subscription.auth_key,
    },
  };

  try {
    await webPush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/notifications",
        tag: payload.tag || `notification-${Date.now()}`,
        icon: payload.icon || "/icons/icon-192x192.png",
        badge: payload.badge || "/icons/icon-72x72.png",
        actions: payload.actions,
        ...payload.data,
      })
    );

    // Update last_used_at
    await pool.query(
      `UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = $1`,
      [subscription.id]
    );

    return { success: true, shouldRemove: false };
  } catch (error) {
    const pushError = error as { statusCode?: number };

    // If subscription is invalid (410 Gone or 404 Not Found), mark for removal
    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
      console.log(`[WebPush] Subscription expired, removing: ${subscription.endpoint.slice(0, 50)}...`);
      return { success: false, shouldRemove: true };
    }

    console.error("[WebPush] Send error:", error);
    return { success: false, shouldRemove: false };
  }
}

/**
 * Send a push notification to all of a user's devices
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; removed: number }> {
  const subscriptions = await getUserSubscriptions(userId);

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, removed: 0 };
  }

  let sent = 0;
  let failed = 0;
  let removed = 0;
  const toRemove: string[] = [];

  // Send to all devices in parallel
  const results = await Promise.all(
    subscriptions.map((sub) => sendToSubscription(sub, payload))
  );

  results.forEach((result, index) => {
    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.shouldRemove && subscriptions[index]) {
        toRemove.push(subscriptions[index].id);
      }
    }
  });

  // Clean up invalid subscriptions
  if (toRemove.length > 0) {
    try {
      await pool.query(
        `DELETE FROM push_subscriptions WHERE id = ANY($1)`,
        [toRemove]
      );
      removed = toRemove.length;
    } catch (error) {
      console.error("[WebPush] Cleanup error:", error);
    }
  }

  return { sent, failed, removed };
}

/**
 * Send a push notification to multiple users
 * Used for admin notifications, announcements, etc.
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ totalSent: number; totalFailed: number; totalRemoved: number }> {
  let totalSent = 0;
  let totalFailed = 0;
  let totalRemoved = 0;

  // Send in batches to avoid overwhelming the database
  const batchSize = 10;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((userId) => sendPushNotificationToUser(userId, payload))
    );

    results.forEach((result) => {
      totalSent += result.sent;
      totalFailed += result.failed;
      totalRemoved += result.removed;
    });
  }

  return { totalSent, totalFailed, totalRemoved };
}

/**
 * Check if web push is properly configured
 */
export function isWebPushConfigured(): boolean {
  /* eslint-disable turbo/no-undeclared-env-vars */
  return !!(
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  );
  /* eslint-enable turbo/no-undeclared-env-vars */
}
