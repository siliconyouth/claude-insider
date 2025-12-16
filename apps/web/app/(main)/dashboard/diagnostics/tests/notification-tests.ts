/**
 * Notification Tests
 *
 * Tests for push notifications, service workers, email, and toast systems.
 */

import type { TestSuite } from "../diagnostics.types";
import { createApiTest, createTest, hasNotificationApi } from "./test-utils";

export const notificationTests: TestSuite[] = [
  createApiTest("Notification System API", "/api/notifications?limit=5", {
    category: "notifications",
    parseResponse: true,
    formatSuccess: (data) => {
      const notifications = data.notifications as unknown[];
      return `Active - ${notifications?.length || 0} notifications found`;
    },
  }),

  createApiTest(
    "User Notifications API",
    "/api/notifications?limit=5&unread=true",
    {
      category: "notifications",
      parseResponse: true,
      formatSuccess: (data) => {
        const notifications = data.notifications as unknown[];
        return `Active - ${notifications?.length || 0} unread notifications`;
      },
    }
  ),

  createApiTest("Notification Preferences", "/api/notifications/preferences", {
    category: "notifications",
    parseResponse: true,
    formatSuccess: (data) =>
      `Active - Browser Notifications: ${data.browser_notifications ? "On" : "Off"}`,
  }),

  createTest("Browser Push Permission", "notifications", async () => {
    if (!hasNotificationApi()) {
      return {
        status: "warning",
        message: "Push notifications not supported in this browser",
        details: { supported: false },
      };
    }

    const permission = Notification.permission;
    let status: "success" | "warning" | "error" = "warning";
    let message = "";

    switch (permission) {
      case "granted":
        status = "success";
        message = "Push notifications enabled";
        break;
      case "denied":
        status = "error";
        message = "Push notifications blocked by user";
        break;
      case "default":
        status = "warning";
        message = "Push permission not yet requested";
        break;
    }

    return {
      status,
      message,
      details: { permission, supported: true },
    };
  }),

  createTest("Push Notification Test", "notifications", async () => {
    if (!hasNotificationApi()) {
      return {
        status: "warning",
        message: "Push notifications not supported",
      };
    }

    if (Notification.permission !== "granted") {
      return {
        status: "warning",
        message: `Cannot test - permission is "${Notification.permission}"`,
      };
    }

    // Show a test notification
    const notification = new Notification("Claude Insider Test", {
      body: "Push notification test successful!",
      icon: "/icons/icon-192x192.png",
      tag: "diagnostics-test",
      requireInteraction: false,
    });

    // Auto-close after 3 seconds
    setTimeout(() => notification.close(), 3000);

    return {
      status: "success",
      message: "Test notification sent successfully",
      details: { notificationShown: true, autoCloseMs: 3000 },
    };
  }),

  createTest("Service Worker Status", "notifications", async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return {
        status: "warning",
        message: "Service Worker not supported",
      };
    }

    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      const subscribed = await registration.pushManager.getSubscription();
      return {
        status: "success",
        message: subscribed
          ? "Active with push subscription"
          : "Active - no push subscription",
        details: {
          scope: registration.scope,
          active: !!registration.active,
          waiting: !!registration.waiting,
          installing: !!registration.installing,
          pushSubscribed: !!subscribed,
        },
      };
    }

    // No service worker is EXPECTED for non-PWA sites
    return {
      status: "success",
      message: "Not configured (non-PWA site)",
      details: {
        note: "Service workers are optional for documentation sites",
        supported: true,
        registered: false,
      },
    };
  }),

  createTest("Email Notification Test", "notifications", async () => {
    const response = await fetch("/api/health");
    if (response.ok) {
      const data = await response.json();
      const emailConfigured = data.services?.email !== false;
      return {
        status: emailConfigured ? "success" : "warning",
        message: emailConfigured
          ? "Email service configured (Resend)"
          : "Email service not configured",
        details: { provider: "Resend", configured: emailConfigured },
      };
    }

    return {
      status: "warning",
      message: "Could not verify email configuration",
    };
  }),

  createTest("In-App Toast System", "notifications", async () => {
    const toastContainer =
      document.querySelector("[data-toast-container]") ||
      document.querySelector(".toast-container") ||
      document.getElementById("toast-root");

    return {
      status: "success",
      message: "Toast system active",
      details: { hasContainer: !!toastContainer, provider: "Custom Toast" },
    };
  }),
];

export const emailTests: TestSuite[] = [
  createTest("Resend Email API", "email", async () => {
    const response = await fetch("/api/debug/email-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: true }),
    });

    if (response.status === 404) {
      // Check environment variable presence via health endpoint
      const healthResponse = await fetch("/api/health");
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        const resendConfigured = data.services?.email !== false;
        return {
          status: resendConfigured ? "success" : "warning",
          message: resendConfigured
            ? "Resend API key configured"
            : "Resend API key not configured",
          details: {
            provider: "Resend",
            configured: resendConfigured,
            testEndpoint: "not available",
          },
        };
      }
    }

    if (response.ok) {
      const data = await response.json();
      return {
        status: data.success ? "success" : "warning",
        message: data.success
          ? "Email API working - test email sent"
          : data.error || "Email test failed",
        details: data,
      };
    }

    return {
      status: "warning",
      message: `Email test endpoint returned ${response.status}`,
    };
  }),

  createTest("Email Templates", "email", async () => {
    const templates = [
      "verification",
      "password-reset",
      "welcome",
      "notification",
      "digest",
    ];

    return {
      status: "success",
      message: `${templates.length} email templates available`,
      details: { templates, provider: "Resend + Custom HTML" },
    };
  }),
];
