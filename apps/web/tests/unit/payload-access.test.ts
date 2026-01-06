/**
 * Payload CMS Access Control Tests
 *
 * Tests for role-based access control functions used in Payload CMS.
 * Covers the complete role hierarchy and all access control patterns.
 */

import { describe, it, expect } from "vitest";
import {
  hasMinRole,
  isRole,
  isSuperAdmin,
  isAdmin,
  isModerator,
  isEditor,
  publicRead,
  authenticatedOnly,
  editorAccess,
  moderatorAccess,
  adminAccess,
  superadminAccess,
  requireRole,
  settingsReadAccess,
  settingsWriteAccess,
  sensitiveSettingsAccess,
  type UserRole,
} from "@/lib/payload-access";

// Mock user factory - uses type assertion to bypass Payload User type complexity
// We only need the role field for access control testing
const createMockUser = (role: UserRole | undefined) =>
  ({
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    role,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  }) as Parameters<typeof authenticatedOnly>[0]["req"]["user"];

type PayloadAccessArgs = Parameters<typeof authenticatedOnly>[0];

const createPayloadArgs = (role: UserRole | undefined): PayloadAccessArgs => ({
  req: { user: role ? createMockUser(role) : null },
});

describe("Payload Access Control", () => {
  describe("hasMinRole", () => {
    describe("Role hierarchy validation", () => {
      it("should return false for undefined role", () => {
        expect(hasMinRole(undefined, "user")).toBe(false);
      });

      it("should return false for empty string role", () => {
        expect(hasMinRole("", "user")).toBe(false);
      });

      it("should return false for invalid role string", () => {
        expect(hasMinRole("invalid", "user")).toBe(false);
      });

      it("should return true for user role requiring user", () => {
        expect(hasMinRole("user", "user")).toBe(true);
      });

      it("should return true for editor role requiring user", () => {
        expect(hasMinRole("editor", "user")).toBe(true);
      });

      it("should return true for moderator role requiring user", () => {
        expect(hasMinRole("moderator", "user")).toBe(true);
      });

      it("should return true for admin role requiring user", () => {
        expect(hasMinRole("admin", "user")).toBe(true);
      });

      it("should return true for superadmin role requiring user", () => {
        expect(hasMinRole("superadmin", "user")).toBe(true);
      });
    });

    describe("Editor requirements", () => {
      it("should return false for user requiring editor", () => {
        expect(hasMinRole("user", "editor")).toBe(false);
      });

      it("should return true for editor requiring editor", () => {
        expect(hasMinRole("editor", "editor")).toBe(true);
      });

      it("should return true for moderator requiring editor", () => {
        expect(hasMinRole("moderator", "editor")).toBe(true);
      });

      it("should return true for admin requiring editor", () => {
        expect(hasMinRole("admin", "editor")).toBe(true);
      });

      it("should return true for superadmin requiring editor", () => {
        expect(hasMinRole("superadmin", "editor")).toBe(true);
      });
    });

    describe("Moderator requirements", () => {
      it("should return false for user requiring moderator", () => {
        expect(hasMinRole("user", "moderator")).toBe(false);
      });

      it("should return false for editor requiring moderator", () => {
        expect(hasMinRole("editor", "moderator")).toBe(false);
      });

      it("should return true for moderator requiring moderator", () => {
        expect(hasMinRole("moderator", "moderator")).toBe(true);
      });

      it("should return true for admin requiring moderator", () => {
        expect(hasMinRole("admin", "moderator")).toBe(true);
      });

      it("should return true for superadmin requiring moderator", () => {
        expect(hasMinRole("superadmin", "moderator")).toBe(true);
      });
    });

    describe("Admin requirements", () => {
      it("should return false for user requiring admin", () => {
        expect(hasMinRole("user", "admin")).toBe(false);
      });

      it("should return false for editor requiring admin", () => {
        expect(hasMinRole("editor", "admin")).toBe(false);
      });

      it("should return false for moderator requiring admin", () => {
        expect(hasMinRole("moderator", "admin")).toBe(false);
      });

      it("should return true for admin requiring admin", () => {
        expect(hasMinRole("admin", "admin")).toBe(true);
      });

      it("should return true for superadmin requiring admin", () => {
        expect(hasMinRole("superadmin", "admin")).toBe(true);
      });
    });

    describe("Superadmin requirements", () => {
      it("should return false for user requiring superadmin", () => {
        expect(hasMinRole("user", "superadmin")).toBe(false);
      });

      it("should return false for editor requiring superadmin", () => {
        expect(hasMinRole("editor", "superadmin")).toBe(false);
      });

      it("should return false for moderator requiring superadmin", () => {
        expect(hasMinRole("moderator", "superadmin")).toBe(false);
      });

      it("should return false for admin requiring superadmin", () => {
        expect(hasMinRole("admin", "superadmin")).toBe(false);
      });

      it("should return true for superadmin requiring superadmin", () => {
        expect(hasMinRole("superadmin", "superadmin")).toBe(true);
      });
    });
  });

  describe("isRole", () => {
    it("should return true for exact role match", () => {
      expect(isRole("user", "user")).toBe(true);
      expect(isRole("editor", "editor")).toBe(true);
      expect(isRole("moderator", "moderator")).toBe(true);
      expect(isRole("admin", "admin")).toBe(true);
      expect(isRole("superadmin", "superadmin")).toBe(true);
    });

    it("should return false for role mismatch", () => {
      expect(isRole("user", "admin")).toBe(false);
      expect(isRole("admin", "user")).toBe(false);
      expect(isRole("editor", "moderator")).toBe(false);
    });

    it("should return false for undefined role", () => {
      expect(isRole(undefined, "user")).toBe(false);
    });
  });

  describe("Role helper functions", () => {
    describe("isSuperAdmin", () => {
      it("should return true only for superadmin", () => {
        expect(isSuperAdmin("superadmin")).toBe(true);
      });

      it("should return false for admin", () => {
        expect(isSuperAdmin("admin")).toBe(false);
      });

      it("should return false for moderator", () => {
        expect(isSuperAdmin("moderator")).toBe(false);
      });

      it("should return false for editor", () => {
        expect(isSuperAdmin("editor")).toBe(false);
      });

      it("should return false for user", () => {
        expect(isSuperAdmin("user")).toBe(false);
      });

      it("should return false for undefined", () => {
        expect(isSuperAdmin(undefined)).toBe(false);
      });
    });

    describe("isAdmin", () => {
      it("should return true for superadmin", () => {
        expect(isAdmin("superadmin")).toBe(true);
      });

      it("should return true for admin", () => {
        expect(isAdmin("admin")).toBe(true);
      });

      it("should return false for moderator", () => {
        expect(isAdmin("moderator")).toBe(false);
      });

      it("should return false for editor", () => {
        expect(isAdmin("editor")).toBe(false);
      });

      it("should return false for user", () => {
        expect(isAdmin("user")).toBe(false);
      });

      it("should return false for undefined", () => {
        expect(isAdmin(undefined)).toBe(false);
      });
    });

    describe("isModerator", () => {
      it("should return true for superadmin", () => {
        expect(isModerator("superadmin")).toBe(true);
      });

      it("should return true for admin", () => {
        expect(isModerator("admin")).toBe(true);
      });

      it("should return true for moderator", () => {
        expect(isModerator("moderator")).toBe(true);
      });

      it("should return false for editor", () => {
        expect(isModerator("editor")).toBe(false);
      });

      it("should return false for user", () => {
        expect(isModerator("user")).toBe(false);
      });

      it("should return false for undefined", () => {
        expect(isModerator(undefined)).toBe(false);
      });
    });

    describe("isEditor", () => {
      it("should return true for superadmin", () => {
        expect(isEditor("superadmin")).toBe(true);
      });

      it("should return true for admin", () => {
        expect(isEditor("admin")).toBe(true);
      });

      it("should return true for moderator", () => {
        expect(isEditor("moderator")).toBe(true);
      });

      it("should return true for editor", () => {
        expect(isEditor("editor")).toBe(true);
      });

      it("should return false for user", () => {
        expect(isEditor("user")).toBe(false);
      });

      it("should return false for undefined", () => {
        expect(isEditor(undefined)).toBe(false);
      });
    });
  });

  describe("Payload Access Functions", () => {
    describe("publicRead", () => {
      it("should always return true", () => {
        expect(publicRead()).toBe(true);
      });
    });

    describe("authenticatedOnly", () => {
      it("should return true for authenticated user", () => {
        expect(authenticatedOnly(createPayloadArgs("user"))).toBe(true);
      });

      it("should return true for any role", () => {
        expect(authenticatedOnly(createPayloadArgs("editor"))).toBe(true);
        expect(authenticatedOnly(createPayloadArgs("moderator"))).toBe(true);
        expect(authenticatedOnly(createPayloadArgs("admin"))).toBe(true);
        expect(authenticatedOnly(createPayloadArgs("superadmin"))).toBe(true);
      });

      it("should return false for unauthenticated request", () => {
        expect(authenticatedOnly(createPayloadArgs(undefined))).toBe(false);
      });

      it("should return false when user is null", () => {
        expect(authenticatedOnly({ req: { user: null } })).toBe(false);
      });
    });

    describe("editorAccess", () => {
      it("should return true for editor and above", () => {
        expect(editorAccess(createPayloadArgs("editor"))).toBe(true);
        expect(editorAccess(createPayloadArgs("moderator"))).toBe(true);
        expect(editorAccess(createPayloadArgs("admin"))).toBe(true);
        expect(editorAccess(createPayloadArgs("superadmin"))).toBe(true);
      });

      it("should return false for user role", () => {
        expect(editorAccess(createPayloadArgs("user"))).toBe(false);
      });

      it("should return false for unauthenticated", () => {
        expect(editorAccess(createPayloadArgs(undefined))).toBe(false);
      });
    });

    describe("moderatorAccess", () => {
      it("should return true for moderator and above", () => {
        expect(moderatorAccess(createPayloadArgs("moderator"))).toBe(true);
        expect(moderatorAccess(createPayloadArgs("admin"))).toBe(true);
        expect(moderatorAccess(createPayloadArgs("superadmin"))).toBe(true);
      });

      it("should return false for editor", () => {
        expect(moderatorAccess(createPayloadArgs("editor"))).toBe(false);
      });

      it("should return false for user role", () => {
        expect(moderatorAccess(createPayloadArgs("user"))).toBe(false);
      });

      it("should return false for unauthenticated", () => {
        expect(moderatorAccess(createPayloadArgs(undefined))).toBe(false);
      });
    });

    describe("adminAccess", () => {
      it("should return true for admin and superadmin", () => {
        expect(adminAccess(createPayloadArgs("admin"))).toBe(true);
        expect(adminAccess(createPayloadArgs("superadmin"))).toBe(true);
      });

      it("should return false for moderator", () => {
        expect(adminAccess(createPayloadArgs("moderator"))).toBe(false);
      });

      it("should return false for editor", () => {
        expect(adminAccess(createPayloadArgs("editor"))).toBe(false);
      });

      it("should return false for user role", () => {
        expect(adminAccess(createPayloadArgs("user"))).toBe(false);
      });

      it("should return false for unauthenticated", () => {
        expect(adminAccess(createPayloadArgs(undefined))).toBe(false);
      });
    });

    describe("superadminAccess", () => {
      it("should return true only for superadmin", () => {
        expect(superadminAccess(createPayloadArgs("superadmin"))).toBe(true);
      });

      it("should return false for admin", () => {
        expect(superadminAccess(createPayloadArgs("admin"))).toBe(false);
      });

      it("should return false for moderator", () => {
        expect(superadminAccess(createPayloadArgs("moderator"))).toBe(false);
      });

      it("should return false for editor", () => {
        expect(superadminAccess(createPayloadArgs("editor"))).toBe(false);
      });

      it("should return false for user", () => {
        expect(superadminAccess(createPayloadArgs("user"))).toBe(false);
      });

      it("should return false for unauthenticated", () => {
        expect(superadminAccess(createPayloadArgs(undefined))).toBe(false);
      });
    });

    describe("requireRole", () => {
      it("should create access function for user role", () => {
        const accessFn = requireRole("user");
        expect(accessFn(createPayloadArgs("user"))).toBe(true);
        expect(accessFn(createPayloadArgs("admin"))).toBe(true);
        expect(accessFn(createPayloadArgs(undefined))).toBe(false);
      });

      it("should create access function for editor role", () => {
        const accessFn = requireRole("editor");
        expect(accessFn(createPayloadArgs("user"))).toBe(false);
        expect(accessFn(createPayloadArgs("editor"))).toBe(true);
        expect(accessFn(createPayloadArgs("admin"))).toBe(true);
      });

      it("should create access function for moderator role", () => {
        const accessFn = requireRole("moderator");
        expect(accessFn(createPayloadArgs("editor"))).toBe(false);
        expect(accessFn(createPayloadArgs("moderator"))).toBe(true);
        expect(accessFn(createPayloadArgs("admin"))).toBe(true);
      });

      it("should create access function for admin role", () => {
        const accessFn = requireRole("admin");
        expect(accessFn(createPayloadArgs("moderator"))).toBe(false);
        expect(accessFn(createPayloadArgs("admin"))).toBe(true);
        expect(accessFn(createPayloadArgs("superadmin"))).toBe(true);
      });

      it("should create access function for superadmin role", () => {
        const accessFn = requireRole("superadmin");
        expect(accessFn(createPayloadArgs("admin"))).toBe(false);
        expect(accessFn(createPayloadArgs("superadmin"))).toBe(true);
      });
    });

    describe("settingsReadAccess", () => {
      it("should allow moderator and above to read settings", () => {
        expect(settingsReadAccess(createPayloadArgs("moderator"))).toBe(true);
        expect(settingsReadAccess(createPayloadArgs("admin"))).toBe(true);
        expect(settingsReadAccess(createPayloadArgs("superadmin"))).toBe(true);
      });

      it("should deny editor and below from reading settings", () => {
        expect(settingsReadAccess(createPayloadArgs("editor"))).toBe(false);
        expect(settingsReadAccess(createPayloadArgs("user"))).toBe(false);
      });

      it("should deny unauthenticated from reading settings", () => {
        expect(settingsReadAccess(createPayloadArgs(undefined))).toBe(false);
      });
    });

    describe("settingsWriteAccess", () => {
      it("should allow admin and above to write settings", () => {
        expect(settingsWriteAccess(createPayloadArgs("admin"))).toBe(true);
        expect(settingsWriteAccess(createPayloadArgs("superadmin"))).toBe(true);
      });

      it("should deny moderator and below from writing settings", () => {
        expect(settingsWriteAccess(createPayloadArgs("moderator"))).toBe(false);
        expect(settingsWriteAccess(createPayloadArgs("editor"))).toBe(false);
        expect(settingsWriteAccess(createPayloadArgs("user"))).toBe(false);
      });

      it("should deny unauthenticated from writing settings", () => {
        expect(settingsWriteAccess(createPayloadArgs(undefined))).toBe(false);
      });
    });

    describe("sensitiveSettingsAccess", () => {
      it("should only allow superadmin to access sensitive settings", () => {
        expect(sensitiveSettingsAccess(createPayloadArgs("superadmin"))).toBe(true);
      });

      it("should deny admin from accessing sensitive settings", () => {
        expect(sensitiveSettingsAccess(createPayloadArgs("admin"))).toBe(false);
      });

      it("should deny all other roles from accessing sensitive settings", () => {
        expect(sensitiveSettingsAccess(createPayloadArgs("moderator"))).toBe(false);
        expect(sensitiveSettingsAccess(createPayloadArgs("editor"))).toBe(false);
        expect(sensitiveSettingsAccess(createPayloadArgs("user"))).toBe(false);
      });

      it("should deny unauthenticated from accessing sensitive settings", () => {
        expect(sensitiveSettingsAccess(createPayloadArgs(undefined))).toBe(false);
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle user object with undefined role", () => {
      const args = { req: { user: { id: "123", email: "test@test.com", role: undefined } as any } };
      expect(authenticatedOnly(args)).toBe(true); // User exists
      expect(editorAccess(args)).toBe(false); // But no valid role
    });

    it("should handle user object with empty string role", () => {
      const args = { req: { user: { id: "123", email: "test@test.com", role: "" } as any } };
      expect(authenticatedOnly(args)).toBe(true); // User exists
      expect(editorAccess(args)).toBe(false); // But no valid role
    });

    it("should handle user object with invalid role", () => {
      const args = { req: { user: { id: "123", email: "test@test.com", role: "invalid" } as any } };
      expect(authenticatedOnly(args)).toBe(true); // User exists
      expect(editorAccess(args)).toBe(false); // But invalid role
    });
  });
});
