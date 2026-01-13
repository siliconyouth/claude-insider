/**
 * Achievements System Unit Tests
 *
 * Tests for the gamification achievements system:
 * - getAchievement: Retrieve single achievement by ID
 * - getAchievementsByCategory: Filter achievements by category
 * - getAchievementsByRarity: Filter achievements by rarity
 * - getAllAchievements: Get complete list
 * - getVisibleAchievements: Exclude hidden achievements
 * - getTotalPossiblePoints: Calculate maximum points
 * - RARITY_CONFIG: Rarity styling configuration
 * - CATEGORY_CONFIG: Category definitions
 */

import { describe, it, expect } from "vitest";
import {
  ACHIEVEMENTS,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
  getAchievement,
  getAchievementsByCategory,
  getAchievementsByRarity,
  getAllAchievements,
  getVisibleAchievements,
  getTotalPossiblePoints,
  type AchievementRarity,
  type AchievementCategory,
} from "@/lib/achievements";

// ============================================
// ACHIEVEMENTS CONSTANT TESTS
// ============================================

describe("ACHIEVEMENTS constant", () => {
  it("should have a large number of achievements", () => {
    const count = Object.keys(ACHIEVEMENTS).length;
    expect(count).toBeGreaterThanOrEqual(50);
  });

  it("should have unique IDs matching object keys", () => {
    Object.entries(ACHIEVEMENTS).forEach(([key, achievement]) => {
      expect(achievement.id).toBe(key);
    });
  });

  it("should have all required properties for each achievement", () => {
    Object.values(ACHIEVEMENTS).forEach((achievement) => {
      expect(achievement.id).toBeDefined();
      expect(achievement.name).toBeDefined();
      expect(achievement.description).toBeDefined();
      expect(achievement.icon).toBeDefined();
      expect(achievement.rarity).toBeDefined();
      expect(achievement.category).toBeDefined();
      expect(achievement.points).toBeGreaterThan(0);
    });
  });

  it("should have valid rarity values", () => {
    const validRarities: AchievementRarity[] = ["common", "rare", "epic", "legendary"];
    Object.values(ACHIEVEMENTS).forEach((achievement) => {
      expect(validRarities).toContain(achievement.rarity);
    });
  });

  it("should have valid category values", () => {
    const validCategories = Object.keys(CATEGORY_CONFIG);
    Object.values(ACHIEVEMENTS).forEach((achievement) => {
      expect(validCategories).toContain(achievement.category);
    });
  });

  it("should have reasonable point values by rarity", () => {
    Object.values(ACHIEVEMENTS).forEach((achievement) => {
      switch (achievement.rarity) {
        case "common":
          expect(achievement.points).toBeLessThanOrEqual(150);
          break;
        case "rare":
          expect(achievement.points).toBeLessThanOrEqual(300);
          break;
        case "epic":
          expect(achievement.points).toBeLessThanOrEqual(600);
          break;
        case "legendary":
          expect(achievement.points).toBeLessThanOrEqual(3000);
          break;
      }
    });
  });
});

// ============================================
// RARITY_CONFIG TESTS
// ============================================

describe("RARITY_CONFIG", () => {
  const rarities: AchievementRarity[] = ["common", "rare", "epic", "legendary"];

  it("should have all rarity levels defined", () => {
    rarities.forEach((rarity) => {
      expect(RARITY_CONFIG[rarity]).toBeDefined();
    });
  });

  it("should have required styling properties", () => {
    rarities.forEach((rarity) => {
      const config = RARITY_CONFIG[rarity];
      expect(config.label).toBeDefined();
      expect(config.color).toBeDefined();
      expect(config.bgColor).toBeDefined();
      expect(config.borderColor).toBeDefined();
      expect(config.iconBg).toBeDefined();
    });
  });

  it("should have correct labels", () => {
    expect(RARITY_CONFIG.common.label).toBe("Common");
    expect(RARITY_CONFIG.rare.label).toBe("Rare");
    expect(RARITY_CONFIG.epic.label).toBe("Epic");
    expect(RARITY_CONFIG.legendary.label).toBe("Legendary");
  });

  it("should have glow colors for premium rarities", () => {
    expect(RARITY_CONFIG.common.glowColor).toBe("");
    expect(RARITY_CONFIG.rare.glowColor).toContain("shadow-blue");
    expect(RARITY_CONFIG.epic.glowColor).toContain("shadow-violet");
    expect(RARITY_CONFIG.legendary.glowColor).toContain("shadow-amber");
  });
});

// ============================================
// CATEGORY_CONFIG TESTS
// ============================================

