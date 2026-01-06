/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for the Edge Runtime (Vercel Edge Functions).
 * It captures errors from:
 * - Middleware
 * - Edge API routes
 * - Edge-rendered pages
 */

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (SENTRY_DSN && IS_PRODUCTION) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment tagging
    environment: process.env.VERCEL_ENV || "production",

    // Enable structured logging
    _experiments: {
      enableLogs: true,
    },

    // Performance Monitoring
    // Lower sample rate for edge (high volume)
    tracesSampleRate: 0.05,

    // Integrations
    integrations: [
      // Capture console.error calls as logs
      Sentry.consoleLoggingIntegration({ levels: ["error"] }),
    ],

    // Filter out noisy errors
    ignoreErrors: [
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      // Network errors
      "ECONNRESET",
      "ETIMEDOUT",
    ],

    // Add custom context
    beforeSend(event, _hint) {
      if (!IS_PRODUCTION) {
        return null;
      }

      // Redact sensitive data from request headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["x-api-key"];
      }

      event.tags = {
        ...event.tags,
        app_version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        runtime: "edge",
      };

      return event;
    },

    debug: false,
  });
}
