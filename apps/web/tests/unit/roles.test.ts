/**
 * Unit Tests for Role-Based Access Control (RBAC) System
 *
 * Tests the role hierarchy, permissions, and access control functions.
 * These are critical path tests for authorization.
 */

import { describe, it, expect } from "vitest";
import {
  ROLES,
  ROLE_HIERARCHY,
  ACTIONS,
  getRoleLevel,
  hasMinRole,
  canPerformAction,
  getAssignableRoles,
  canManageRole,
  isValidRole,
  getRoleInfo,
  isSuperAdmin,
  canViewPrivateData,
  canDeleteAnything,
} from "@/lib/roles";

// ============================================
// ROLE HIERARCHY TESTS
// ============================================

describe("Role Hierarchy", () => {
  it("should have correct role order", () => {
    expect(ROLE_HIERARCHY).toEqual([
      ROLES.USER,
      ROLES.EDITOR,
      ROLES.MODERATOR,
      ROLES.ADMIN,
      ROLES.SUPERADMIN,
    ]);
  });

  it("should return correct role levels", () => {
    expect(getRoleLevel(ROLES.USER)).toBe(0);
    expect(getRoleLevel(ROLES.EDITOR)).toBe(1);
    expect(getRoleLevel(ROLES.MODERATOR)).toBe(2);
    expect(getRoleLevel(ROLES.ADMIN)).toBe(3);
    expect(getRoleLevel(ROLES.SUPERADMIN)).toBe(4);
  });

  it("should return -1 for AI_ASSISTANT (not in hierarchy)", () => {
    expect(getRoleLevel(ROLES.AI_ASSISTANT)).toBe(-1);
  });
});

// ============================================
// hasMinRole TESTS
// ============================================

