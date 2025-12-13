"use client";

/**
 * PWA Hook
 *
 * Provides PWA functionality: install prompt, online status, push notifications.
 */

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdating: boolean;
  isPushSupported: boolean;
  isPushEnabled: boolean;
}

interface PWAActions {
  promptInstall: () => Promise<boolean>;
  requestPushPermission: () => Promise<boolean>;
  cachePage: (url: string) => void;
  cachePages: (urls: string[]) => void;
  clearOfflineCache: () => void;
  checkForUpdates: () => void;
}

export function usePWA(): PWAState & PWAActions {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  // Check if installed via display-mode
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error - iOS Safari specific
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Capture beforeinstallprompt event
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Check if app was installed
    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  // Track online status
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check push notification status
  useEffect(() => {
    if (typeof window === "undefined" || !("PushManager" in window)) return;

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((subscription) => {
        setIsPushEnabled(!!subscription);
      });
    });
  }, []);

  // Listen for service worker updates
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setIsUpdating(true);
            }
          });
        }
      });
    });
  }, []);

  // Prompt install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return outcome === "accepted";
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  // Request push notification permission
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("PushManager" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // In production, replace with your VAPID public key
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
        ),
      });

      // TODO: Send subscription to server
      console.log("Push subscription:", JSON.stringify(subscription));
      setIsPushEnabled(true);
      return true;
    } catch (err) {
      console.error("Push subscription error:", err);
      return false;
    }
  }, []);

  // Cache a page for offline
  const cachePage = useCallback((url: string) => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.controller?.postMessage({
      type: "CACHE_PAGE",
      payload: { url },
    });
  }, []);

  // Cache multiple pages
  const cachePages = useCallback((urls: string[]) => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.controller?.postMessage({
      type: "CACHE_PAGES",
      payload: { urls },
    });
  }, []);

  // Clear offline cache
  const clearOfflineCache = useCallback(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.controller?.postMessage({
      type: "CLEAR_OFFLINE_CACHE",
    });
  }, []);

  // Check for service worker updates
  const checkForUpdates = useCallback(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }, []);

  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled,
    isOnline,
    isUpdating,
    isPushSupported: typeof window !== "undefined" && "PushManager" in window,
    isPushEnabled,
    promptInstall,
    requestPushPermission,
    cachePage,
    cachePages,
    clearOfflineCache,
    checkForUpdates,
  };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  if (!base64String) return new ArrayBuffer(0);

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}