describe("CATEGORY_CONFIG", () => {
  const categories: AchievementCategory[] = [
    "onboarding",
    "engagement",
    "learning",
    "social",
    "content",
    "streak",
    "collector",
    "expert",
    "supporter",
    "special",
  ];

  it("should have all categories defined", () => {
    categories.forEach((category) => {
      expect(CATEGORY_CONFIG[category]).toBeDefined();
    });
  });

  it("should have required properties", () => {
    categories.forEach((category) => {
      const config = CATEGORY_CONFIG[category];
      expect(config.label).toBeDefined();
      expect(config.description).toBeDefined();
      expect(config.icon).toBeDefined();
    });
  });

  it("should have descriptive labels", () => {
    expect(CATEGORY_CONFIG.onboarding.label).toBe("Getting Started");
    expect(CATEGORY_CONFIG.engagement.label).toBe("Engagement");
    expect(CATEGORY_CONFIG.learning.label).toBe("Learning");
    expect(CATEGORY_CONFIG.streak.label).toBe("Streaks");
  });
});

// ============================================
// getAchievement TESTS
// ============================================

describe("getAchievement", () => {
  it("should return achievement by valid ID", () => {
    const achievement = getAchievement("welcome_aboard");
    expect(achievement).toBeDefined();
    expect(achievement?.id).toBe("welcome_aboard");
    expect(achievement?.name).toBe("Welcome Aboard");
    expect(achievement?.category).toBe("onboarding");
  });

  it("should return undefined for invalid ID", () => {
    expect(getAchievement("nonexistent")).toBeUndefined();
    expect(getAchievement("")).toBeUndefined();
  });

  it("should return correct data structure", () => {
    const achievement = getAchievement("first_comment");
    expect(achievement).toMatchObject({
      id: "first_comment",
      name: "Ice Breaker",
      category: "engagement",
      rarity: "common",
    });
  });
});

// ============================================
// getAchievementsByCategory TESTS
// ============================================

