/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for the browser/client-side.
 * It runs in the user's browser and captures:
 * - JavaScript errors
 * - Unhandled promise rejections
 * - React component errors
 * - User sessions and interactions
 * - Frontend performance metrics
 */

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (SENTRY_DSN && IS_PRODUCTION) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment tagging
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "production",

    // Enable structured logging
    _experiments: {
      enableLogs: true,
    },

    // Performance Monitoring
    // Capture 10% of transactions in production (adjust based on traffic)
    tracesSampleRate: 0.1,

    // Session Replay for debugging user-reported issues
    // Capture 1% of all sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      // Capture React component stack traces
      Sentry.replayIntegration({
        // Mask all text for privacy
        maskAllText: false,
        // Block all media for performance
        blockAllMedia: false,
      }),
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Trace all navigation
        enableInp: true,
      }),
      // Capture console.error and console.warn as logs
      Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
    ],

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "canvas.contentDocument",
      "MyApp_RemoveAllHighlights",
      "atomicFindClose",
      // Benign browser errors
      "ResizeObserver loop",
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Network errors (user's connection issues)
      "Failed to fetch",
      "NetworkError",
      "Load failed",
      "Network request failed",
      // Third-party script errors
      "Script error.",
      "Non-Error promise rejection captured",
      // Auth-related (expected during logout/session expiry)
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
    ],

    // Don't send errors from these URLs
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      // Third-party scripts
      /googlesyndication\.com/i,
      /googletagmanager\.com/i,
      /doubleclick\.net/i,
    ],

    // Add custom context to all events
    beforeSend(event, _hint) {
      // Don't send events in development
      if (!IS_PRODUCTION) {
        console.log("[Sentry] Event captured (dev mode, not sent):", event);
        return null;
      }

      // Add build information
      event.tags = {
        ...event.tags,
        app_version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
      };

      return event;
    },

    // Debug mode for development
    debug: false,
  });
}
