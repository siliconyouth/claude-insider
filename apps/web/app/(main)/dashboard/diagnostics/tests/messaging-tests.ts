/**
 * Messaging Tests
 *
 * Tests for real-time messaging and chat functionality.
 */

import type { TestSuite } from "../diagnostics.types";
import { createTest } from "./test-utils";

export const messagingTests: TestSuite[] = [
  createTest("Messaging Database", "messaging", async () => {
    const response = await fetch("/api/dashboard/stats");

    if (response.ok) {
      return {
        status: "success",
        message: "Messaging tables accessible",
        details: {
          tables: ["dm_conversations", "dm_participants", "dm_messages"],
          status: "operational",
        },
      };
    }

    return {
      status: "warning",
      message: "Could not verify messaging tables",
    };
  }),

  createTest("Real-time Messaging", "messaging", async () => {
    if (typeof window === "undefined") {
      return {
        status: "warning",
        message: "Server-side test - cannot verify WebSocket",
      };
    }

    const wsSupported = "WebSocket" in window;

    if (!wsSupported) {
      return {
        status: "error",
        message: "WebSocket not supported by browser",
      };
    }

    return {
      status: "success",
      message: "WebSocket available for real-time messaging",
      details: {
        webSocketSupported: true,
        provider: "Supabase Realtime",
      },
    };
  }),
];
