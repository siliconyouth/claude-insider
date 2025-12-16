/**
 * E2EE (End-to-End Encryption) Tests
 *
 * Tests for encryption APIs, device keys, and crypto support.
 */

import type { TestSuite } from "../diagnostics.types";
import { createApiTest, createTest } from "./test-utils";

export const e2eeTests: TestSuite[] = [
  createApiTest("E2EE Device Keys API", "/api/e2ee/devices", {
    category: "e2ee",
    parseResponse: true,
    formatSuccess: (data) => {
      const devices = data.devices as unknown[];
      return `Active - ${devices?.length || 0} device(s) registered`;
    },
  }),

  createTest("E2EE Prekeys API", "e2ee", async () => {
    const response = await fetch("/api/e2ee/prekeys");

    if (response.ok) {
      const data = await response.json();
      const prekeyCount = data.remaining || 0;
      return {
        status:
          prekeyCount > 10 ? "success" : prekeyCount > 0 ? "warning" : "error",
        message:
          prekeyCount > 10
            ? `Healthy - ${prekeyCount} prekeys available`
            : prekeyCount > 0
              ? `Low - only ${prekeyCount} prekeys remaining`
              : "No prekeys available",
        details: { prekeyCount, threshold: 10 },
      };
    }

    if (response.status === 401) {
      return { status: "warning", message: "Auth required" };
    }

    return { status: "error", message: `Error: ${response.status}` };
  }),

  createTest("E2EE Backup API", "e2ee", async () => {
    const response = await fetch("/api/e2ee/backup");

    if (response.ok) {
      const data = await response.json();
      return {
        status: data.hasBackup ? "success" : "warning",
        message: data.hasBackup
          ? `Backup exists - last updated ${new Date(data.lastUpdated).toLocaleDateString()}`
          : "No backup configured",
        details: {
          hasBackup: data.hasBackup,
          deviceCount: data.deviceCount,
          version: data.version,
        },
      };
    }

    if (response.status === 401) {
      return { status: "warning", message: "Auth required" };
    }

    return { status: "error", message: `Error: ${response.status}` };
  }),

  createApiTest("E2EE Sessions API", "/api/e2ee/sessions", {
    category: "e2ee",
    parseResponse: true,
    formatSuccess: (data) => {
      const sessions = data.sessions as unknown[];
      return `Active - ${sessions?.length || 0} encrypted session(s)`;
    },
  }),

  createTest("E2EE Pending Verifications", "e2ee", async () => {
    const response = await fetch("/api/e2ee/verification/pending");

    if (response.ok) {
      const data = await response.json();
      const pendingCount = data.verifications?.length || 0;
      return {
        status: pendingCount > 0 ? "warning" : "success",
        message:
          pendingCount > 0
            ? `${pendingCount} pending verification(s)`
            : "No pending verifications",
        details: { pendingCount },
      };
    }

    if (response.status === 401) {
      return { status: "warning", message: "Auth required" };
    }

    return { status: "error", message: `Error: ${response.status}` };
  }),

  createApiTest("E2EE AI Consent API", "/api/e2ee/ai-consent", {
    category: "e2ee",
    parseResponse: true,
    formatSuccess: (data) =>
      data.hasConsent
        ? `AI consent granted - ${data.consentedConversations || 0} conversation(s)`
        : "No AI consent configured",
  }),

  createTest("E2EE WebCrypto Support", "e2ee", async () => {
    const hasWebCrypto =
      typeof crypto !== "undefined" && crypto.subtle !== undefined;

    if (!hasWebCrypto) {
      return {
        status: "error",
        message: "WebCrypto API not available",
      };
    }

    // Test key generation capability
    const testKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    // Test encryption/decryption
    const testData = new TextEncoder().encode("E2EE Test");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      testKey,
      testData
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      testKey,
      encrypted
    );

    const decryptedText = new TextDecoder().decode(decrypted);
    const success = decryptedText === "E2EE Test";

    return {
      status: success ? "success" : "error",
      message: success
        ? "WebCrypto fully functional"
        : "Encryption/decryption failed",
      details: {
        hasWebCrypto: true,
        aesGcmSupport: success,
        keyGeneration: true,
      },
    };
  }),

  createTest("E2EE WASM Module", "e2ee", async () => {
    try {
      const { isWasmLoaded, isVodozemacAvailable } = await import(
        "@/lib/e2ee/vodozemac"
      );
      const wasmLoaded = isWasmLoaded();
      const available = isVodozemacAvailable();

      if (available) {
        return {
          status: "success",
          message: "Vodozemac WASM module loaded",
          details: { wasmLoaded, vodozemacAvailable: available },
        };
      }

      return {
        status: "warning",
        message: wasmLoaded
          ? "WASM loaded but Vodozemac not available"
          : "WASM not yet loaded (lazy loading)",
        details: { wasmLoaded, vodozemacAvailable: available },
      };
    } catch (e) {
      return {
        status: "warning",
        message: "E2EE module not initialized",
        details: { error: e instanceof Error ? e.message : "Import failed" },
      };
    }
  }),

  createTest("E2EE IndexedDB Storage", "e2ee", async () => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return {
        status: "error",
        message: "IndexedDB not available",
      };
    }

    return new Promise((resolve) => {
      const request = indexedDB.open("e2ee_test_db", 1);

      request.onerror = () => {
        resolve({
          status: "error",
          message: "IndexedDB access denied",
        });
      };

      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase("e2ee_test_db");
        resolve({
          status: "success",
          message: "IndexedDB available for key storage",
          details: { supported: true },
        });
      };
    });
  }),
];
