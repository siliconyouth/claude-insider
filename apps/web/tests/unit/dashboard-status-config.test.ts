/**
 * Dashboard Status Configuration Tests
 *
 * Tests for status/color mappings used across dashboard pages.
 * Verifies all status configs have proper styling and labels.
 */

import { describe, it, expect } from "vitest";
import {
  MODERATION_STATUS,
  FEEDBACK_STATUS,
  FEEDBACK_TYPE,
  SEVERITY,
  REPORT_STATUS,
  NOTIFICATION_STATUS,
  BETA_APPLICATION_STATUS,
  RESOURCE_STATUS,
  USER_ROLE,
  TRUST_LEVEL,
  getStatusStyle,
  getStatusOptions,
  type ModerationStatus,
  type FeedbackStatus,
  type FeedbackType,
  type Severity,
  type ReportStatus,
  type NotificationStatus,
  type BetaApplicationStatus,
  type ResourceStatus,
  type UserRole,
  type TrustLevel,
} from "@/lib/dashboard/status-config";
import type { StatusStyle, StatusConfig } from "@/lib/dashboard/types";

describe("Dashboard Status Configuration", () => {
  // Helper to validate status style structure
  const validateStatusStyle = (style: StatusStyle) => {
    expect(style.bg).toBeDefined();
    expect(typeof style.bg).toBe("string");
    expect(style.bg.length).toBeGreaterThan(0);

    expect(style.text).toBeDefined();
    expect(typeof style.text).toBe("string");
    expect(style.text.length).toBeGreaterThan(0);

    expect(style.label).toBeDefined();
    expect(typeof style.label).toBe("string");
    expect(style.label.length).toBeGreaterThan(0);
  };

  // Helper to check that styles use Tailwind classes
  const validateTailwindClasses = (style: StatusStyle) => {
    expect(style.bg).toMatch(/^bg-/);
    expect(style.text).toMatch(/^text-/);
  };

  describe("MODERATION_STATUS", () => {
    const statuses: ModerationStatus[] = ["pending", "approved", "rejected", "flagged"];

    it("should have all 4 moderation statuses", () => {
      expect(Object.keys(MODERATION_STATUS)).toHaveLength(4);
    });

    it.each(statuses)("should have valid style for '%s' status", (status) => {
      const style = MODERATION_STATUS[status];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'Pending' label for pending status", () => {
      expect(MODERATION_STATUS.pending.label).toBe("Pending");
    });

    it("should have 'Approved' label for approved status", () => {
      expect(MODERATION_STATUS.approved.label).toBe("Approved");
    });

    it("should have 'Rejected' label for rejected status", () => {
      expect(MODERATION_STATUS.rejected.label).toBe("Rejected");
    });

    it("should have 'Flagged' label for flagged status", () => {
      expect(MODERATION_STATUS.flagged.label).toBe("Flagged");
    });

    it("should have yellow colors for pending", () => {
      expect(MODERATION_STATUS.pending.bg).toContain("yellow");
    });

    it("should have emerald colors for approved", () => {
      expect(MODERATION_STATUS.approved.bg).toContain("emerald");
    });

    it("should have red colors for rejected", () => {
      expect(MODERATION_STATUS.rejected.bg).toContain("red");
    });

    it("should have orange colors for flagged", () => {
      expect(MODERATION_STATUS.flagged.bg).toContain("orange");
    });
  });

  describe("FEEDBACK_STATUS", () => {
    const statuses: FeedbackStatus[] = ["open", "in_progress", "resolved", "closed", "wont_fix"];

    it("should have all 5 feedback statuses", () => {
      expect(Object.keys(FEEDBACK_STATUS)).toHaveLength(5);
    });

    it.each(statuses)("should have valid style for '%s' status", (status) => {
      const style = FEEDBACK_STATUS[status];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'Open' label", () => {
      expect(FEEDBACK_STATUS.open.label).toBe("Open");
    });

    it("should have 'In Progress' label", () => {
      expect(FEEDBACK_STATUS.in_progress.label).toBe("In Progress");
    });

    it("should have 'Resolved' label", () => {
      expect(FEEDBACK_STATUS.resolved.label).toBe("Resolved");
    });

    it("should have 'Closed' label", () => {
      expect(FEEDBACK_STATUS.closed.label).toBe("Closed");
    });

    it("should have 'Won't Fix' label", () => {
      expect(FEEDBACK_STATUS.wont_fix.label).toBe("Won't Fix");
    });

    it("should have blue colors for in_progress", () => {
      expect(FEEDBACK_STATUS.in_progress.bg).toContain("blue");
    });

    it("should have gray colors for closed", () => {
      expect(FEEDBACK_STATUS.closed.bg).toContain("gray");
    });
  });

  describe("FEEDBACK_TYPE", () => {
    const types: FeedbackType[] = ["bug", "feature", "general"];

    it("should have all 3 feedback types", () => {
      expect(Object.keys(FEEDBACK_TYPE)).toHaveLength(3);
    });

    it.each(types)("should have valid style for '%s' type", (type) => {
      const style = FEEDBACK_TYPE[type];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'Bug' label", () => {
      expect(FEEDBACK_TYPE.bug.label).toBe("Bug");
    });

    it("should have 'Feature' label", () => {
      expect(FEEDBACK_TYPE.feature.label).toBe("Feature");
    });

    it("should have 'General' label", () => {
      expect(FEEDBACK_TYPE.general.label).toBe("General");
    });

    it("should have red colors for bug", () => {
      expect(FEEDBACK_TYPE.bug.bg).toContain("red");
    });

    it("should have emerald colors for feature", () => {
      expect(FEEDBACK_TYPE.feature.bg).toContain("emerald");
    });
  });

  describe("SEVERITY", () => {
    const severities: Severity[] = ["low", "medium", "high", "critical"];

    it("should have all 4 severity levels", () => {
      expect(Object.keys(SEVERITY)).toHaveLength(4);
    });

    it.each(severities)("should have valid style for '%s' severity", (severity) => {
      const style = SEVERITY[severity];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'Low' label", () => {
      expect(SEVERITY.low.label).toBe("Low");
    });

    it("should have 'Medium' label", () => {
      expect(SEVERITY.medium.label).toBe("Medium");
    });

    it("should have 'High' label", () => {
      expect(SEVERITY.high.label).toBe("High");
    });

    it("should have 'Critical' label", () => {
      expect(SEVERITY.critical.label).toBe("Critical");
    });

    it("should escalate colors from gray to red", () => {
      expect(SEVERITY.low.bg).toContain("gray");
      expect(SEVERITY.medium.bg).toContain("yellow");
      expect(SEVERITY.high.bg).toContain("orange");
      expect(SEVERITY.critical.bg).toContain("red");
    });
  });

  describe("REPORT_STATUS", () => {
    const statuses: ReportStatus[] = ["pending", "investigating", "action_taken", "dismissed"];

    it("should have all 4 report statuses", () => {
      expect(Object.keys(REPORT_STATUS)).toHaveLength(4);
    });

    it.each(statuses)("should have valid style for '%s' status", (status) => {
      const style = REPORT_STATUS[status];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'Pending' label", () => {
      expect(REPORT_STATUS.pending.label).toBe("Pending");
    });

    it("should have 'Investigating' label", () => {
      expect(REPORT_STATUS.investigating.label).toBe("Investigating");
    });

    it("should have 'Action Taken' label", () => {
      expect(REPORT_STATUS.action_taken.label).toBe("Action Taken");
    });

    it("should have 'Dismissed' label", () => {
      expect(REPORT_STATUS.dismissed.label).toBe("Dismissed");
    });
  });

  describe("NOTIFICATION_STATUS", () => {
    const statuses: NotificationStatus[] = ["draft", "scheduled", "sending", "sent", "failed"];

    it("should have all 5 notification statuses", () => {
      expect(Object.keys(NOTIFICATION_STATUS)).toHaveLength(5);
    });

    it.each(statuses)("should have valid style for '%s' status", (status) => {
      const style = NOTIFICATION_STATUS[status];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'Draft' label", () => {
      expect(NOTIFICATION_STATUS.draft.label).toBe("Draft");
    });

    it("should have 'Scheduled' label", () => {
      expect(NOTIFICATION_STATUS.scheduled.label).toBe("Scheduled");
    });

    it("should have 'Sending' label", () => {
      expect(NOTIFICATION_STATUS.sending.label).toBe("Sending");
    });

    it("should have 'Sent' label", () => {
      expect(NOTIFICATION_STATUS.sent.label).toBe("Sent");
    });

    it("should have 'Failed' label", () => {
      expect(NOTIFICATION_STATUS.failed.label).toBe("Failed");
    });

    it("should have cyan colors for sending", () => {
      expect(NOTIFICATION_STATUS.sending.bg).toContain("cyan");
    });
  });

  describe("BETA_APPLICATION_STATUS", () => {
    const statuses: BetaApplicationStatus[] = ["pending", "approved", "rejected"];

    it("should have all 3 beta application statuses", () => {
      expect(Object.keys(BETA_APPLICATION_STATUS)).toHaveLength(3);
    });

    it.each(statuses)("should have valid style for '%s' status", (status) => {
      const style = BETA_APPLICATION_STATUS[status];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'Pending Review' label", () => {
      expect(BETA_APPLICATION_STATUS.pending.label).toBe("Pending Review");
    });

    it("should have 'Approved' label", () => {
      expect(BETA_APPLICATION_STATUS.approved.label).toBe("Approved");
    });

    it("should have 'Rejected' label", () => {
      expect(BETA_APPLICATION_STATUS.rejected.label).toBe("Rejected");
    });
  });

  describe("RESOURCE_STATUS", () => {
    const statuses: ResourceStatus[] = ["pending", "approved", "rejected", "archived"];

    it("should have all 4 resource statuses", () => {
      expect(Object.keys(RESOURCE_STATUS)).toHaveLength(4);
    });

    it.each(statuses)("should have valid style for '%s' status", (status) => {
      const style = RESOURCE_STATUS[status];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'Archived' label", () => {
      expect(RESOURCE_STATUS.archived.label).toBe("Archived");
    });

    it("should have gray colors for archived", () => {
      expect(RESOURCE_STATUS.archived.bg).toContain("gray");
    });
  });

  describe("USER_ROLE", () => {
    const roles: UserRole[] = ["user", "editor", "moderator", "admin", "superadmin", "ai_assistant"];

    it("should have all 6 user roles", () => {
      expect(Object.keys(USER_ROLE)).toHaveLength(6);
    });

    it.each(roles)("should have valid style for '%s' role", (role) => {
      const style = USER_ROLE[role];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'User' label", () => {
      expect(USER_ROLE.user.label).toBe("User");
    });

    it("should have 'Editor' label", () => {
      expect(USER_ROLE.editor.label).toBe("Editor");
    });

    it("should have 'Moderator' label", () => {
      expect(USER_ROLE.moderator.label).toBe("Moderator");
    });

    it("should have 'Admin' label", () => {
      expect(USER_ROLE.admin.label).toBe("Admin");
    });

    it("should have 'Super Admin' label", () => {
      expect(USER_ROLE.superadmin.label).toBe("Super Admin");
    });

    it("should have 'AI Assistant' label", () => {
      expect(USER_ROLE.ai_assistant.label).toBe("AI Assistant");
    });

    it("should have gray colors for user", () => {
      expect(USER_ROLE.user.bg).toContain("gray");
    });

    it("should have blue colors for editor", () => {
      expect(USER_ROLE.editor.bg).toContain("blue");
    });

    it("should have violet colors for moderator", () => {
      expect(USER_ROLE.moderator.bg).toContain("violet");
    });

    it("should have amber colors for admin", () => {
      expect(USER_ROLE.admin.bg).toContain("amber");
    });

    it("should have red colors for superadmin", () => {
      expect(USER_ROLE.superadmin.bg).toContain("red");
    });

    it("should have cyan colors for ai_assistant", () => {
      expect(USER_ROLE.ai_assistant.bg).toContain("cyan");
    });
  });

  describe("TRUST_LEVEL", () => {
    const levels: TrustLevel[] = ["untrusted", "suspicious", "neutral", "trusted", "verified"];

    it("should have all 5 trust levels", () => {
      expect(Object.keys(TRUST_LEVEL)).toHaveLength(5);
    });

    it.each(levels)("should have valid style for '%s' level", (level) => {
      const style = TRUST_LEVEL[level];
      validateStatusStyle(style);
      validateTailwindClasses(style);
    });

    it("should have 'Untrusted' label", () => {
      expect(TRUST_LEVEL.untrusted.label).toBe("Untrusted");
    });

    it("should have 'Suspicious' label", () => {
      expect(TRUST_LEVEL.suspicious.label).toBe("Suspicious");
    });

    it("should have 'Neutral' label", () => {
      expect(TRUST_LEVEL.neutral.label).toBe("Neutral");
    });

    it("should have 'Trusted' label", () => {
      expect(TRUST_LEVEL.trusted.label).toBe("Trusted");
    });

    it("should have 'Verified' label", () => {
      expect(TRUST_LEVEL.verified.label).toBe("Verified");
    });

    it("should escalate from red to green", () => {
      expect(TRUST_LEVEL.untrusted.bg).toContain("red");
      expect(TRUST_LEVEL.suspicious.bg).toContain("orange");
      expect(TRUST_LEVEL.neutral.bg).toContain("gray");
      expect(TRUST_LEVEL.trusted.bg).toContain("blue");
      expect(TRUST_LEVEL.verified.bg).toContain("emerald");
    });
  });

  describe("getStatusStyle", () => {
    it("should return correct style for valid status", () => {
      const style = getStatusStyle(MODERATION_STATUS, "pending");
      expect(style.label).toBe("Pending");
      expect(style.bg).toContain("yellow");
    });

    it("should return fallback style for unknown status", () => {
      const style = getStatusStyle(MODERATION_STATUS, "unknown");
      expect(style.label).toBe("unknown");
      expect(style.bg).toContain("gray");
    });

    it("should use provided fallback status", () => {
      const style = getStatusStyle(MODERATION_STATUS, "unknown", "pending");
      expect(style.label).toBe("Pending");
    });

    it("should work with different status configs", () => {
      const feedbackStyle = getStatusStyle(FEEDBACK_STATUS, "open");
      expect(feedbackStyle.label).toBe("Open");

      const severityStyle = getStatusStyle(SEVERITY, "critical");
      expect(severityStyle.label).toBe("Critical");
    });

    it("should return style with all required properties", () => {
      const style = getStatusStyle(USER_ROLE, "admin");
      expect(style).toHaveProperty("bg");
      expect(style).toHaveProperty("text");
      expect(style).toHaveProperty("label");
    });

    it("should handle empty string status", () => {
      const style = getStatusStyle(MODERATION_STATUS, "");
      expect(style.label).toBe("");
    });
  });

  describe("getStatusOptions", () => {
    it("should return all options with 'All' included by default", () => {
      const options = getStatusOptions(MODERATION_STATUS);
      expect(options[0]).toEqual({ value: "all", label: "All" });
      expect(options).toHaveLength(5); // 1 "All" + 4 statuses
    });

    it("should not include 'All' when includeAll is false", () => {
      const options = getStatusOptions(MODERATION_STATUS, false);
      expect(options[0]?.value).not.toBe("all");
      expect(options).toHaveLength(4);
    });

    it("should return options for all MODERATION_STATUS values", () => {
      const options = getStatusOptions(MODERATION_STATUS, false);
      const values = options.map((o) => o.value);
      expect(values).toContain("pending");
      expect(values).toContain("approved");
      expect(values).toContain("rejected");
      expect(values).toContain("flagged");
    });

    it("should return options with correct labels", () => {
      const options = getStatusOptions(FEEDBACK_STATUS, false);
      const inProgress = options.find((o) => o.value === "in_progress");
      expect(inProgress?.label).toBe("In Progress");
    });

    it("should work with USER_ROLE config", () => {
      const options = getStatusOptions(USER_ROLE, false);
      expect(options).toHaveLength(6);
      const admin = options.find((o) => o.value === "admin");
      expect(admin?.label).toBe("Admin");
    });

    it("should work with SEVERITY config", () => {
      const options = getStatusOptions(SEVERITY);
      expect(options).toHaveLength(5); // All + 4 severities
    });

    it("should work with TRUST_LEVEL config", () => {
      const options = getStatusOptions(TRUST_LEVEL);
      expect(options).toHaveLength(6); // All + 5 trust levels
    });
  });

  describe("Dark mode support", () => {
    it("should have dark mode classes in MODERATION_STATUS", () => {
      Object.values(MODERATION_STATUS).forEach((style) => {
        expect(style.bg).toContain("dark:");
        expect(style.text).toContain("dark:");
      });
    });

    it("should have dark mode classes in USER_ROLE", () => {
      Object.values(USER_ROLE).forEach((style) => {
        expect(style.bg).toContain("dark:");
        expect(style.text).toContain("dark:");
      });
    });

    it("should have dark mode classes in SEVERITY", () => {
      Object.values(SEVERITY).forEach((style) => {
        expect(style.bg).toContain("dark:");
        expect(style.text).toContain("dark:");
      });
    });
  });

  describe("Border property", () => {
    it("should have border property in MODERATION_STATUS", () => {
      Object.values(MODERATION_STATUS).forEach((style) => {
        expect(style.border).toBeDefined();
        expect(style.border).toContain("border-");
      });
    });

    it("should have border property in all status configs", () => {
      const configs = [
        MODERATION_STATUS,
        FEEDBACK_STATUS,
        FEEDBACK_TYPE,
        SEVERITY,
        REPORT_STATUS,
        NOTIFICATION_STATUS,
        BETA_APPLICATION_STATUS,
        RESOURCE_STATUS,
        USER_ROLE,
        TRUST_LEVEL,
      ];

      configs.forEach((config) => {
        Object.values(config).forEach((style) => {
          expect(style.border).toBeDefined();
        });
      });
    });
  });
});
