/**
 * Browser Environment Collection Utility
 *
 * Collects comprehensive browser environment data including cookies,
 * storage, permissions, and capabilities.
 */

import type { BrowserEnvironment } from "../diagnostics.types";

interface ToastLike {
  success: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Collects browser environment data.
 * This is a pure function that can be called from anywhere.
 */
export async function collectBrowserEnvironmentData(
  toast?: ToastLike
): Promise<BrowserEnvironment | null> {
  try {
    // Parse cookies
    const cookies = document.cookie
      .split(";")
      .filter((c) => c.trim())
      .map((cookie) => {
        const [name, ...valueParts] = cookie.trim().split("=");
        return {
          name: name || "",
          value: valueParts.join("=") || "",
        };
      });

    // Parse localStorage
    const localStorageItems: { key: string; value: string; size: number }[] =
      [];
    let localStorageSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || "";
        const size = new Blob([value]).size;
        localStorageSize += size;
        localStorageItems.push({
          key,
          value: value.length > 200 ? value.substring(0, 200) + "..." : value,
          size,
        });
      }
    }

    // Parse sessionStorage
    const sessionStorageItems: { key: string; value: string; size: number }[] =
      [];
    let sessionStorageSize = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key) || "";
        const size = new Blob([value]).size;
        sessionStorageSize += size;
        sessionStorageItems.push({
          key,
          value: value.length > 200 ? value.substring(0, 200) + "..." : value,
          size,
        });
      }
    }

    // Check permissions
    const permissionNames = [
      "notifications",
      "geolocation",
      "camera",
      "microphone",
      "clipboard-read",
      "clipboard-write",
    ] as const;

    const permissions: { name: string; state: string }[] = [];
    for (const name of permissionNames) {
      try {
        const result = await navigator.permissions.query({
          name: name as PermissionName,
        });
        permissions.push({ name, state: result.state });
      } catch {
        permissions.push({ name, state: "unsupported" });
      }
    }

    // Check WebGL
    let webGLRenderer: string | null = null;
    let webGL = false;
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        webGL = true;
        const debugInfo = (gl as WebGLRenderingContext).getExtension(
          "WEBGL_debug_renderer_info"
        );
        if (debugInfo) {
          webGLRenderer = (gl as WebGLRenderingContext).getParameter(
            debugInfo.UNMASKED_RENDERER_WEBGL
          );
        }
      }
    } catch {
      // WebGL not available
    }

    const env: BrowserEnvironment = {
      // Browser info
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: [...navigator.languages],
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      // Screen info
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      colorDepth: screen.colorDepth,
      // Storage
      cookies,
      localStorage: localStorageItems,
      sessionStorage: sessionStorageItems,
      localStorageSize,
      sessionStorageSize,
      // Permissions
      permissions,
      // Timestamps
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      // Features
      serviceWorker: "serviceWorker" in navigator,
      webGL,
      webGLRenderer,
      indexedDB: "indexedDB" in window,
    };

    toast?.success("Browser environment collected");
    return env;
  } catch (error) {
    console.error("Browser environment collection error:", error);
    toast?.error("Failed to collect browser environment");
    return null;
  }
}
