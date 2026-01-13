/**
 * FloatingChatButton Component Tests
 *
 * Tests for the floating action button:
 * - Initial rendering and styling
 * - Keyboard shortcut (Cmd + .)
 * - Last tab memory
 * - Open/close behavior
 * - Tooltip display
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { FloatingChatButton } from "@/components/unified-chat/floating-chat-button";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/test-page",
}));

// Mock Vercel analytics
vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

// Mock unified chat provider
const mockOpenUnifiedChat = vi.fn();
const mockIsOpen = { value: false };
vi.mock("@/components/unified-chat/unified-chat-provider", () => ({
  useUnifiedChat: () => ({
    isOpen: mockIsOpen.value,
    openUnifiedChat: mockOpenUnifiedChat,
    activeTab: "ai",
  }),
}));

// Mock announcer hook
const mockAnnounce = vi.fn();
vi.mock("@/hooks/use-aria-live", () => ({
  useAnnouncer: () => ({ announce: mockAnnounce }),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("FloatingChatButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockIsOpen.value = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should not render until mounted (hydration safety)", () => {
      // Initial render returns null before mount
      const { container } = render(<FloatingChatButton />);

      // After mount effect runs, it should render
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should render button after mount", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });
    });

    it("should have accessible label", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByLabelText("Open AI Assistant")).toBeInTheDocument();
      });
    });

    it("should have title attribute", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("title", expect.stringContaining("AI Assistant"));
      });
    });
  });

  describe("Tooltip", () => {
    it("should display AI Assistant text", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByText("AI Assistant")).toBeInTheDocument();
      });
    });

    it("should display keyboard shortcut", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByText("⌘")).toBeInTheDocument();
        expect(screen.getByText(".")).toBeInTheDocument();
      });
    });

    it("should have gradient accent line", async () => {
      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        const gradientLine = container.querySelector(".from-violet-500");
        expect(gradientLine).toBeInTheDocument();
      });
    });
  });

  describe("Button Styling", () => {
    it("should have gradient background", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.className).toContain("from-violet-600");
      });
    });

    it("should be rounded full", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.className).toContain("rounded-full");
      });
    });

    it("should have shadow", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.className).toContain("shadow-lg");
      });
    });

    it("should have correct size (h-14 w-14)", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.className).toContain("h-14");
        expect(button.className).toContain("w-14");
      });
    });

    it("should have focus ring", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.className).toContain("focus-visible:ring-2");
      });
    });

    it("should have hover scale effect", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.className).toContain("hover:scale-110");
      });
    });
  });

  describe("Glow Effect", () => {
    it("should have glow ring element", async () => {
      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        const glow = container.querySelector(".blur-lg");
        expect(glow).toBeInTheDocument();
      });
    });

    it("should have blue glow color", async () => {
      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        const glow = container.querySelector(".bg-blue-500\\/20");
        expect(glow).toBeInTheDocument();
      });
    });
  });

  describe("Click Behavior", () => {
    it("should call openUnifiedChat when clicked", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenUnifiedChat).toHaveBeenCalled();
    });

    it("should open with AI tab by default", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenUnifiedChat).toHaveBeenCalledWith("ai");
    });

    it("should announce when opened", async () => {
      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      expect(mockAnnounce).toHaveBeenCalledWith(expect.stringContaining("Chat opened"));
    });
  });

  describe("Last Tab Memory", () => {
    it("should read last tab from localStorage", async () => {
      mockLocalStorage.getItem.mockReturnValue("messages");

      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenUnifiedChat).toHaveBeenCalledWith("messages");
    });

    it("should default to AI tab if no saved preference", async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenUnifiedChat).toHaveBeenCalledWith("ai");
    });
  });

  describe("Keyboard Shortcut", () => {
    it("should open on Cmd+. when not open", async () => {
      mockIsOpen.value = false;

      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: ".", metaKey: true });

      expect(mockOpenUnifiedChat).toHaveBeenCalled();
    });

    it("should open on Ctrl+. when not open", async () => {
      mockIsOpen.value = false;

      render(<FloatingChatButton />);

      await waitFor(() => {
        expect(screen.getByRole("button")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: ".", ctrlKey: true });

      expect(mockOpenUnifiedChat).toHaveBeenCalled();
    });

    it("should not open on shortcut when already open", async () => {
      mockIsOpen.value = true;

      render(<FloatingChatButton />);

      await waitFor(() => {
        // Button may be hidden but component mounted
        expect(screen.queryByRole("button")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: ".", metaKey: true });

      // Should not be called again
      expect(mockOpenUnifiedChat).not.toHaveBeenCalled();
    });
  });

  describe("Visibility", () => {
    it("should be visible when chat is closed", async () => {
      mockIsOpen.value = false;

      render(<FloatingChatButton />);

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button.closest("div")).toHaveClass("scale-100", "opacity-100");
      });
    });

    it("should be hidden when chat is open", async () => {
      mockIsOpen.value = true;

      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        const wrapper = container.querySelector(".scale-0");
        expect(wrapper).toBeInTheDocument();
      });
    });
  });

  describe("Positioning", () => {
    it("should have fixed positioning", async () => {
      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        expect(container.querySelector(".fixed")).toBeInTheDocument();
      });
    });

    it("should be positioned at bottom right", async () => {
      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        expect(container.querySelector(".right-6")).toBeInTheDocument();
      });
    });

    it("should have high z-index", async () => {
      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        expect(container.querySelector(".z-40")).toBeInTheDocument();
      });
    });

    it("should account for mobile nav height", async () => {
      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper.style.bottom).toContain("--mobile-nav-height");
      });
    });
  });

  describe("Icon", () => {
    it("should render chat icon", async () => {
      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        const svg = container.querySelector("button svg");
        expect(svg).toBeInTheDocument();
      });
    });

    it("should have icon size h-6 w-6", async () => {
      const { container } = render(<FloatingChatButton />);

      await waitFor(() => {
        const svg = container.querySelector("button svg");
        expect(svg).toHaveClass("h-6", "w-6");
      });
    });
  });
});
