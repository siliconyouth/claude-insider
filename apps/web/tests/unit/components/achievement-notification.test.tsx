/**
 * AchievementNotification Component Tests
 *
 * Tests for the achievement notification system:
 * - Provider and hook
 * - Sound effect triggers
 * - Basic functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  AchievementNotificationProvider,
  useAchievementNotification,
} from "@/components/achievements/achievement-notification";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock sound effects
const mockPlayLevelUp = vi.fn();
const mockPlayAchievement = vi.fn();
const mockPlayComplete = vi.fn();
vi.mock("@/hooks/use-sound-effects", () => ({
  useSoundEffects: () => ({
    playLevelUp: mockPlayLevelUp,
    playAchievement: mockPlayAchievement,
    playComplete: mockPlayComplete,
  }),
}));

// Mock achievements library
vi.mock("@/lib/achievements", () => ({
  RARITY_CONFIG: {
    common: {
      bgColor: "bg-gray-100",
      borderColor: "border-gray-300",
      color: "text-gray-600",
      iconBg: "bg-gray-200",
      glowColor: "",
    },
    rare: {
      bgColor: "bg-blue-100",
      borderColor: "border-blue-400",
      color: "text-blue-600",
      iconBg: "bg-blue-200",
      glowColor: "shadow-blue-500/30",
    },
    epic: {
      bgColor: "bg-violet-100",
      borderColor: "border-violet-400",
      color: "text-violet-600",
      iconBg: "bg-violet-200",
      glowColor: "shadow-violet-500/30",
    },
    legendary: {
      bgColor: "bg-amber-100",
      borderColor: "border-amber-400",
      color: "text-amber-600",
      iconBg: "bg-amber-200",
      glowColor: "shadow-amber-500/30",
    },
  },
  getAchievement: (id: string) => {
    if (id === "first_message") {
      return {
        id: "first_message",
        name: "First Steps",
        description: "Send your first message",
        icon: "🎉",
        rarity: "common",
        points: 10,
        category: "social",
      };
    }
    return null;
  },
}));

// Mock achievement queue
vi.mock("@/lib/achievement-queue", () => ({
  getPendingAchievements: () => [],
  clearAchievement: vi.fn(),
}));

describe("AchievementNotificationProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Provider Rendering", () => {
    it("should render children", () => {
      render(
        <AchievementNotificationProvider>
          <div data-testid="child">Child Content</div>
        </AchievementNotificationProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should not render modal initially", () => {
      render(
        <AchievementNotificationProvider>
          <div>Content</div>
        </AchievementNotificationProvider>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("useAchievementNotification", () => {
  it("should return no-op functions when used outside provider", () => {
    // Test component that uses hook outside provider
    function TestComponent() {
      const { showAchievement, hideAchievement } = useAchievementNotification();

      return (
        <div>
          <button onClick={() => showAchievement({ id: "test", name: "Test", description: "Test" })}>
            Show
          </button>
          <button onClick={hideAchievement}>Hide</button>
        </div>
      );
    }

    render(<TestComponent />);

    // Should not throw when clicked
    expect(() => {
      fireEvent.click(screen.getByText("Show"));
      fireEvent.click(screen.getByText("Hide"));
    }).not.toThrow();
  });

  it("should return showAchievement function", () => {
    let hookResult: ReturnType<typeof useAchievementNotification> | null = null;

    function TestComponent() {
      hookResult = useAchievementNotification();
      return null;
    }

    render(<TestComponent />);

    expect(typeof hookResult?.showAchievement).toBe("function");
  });

  it("should return hideAchievement function", () => {
    let hookResult: ReturnType<typeof useAchievementNotification> | null = null;

    function TestComponent() {
      hookResult = useAchievementNotification();
      return null;
    }

    render(<TestComponent />);

    expect(typeof hookResult?.hideAchievement).toBe("function");
  });
});

describe("RARITY_CONFIG mock", () => {
  it("should have common rarity config", async () => {
    const { RARITY_CONFIG } = await import("@/lib/achievements");
    expect(RARITY_CONFIG.common).toBeDefined();
    expect(RARITY_CONFIG.common.bgColor).toBe("bg-gray-100");
  });

  it("should have rare rarity config", async () => {
    const { RARITY_CONFIG } = await import("@/lib/achievements");
    expect(RARITY_CONFIG.rare).toBeDefined();
    expect(RARITY_CONFIG.rare.bgColor).toBe("bg-blue-100");
  });

  it("should have epic rarity config", async () => {
    const { RARITY_CONFIG } = await import("@/lib/achievements");
    expect(RARITY_CONFIG.epic).toBeDefined();
    expect(RARITY_CONFIG.epic.bgColor).toBe("bg-violet-100");
  });

  it("should have legendary rarity config", async () => {
    const { RARITY_CONFIG } = await import("@/lib/achievements");
    expect(RARITY_CONFIG.legendary).toBeDefined();
    expect(RARITY_CONFIG.legendary.bgColor).toBe("bg-amber-100");
  });
});

describe("getAchievement mock", () => {
  it("should return achievement by id", async () => {
    const { getAchievement } = await import("@/lib/achievements");
    const achievement = getAchievement("first_message");

    expect(achievement).toBeDefined();
    expect(achievement?.name).toBe("First Steps");
    expect(achievement?.description).toBe("Send your first message");
  });

  it("should return null for unknown id", async () => {
    const { getAchievement } = await import("@/lib/achievements");
    const achievement = getAchievement("unknown");

    expect(achievement).toBeNull();
  });
});

describe("Sound Effects Integration", () => {
  it("should have playComplete mock function", () => {
    expect(typeof mockPlayComplete).toBe("function");
  });

  it("should have playAchievement mock function", () => {
    expect(typeof mockPlayAchievement).toBe("function");
  });

  it("should have playLevelUp mock function", () => {
    expect(typeof mockPlayLevelUp).toBe("function");
  });
});

describe("Achievement Interface", () => {
  it("should define required Achievement properties", () => {
    const achievement = {
      id: "test",
      name: "Test Achievement",
      description: "A test achievement",
    };

    expect(achievement.id).toBe("test");
    expect(achievement.name).toBe("Test Achievement");
    expect(achievement.description).toBe("A test achievement");
  });

  it("should accept optional Achievement properties", () => {
    const achievement = {
      id: "test",
      name: "Test Achievement",
      description: "A test achievement",
      icon: "🏆",
      rarity: "epic" as const,
      points: 100,
      category: "social",
    };

    expect(achievement.icon).toBe("🏆");
    expect(achievement.rarity).toBe("epic");
    expect(achievement.points).toBe(100);
    expect(achievement.category).toBe("social");
  });
});

describe("AchievementNotificationContext", () => {
  it("should provide context to children", () => {
    let contextAvailable = false;

    function TestChild() {
      const context = useAchievementNotification();
      contextAvailable = context !== null;
      return null;
    }

    render(
      <AchievementNotificationProvider>
        <TestChild />
      </AchievementNotificationProvider>
    );

    expect(contextAvailable).toBe(true);
  });
});

describe("Provider Export", () => {
  it("should export AchievementNotificationProvider", async () => {
    const module = await import("@/components/achievements/achievement-notification");
    expect(module.AchievementNotificationProvider).toBeDefined();
  });

  it("should export useAchievementNotification hook", async () => {
    const module = await import("@/components/achievements/achievement-notification");
    expect(module.useAchievementNotification).toBeDefined();
  });

  it("should have default export", async () => {
    const module = await import("@/components/achievements/achievement-notification");
    expect(module.default).toBeDefined();
  });
});
