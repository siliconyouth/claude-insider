/**
 * SoundToggle Component Tests
 *
 * Tests for the footer sound toggle component:
 * - Sound enable/disable toggle
 * - Theme selection dropdown
 * - Click outside to close
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SoundToggle } from "@/components/sound-toggle";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Use vi.hoisted to define mocks before vi.mock hoisting
const {
  mockSettings,
  mockCurrentTheme,
  mockUpdateSettings,
  mockPlayToggleOn,
  mockPlayToggleOff,
  mockPlaySuccess,
} = vi.hoisted(() => ({
  mockSettings: {
    enabled: true,
    theme: "claude-insider",
  },
  mockCurrentTheme: {
    id: "claude-insider",
    name: "Claude Insider",
    icon: "🎵",
  },
  mockUpdateSettings: vi.fn(),
  mockPlayToggleOn: vi.fn(),
  mockPlayToggleOff: vi.fn(),
  mockPlaySuccess: vi.fn(),
}));

vi.mock("@/hooks/use-sound-effects", () => ({
  useSound: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
    currentTheme: mockCurrentTheme,
    playToggleOn: mockPlayToggleOn,
    playToggleOff: mockPlayToggleOff,
    playSuccess: mockPlaySuccess,
  }),
  THEME_LIST: [
    { id: "claude-insider", name: "Claude Insider", icon: "🎵" },
    { id: "apple", name: "Apple", icon: "🍎" },
    { id: "microsoft", name: "Microsoft", icon: "🪟" },
    { id: "google", name: "Google", icon: "🔍" },
    { id: "linux", name: "Linux", icon: "🐧" },
  ],
}));

describe("SoundToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockSettings.enabled = true;
    mockSettings.theme = "claude-insider";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Button Rendering", () => {
    it("should render toggle button", () => {
      render(<SoundToggle />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should show Sound System when enabled", () => {
      render(<SoundToggle />);

      expect(screen.getByText("Sound System")).toBeInTheDocument();
    });

    it("should show Sounds Muted when disabled", () => {
      mockSettings.enabled = false;
      render(<SoundToggle />);

      expect(screen.getByText("Sounds Muted")).toBeInTheDocument();
    });

    it("should have correct aria-label when enabled", () => {
      render(<SoundToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Sound System, click to open settings");
    });

    it("should have correct aria-label when disabled", () => {
      mockSettings.enabled = false;
      render(<SoundToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Sounds Muted, click to open settings");
    });

    it("should have aria-expanded attribute", () => {
      render(<SoundToggle />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("should render speaker icon", () => {
      const { container } = render(<SoundToggle />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Dropdown Toggle", () => {
    it("should not show dropdown initially", () => {
      render(<SoundToggle />);

      expect(screen.queryByText("Sound Effects")).not.toBeInTheDocument();
    });

    it("should show dropdown when button is clicked", () => {
      render(<SoundToggle />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Sound Effects")).toBeInTheDocument();
    });

    it("should update aria-expanded when open", () => {
      render(<SoundToggle />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("should hide dropdown when button is clicked again", () => {
      render(<SoundToggle />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(screen.getByText("Sound Effects")).toBeInTheDocument();

      fireEvent.click(button);
      expect(screen.queryByText("Sound Effects")).not.toBeInTheDocument();
    });
  });

  describe("Dropdown Content", () => {
    beforeEach(() => {
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));
    });

    it("should show current theme name", () => {
      expect(screen.getByText("Claude Insider")).toBeInTheDocument();
    });

    it("should show current theme icon", () => {
      // Icon appears multiple times: in header span and in theme grid
      expect(screen.getAllByText("🎵").length).toBeGreaterThanOrEqual(1);
    });

    it("should show Sound Effects label", () => {
      expect(screen.getByText("Sound Effects")).toBeInTheDocument();
    });

    it("should show theme switch section when enabled", () => {
      expect(screen.getByText("Quick Theme Switch")).toBeInTheDocument();
    });

    it("should show all theme buttons", () => {
      // All 5 themes should be rendered
      expect(screen.getByTitle("Claude Insider")).toBeInTheDocument();
      expect(screen.getByTitle("Apple")).toBeInTheDocument();
      expect(screen.getByTitle("Microsoft")).toBeInTheDocument();
      expect(screen.getByTitle("Google")).toBeInTheDocument();
      expect(screen.getByTitle("Linux")).toBeInTheDocument();
    });
  });

  describe("Master Toggle", () => {
    it("should render toggle switch", () => {
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      // Find the toggle button (second button in dropdown)
      const toggleButton = screen.getByLabelText("Disable sounds");
      expect(toggleButton).toBeInTheDocument();
    });

    it("should show Enable sounds label when disabled", () => {
      mockSettings.enabled = false;
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      const toggleButton = screen.getByLabelText("Enable sounds");
      expect(toggleButton).toBeInTheDocument();
    });

    it("should call playToggleOff and update settings when disabling", () => {
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      const toggleButton = screen.getByLabelText("Disable sounds");
      fireEvent.click(toggleButton);

      expect(mockPlayToggleOff).toHaveBeenCalled();

      // Fast forward the setTimeout
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ enabled: false });
    });

    it("should call updateSettings and playToggleOn when enabling", () => {
      mockSettings.enabled = false;
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      const toggleButton = screen.getByLabelText("Enable sounds");
      fireEvent.click(toggleButton);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ enabled: true });

      // Fast forward the setTimeout
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockPlayToggleOn).toHaveBeenCalled();
    });
  });

  describe("Theme Selection", () => {
    it("should call updateSettings with new theme on selection", () => {
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      const appleButton = screen.getByTitle("Apple");
      fireEvent.click(appleButton);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ theme: "apple" });
    });

    it("should play success sound on theme selection", () => {
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      const googleButton = screen.getByTitle("Google");
      fireEvent.click(googleButton);

      // Fast forward the setTimeout
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(mockPlaySuccess).toHaveBeenCalled();
    });

    it("should close dropdown after theme selection", () => {
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      const microsoftButton = screen.getByTitle("Microsoft");
      fireEvent.click(microsoftButton);

      expect(screen.queryByText("Quick Theme Switch")).not.toBeInTheDocument();
    });

    it("should highlight current theme", () => {
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      const currentThemeButton = screen.getByTitle("Claude Insider");
      expect(currentThemeButton.className).toContain("border-blue-500");
    });
  });

  describe("Theme Section Visibility", () => {
    it("should hide theme switch when sounds disabled", () => {
      mockSettings.enabled = false;
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.queryByText("Quick Theme Switch")).not.toBeInTheDocument();
    });

    it("should show theme switch when sounds enabled", () => {
      render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByText("Quick Theme Switch")).toBeInTheDocument();
    });
  });

  describe("Click Outside", () => {
    it("should close dropdown when clicking outside", () => {
      render(
        <div data-testid="outside">
          <SoundToggle />
        </div>
      );

      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByText("Sound Effects")).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId("outside"));
      expect(screen.queryByText("Sound Effects")).not.toBeInTheDocument();
    });

    it("should not close when clicking inside dropdown", () => {
      render(<SoundToggle />);

      fireEvent.click(screen.getByRole("button"));
      const dropdown = screen.getByText("Sound Effects").closest("div");
      fireEvent.mouseDown(dropdown!);

      expect(screen.getByText("Sound Effects")).toBeInTheDocument();
    });

    it("should cleanup event listener on close", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      render(<SoundToggle />);

      // Get the main toggle button by its aria-label
      const mainButton = screen.getByLabelText("Sound System, click to open settings");
      fireEvent.click(mainButton);

      // Close dropdown by clicking the main button again
      fireEvent.click(mainButton);

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function)
      );
    });
  });

  describe("Dropdown Styling", () => {
    it("should position dropdown above button", () => {
      const { container } = render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      const dropdown = container.querySelector(".bottom-full");
      expect(dropdown).toBeInTheDocument();
    });

    it("should have z-50 for proper stacking", () => {
      const { container } = render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      expect(container.querySelector(".z-50")).toBeInTheDocument();
    });

    it("should have rounded corners", () => {
      const { container } = render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      expect(container.querySelector(".rounded-xl")).toBeInTheDocument();
    });

    it("should have shadow", () => {
      const { container } = render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      expect(container.querySelector(".shadow-lg")).toBeInTheDocument();
    });
  });

  describe("Theme Grid", () => {
    it("should render 5-column grid for themes", () => {
      const { container } = render(<SoundToggle />);
      fireEvent.click(screen.getByRole("button"));

      expect(container.querySelector(".grid-cols-5")).toBeInTheDocument();
    });
  });
});