describe("hasMinRole", () => {
  it("should return true when user role meets minimum", () => {
    expect(hasMinRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(true);
    expect(hasMinRole(ROLES.ADMIN, ROLES.MODERATOR)).toBe(true);
    expect(hasMinRole(ROLES.SUPERADMIN, ROLES.ADMIN)).toBe(true);
  });

  it("should return false when user role is below minimum", () => {
    expect(hasMinRole(ROLES.USER, ROLES.ADMIN)).toBe(false);
    expect(hasMinRole(ROLES.EDITOR, ROLES.MODERATOR)).toBe(false);
    expect(hasMinRole(ROLES.MODERATOR, ROLES.ADMIN)).toBe(false);
  });

  it("should return false for undefined role", () => {
    expect(hasMinRole(undefined, ROLES.USER)).toBe(false);
    expect(hasMinRole(undefined, ROLES.ADMIN)).toBe(false);
  });

  it("should handle AI_ASSISTANT role", () => {
    // AI_ASSISTANT is not in hierarchy, so it should fail most checks
    expect(hasMinRole(ROLES.AI_ASSISTANT, ROLES.USER)).toBe(false);
  });
});

// ============================================
// canPerformAction TESTS
// ============================================

describe("canPerformAction", () => {
  describe("Boolean permissions", () => {
    it("should allow users to view content", () => {
      expect(canPerformAction(ROLES.USER, ACTIONS.VIEW_CONTENT)).toBe(true);
      expect(canPerformAction(ROLES.ADMIN, ACTIONS.VIEW_CONTENT)).toBe(true);
    });

    it("should deny users from viewing admin dashboard", () => {
      expect(canPerformAction(ROLES.USER, ACTIONS.VIEW_ADMIN_DASHBOARD)).toBe(false);
      expect(canPerformAction(ROLES.EDITOR, ACTIONS.VIEW_ADMIN_DASHBOARD)).toBe(false);
    });

    it("should allow moderators to view admin dashboard", () => {
      expect(canPerformAction(ROLES.MODERATOR, ACTIONS.VIEW_ADMIN_DASHBOARD)).toBe(true);
      expect(canPerformAction(ROLES.ADMIN, ACTIONS.VIEW_ADMIN_DASHBOARD)).toBe(true);
    });
  });

  describe("Beta permissions", () => {
    it("should deny feedback submission for non-beta users", () => {
      expect(canPerformAction(ROLES.USER, ACTIONS.SUBMIT_FEEDBACK)).toBe(false);
      expect(canPerformAction(ROLES.USER, ACTIONS.SUBMIT_FEEDBACK, { isBetaTester: false })).toBe(false);
    });

    it("should allow feedback submission for beta testers", () => {
      expect(canPerformAction(ROLES.USER, ACTIONS.SUBMIT_FEEDBACK, { isBetaTester: true })).toBe(true);
    });

    it("should allow editors to submit feedback without beta flag", () => {
      expect(canPerformAction(ROLES.EDITOR, ACTIONS.SUBMIT_FEEDBACK)).toBe(true);
    });
  });

  describe("Own resource permissions", () => {
    it("should deny comment moderation for non-own resources", () => {
      expect(canPerformAction(ROLES.EDITOR, ACTIONS.MODERATE_COMMENTS)).toBe(false);
      expect(canPerformAction(ROLES.EDITOR, ACTIONS.MODERATE_COMMENTS, { isOwnResource: false })).toBe(false);
    });

    it("should allow comment moderation for own resources", () => {
      expect(canPerformAction(ROLES.EDITOR, ACTIONS.MODERATE_COMMENTS, { isOwnResource: true })).toBe(true);
    });

    it("should allow moderators to moderate any comments", () => {
      expect(canPerformAction(ROLES.MODERATOR, ACTIONS.MODERATE_COMMENTS)).toBe(true);
    });
  });

  describe("Super Admin exclusive permissions", () => {
    it("should deny private data viewing for admins", () => {
      expect(canPerformAction(ROLES.ADMIN, ACTIONS.VIEW_PRIVATE_USER_DATA)).toBe(false);
    });

    it("should allow private data viewing for super admins", () => {
      expect(canPerformAction(ROLES.SUPERADMIN, ACTIONS.VIEW_PRIVATE_USER_DATA)).toBe(true);
    });

    it("should deny delete anything for admins", () => {
      expect(canPerformAction(ROLES.ADMIN, ACTIONS.DELETE_ANYTHING)).toBe(false);
    });

    it("should allow delete anything for super admins", () => {
      expect(canPerformAction(ROLES.SUPERADMIN, ACTIONS.DELETE_ANYTHING)).toBe(true);
    });
  });

  describe("Undefined role handling", () => {
    it("should deny all actions for undefined role", () => {
      expect(canPerformAction(undefined, ACTIONS.VIEW_CONTENT)).toBe(false);
      expect(canPerformAction(undefined, ACTIONS.VIEW_ADMIN_DASHBOARD)).toBe(false);
    });
  });
});

// ============================================
// ROLE ASSIGNMENT TESTS
// ============================================

describe("getAssignableRoles", () => {
  it("should return empty array for users and editors", () => {
    expect(getAssignableRoles(ROLES.USER)).toEqual([]);
    expect(getAssignableRoles(ROLES.EDITOR)).toEqual([]);
    expect(getAssignableRoles(ROLES.MODERATOR)).toEqual([]);
  });

  it("should allow admins to assign lower roles", () => {
    const assignable = getAssignableRoles(ROLES.ADMIN);
    expect(assignable).toContain(ROLES.USER);
    expect(assignable).toContain(ROLES.EDITOR);
    expect(assignable).toContain(ROLES.MODERATOR);
    expect(assignable).not.toContain(ROLES.ADMIN);
    expect(assignable).not.toContain(ROLES.SUPERADMIN);
  });

  it("should allow super admins to assign all lower roles", () => {
    const assignable = getAssignableRoles(ROLES.SUPERADMIN);
    expect(assignable).toContain(ROLES.USER);
    expect(assignable).toContain(ROLES.EDITOR);
    expect(assignable).toContain(ROLES.MODERATOR);
    expect(assignable).toContain(ROLES.ADMIN);
    expect(assignable).not.toContain(ROLES.SUPERADMIN);
  });
});

describe("canManageRole", () => {
  it("should allow higher roles to manage lower roles", () => {
    expect(canManageRole(ROLES.ADMIN, ROLES.USER)).toBe(true);
    expect(canManageRole(ROLES.ADMIN, ROLES.MODERATOR)).toBe(true);
    expect(canManageRole(ROLES.SUPERADMIN, ROLES.ADMIN)).toBe(true);
  });

  it("should deny managing same or higher roles", () => {
    expect(canManageRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(false);
    expect(canManageRole(ROLES.ADMIN, ROLES.SUPERADMIN)).toBe(false);
    expect(canManageRole(ROLES.MODERATOR, ROLES.ADMIN)).toBe(false);
  });
});

// ============================================
// VALIDATION TESTS
// ============================================

describe("isValidRole", () => {
  it("should return true for valid roles", () => {
    expect(isValidRole("user")).toBe(true);
    expect(isValidRole("admin")).toBe(true);
    expect(isValidRole("superadmin")).toBe(true);
    expect(isValidRole("ai_assistant")).toBe(true);
  });

  it("should return false for invalid roles", () => {
    expect(isValidRole("invalid")).toBe(false);
    expect(isValidRole("")).toBe(false);
    expect(isValidRole("ADMIN")).toBe(false); // Case-sensitive
  });
});

describe("getRoleInfo", () => {
  it("should return correct info for valid roles", () => {
    const userInfo = getRoleInfo(ROLES.USER);
    expect(userInfo.label).toBe("User");

    const adminInfo = getRoleInfo(ROLES.ADMIN);
    expect(adminInfo.label).toBe("Admin");
  });

  it("should fallback to user info for invalid roles", () => {
    const info = getRoleInfo("invalid");
    expect(info.label).toBe("User");
  });
});

// ============================================
// SUPER ADMIN HELPER TESTS
// ============================================

describe("Super Admin helpers", () => {
  describe("isSuperAdmin", () => {
    it("should return true only for super admin", () => {
      expect(isSuperAdmin(ROLES.SUPERADMIN)).toBe(true);
      expect(isSuperAdmin(ROLES.ADMIN)).toBe(false);
      expect(isSuperAdmin(ROLES.USER)).toBe(false);
      expect(isSuperAdmin(undefined)).toBe(false);
    });
  });

  describe("canViewPrivateData", () => {
    it("should only allow super admins", () => {
      expect(canViewPrivateData(ROLES.SUPERADMIN)).toBe(true);
      expect(canViewPrivateData(ROLES.ADMIN)).toBe(false);
      expect(canViewPrivateData(undefined)).toBe(false);
    });
  });

  describe("canDeleteAnything", () => {
    it("should only allow super admins", () => {
      expect(canDeleteAnything(ROLES.SUPERADMIN)).toBe(true);
      expect(canDeleteAnything(ROLES.ADMIN)).toBe(false);
      expect(canDeleteAnything(undefined)).toBe(false);
    });
  });
});
