/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for the server-side (Node.js runtime).
 * It captures:
 * - API route errors
 * - Server-side rendering errors
 * - Database query failures
 * - External API failures (Anthropic, ElevenLabs, Supabase)
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
    // Capture 10% of transactions (adjust based on traffic)
    tracesSampleRate: 0.1,

    // Integrations
    integrations: [
      // Capture console.error calls as logs
      Sentry.consoleLoggingIntegration({ levels: ["error"] }),
    ],

    // Filter out noisy errors
    ignoreErrors: [
      // Expected Next.js errors
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      // Network timeouts (usually client disconnects)
      "ECONNRESET",
      "EPIPE",
      "ETIMEDOUT",
      // Rate limiting (expected behavior)
      "rate limit exceeded",
      "Rate limit exceeded",
    ],

    // Add custom context to all events
    beforeSend(event, _hint) {
      // Don't send events in development
      if (!IS_PRODUCTION) {
        console.log("[Sentry Server] Event captured (dev mode, not sent):", event);
        return null;
      }

      // Redact sensitive data
      if (event.request?.headers) {
        // Remove auth headers
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["x-api-key"];
      }

      // Add build information
      event.tags = {
        ...event.tags,
        app_version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        runtime: "nodejs",
      };

      return event;
    },

    // Debug mode for development
    debug: false,
  });
}
