/**
 * Resource Schema Tests
 *
 * Tests for resource schema validation, type guards, and category utilities.
 * These tests cover the core data structures used throughout the resources system.
 */

import { describe, it, expect } from "vitest";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_CATEGORY_SLUGS,
  getCategoryBySlug,
  validateResource,
  type ResourceEntry,
  type ResourceCategorySlug,
  type DifficultyLevel,
  type ResourceStatus,
} from "@/data/resources/schema";

describe("Resource Schema", () => {
  describe("RESOURCE_CATEGORY_SLUGS", () => {
    it("should contain all 10 category slugs", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toHaveLength(10);
    });

    it("should include official category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("official");
    });

    it("should include tools category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("tools");
    });

    it("should include mcp-servers category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("mcp-servers");
    });

    it("should include rules category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("rules");
    });

    it("should include prompts category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("prompts");
    });

    it("should include agents category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("agents");
    });

    it("should include tutorials category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("tutorials");
    });

    it("should include sdks category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("sdks");
    });

    it("should include showcases category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("showcases");
    });

    it("should include community category", () => {
      expect(RESOURCE_CATEGORY_SLUGS).toContain("community");
    });
  });

  describe("RESOURCE_CATEGORIES", () => {
    it("should have 10 categories", () => {
      expect(RESOURCE_CATEGORIES).toHaveLength(10);
    });

    it("should have matching slugs with RESOURCE_CATEGORY_SLUGS", () => {
      const categorySlugs = RESOURCE_CATEGORIES.map((c) => c.slug);
      expect(categorySlugs.sort()).toEqual([...RESOURCE_CATEGORY_SLUGS].sort());
    });

    it("should have name property for all categories", () => {
      RESOURCE_CATEGORIES.forEach((category) => {
        expect(category.name).toBeDefined();
        expect(typeof category.name).toBe("string");
        expect(category.name.length).toBeGreaterThan(0);
      });
    });

    it("should have shortName property for all categories", () => {
      RESOURCE_CATEGORIES.forEach((category) => {
        expect(category.shortName).toBeDefined();
        expect(typeof category.shortName).toBe("string");
      });
    });

    it("should have description property for all categories", () => {
      RESOURCE_CATEGORIES.forEach((category) => {
        expect(category.description).toBeDefined();
        expect(typeof category.description).toBe("string");
        expect(category.description.length).toBeGreaterThan(0);
      });
    });

    it("should have emoji icon for all categories", () => {
      RESOURCE_CATEGORIES.forEach((category) => {
        expect(category.icon).toBeDefined();
        expect(typeof category.icon).toBe("string");
      });
    });

    it("should have color property for all categories", () => {
      RESOURCE_CATEGORIES.forEach((category) => {
        expect(category.color).toBeDefined();
        expect(typeof category.color).toBe("string");
      });
    });

    describe("Official category", () => {
      const official = RESOURCE_CATEGORIES.find((c) => c.slug === "official");

      it("should have correct name", () => {
        expect(official?.name).toBe("Official Resources");
      });

      it("should have correct icon", () => {
        expect(official?.icon).toBe("🎯");
      });

      it("should have violet color", () => {
        expect(official?.color).toBe("violet");
      });
    });

    describe("MCP Servers category", () => {
      const mcp = RESOURCE_CATEGORIES.find((c) => c.slug === "mcp-servers");

      it("should have correct name", () => {
        expect(mcp?.name).toBe("MCP Servers");
      });

      it("should have correct icon", () => {
        expect(mcp?.icon).toBe("🔌");
      });

      it("should have cyan color", () => {
        expect(mcp?.color).toBe("cyan");
      });
    });

    describe("Tools category", () => {
      const tools = RESOURCE_CATEGORIES.find((c) => c.slug === "tools");

      it("should have correct name", () => {
        expect(tools?.name).toBe("Tools & Extensions");
      });

      it("should have correct shortName", () => {
        expect(tools?.shortName).toBe("Tools");
      });
    });
  });

  describe("getCategoryBySlug", () => {
    it("should return official category for 'official' slug", () => {
      const category = getCategoryBySlug("official");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("official");
      expect(category?.name).toBe("Official Resources");
    });

    it("should return tools category for 'tools' slug", () => {
      const category = getCategoryBySlug("tools");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("tools");
    });

    it("should return mcp-servers category for 'mcp-servers' slug", () => {
      const category = getCategoryBySlug("mcp-servers");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("mcp-servers");
    });

    it("should return rules category for 'rules' slug", () => {
      const category = getCategoryBySlug("rules");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("rules");
    });

    it("should return prompts category for 'prompts' slug", () => {
      const category = getCategoryBySlug("prompts");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("prompts");
    });

    it("should return agents category for 'agents' slug", () => {
      const category = getCategoryBySlug("agents");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("agents");
    });

    it("should return tutorials category for 'tutorials' slug", () => {
      const category = getCategoryBySlug("tutorials");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("tutorials");
    });

    it("should return sdks category for 'sdks' slug", () => {
      const category = getCategoryBySlug("sdks");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("sdks");
    });

    it("should return showcases category for 'showcases' slug", () => {
      const category = getCategoryBySlug("showcases");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("showcases");
    });

    it("should return community category for 'community' slug", () => {
      const category = getCategoryBySlug("community");
      expect(category).toBeDefined();
      expect(category?.slug).toBe("community");
    });

    it("should return undefined for invalid slug", () => {
      const category = getCategoryBySlug("invalid" as ResourceCategorySlug);
      expect(category).toBeUndefined();
    });
  });

  describe("validateResource", () => {
    const validResource: ResourceEntry = {
      id: "test-123",
      title: "Test Resource",
      description: "A test resource description",
      url: "https://example.com/resource",
      category: "tools",
      tags: ["test", "example"],
      status: "community",
      addedDate: "2024-01-01",
      lastVerified: "2024-01-01",
    };

    describe("Valid resources", () => {
      it("should return true for valid resource with required fields", () => {
        expect(validateResource(validResource)).toBe(true);
      });

      it("should return true for resource with optional fields", () => {
        const resourceWithOptionals: ResourceEntry = {
          ...validResource,
          subcategory: "IDE Plugins",
          difficulty: "beginner" as DifficultyLevel,
          featured: true,
          featuredReason: "Editor's Pick",
          version: "1.0.0",
        };
        expect(validateResource(resourceWithOptionals)).toBe(true);
      });

      it("should return true for resource with enhanced fields", () => {
        const resourceWithEnhanced: ResourceEntry = {
          ...validResource,
          aiOverview: "AI-generated overview",
          aiSummary: "AI-generated summary",
          keyFeatures: ["feature1", "feature2"],
          useCases: ["use case 1"],
          pros: ["pro1", "pro2"],
          cons: ["con1"],
          targetAudience: ["Developers"],
          prerequisites: ["Node.js"],
        };
        expect(validateResource(resourceWithEnhanced)).toBe(true);
      });

      it("should return true for resource with GitHub info", () => {
        const resourceWithGitHub: ResourceEntry = {
          ...validResource,
          github: {
            owner: "anthropics",
            repo: "claude-code",
            stars: 1000,
            forks: 100,
            lastUpdated: "2024-01-01",
            language: "TypeScript",
          },
        };
        expect(validateResource(resourceWithGitHub)).toBe(true);
      });

      it("should return true for all valid status values", () => {
        const statuses: ResourceStatus[] = ["official", "community", "beta", "deprecated", "archived"];
        statuses.forEach((status) => {
          expect(validateResource({ ...validResource, status })).toBe(true);
        });
      });

      it("should return true for all valid difficulty levels", () => {
        const difficulties: DifficultyLevel[] = ["beginner", "intermediate", "advanced", "expert"];
        difficulties.forEach((difficulty) => {
          expect(validateResource({ ...validResource, difficulty })).toBe(true);
        });
      });

      it("should return true for all valid categories", () => {
        RESOURCE_CATEGORY_SLUGS.forEach((category) => {
          expect(validateResource({ ...validResource, category })).toBe(true);
        });
      });
    });

    describe("Invalid resources", () => {
      it("should return false for empty object", () => {
        expect(validateResource({})).toBe(false);
      });

      it("should return false for missing id", () => {
        const { id: _, ...resourceWithoutId } = validResource;
        expect(validateResource(resourceWithoutId)).toBe(false);
      });

      it("should return false for missing title", () => {
        const { title: _, ...resourceWithoutTitle } = validResource;
        expect(validateResource(resourceWithoutTitle)).toBe(false);
      });

      it("should return false for missing description", () => {
        const { description: _, ...resourceWithoutDescription } = validResource;
        expect(validateResource(resourceWithoutDescription)).toBe(false);
      });

      it("should return false for missing url", () => {
        const { url: _, ...resourceWithoutUrl } = validResource;
        expect(validateResource(resourceWithoutUrl)).toBe(false);
      });

      it("should return false for missing category", () => {
        const { category: _, ...resourceWithoutCategory } = validResource;
        expect(validateResource(resourceWithoutCategory)).toBe(false);
      });

      it("should return false for missing status", () => {
        const { status: _, ...resourceWithoutStatus } = validResource;
        expect(validateResource(resourceWithoutStatus)).toBe(false);
      });

      it("should return false for missing tags", () => {
        const { tags: _, ...resourceWithoutTags } = validResource;
        expect(validateResource(resourceWithoutTags)).toBe(false);
      });

      it("should return false for missing addedDate", () => {
        const { addedDate: _, ...resourceWithoutAddedDate } = validResource;
        expect(validateResource(resourceWithoutAddedDate)).toBe(false);
      });

      it("should return false for missing lastVerified", () => {
        const { lastVerified: _, ...resourceWithoutLastVerified } = validResource;
        expect(validateResource(resourceWithoutLastVerified)).toBe(false);
      });

      it("should return false for null values", () => {
        expect(validateResource({ ...validResource, id: null as unknown as string })).toBe(false);
      });

      it("should return false for undefined values", () => {
        expect(validateResource({ ...validResource, title: undefined as unknown as string })).toBe(false);
      });

      it("should return false for empty string id", () => {
        expect(validateResource({ ...validResource, id: "" })).toBe(false);
      });

      it("should return false for empty string title", () => {
        expect(validateResource({ ...validResource, title: "" })).toBe(false);
      });

      it("should return false for empty string description", () => {
        expect(validateResource({ ...validResource, description: "" })).toBe(false);
      });

      it("should return false for empty string url", () => {
        expect(validateResource({ ...validResource, url: "" })).toBe(false);
      });
    });
  });

  describe("Type definitions", () => {
    it("should have correct DifficultyLevel values", () => {
      const validDifficulties: DifficultyLevel[] = ["beginner", "intermediate", "advanced", "expert"];
      expect(validDifficulties).toHaveLength(4);
    });

    it("should have correct ResourceStatus values", () => {
      const validStatuses: ResourceStatus[] = ["official", "community", "beta", "deprecated", "archived"];
      expect(validStatuses).toHaveLength(5);
    });

    it("should have correct ResourceCategorySlug values", () => {
      const validCategories: ResourceCategorySlug[] = RESOURCE_CATEGORY_SLUGS;
      expect(validCategories).toHaveLength(10);
    });
  });
});
