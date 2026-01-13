/**
 * Gamification System Tests
 *
 * Tests for points, levels, streaks, and rewards configuration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  pointActions,
  levels,
  streakMilestones,
  getLevelFromPoints,
  getLevelProgress,
  isStreakActive,
  getStreakBonus,
  getPointAction,
  calculatePoints,
  type PointAction,
  type Level,
} from "@/lib/gamification";

describe("pointActions constant", () => {
  it("should be an array", () => {
    expect(Array.isArray(pointActions)).toBe(true);
  });

  it("should have at least 10 actions", () => {
    expect(pointActions.length).toBeGreaterThanOrEqual(10);
  });

  it("should have valid action structure", () => {
    pointActions.forEach((action) => {
      expect(action).toHaveProperty("id");
      expect(action).toHaveProperty("name");
      expect(action).toHaveProperty("description");
      expect(action).toHaveProperty("points");
      expect(action).toHaveProperty("category");
      expect(typeof action.id).toBe("string");
      expect(typeof action.name).toBe("string");
      expect(typeof action.description).toBe("string");
      expect(typeof action.points).toBe("number");
    });
  });

  it("should have unique IDs", () => {
    const ids = pointActions.map((a) => a.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  it("should have valid categories", () => {
    const validCategories = ["reading", "engagement", "contribution", "social"];
    pointActions.forEach((action) => {
      expect(validCategories).toContain(action.category);
    });
  });

  it("should have positive point values", () => {
    pointActions.forEach((action) => {
      expect(action.points).toBeGreaterThan(0);
    });
  });

  it("should have reasonable daily limits when set", () => {
    pointActions.forEach((action) => {
      if (action.daily_limit !== undefined) {
        expect(action.daily_limit).toBeGreaterThan(0);
        expect(action.daily_limit).toBeLessThanOrEqual(100);
      }
    });
  });
});

describe("Point action categories", () => {
  it("should have reading actions", () => {
    const readingActions = pointActions.filter((a) => a.category === "reading");
    expect(readingActions.length).toBeGreaterThan(0);
  });

  it("should have engagement actions", () => {
    const engagementActions = pointActions.filter((a) => a.category === "engagement");
    expect(engagementActions.length).toBeGreaterThan(0);
  });

  it("should have contribution actions", () => {
    const contributionActions = pointActions.filter((a) => a.category === "contribution");
    expect(contributionActions.length).toBeGreaterThan(0);
  });

  it("should have social actions", () => {
    const socialActions = pointActions.filter((a) => a.category === "social");
    expect(socialActions.length).toBeGreaterThan(0);
  });
});

describe("levels constant", () => {
  it("should be an array", () => {
    expect(Array.isArray(levels)).toBe(true);
  });

  it("should have 10 levels", () => {
    expect(levels.length).toBe(10);
  });

  it("should have valid level structure", () => {
    levels.forEach((level) => {
      expect(level).toHaveProperty("level");
      expect(level).toHaveProperty("name");
      expect(level).toHaveProperty("min_points");
      expect(level).toHaveProperty("icon");
      expect(level).toHaveProperty("color");
      expect(typeof level.level).toBe("number");
      expect(typeof level.name).toBe("string");
      expect(typeof level.min_points).toBe("number");
    });
  });

  it("should start at level 1", () => {
    expect(levels[0]?.level).toBe(1);
  });

  it("should end at level 10", () => {
    expect(levels[levels.length - 1]?.level).toBe(10);
  });

  it("should have ascending level numbers", () => {
    for (let i = 0; i < levels.length - 1; i++) {
      const current = levels[i];
      const next = levels[i + 1];
      if (current && next) {
        expect(next.level).toBeGreaterThan(current.level);
      }
    }
  });

  it("should have ascending min_points", () => {
    for (let i = 0; i < levels.length - 1; i++) {
      const current = levels[i];
      const next = levels[i + 1];
      if (current && next) {
        expect(next.min_points).toBeGreaterThan(current.min_points);
      }
    }
  });

  it("should start with 0 min_points for level 1", () => {
    expect(levels[0]?.min_points).toBe(0);
  });

  it("should have unique level names", () => {
    const names = levels.map((l) => l.name);
    const uniqueNames = [...new Set(names)];
    expect(names.length).toBe(uniqueNames.length);
  });
});

describe("streakMilestones constant", () => {
  it("should be an array", () => {
    expect(Array.isArray(streakMilestones)).toBe(true);
  });

  it("should have valid milestone structure", () => {
    streakMilestones.forEach((milestone) => {
      expect(milestone).toHaveProperty("days");
      expect(milestone).toHaveProperty("bonus");
      expect(milestone).toHaveProperty("badge");
      expect(typeof milestone.days).toBe("number");
      expect(typeof milestone.bonus).toBe("number");
      expect(typeof milestone.badge).toBe("string");
    });
  });

  it("should have ascending day requirements", () => {
    for (let i = 0; i < streakMilestones.length - 1; i++) {
      const current = streakMilestones[i];
      const next = streakMilestones[i + 1];
      if (current && next) {
        expect(next.days).toBeGreaterThan(current.days);
      }
    }
  });

  it("should have ascending bonuses", () => {
    for (let i = 0; i < streakMilestones.length - 1; i++) {
      const current = streakMilestones[i];
      const next = streakMilestones[i + 1];
      if (current && next) {
        expect(next.bonus).toBeGreaterThan(current.bonus);
      }
    }
  });

  it("should include common milestones (7, 30, 365 days)", () => {
    const days = streakMilestones.map((m) => m.days);
    expect(days).toContain(7);
    expect(days).toContain(30);
    expect(days).toContain(365);
  });
});

describe("getLevelFromPoints", () => {
  it("should return level 1 for 0 points", () => {
    const level = getLevelFromPoints(0);
    expect(level.level).toBe(1);
    expect(level.name).toBe("Newcomer");
  });

  it("should return level 1 for 99 points", () => {
    const level = getLevelFromPoints(99);
    expect(level.level).toBe(1);
  });

  it("should return level 2 for exactly 100 points", () => {
    const level = getLevelFromPoints(100);
    expect(level.level).toBe(2);
    expect(level.name).toBe("Explorer");
  });

  it("should return level 10 for max points", () => {
    const level = getLevelFromPoints(50000);
    expect(level.level).toBe(10);
    expect(level.name).toBe("Titan");
  });

  it("should return level 10 for points above max", () => {
    const level = getLevelFromPoints(100000);
    expect(level.level).toBe(10);
  });

  it("should handle all level boundaries correctly", () => {
    // Test each level boundary
    expect(getLevelFromPoints(0).level).toBe(1);
    expect(getLevelFromPoints(100).level).toBe(2);
    expect(getLevelFromPoints(300).level).toBe(3);
    expect(getLevelFromPoints(750).level).toBe(4);
    expect(getLevelFromPoints(1500).level).toBe(5);
    expect(getLevelFromPoints(3000).level).toBe(6);
    expect(getLevelFromPoints(6000).level).toBe(7);
    expect(getLevelFromPoints(12000).level).toBe(8);
    expect(getLevelFromPoints(25000).level).toBe(9);
    expect(getLevelFromPoints(50000).level).toBe(10);
  });
});

describe("getLevelProgress", () => {
  it("should return 0 progress at level start", () => {
    const progress = getLevelProgress(100); // Just reached level 2

    expect(progress.current.level).toBe(2);
    expect(progress.progress).toBe(0);
  });

  it("should return correct progress percentage", () => {
    // Level 2 is 100-299 (200 points needed)
    const progress = getLevelProgress(200); // Halfway to level 3

    expect(progress.current.level).toBe(2);
    expect(progress.next?.level).toBe(3);
    expect(progress.progress).toBe(50);
  });

  it("should return 100 progress at max level", () => {
    const progress = getLevelProgress(50000);

    expect(progress.current.level).toBe(10);
    expect(progress.next).toBeNull();
    expect(progress.progress).toBe(100);
  });

  it("should return 0 pointsToNext at max level", () => {
    const progress = getLevelProgress(50000);

    expect(progress.pointsToNext).toBe(0);
  });

  it("should calculate pointsToNext correctly", () => {
    const progress = getLevelProgress(50); // Level 1, need 100 for level 2

    expect(progress.pointsToNext).toBe(50);
  });

  it("should return current and next level info", () => {
    const progress = getLevelProgress(500);

    expect(progress.current).toHaveProperty("level");
    expect(progress.current).toHaveProperty("name");
    expect(progress.next).toHaveProperty("level");
    expect(progress.next).toHaveProperty("name");
  });
});

describe("isStreakActive", () => {
  const mockNow = new Date("2024-06-15T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return true for activity within 36 hours", () => {
    const recentActivity = new Date(mockNow.getTime() - 30 * 60 * 60 * 1000); // 30 hours ago
    expect(isStreakActive(recentActivity.toISOString())).toBe(true);
  });

  it("should return false for activity older than 36 hours", () => {
    const oldActivity = new Date(mockNow.getTime() - 40 * 60 * 60 * 1000); // 40 hours ago
    expect(isStreakActive(oldActivity.toISOString())).toBe(false);
  });

  it("should return true for very recent activity", () => {
    const justNow = new Date(mockNow.getTime() - 1000); // 1 second ago
    expect(isStreakActive(justNow.toISOString())).toBe(true);
  });

  it("should return true at exactly 35 hours", () => {
    const thirtyFiveHours = new Date(mockNow.getTime() - 35 * 60 * 60 * 1000);
    expect(isStreakActive(thirtyFiveHours.toISOString())).toBe(true);
  });

  it("should return false at exactly 37 hours", () => {
    const thirtySevenHours = new Date(mockNow.getTime() - 37 * 60 * 60 * 1000);
    expect(isStreakActive(thirtySevenHours.toISOString())).toBe(false);
  });
});

describe("getStreakBonus", () => {
  it("should return 0 bonus for 0 streak", () => {
    const result = getStreakBonus(0);
    expect(result.bonus).toBe(0);
    expect(result.milestone).toBeNull();
  });

  it("should return 5% per day bonus", () => {
    const result = getStreakBonus(1);
    expect(result.bonus).toBe(5);
  });

  it("should cap base bonus at 50%", () => {
    const result = getStreakBonus(20);
    expect(result.bonus).toBe(50); // No milestone bonus at 20 days
  });

  it("should return milestone at 7 days", () => {
    const result = getStreakBonus(7);

    expect(result.milestone).not.toBeNull();
    expect(result.milestone?.days).toBe(7);
    expect(result.bonus).toBe(35 + 75); // 7*5 + milestone bonus
  });

  it("should return milestone at 30 days", () => {
    const result = getStreakBonus(30);

    expect(result.milestone).not.toBeNull();
    expect(result.milestone?.days).toBe(30);
  });

  it("should return milestone at 365 days", () => {
    const result = getStreakBonus(365);

    expect(result.milestone).not.toBeNull();
    expect(result.milestone?.days).toBe(365);
  });

  it("should not return milestone for non-milestone days", () => {
    const result = getStreakBonus(8);

    expect(result.milestone).toBeNull();
  });
});

describe("getPointAction", () => {
  it("should find action by ID", () => {
    const action = getPointAction("read_article");

    expect(action).toBeDefined();
    expect(action?.id).toBe("read_article");
  });

  it("should return undefined for non-existent ID", () => {
    const action = getPointAction("non_existent_action");

    expect(action).toBeUndefined();
  });

  it("should find daily_visit action", () => {
    const action = getPointAction("daily_visit");

    expect(action).toBeDefined();
    expect(action?.category).toBe("engagement");
  });

  it("should find refer_user action", () => {
    const action = getPointAction("refer_user");

    expect(action).toBeDefined();
    expect(action?.category).toBe("social");
    expect(action?.points).toBe(100);
  });
});

describe("calculatePoints", () => {
  it("should return base points with no streak", () => {
    const points = calculatePoints(100, 0);
    expect(points).toBe(100);
  });

  it("should add 5% per streak day", () => {
    const points = calculatePoints(100, 1);
    expect(points).toBe(105);
  });

  it("should add 10% for 2 day streak", () => {
    const points = calculatePoints(100, 2);
    expect(points).toBe(110);
  });

  it("should cap multiplier at 50%", () => {
    const points = calculatePoints(100, 20);
    expect(points).toBe(150);
  });

  it("should not exceed 50% even with very long streaks", () => {
    const points = calculatePoints(100, 100);
    expect(points).toBe(150);
  });

  it("should round to nearest integer", () => {
    const points = calculatePoints(33, 1);
    // 33 * 1.05 = 34.65, should round to 35
    expect(points).toBe(35);
  });

  it("should handle 0 base points", () => {
    const points = calculatePoints(0, 10);
    expect(points).toBe(0);
  });
});

describe("Type exports", () => {
  it("should export PointAction type with correct shape", () => {
    const action: PointAction = {
      id: "test",
      name: "Test Action",
      description: "A test action",
      points: 10,
      category: "reading",
      daily_limit: 5,
      cooldown_minutes: 30,
    };

    expect(action.id).toBe("test");
    expect(action.points).toBe(10);
  });

  it("should export Level type with correct shape", () => {
    const level: Level = {
      level: 1,
      name: "Test",
      min_points: 0,
      icon: "🔥",
      color: "text-red-500",
      perks: ["Test perk"],
    };

    expect(level.level).toBe(1);
    expect(level.perks).toContain("Test perk");
  });
});

describe("Integration scenarios", () => {
  it("should progress through levels correctly", () => {
    // Simulate user earning points
    let points = 0;

    // Start at level 1
    expect(getLevelFromPoints(points).level).toBe(1);

    // Earn 100 points -> level 2
    points += 100;
    expect(getLevelFromPoints(points).level).toBe(2);

    // Earn 200 more -> level 3
    points += 200;
    expect(getLevelFromPoints(points).level).toBe(3);
  });

  it("should calculate streak bonuses correctly over time", () => {
    // Day 1: 5% bonus
    expect(calculatePoints(100, 1)).toBe(105);

    // Day 7: milestone + 35% base = higher bonus
    const day7Bonus = getStreakBonus(7);
    expect(day7Bonus.milestone).not.toBeNull();

    // Day 30: bigger milestone
    const day30Bonus = getStreakBonus(30);
    expect(day30Bonus.bonus).toBeGreaterThan(day7Bonus.bonus);
  });
});
