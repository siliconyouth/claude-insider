/**
 * Client-side Instrumentation
 *
 * Initializes Vercel BotID for invisible bot detection.
 * Runs early in the client-side lifecycle.
 */

import { initBotId } from "botid/client/core";

// Initialize BotID for protected routes
// These routes will have bot verification enabled
initBotId({
  protect: [
    // Authentication endpoints
    { path: "/api/auth/*", method: "POST" },

    // User interaction endpoints
    { path: "/api/feedback", method: "POST" },
    { path: "/api/beta-application", method: "POST" },
    { path: "/api/comments", method: "POST" },
    { path: "/api/comments/*", method: "PUT" },
    { path: "/api/comments/*", method: "DELETE" },

    // Resource suggestions
    { path: "/api/suggestions", method: "POST" },

    // User profile actions
    { path: "/api/user/*", method: "POST" },
    { path: "/api/user/*", method: "PUT" },

    // AI assistant (rate-limit protection)
    { path: "/api/assistant/chat", method: "POST" },

    // Admin actions
    { path: "/api/dashboard/*", method: "POST" },
    { path: "/api/dashboard/*", method: "PUT" },
    { path: "/api/dashboard/*", method: "DELETE" },

    // Notifications
    { path: "/api/notifications/*", method: "POST" },
    { path: "/api/notifications/*", method: "PUT" },
  ],
});
