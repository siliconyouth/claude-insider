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

    // Performance Monitoring
    // Lower sample rate for edge (high volume)
    tracesSampleRate: 0.05,

    // Filter out noisy errors
    ignoreErrors: [
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
    ],

    // Add custom context
    beforeSend(event) {
      if (!IS_PRODUCTION) {
        return null;
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