describe("getAchievementsByCategory", () => {
  it("should return only achievements from specified category", () => {
    const onboarding = getAchievementsByCategory("onboarding");
    expect(onboarding.length).toBeGreaterThan(0);
    onboarding.forEach((achievement) => {
      expect(achievement.category).toBe("onboarding");
    });
  });

  it("should return different results for different categories", () => {
    const onboarding = getAchievementsByCategory("onboarding");
    const engagement = getAchievementsByCategory("engagement");

    expect(onboarding.length).toBeGreaterThan(0);
    expect(engagement.length).toBeGreaterThan(0);

    const onboardingIds = onboarding.map((a) => a.id);
    const engagementIds = engagement.map((a) => a.id);

    // No overlap between categories
    const overlap = onboardingIds.filter((id) => engagementIds.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it("should include expected achievements per category", () => {
    expect(
      getAchievementsByCategory("onboarding").some((a) => a.id === "welcome_aboard")
    ).toBe(true);
    expect(
      getAchievementsByCategory("engagement").some((a) => a.id === "first_comment")
    ).toBe(true);
    expect(
      getAchievementsByCategory("streak").some((a) => a.id === "seven_day_streak")
    ).toBe(true);
    expect(
      getAchievementsByCategory("supporter").some((a) => a.id === "first_donation")
    ).toBe(true);
  });

  it("should return achievements for all categories", () => {
    const categories: AchievementCategory[] = [
      "onboarding",
      "engagement",
      "learning",
      "social",
      "content",
      "streak",
      "collector",
      "expert",
      "supporter",
      "special",
    ];

    categories.forEach((category) => {
      const achievements = getAchievementsByCategory(category);
      expect(achievements.length).toBeGreaterThan(0);
    });
  });
});

// ============================================
// getAchievementsByRarity TESTS
// ============================================

describe("getAchievementsByRarity", () => {
  it("should return only achievements of specified rarity", () => {
    const legendary = getAchievementsByRarity("legendary");
    expect(legendary.length).toBeGreaterThan(0);
    legendary.forEach((achievement) => {
      expect(achievement.rarity).toBe("legendary");
    });
  });

  it("should have more common achievements than legendary", () => {
    const common = getAchievementsByRarity("common");
    const legendary = getAchievementsByRarity("legendary");

    expect(common.length).toBeGreaterThan(legendary.length);
  });

  it("should return achievements for all rarities", () => {
    const rarities: AchievementRarity[] = ["common", "rare", "epic", "legendary"];

    rarities.forEach((rarity) => {
      const achievements = getAchievementsByRarity(rarity);
      expect(achievements.length).toBeGreaterThan(0);
    });
  });

  it("should have proper point distribution by rarity", () => {
    const common = getAchievementsByRarity("common");
    const legendary = getAchievementsByRarity("legendary");

    const avgCommon = common.reduce((sum, a) => sum + a.points, 0) / common.length;
    const avgLegendary =
      legendary.reduce((sum, a) => sum + a.points, 0) / legendary.length;

    expect(avgLegendary).toBeGreaterThan(avgCommon);
  });
});

// ============================================
// getAllAchievements TESTS
// ============================================

describe("getAllAchievements", () => {
  it("should return all achievements as array", () => {
    const all = getAllAchievements();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(Object.keys(ACHIEVEMENTS).length);
  });

  it("should include both visible and hidden achievements", () => {
    const all = getAllAchievements();
    const hasHidden = all.some((a) => a.hidden === true);
    const hasVisible = all.some((a) => !a.hidden);

    expect(hasHidden).toBe(true);
    expect(hasVisible).toBe(true);
  });
});

// ============================================
// getVisibleAchievements TESTS
// ============================================

describe("getVisibleAchievements", () => {
  it("should exclude hidden achievements", () => {
    const visible = getVisibleAchievements();
    visible.forEach((achievement) => {
      expect(achievement.hidden).not.toBe(true);
    });
  });

  it("should return fewer achievements than getAllAchievements", () => {
    const all = getAllAchievements();
    const visible = getVisibleAchievements();

    expect(visible.length).toBeLessThan(all.length);
  });

  it("should not include completionist achievement", () => {
    const visible = getVisibleAchievements();
    expect(visible.find((a) => a.id === "completionist")).toBeUndefined();
  });

  it("should not include early_adopter achievement", () => {
    const visible = getVisibleAchievements();
    expect(visible.find((a) => a.id === "early_adopter")).toBeUndefined();
  });

  it("should not include recurring_supporter achievement", () => {
    const visible = getVisibleAchievements();
    expect(visible.find((a) => a.id === "recurring_supporter")).toBeUndefined();
  });
});

// ============================================
// getTotalPossiblePoints TESTS
// ============================================

describe("getTotalPossiblePoints", () => {
  it("should return a positive number", () => {
    const total = getTotalPossiblePoints();
    expect(total).toBeGreaterThan(0);
  });

  it("should equal sum of all achievement points", () => {
    const total = getTotalPossiblePoints();
    const manualSum = Object.values(ACHIEVEMENTS).reduce((sum, a) => sum + a.points, 0);
    expect(total).toBe(manualSum);
  });

  it("should be at least 5000 points", () => {
    // Based on the achievements we saw, there should be substantial points
    const total = getTotalPossiblePoints();
    expect(total).toBeGreaterThanOrEqual(5000);
  });

  it("should be consistent across calls", () => {
    const total1 = getTotalPossiblePoints();
    const total2 = getTotalPossiblePoints();
    expect(total1).toBe(total2);
  });
});

// ============================================
// SPECIFIC ACHIEVEMENT TESTS
// ============================================

describe("Specific achievements", () => {
  describe("Onboarding achievements", () => {
    it("should have welcome_aboard as first achievement", () => {
      const achievement = getAchievement("welcome_aboard");
      expect(achievement?.rarity).toBe("common");
      expect(achievement?.points).toBe(50);
    });

    it("should have security_setup as rare", () => {
      const achievement = getAchievement("security_setup");
      expect(achievement?.rarity).toBe("rare");
      expect(achievement?.category).toBe("onboarding");
    });
  });

  describe("Streak achievements", () => {
    it("should have increasing points for longer streaks", () => {
      const three = getAchievement("three_day_streak");
      const seven = getAchievement("seven_day_streak");
      const thirty = getAchievement("thirty_day_streak");
      const hundred = getAchievement("hundred_day_streak");

      expect(three?.points).toBeLessThan(seven?.points || 0);
      expect(seven?.points).toBeLessThan(thirty?.points || 0);
      expect(thirty?.points).toBeLessThan(hundred?.points || 0);
    });

    it("should have increasing rarity for longer streaks", () => {
      expect(getAchievement("three_day_streak")?.rarity).toBe("common");
      expect(getAchievement("seven_day_streak")?.rarity).toBe("rare");
      expect(getAchievement("thirty_day_streak")?.rarity).toBe("epic");
      expect(getAchievement("hundred_day_streak")?.rarity).toBe("legendary");
    });
  });

  describe("Supporter achievements", () => {
    it("should have donation tier achievements", () => {
      expect(getAchievement("bronze_supporter")).toBeDefined();
      expect(getAchievement("silver_supporter")).toBeDefined();
      expect(getAchievement("gold_supporter")).toBeDefined();
      expect(getAchievement("platinum_supporter")).toBeDefined();
    });

    it("should have increasing rarity for higher tiers", () => {
      expect(getAchievement("bronze_supporter")?.rarity).toBe("common");
      expect(getAchievement("silver_supporter")?.rarity).toBe("rare");
      expect(getAchievement("gold_supporter")?.rarity).toBe("epic");
      expect(getAchievement("platinum_supporter")?.rarity).toBe("legendary");
    });
  });

  describe("Expert achievements", () => {
    it("should have completionist as hidden legendary", () => {
      const completionist = getAchievement("completionist");
      expect(completionist?.rarity).toBe("legendary");
      expect(completionist?.hidden).toBe(true);
    });
  });
});
