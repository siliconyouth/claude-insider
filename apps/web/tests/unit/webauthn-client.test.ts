/**
 * WebAuthn Client Utilities Tests
 *
 * Tests for client-side WebAuthn functions including:
 * - Browser support detection
 * - Device type identification
 * - Passkey name derivation
 * - Timestamp formatting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  formatLastUsed,
  getDeviceType,
  derivePasskeyName,
} from "@/lib/webauthn-client";

describe("WebAuthn Client Utilities", () => {
  describe("isWebAuthnSupported", () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it("should return false when window is undefined (server-side)", () => {
      // @ts-expect-error - Testing server environment
      global.window = undefined;
      expect(isWebAuthnSupported()).toBe(false);
    });

    it("should return false when PublicKeyCredential is undefined", () => {
      global.window = {} as Window & typeof globalThis;
      expect(isWebAuthnSupported()).toBe(false);
    });

    it("should return false when PublicKeyCredential is not a function", () => {
      global.window = {
        PublicKeyCredential: "not a function",
      } as unknown as Window & typeof globalThis;
      expect(isWebAuthnSupported()).toBe(false);
    });

    it("should return true when PublicKeyCredential is available and is a function", () => {
      global.window = {
        PublicKeyCredential: function () {},
      } as unknown as Window & typeof globalThis;
      expect(isWebAuthnSupported()).toBe(true);
    });
  });

  describe("isPlatformAuthenticatorAvailable", () => {
    const originalWindow = global.window;
    const originalPublicKeyCredential = (global as unknown as { PublicKeyCredential?: unknown }).PublicKeyCredential;

    afterEach(() => {
      global.window = originalWindow;
      (global as unknown as { PublicKeyCredential?: unknown }).PublicKeyCredential = originalPublicKeyCredential;
    });

    it("should return false when WebAuthn is not supported", async () => {
      // @ts-expect-error - Testing server environment
      global.window = undefined;
      expect(await isPlatformAuthenticatorAvailable()).toBe(false);
    });

    it("should return true when platform authenticator is available", async () => {
      const mockPublicKeyCredential = Object.assign(function () {}, {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      });
      global.window = {
        PublicKeyCredential: mockPublicKeyCredential,
      } as unknown as Window & typeof globalThis;
      // Also assign to global since the implementation uses global PublicKeyCredential
      (global as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = mockPublicKeyCredential;
      expect(await isPlatformAuthenticatorAvailable()).toBe(true);
    });

    it("should return false when platform authenticator is not available", async () => {
      const mockPublicKeyCredential = Object.assign(function () {}, {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(false),
      });
      global.window = {
        PublicKeyCredential: mockPublicKeyCredential,
      } as unknown as Window & typeof globalThis;
      (global as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = mockPublicKeyCredential;
      expect(await isPlatformAuthenticatorAvailable()).toBe(false);
    });

    it("should return false when check throws an error", async () => {
      const mockPublicKeyCredential = Object.assign(function () {}, {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockRejectedValue(new Error("Not supported")),
      });
      global.window = {
        PublicKeyCredential: mockPublicKeyCredential,
      } as unknown as Window & typeof globalThis;
      (global as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = mockPublicKeyCredential;
      expect(await isPlatformAuthenticatorAvailable()).toBe(false);
    });
  });

  describe("formatLastUsed", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-06T12:00:00.000Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return 'Never used' for null timestamp", () => {
      expect(formatLastUsed(null)).toBe("Never used");
    });

    it("should return 'Just now' for timestamps less than 1 minute ago", () => {
      const thirtySecondsAgo = new Date("2026-01-06T11:59:30.000Z").toISOString();
      expect(formatLastUsed(thirtySecondsAgo)).toBe("Just now");
    });

    it("should return '1 minute ago' for exactly 1 minute ago", () => {
      const oneMinuteAgo = new Date("2026-01-06T11:59:00.000Z").toISOString();
      expect(formatLastUsed(oneMinuteAgo)).toBe("1 minute ago");
    });

    it("should return 'X minutes ago' for timestamps within an hour", () => {
      const thirtyMinutesAgo = new Date("2026-01-06T11:30:00.000Z").toISOString();
      expect(formatLastUsed(thirtyMinutesAgo)).toBe("30 minutes ago");
    });

    it("should return '1 hour ago' for exactly 1 hour ago", () => {
      const oneHourAgo = new Date("2026-01-06T11:00:00.000Z").toISOString();
      expect(formatLastUsed(oneHourAgo)).toBe("1 hour ago");
    });

    it("should return 'X hours ago' for timestamps within a day", () => {
      const fiveHoursAgo = new Date("2026-01-06T07:00:00.000Z").toISOString();
      expect(formatLastUsed(fiveHoursAgo)).toBe("5 hours ago");
    });

    it("should return '1 day ago' for exactly 1 day ago", () => {
      const oneDayAgo = new Date("2026-01-05T12:00:00.000Z").toISOString();
      expect(formatLastUsed(oneDayAgo)).toBe("1 day ago");
    });

    it("should return 'X days ago' for timestamps within a week", () => {
      const threeDaysAgo = new Date("2026-01-03T12:00:00.000Z").toISOString();
      expect(formatLastUsed(threeDaysAgo)).toBe("3 days ago");
    });

    it("should return formatted date for timestamps older than a week", () => {
      const twoWeeksAgo = new Date("2025-12-23T12:00:00.000Z").toISOString();
      const result = formatLastUsed(twoWeeksAgo);
      // Should be a date string like "12/23/2025" or similar based on locale
      expect(result).not.toBe("Never used");
      expect(result).not.toContain("ago");
    });

    it("should handle edge case at 59 minutes (still minutes)", () => {
      const fiftyNineMinutesAgo = new Date("2026-01-06T11:01:00.000Z").toISOString();
      expect(formatLastUsed(fiftyNineMinutesAgo)).toBe("59 minutes ago");
    });

    it("should handle edge case at 23 hours (still hours)", () => {
      const twentyThreeHoursAgo = new Date("2026-01-05T13:00:00.000Z").toISOString();
      expect(formatLastUsed(twentyThreeHoursAgo)).toBe("23 hours ago");
    });

    it("should handle edge case at 6 days (still days)", () => {
      const sixDaysAgo = new Date("2025-12-31T12:00:00.000Z").toISOString();
      expect(formatLastUsed(sixDaysAgo)).toBe("6 days ago");
    });
  });

  describe("getDeviceType", () => {
    it("should return 'platform' when authenticatorAttachment is 'platform'", () => {
      expect(getDeviceType("platform", undefined)).toBe("platform");
    });

    it("should return 'cross-platform' when authenticatorAttachment is 'cross-platform'", () => {
      expect(getDeviceType("cross-platform", undefined)).toBe("cross-platform");
    });

    it("should infer 'platform' from 'internal' transport", () => {
      expect(getDeviceType(undefined, ["internal"])).toBe("platform");
    });

    it("should infer 'platform' from 'hybrid' transport", () => {
      expect(getDeviceType(undefined, ["hybrid"])).toBe("platform");
    });

    it("should infer 'platform' from mixed transports including 'internal'", () => {
      expect(getDeviceType(undefined, ["usb", "internal"])).toBe("platform");
    });

    it("should return 'cross-platform' for USB-only transport", () => {
      expect(getDeviceType(undefined, ["usb"])).toBe("cross-platform");
    });

    it("should return 'cross-platform' for NFC-only transport", () => {
      expect(getDeviceType(undefined, ["nfc"])).toBe("cross-platform");
    });

    it("should return 'cross-platform' for BLE-only transport", () => {
      expect(getDeviceType(undefined, ["ble"])).toBe("cross-platform");
    });

    it("should return 'cross-platform' when no information is available", () => {
      expect(getDeviceType(undefined, undefined)).toBe("cross-platform");
    });

    it("should return 'cross-platform' for empty transports array", () => {
      expect(getDeviceType(undefined, [])).toBe("cross-platform");
    });

    it("should prioritize authenticatorAttachment over transports", () => {
      expect(getDeviceType("platform", ["usb"])).toBe("platform");
      expect(getDeviceType("cross-platform", ["internal"])).toBe("cross-platform");
    });
  });

  describe("derivePasskeyName", () => {
    describe("Known AAGUID mappings", () => {
      it("should identify iPhone by AAGUID", () => {
        expect(derivePasskeyName("platform", [], "fbfc3007-154e-4ecc-8c0b-6e020557d7bd")).toBe("iPhone");
      });

      it("should identify Touch ID by AAGUID", () => {
        expect(derivePasskeyName("platform", [], "adce0002-35bc-c60a-648b-0b25f1f05503")).toBe("Touch ID");
      });

      it("should identify Face ID by AAGUID", () => {
        expect(derivePasskeyName("platform", [], "dd4ec289-e01d-41c9-bb89-70fa845d4bf2")).toBe("Face ID");
      });

      it("should identify Android by AAGUID", () => {
        expect(derivePasskeyName("platform", [], "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4")).toBe("Android");
      });

      it("should identify Chrome by AAGUID", () => {
        expect(derivePasskeyName("platform", [], "b93fd961-f2e6-462f-b122-82002247de78")).toBe("Chrome");
      });

      it("should identify Windows Hello by AAGUID", () => {
        expect(derivePasskeyName("platform", [], "6028b017-b1d4-4c02-b4b3-afcdafc96bb2")).toBe("Windows Hello");
      });

      it("should identify YubiKey 5 by AAGUID", () => {
        expect(derivePasskeyName("cross-platform", [], "ee882879-721c-4913-9775-3dfcce97072a")).toBe("YubiKey 5");
      });

      it("should identify YubiKey 5 FIPS by AAGUID", () => {
        expect(derivePasskeyName("cross-platform", [], "73bb0cd4-e502-49b8-9c6f-b59445bf720b")).toBe("YubiKey 5 FIPS");
      });

      it("should identify YubiKey Bio by AAGUID", () => {
        expect(derivePasskeyName("cross-platform", [], "c1f9a0bc-1dd2-404a-b27f-8e29047a43fd")).toBe("YubiKey Bio");
      });

      it("should identify 1Password by AAGUID", () => {
        expect(derivePasskeyName("platform", [], "bada5566-a7aa-401f-bd96-45619a55120d")).toBe("1Password");
      });

      it("should identify Bitwarden by AAGUID", () => {
        expect(derivePasskeyName("platform", [], "d548826e-79b4-db40-a3d8-11116f7e8349")).toBe("Bitwarden");
      });

      it("should identify Dashlane by AAGUID", () => {
        expect(derivePasskeyName("platform", [], "531126d6-e717-415c-9320-3d9aa6981239")).toBe("Dashlane");
      });
    });

    describe("Platform authenticator fallbacks", () => {
      it("should return 'Phone Passkey' for platform with hybrid transport", () => {
        expect(derivePasskeyName("platform", ["hybrid"], undefined)).toBe("Phone Passkey");
      });

      it("should return 'Built-in Passkey' for platform without special transports", () => {
        expect(derivePasskeyName("platform", ["internal"], undefined)).toBe("Built-in Passkey");
      });

      it("should return 'Built-in Passkey' for platform with empty transports", () => {
        expect(derivePasskeyName("platform", [], undefined)).toBe("Built-in Passkey");
      });

      it("should return 'Built-in Passkey' for platform with undefined transports", () => {
        expect(derivePasskeyName("platform", undefined, undefined)).toBe("Built-in Passkey");
      });
    });

    describe("Cross-platform authenticator fallbacks", () => {
      it("should return 'USB Security Key' for USB transport", () => {
        expect(derivePasskeyName("cross-platform", ["usb"], undefined)).toBe("USB Security Key");
      });

      it("should return 'NFC Security Key' for NFC transport", () => {
        expect(derivePasskeyName("cross-platform", ["nfc"], undefined)).toBe("NFC Security Key");
      });

      it("should return 'Bluetooth Security Key' for BLE transport", () => {
        expect(derivePasskeyName("cross-platform", ["ble"], undefined)).toBe("Bluetooth Security Key");
      });

      it("should return 'Security Key' for cross-platform without special transports", () => {
        expect(derivePasskeyName("cross-platform", [], undefined)).toBe("Security Key");
      });

      it("should return 'Security Key' for cross-platform with undefined transports", () => {
        expect(derivePasskeyName("cross-platform", undefined, undefined)).toBe("Security Key");
      });
    });

    describe("Transport priority", () => {
      it("should prioritize USB over NFC when both present", () => {
        expect(derivePasskeyName("cross-platform", ["usb", "nfc"], undefined)).toBe("USB Security Key");
      });

      it("should prioritize USB over BLE when both present", () => {
        expect(derivePasskeyName("cross-platform", ["usb", "ble"], undefined)).toBe("USB Security Key");
      });

      it("should prioritize NFC over BLE when USB not present", () => {
        expect(derivePasskeyName("cross-platform", ["nfc", "ble"], undefined)).toBe("NFC Security Key");
      });
    });

    describe("Unknown AAGUID handling", () => {
      it("should fall back to device type naming for unknown AAGUID", () => {
        expect(derivePasskeyName("platform", ["internal"], "unknown-aaguid-value")).toBe("Built-in Passkey");
      });

      it("should fall back to transport naming for unknown AAGUID on cross-platform", () => {
        expect(derivePasskeyName("cross-platform", ["usb"], "unknown-aaguid-value")).toBe("USB Security Key");
      });
    });
  });
});
