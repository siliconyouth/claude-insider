"use client";

/**
 * Browser Notifications Hook
 *
 * Handles browser push notification permissions and Web Push subscriptions.
 * Uses both the Web Notifications API and Web Push API for background notifications.
 *
 * Key Features:
 * - Basic notifications (when page is open)
 * - Web Push notifications (works even when site is closed)
 * - Automatic Service Worker subscription management
 */

import { useState, useEffect, useCallback, useRef } from "react";

export type BrowserNotificationPermission = "default" | "granted" | "denied";

export interface BrowserNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  onClick?: () => void;
}

interface UseBrowserNotificationsReturn {
  /** Whether the browser supports notifications */
  isSupported: boolean;
  /** Whether Web Push is supported (Service Worker + Push API) */
  isPushSupported: boolean;
  /** Current permission state */
  permission: BrowserNotificationPermission;
  /** Whether we're currently requesting permission */
  isRequesting: boolean;
  /** Whether push subscription is active */
  isSubscribed: boolean;
  /** Request notification permission and subscribe to push */
  requestPermission: () => Promise<BrowserNotificationPermission>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Send a browser notification (if permission granted) - for immediate display */
  sendNotification: (options: BrowserNotificationOptions) => void;
  /** Check if notifications are enabled (permission granted) */
  isEnabled: boolean;
}

const APP_ICON = "/icons/icon-192x192.png";
const APP_BADGE = "/icons/icon-72x72.png";

/**
 * Convert a base64 string to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useBrowserNotifications(): UseBrowserNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [permission, setPermission] = useState<BrowserNotificationPermission>("default");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const pushSubscriptionRef = useRef<PushSubscription | null>(null);

  // Check browser support and current permission on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Basic notification support
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission as BrowserNotificationPermission);
    }

    // Web Push support (requires Service Worker and Push API)
    const checkPushSupport = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        setIsPushSupported(true);

        try {
          // Get existing service worker registration
          const registration = await navigator.serviceWorker.ready;
          swRegistrationRef.current = registration;

          // Check for existing push subscription
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            pushSubscriptionRef.current = existingSubscription;
            setIsSubscribed(true);
          }
        } catch (error) {
          console.error("[BrowserNotifications] Service worker check error:", error);
        }
      }
    };

    checkPushSupport();
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported || !swRegistrationRef.current) {
      console.log("[BrowserNotifications] Push not supported or SW not ready");
      return false;
    }

    try {
      // Get VAPID public key from server
      const keyResponse = await fetch("/api/push/subscribe");
      if (!keyResponse.ok) {
        console.error("[BrowserNotifications] Failed to get VAPID key");
        return false;
      }

      const { publicKey } = await keyResponse.json();
      if (!publicKey) {
        console.error("[BrowserNotifications] No VAPID public key available");
        return false;
      }

      // Subscribe to push notifications
      const subscription = await swRegistrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Send subscription to server
      const saveResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceName: getDeviceName(),
        }),
      });

      if (!saveResponse.ok) {
        console.error("[BrowserNotifications] Failed to save subscription");
        // Unsubscribe since we couldn't save it
        await subscription.unsubscribe();
        return false;
      }

      pushSubscriptionRef.current = subscription;
      setIsSubscribed(true);
      console.log("[BrowserNotifications] Successfully subscribed to push notifications");
      return true;
    } catch (error) {
      console.error("[BrowserNotifications] Push subscription error:", error);
      return false;
    }
  }, [isPushSupported]);

  // Request permission from the browser and subscribe to push
  const requestPermission = useCallback(async (): Promise<BrowserNotificationPermission> => {
    if (!isSupported) {
      return "denied";
    }

    // Already granted - just ensure we're subscribed to push
    if (Notification.permission === "granted") {
      setPermission("granted");
      // Subscribe to push if not already
      if (isPushSupported && !isSubscribed) {
        await subscribeToPush();
      }
      return "granted";
    }

    // Already denied - can't ask again
    if (Notification.permission === "denied") {
      setPermission("denied");
      return "denied";
    }

    setIsRequesting(true);

    try {
      const result = await Notification.requestPermission();
      const newPermission = result as BrowserNotificationPermission;
      setPermission(newPermission);

      // If granted, subscribe to push notifications
      if (newPermission === "granted" && isPushSupported) {
        await subscribeToPush();
      }

      return newPermission;
    } catch (error) {
      console.error("[BrowserNotifications] Permission request error:", error);
      return "denied";
    } finally {
      setIsRequesting(false);
    }
  }, [isSupported, isPushSupported, isSubscribed, subscribeToPush]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!pushSubscriptionRef.current) {
      setIsSubscribed(false);
      return true;
    }

    try {
      const endpoint = pushSubscriptionRef.current.endpoint;

      // Unsubscribe from browser
      await pushSubscriptionRef.current.unsubscribe();

      // Remove from server
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      pushSubscriptionRef.current = null;
      setIsSubscribed(false);
      console.log("[BrowserNotifications] Successfully unsubscribed from push notifications");
      return true;
    } catch (error) {
      console.error("[BrowserNotifications] Unsubscribe error:", error);
      return false;
    }
  }, []);

  // Send a notification (immediate display when page is open)
  const sendNotification = useCallback(
    (options: BrowserNotificationOptions) => {
      if (!isSupported || permission !== "granted") {
        console.log("[BrowserNotifications] Cannot send - not supported or not granted");
        return;
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || APP_ICON,
          badge: options.badge || APP_BADGE,
          tag: options.tag,
          data: options.data,
          requireInteraction: false,
          silent: false,
        });

        // Handle click
        if (options.onClick) {
          notification.onclick = () => {
            window.focus();
            notification.close();
            options.onClick?.();
          };
        }

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error("[BrowserNotifications] Send error:", error);
      }
    },
    [isSupported, permission]
  );

  return {
    isSupported,
    isPushSupported,
    permission,
    isRequesting,
    isSubscribed,
    requestPermission,
    unsubscribe,
    sendNotification,
    isEnabled: permission === "granted",
  };
}

/**
 * Get a friendly device name based on user agent
 */
function getDeviceName(): string {
  if (typeof navigator === "undefined") return "Unknown Device";

  const ua = navigator.userAgent;

  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) {
    if (/Mobile/.test(ua)) return "Android Phone";
    return "Android Tablet";
  }
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux";

  return "Browser";
}

/**
 * Check if browser notifications are supported
 */
export function isBrowserNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Check if Web Push is supported
 */
export function isWebPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/**
 * Get current browser notification permission
 */
export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (!isBrowserNotificationsSupported()) {
    return "denied";
  }
  return Notification.permission as BrowserNotificationPermission;
}
