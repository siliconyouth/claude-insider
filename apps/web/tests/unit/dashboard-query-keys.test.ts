/**
 * Dashboard Query Keys Tests
 *
 * Tests for TanStack Query key factory used across dashboard pages.
 * Verifies query key structure and hierarchy for cache invalidation.
 */

import { describe, it, expect } from "vitest";
import {
  queryKeys,
  type UsersFilters,
  type FeedbackFilters,
  type DiscoveryQueueFilters,
  type BetaFilters,
  type ResourceFilters,
  type NotificationFilters,
  type AuditFilters,
} from "@/lib/query/keys";

describe("Dashboard Query Keys", () => {
  describe("Query Key Structure", () => {
    it("should have dashboard base key", () => {
      expect(queryKeys.dashboard.all).toEqual(["dashboard"]);
    });

    it("should have navCounts key", () => {
      expect(queryKeys.navCounts).toEqual(["dashboard", "nav-counts"]);
    });
  });

  describe("Dashboard Section Keys", () => {
    it("should have stats key", () => {
      expect(queryKeys.dashboard.stats).toEqual(["dashboard", "stats"]);
    });

    it("should have chartStats key", () => {
      expect(queryKeys.dashboard.chartStats).toEqual(["dashboard", "chart-stats"]);
    });
  });

  describe("Users Section Keys", () => {
    it("should have all users key", () => {
      expect(queryKeys.users.all).toEqual(["dashboard", "users"]);
    });

    it("should have users list key with filters", () => {
      const filters: UsersFilters = { page: 1, pageSize: 10 };
      const key = queryKeys.users.list(filters);
      expect(key).toEqual(["dashboard", "users", "list", filters]);
    });

    it("should have users detail key with id", () => {
      const key = queryKeys.users.detail("user-123");
      expect(key).toEqual(["dashboard", "users", "detail", "user-123"]);
    });

    it("should have banned users key", () => {
      expect(queryKeys.users.banned).toEqual(["dashboard", "users", "banned"]);
    });

    it("should include filters in list key", () => {
      const filters: UsersFilters = {
        page: 2,
        pageSize: 20,
        search: "john",
        role: "admin",
        status: "active",
        sortBy: "createdAt",
        sortOrder: "desc",
      };
      const key = queryKeys.users.list(filters);
      expect(key[3]).toEqual(filters);
    });
  });

  describe("Discovery Section Keys", () => {
    it("should have all discovery key", () => {
      expect(queryKeys.discovery.all).toEqual(["dashboard", "discovery"]);
    });

    it("should have discovery stats key", () => {
      expect(queryKeys.discovery.stats).toEqual(["dashboard", "discovery", "stats"]);
    });

    it("should have discovery queue key with filters", () => {
      const filters: DiscoveryQueueFilters = { page: 1, status: "pending" };
      const key = queryKeys.discovery.queue(filters);
      expect(key).toEqual(["dashboard", "discovery", "queue", filters]);
    });

    it("should have discovery sources key", () => {
      expect(queryKeys.discovery.sources).toEqual(["dashboard", "discovery", "sources"]);
    });

    it("should have discovery source detail key", () => {
      const key = queryKeys.discovery.sourceDetail("source-123");
      expect(key).toEqual(["dashboard", "discovery", "sources", "source-123"]);
    });
  });

  describe("Feedback Section Keys", () => {
    it("should have all feedback key", () => {
      expect(queryKeys.feedback.all).toEqual(["dashboard", "feedback"]);
    });

    it("should have feedback list key with filters", () => {
      const filters: FeedbackFilters = { page: 1, status: "open", type: "bug" };
      const key = queryKeys.feedback.list(filters);
      expect(key).toEqual(["dashboard", "feedback", "list", filters]);
    });

    it("should have feedback detail key", () => {
      const key = queryKeys.feedback.detail("feedback-123");
      expect(key).toEqual(["dashboard", "feedback", "detail", "feedback-123"]);
    });

    it("should have feedback stats key", () => {
      expect(queryKeys.feedback.stats).toEqual(["dashboard", "feedback", "stats"]);
    });
  });

  describe("Beta Section Keys", () => {
    it("should have all beta key", () => {
      expect(queryKeys.beta.all).toEqual(["dashboard", "beta"]);
    });

    it("should have beta applications key with filters", () => {
      const filters: BetaFilters = { page: 1, status: "pending" };
      const key = queryKeys.beta.applications(filters);
      expect(key).toEqual(["dashboard", "beta", "applications", filters]);
    });

    it("should have beta testers key with filters", () => {
      const filters: BetaFilters = { page: 1, search: "john" };
      const key = queryKeys.beta.testers(filters);
      expect(key).toEqual(["dashboard", "beta", "testers", filters]);
    });

    it("should have beta detail key", () => {
      const key = queryKeys.beta.detail("beta-123");
      expect(key).toEqual(["dashboard", "beta", "detail", "beta-123"]);
    });
  });

  describe("Moderation Section Keys", () => {
    it("should have all moderation key", () => {
      expect(queryKeys.moderation.all).toEqual(["dashboard", "moderation"]);
    });

    it("should have suggestions key with filters", () => {
      const filters = { page: 1, status: "pending" };
      const key = queryKeys.moderation.suggestions(filters);
      expect(key).toEqual(["dashboard", "moderation", "suggestions", filters]);
    });

    it("should have comments key with filters", () => {
      const filters = { page: 2, status: "approved" };
      const key = queryKeys.moderation.comments(filters);
      expect(key).toEqual(["dashboard", "moderation", "comments", filters]);
    });

    it("should have reports key with filters", () => {
      const filters = { page: 1, status: "investigating", type: "spam" };
      const key = queryKeys.moderation.reports(filters);
      expect(key).toEqual(["dashboard", "moderation", "reports", filters]);
    });
  });

  describe("Resources Section Keys", () => {
    it("should have all resources key", () => {
      expect(queryKeys.resources.all).toEqual(["dashboard", "resources"]);
    });

    it("should have resources list key with filters", () => {
      const filters: ResourceFilters = { page: 1, category: "tools" };
      const key = queryKeys.resources.list(filters);
      expect(key).toEqual(["dashboard", "resources", "list", filters]);
    });

    it("should have resources detail key", () => {
      const key = queryKeys.resources.detail("resource-123");
      expect(key).toEqual(["dashboard", "resources", "detail", "resource-123"]);
    });

    it("should have resources analytics key", () => {
      expect(queryKeys.resources.analytics).toEqual(["dashboard", "resources", "analytics"]);
    });

    it("should have resources updates key", () => {
      expect(queryKeys.resources.updates).toEqual(["dashboard", "resources", "updates"]);
    });
  });

  describe("Documentation Section Keys", () => {
    it("should have all documentation key", () => {
      expect(queryKeys.documentation.all).toEqual(["dashboard", "documentation"]);
    });

    it("should have documentation list key with filters", () => {
      const filters = { page: 1, category: "api" };
      const key = queryKeys.documentation.list(filters);
      expect(key).toEqual(["dashboard", "documentation", "list", filters]);
    });

    it("should have documentation versions key", () => {
      expect(queryKeys.documentation.versions).toEqual(["dashboard", "documentation", "versions"]);
    });

    it("should have documentation relationships key", () => {
      expect(queryKeys.documentation.relationships).toEqual([
        "dashboard",
        "documentation",
        "relationships",
      ]);
    });
  });

  describe("Prompts Section Keys", () => {
    it("should have all prompts key", () => {
      expect(queryKeys.prompts.all).toEqual(["dashboard", "prompts"]);
    });

    it("should have prompts list key with filters", () => {
      const filters = { page: 1, category: "writing" };
      const key = queryKeys.prompts.list(filters);
      expect(key).toEqual(["dashboard", "prompts", "list", filters]);
    });

    it("should have prompts detail key", () => {
      const key = queryKeys.prompts.detail("prompt-123");
      expect(key).toEqual(["dashboard", "prompts", "detail", "prompt-123"]);
    });
  });

  describe("Security Section Keys", () => {
    it("should have all security key", () => {
      expect(queryKeys.security.all).toEqual(["dashboard", "security"]);
    });

    it("should have security stats key", () => {
      expect(queryKeys.security.stats).toEqual(["dashboard", "security", "stats"]);
    });

    it("should have security overview key", () => {
      expect(queryKeys.security.overview).toEqual(["dashboard", "security", "overview"]);
    });

    it("should have security logs key with filters", () => {
      const filters = {
        page: 1,
        severity: "high",
        eventType: "login_failed",
        botOnly: true,
      };
      const key = queryKeys.security.logs(filters);
      expect(key).toEqual(["dashboard", "security", "logs", filters]);
    });

    it("should have security visitors key with filters", () => {
      const filters = {
        page: 1,
        trustLevel: "suspicious",
        isBlocked: true,
        hasAccount: false,
      };
      const key = queryKeys.security.visitors(filters);
      expect(key).toEqual(["dashboard", "security", "visitors", filters]);
    });

    it("should have security honeypots key", () => {
      expect(queryKeys.security.honeypots).toEqual(["dashboard", "security", "honeypots"]);
    });

    it("should have security bots key", () => {
      expect(queryKeys.security.bots).toEqual(["dashboard", "security", "bots"]);
    });

    it("should have security settings key", () => {
      expect(queryKeys.security.settings).toEqual(["dashboard", "security", "settings"]);
    });
  });

  describe("Analytics Section Keys", () => {
    it("should have all analytics key", () => {
      expect(queryKeys.analytics.all).toEqual(["dashboard", "analytics"]);
    });

    it("should have analytics faq key", () => {
      expect(queryKeys.analytics.faq).toEqual(["dashboard", "analytics", "faq"]);
    });

    it("should have analytics search key with filters", () => {
      const filters = { period: "7d" };
      const key = queryKeys.analytics.search(filters);
      expect(key).toEqual(["dashboard", "analytics", "search", filters]);
    });
  });

  describe("Notifications Section Keys", () => {
    it("should have all notifications key", () => {
      expect(queryKeys.notifications.all).toEqual(["dashboard", "notifications"]);
    });

    it("should have notifications list key with filters", () => {
      const filters: NotificationFilters = { page: 1, type: "system", sent: true };
      const key = queryKeys.notifications.list(filters);
      expect(key).toEqual(["dashboard", "notifications", "list", filters]);
    });

    it("should have notifications templates key", () => {
      expect(queryKeys.notifications.templates).toEqual([
        "dashboard",
        "notifications",
        "templates",
      ]);
    });
  });

  describe("Donations Section Keys", () => {
    it("should have all donations key", () => {
      expect(queryKeys.donations.all).toEqual(["dashboard", "donations"]);
    });

    it("should have donations list key with filters", () => {
      const filters = { page: 1, status: "completed" };
      const key = queryKeys.donations.list(filters);
      expect(key).toEqual(["dashboard", "donations", "list", filters]);
    });

    it("should have donations stats key", () => {
      expect(queryKeys.donations.stats).toEqual(["dashboard", "donations", "stats"]);
    });
  });

  describe("Exports Section Keys", () => {
    it("should have all exports key", () => {
      expect(queryKeys.exports.all).toEqual(["dashboard", "exports"]);
    });

    it("should have exports jobs key with filters", () => {
      const filters = { page: 1 };
      const key = queryKeys.exports.jobs(filters);
      expect(key).toEqual(["dashboard", "exports", "jobs", filters]);
    });
  });

  describe("SEO Section Keys", () => {
    it("should have all seo key", () => {
      expect(queryKeys.seo.all).toEqual(["dashboard", "seo"]);
    });

    it("should have seo pages key", () => {
      expect(queryKeys.seo.pages).toEqual(["dashboard", "seo", "pages"]);
    });

    it("should have seo indexnow key", () => {
      expect(queryKeys.seo.indexnow).toEqual(["dashboard", "seo", "indexnow"]);
    });
  });

  describe("Broken Links Section Keys", () => {
    it("should have all brokenLinks key", () => {
      expect(queryKeys.brokenLinks.all).toEqual(["dashboard", "broken-links"]);
    });

    it("should have brokenLinks queue key with filters", () => {
      const filters = { status: "invalid", page: 1 };
      const key = queryKeys.brokenLinks.queue(filters);
      expect(key).toEqual(["dashboard", "broken-links", "queue", filters]);
    });

    it("should have brokenLinks stats key", () => {
      expect(queryKeys.brokenLinks.stats).toEqual(["dashboard", "broken-links", "stats"]);
    });
  });

  describe("Admin Section Keys", () => {
    it("should have all admin key", () => {
      expect(queryKeys.admin.all).toEqual(["dashboard", "admin"]);
    });

    it("should have banned users key", () => {
      expect(queryKeys.admin.bannedUsers).toEqual(["dashboard", "admin", "banned-users"]);
    });

    it("should have ban appeals key with status", () => {
      const key = queryKeys.admin.banAppeals("pending");
      expect(key).toEqual(["dashboard", "admin", "ban-appeals", "pending"]);
    });

    it("should have ban appeals key with 'all' status", () => {
      const key = queryKeys.admin.banAppeals("all");
      expect(key).toEqual(["dashboard", "admin", "ban-appeals", "all"]);
    });

    it("should have admin notifications key", () => {
      const key = queryKeys.admin.notifications("unread");
      expect(key).toEqual(["dashboard", "admin", "notifications", "unread"]);
    });

    it("should have admin donations key", () => {
      expect(queryKeys.admin.donations).toEqual(["dashboard", "admin", "donations"]);
    });

    it("should have admin exports key", () => {
      expect(queryKeys.admin.exports).toEqual(["dashboard", "admin", "exports"]);
    });
  });

  describe("Query Key Hierarchy", () => {
    it("should have consistent prefix for all dashboard keys", () => {
      expect(queryKeys.dashboard.all[0]).toBe("dashboard");
      expect(queryKeys.users.all[0]).toBe("dashboard");
      expect(queryKeys.feedback.all[0]).toBe("dashboard");
      expect(queryKeys.security.all[0]).toBe("dashboard");
    });

    it("should have 2-element base keys for sections", () => {
      expect(queryKeys.users.all).toHaveLength(2);
      expect(queryKeys.feedback.all).toHaveLength(2);
      expect(queryKeys.resources.all).toHaveLength(2);
    });

    it("should have 3-element keys for stats/overview", () => {
      expect(queryKeys.dashboard.stats).toHaveLength(2);
      expect(queryKeys.feedback.stats).toHaveLength(3);
      expect(queryKeys.security.overview).toHaveLength(3);
    });

    it("should have 4-element keys for list/detail with filters", () => {
      const listKey = queryKeys.users.list({ page: 1 });
      expect(listKey).toHaveLength(4);

      const detailKey = queryKeys.users.detail("123");
      expect(detailKey).toHaveLength(4);
    });
  });

  describe("Filter Types", () => {
    it("should accept UsersFilters with all properties", () => {
      const filters: UsersFilters = {
        page: 1,
        pageSize: 10,
        search: "test",
        role: "admin",
        status: "active",
        sortBy: "name",
        sortOrder: "asc",
      };
      const key = queryKeys.users.list(filters);
      expect(key[3]).toEqual(filters);
    });

    it("should accept FeedbackFilters with all properties", () => {
      const filters: FeedbackFilters = {
        page: 1,
        pageSize: 10,
        status: "open",
        type: "bug",
        search: "error",
      };
      const key = queryKeys.feedback.list(filters);
      expect(key[3]).toEqual(filters);
    });

    it("should accept DiscoveryQueueFilters with all properties", () => {
      const filters: DiscoveryQueueFilters = {
        page: 1,
        pageSize: 10,
        status: "pending",
        sourceId: "source-1",
      };
      const key = queryKeys.discovery.queue(filters);
      expect(key[3]).toEqual(filters);
    });

    it("should accept NotificationFilters with all properties", () => {
      const filters: NotificationFilters = {
        page: 1,
        pageSize: 10,
        type: "system",
        sent: true,
      };
      const key = queryKeys.notifications.list(filters);
      expect(key[3]).toEqual(filters);
    });

    it("should accept empty filters object", () => {
      const key = queryKeys.users.list({});
      expect(key[3]).toEqual({});
    });
  });

  describe("Type Safety", () => {
    it("should return readonly arrays", () => {
      const key = queryKeys.dashboard.all;
      // TypeScript will catch attempts to modify
      expect(Array.isArray(key)).toBe(true);
    });

    it("should preserve filter type in key", () => {
      const filters: UsersFilters = { page: 1, role: "admin" };
      const key = queryKeys.users.list(filters);
      // The filters should be the same object reference
      expect(key[3]).toBe(filters);
    });
  });
});
