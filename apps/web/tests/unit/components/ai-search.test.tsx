/**
 * AISearch Component Tests
 *
 * Tests for the AI-powered search modal:
 * - Button rendering and styling
 * - Modal open/close behavior
 * - Keyboard shortcuts (Cmd/Ctrl+Shift+K)
 * - Search input and debouncing
 * - Results display
 * - Voice search (when supported)
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AISearch } from "@/components/ai-search";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock focus trap hook
vi.mock("@/hooks/use-focus-trap", () => ({
  useFocusTrap: ({ onEscape, onClickOutside }: { onEscape?: () => void; onClickOutside?: () => void }) => ({
    containerRef: { current: null },
    onEscape,
    onClickOutside,
  }),
}));

// Mock announcer hook
const mockAnnounce = vi.fn();
vi.mock("@/hooks/use-aria-live", () => ({
  useAnnouncer: () => ({ announce: mockAnnounce }),
}));

// Mock speech recognition
vi.mock("@/lib/speech-recognition", () => ({
  isSpeechRecognitionSupported: () => false,
  VoiceRecognizer: vi.fn(),
}));

// Mock createPortal to render in same container
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Mock fetch for AI search API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("AISearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Button Rendering", () => {
    it("should render AI Search button", () => {
      render(<AISearch />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should have accessible label", () => {
      render(<AISearch />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", expect.stringContaining("AI Search"));
    });

    it("should have aria-haspopup dialog", () => {
      render(<AISearch />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
    });

    it("should show AI Search text on desktop", () => {
      render(<AISearch />);

      expect(screen.getByText("AI Search")).toBeInTheDocument();
    });

    it("should show keyboard shortcut", () => {
      render(<AISearch />);

      expect(screen.getByText("K")).toBeInTheDocument();
    });

    it("should have gradient background styling", () => {
      render(<AISearch />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("from-violet-500/10");
    });

    it("should have focus ring styling", () => {
      render(<AISearch />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("focus-visible:ring");
    });
  });

  describe("Modal Open/Close", () => {
    it("should not show modal initially", () => {
      render(<AISearch />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should open modal when button clicked", async () => {
      render(<AISearch />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should show AI-Powered badge in modal", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("AI-Powered")).toBeInTheDocument();
      });
    });

    it("should show close button in modal", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByLabelText("Close search")).toBeInTheDocument();
      });
    });

    it("should close modal when close button clicked", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Close search"));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should close modal when backdrop clicked", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Click on the dialog backdrop
      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should open modal on Cmd+Shift+K", async () => {
      render(<AISearch />);

      fireEvent.keyDown(document, { key: "k", metaKey: true, shiftKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should open modal on Ctrl+Shift+K", async () => {
      render(<AISearch />);

      fireEvent.keyDown(document, { key: "k", ctrlKey: true, shiftKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should close modal on Escape", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should not open modal without Shift key", async () => {
      render(<AISearch />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      // Should not open (regular search shortcut)
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Search Input", () => {
    it("should render search input in modal", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Ask anything about Claude Code/)).toBeInTheDocument();
      });
    });

    it("should have type search", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Ask anything about Claude Code/);
        expect(input).toHaveAttribute("type", "search");
      });
    });

    it("should have accessible label", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Ask anything about Claude Code/);
        expect(input).toHaveAttribute("aria-label", "AI Search");
      });
    });
  });

  describe("Initial State", () => {
    it("should show initial help text", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText(/Ask questions in natural language/)).toBeInTheDocument();
      });
    });

    it("should show example questions", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText(/How do I configure MCP servers/)).toBeInTheDocument();
      });
    });

    it("should show navigation hints", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Navigate")).toBeInTheDocument();
        expect(screen.getByText("Select")).toBeInTheDocument();
        expect(screen.getByText("Close")).toBeInTheDocument();
      });
    });
  });

  describe("Footer", () => {
    it("should show powered by Claude AI", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText(/Powered by Claude AI/)).toBeInTheDocument();
      });
    });

    it("should show escape hint in footer", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText(/to close/)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have role dialog on modal", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should have aria-modal true", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
      });
    });

    it("should have aria-labelledby", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby", "ai-search-dialog-title");
      });
    });

    it("should have sr-only title", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("AI-Powered Search")).toBeInTheDocument();
      });
    });
  });

  describe("Styling", () => {
    it("should have backdrop blur on modal", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog.className).toContain("backdrop-blur");
      });
    });

    it("should have rounded modal container", async () => {
      const { container } = render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(container.querySelector(".rounded-xl")).toBeInTheDocument();
      });
    });

    it("should have violet border styling", async () => {
      const { container } = render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(container.querySelector(".border-violet-500\\/30")).toBeInTheDocument();
      });
    });
  });

  describe("Search Behavior", () => {
    it("should not search with less than 3 characters", async () => {
      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      const input = await screen.findByPlaceholderText(/Ask anything about Claude Code/);
      fireEvent.change(input, { target: { value: "ab" } });

      // Wait for debounce - should not call fetch
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle search API error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<AISearch />);

      fireEvent.click(screen.getByRole("button"));

      const input = await screen.findByPlaceholderText(/Ask anything about Claude Code/);
      fireEvent.change(input, { target: { value: "test query here" } });

      // Wait for debounce and error
      await waitFor(() => {
        // Error state should be handled without crashing
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
