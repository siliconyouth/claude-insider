/**
 * ApiCreditsIndicator Component Tests
 *
 * Tests for the header API credits indicator:
 * - Loading state (skeleton)
 * - No API key state (Site API link)
 * - Invalid key state (warning indicator)
 * - Valid key state (model selector dropdown)
 * - Model selection functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ApiCreditsIndicator } from "@/components/api-credits-indicator";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Use vi.hoisted to define mocks before vi.mock hoisting
const {
  mockIsAuthenticated,
  mockHasOwnKey,
  mockIsValid,
  mockModelName,
  mockModelTier,
  mockAvailableModels,
  mockRecommendedModel,
  mockPreferredModel,
  mockIsLoading,
  mockRefresh,
  mockChangeModel,
} = vi.hoisted(() => ({
  mockIsAuthenticated: { value: true },
  mockHasOwnKey: { value: true },
  mockIsValid: { value: true },
  mockModelName: { value: "Claude Sonnet 4" },
  mockModelTier: { value: "sonnet" as "opus" | "sonnet" | "haiku" | null },
  mockAvailableModels: {
    value: [
      { id: "claude-opus-4", name: "Claude Opus 4", tier: "opus" as const, description: "Most capable", inputPrice: 15, outputPrice: 75 },
      { id: "claude-sonnet-4", name: "Claude Sonnet 4", tier: "sonnet" as const, description: "Balanced", inputPrice: 3, outputPrice: 15 },
      { id: "claude-haiku-3.5", name: "Claude Haiku 3.5", tier: "haiku" as const, description: "Fastest", inputPrice: 0.25, outputPrice: 1.25 },
    ],
  },
  mockRecommendedModel: { value: { id: "claude-sonnet-4", name: "Claude Sonnet 4" } },
  mockPreferredModel: { value: "claude-sonnet-4" },
  mockIsLoading: { value: false },
  mockRefresh: vi.fn(),
  mockChangeModel: vi.fn().mockResolvedValue(true),
}));

// Mock auth provider
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated.value }),
}));

// Mock useApiCredits hook
vi.mock("@/hooks/use-api-credits", () => ({
  useApiCredits: () => ({
    hasOwnKey: mockHasOwnKey.value,
    isValid: mockIsValid.value,
    modelName: mockModelName.value,
    modelTier: mockModelTier.value,
    availableModels: mockAvailableModels.value,
    recommendedModel: mockRecommendedModel.value,
    preferredModel: mockPreferredModel.value,
    isLoading: mockIsLoading.value,
    refresh: mockRefresh,
    changeModel: mockChangeModel,
  }),
}));

describe("ApiCreditsIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocked values to defaults
    mockIsAuthenticated.value = true;
    mockHasOwnKey.value = true;
    mockIsValid.value = true;
    mockModelName.value = "Claude Sonnet 4";
    mockModelTier.value = "sonnet";
    mockIsLoading.value = false;
    mockPreferredModel.value = "claude-sonnet-4";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Unauthenticated State", () => {
    it("should return null when not authenticated", () => {
      mockIsAuthenticated.value = false;
      const { container } = render(<ApiCreditsIndicator />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Loading State", () => {
    it("should show skeleton when loading", () => {
      mockIsLoading.value = true;
      const { container } = render(<ApiCreditsIndicator />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("should show skeleton with proper structure", () => {
      mockIsLoading.value = true;
      const { container } = render(<ApiCreditsIndicator />);

      // Should have indicator dot placeholder
      expect(container.querySelector(".rounded-full")).toBeInTheDocument();
    });
  });

  describe("Site API State (No Own Key)", () => {
    beforeEach(() => {
      mockHasOwnKey.value = false;
    });

    it("should render Site API link", () => {
      render(<ApiCreditsIndicator />);

      expect(screen.getByText("Site API")).toBeInTheDocument();
    });

    it("should link to settings", () => {
      render(<ApiCreditsIndicator />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/settings#ai");
    });

    it("should have title explaining shared API", () => {
      render(<ApiCreditsIndicator />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("title", expect.stringContaining("shared API"));
    });

    it("should show plus icon", () => {
      const { container } = render(<ApiCreditsIndicator />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have gray indicator dot", () => {
      const { container } = render(<ApiCreditsIndicator />);

      const dot = container.querySelector(".bg-gray-400");
      expect(dot).toBeInTheDocument();
    });
  });

  describe("Invalid Key State", () => {
    beforeEach(() => {
      mockIsValid.value = false;
    });

    it("should render Key Invalid link", () => {
      render(<ApiCreditsIndicator />);

      expect(screen.getByText("Key Invalid")).toBeInTheDocument();
    });

    it("should link to settings", () => {
      render(<ApiCreditsIndicator />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/settings#ai");
    });

    it("should have warning styling", () => {
      render(<ApiCreditsIndicator />);

      const link = screen.getByRole("link");
      expect(link.className).toContain("amber");
    });

    it("should have warning icon", () => {
      const { container } = render(<ApiCreditsIndicator />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Valid Key State", () => {
    it("should render model selector button", () => {
      render(<ApiCreditsIndicator />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should display current model name", () => {
      render(<ApiCreditsIndicator />);

      // On desktop, shows full name without "Claude "
      expect(screen.getByText("Sonnet 4")).toBeInTheDocument();
    });

    it("should show tier indicator dot", () => {
      const { container } = render(<ApiCreditsIndicator />);

      // Sonnet tier is blue
      expect(container.querySelector(".bg-blue-500")).toBeInTheDocument();
    });

    it("should show chevron dropdown arrow", () => {
      const { container } = render(<ApiCreditsIndicator />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have gradient background", () => {
      render(<ApiCreditsIndicator />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-gradient-to-r");
    });
  });

  describe("Model Dropdown", () => {
    it("should not show dropdown initially", () => {
      render(<ApiCreditsIndicator />);

      expect(screen.queryByText("Select Model")).not.toBeInTheDocument();
    });

    it("should show dropdown when button is clicked", () => {
      render(<ApiCreditsIndicator />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Select Model")).toBeInTheDocument();
    });

    it("should show all available models", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Claude Opus 4")).toBeInTheDocument();
      expect(screen.getByText("Claude Sonnet 4")).toBeInTheDocument();
      expect(screen.getByText("Claude Haiku 3.5")).toBeInTheDocument();
    });

    it("should show model descriptions", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Most capable")).toBeInTheDocument();
      expect(screen.getByText("Balanced")).toBeInTheDocument();
      expect(screen.getByText("Fastest")).toBeInTheDocument();
    });

    it("should show pricing info", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText(/\$3\/M input/)).toBeInTheDocument();
    });

    it("should show BEST badge on recommended model", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("BEST")).toBeInTheDocument();
    });

    it("should show checkmark on selected model", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      // Find the Sonnet button (selected)
      const sonnetButton = screen.getByText("Claude Sonnet 4").closest("button");
      const checkmark = sonnetButton?.querySelector("svg");
      expect(checkmark).toBeInTheDocument();
    });

    it("should highlight selected model", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      const sonnetButton = screen.getByText("Claude Sonnet 4").closest("button");
      expect(sonnetButton?.className).toContain("bg-blue-50");
    });

    it("should show refresh button", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      const refreshButton = screen.getByTitle("Refresh");
      expect(refreshButton).toBeInTheDocument();
    });

    it("should call refresh when refresh button clicked", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      const refreshButton = screen.getByTitle("Refresh");
      fireEvent.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalled();
    });

    it("should show Manage API Key link", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Manage API Key →")).toBeInTheDocument();
    });

    it("should close dropdown when clicking outside", () => {
      render(
        <div data-testid="outside">
          <ApiCreditsIndicator />
        </div>
      );

      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByText("Select Model")).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId("outside"));
      expect(screen.queryByText("Select Model")).not.toBeInTheDocument();
    });
  });

  describe("Model Selection", () => {
    it("should call changeModel when different model is clicked", async () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      const opusButton = screen.getByText("Claude Opus 4").closest("button");
      fireEvent.click(opusButton!);

      await waitFor(() => {
        expect(mockChangeModel).toHaveBeenCalledWith("claude-opus-4");
      });
    });

    it("should not call changeModel when same model is clicked", () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      const sonnetButton = screen.getByText("Claude Sonnet 4").closest("button");
      fireEvent.click(sonnetButton!);

      expect(mockChangeModel).not.toHaveBeenCalled();
    });

    it("should close dropdown after successful model change", async () => {
      render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      const opusButton = screen.getByText("Claude Opus 4").closest("button");
      fireEvent.click(opusButton!);

      await waitFor(() => {
        expect(screen.queryByText("Select Model")).not.toBeInTheDocument();
      });
    });
  });

  describe("Tooltip", () => {
    it("should show tooltip on hover when dropdown is closed", async () => {
      render(<ApiCreditsIndicator />);

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText("Claude Sonnet 4")).toBeInTheDocument();
      });
    });

    it("should hide tooltip on mouse leave", async () => {
      render(<ApiCreditsIndicator />);

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);

      // Wait a moment for state update
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      // Tooltip should be gone (only model name in button remains)
      const tooltips = screen.queryAllByText("Claude Sonnet 4");
      expect(tooltips.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Tier Colors", () => {
    it("should show violet dot for opus tier", () => {
      mockModelTier.value = "opus";
      mockPreferredModel.value = "claude-opus-4";
      const { container } = render(<ApiCreditsIndicator />);

      expect(container.querySelector(".bg-violet-500")).toBeInTheDocument();
    });

    it("should show blue dot for sonnet tier", () => {
      mockModelTier.value = "sonnet";
      const { container } = render(<ApiCreditsIndicator />);

      expect(container.querySelector(".bg-blue-500")).toBeInTheDocument();
    });

    it("should show emerald dot for haiku tier", () => {
      mockModelTier.value = "haiku";
      mockPreferredModel.value = "claude-haiku-3.5";
      const { container } = render(<ApiCreditsIndicator />);

      expect(container.querySelector(".bg-emerald-500")).toBeInTheDocument();
    });
  });

  describe("Model Name Display", () => {
    it("should show abbreviated name on mobile", () => {
      mockModelName.value = "Claude Opus 4";
      render(<ApiCreditsIndicator />);

      // The sm:hidden span shows abbreviated name
      expect(screen.getByText("Opus")).toBeInTheDocument();
    });

    it("should show full name without Claude prefix on desktop", () => {
      mockModelName.value = "Claude Sonnet 4";
      render(<ApiCreditsIndicator />);

      expect(screen.getByText("Sonnet 4")).toBeInTheDocument();
    });

    it("should show Select Model when no model name", () => {
      mockModelName.value = null as unknown as string;
      render(<ApiCreditsIndicator />);

      expect(screen.getByText("Select Model")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have rounded-lg on button", () => {
      render(<ApiCreditsIndicator />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("rounded-lg");
    });

    it("should have fixed height", () => {
      render(<ApiCreditsIndicator />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-8");
    });

    it("should have transition classes", () => {
      render(<ApiCreditsIndicator />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("transition");
    });
  });

  describe("Dropdown Positioning", () => {
    it("should position dropdown at top-full", () => {
      const { container } = render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector(".top-full");
      expect(dropdown).toBeInTheDocument();
    });

    it("should position dropdown at right-0", () => {
      const { container } = render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector(".right-0");
      expect(dropdown).toBeInTheDocument();
    });

    it("should have z-50 for proper stacking", () => {
      const { container } = render(<ApiCreditsIndicator />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector(".z-50");
      expect(dropdown).toBeInTheDocument();
    });
  });
});
