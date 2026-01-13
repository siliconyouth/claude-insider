/**
 * OpenAssistantButton Component Tests
 *
 * Tests for the AI assistant trigger button:
 * - Button rendering with gradient styling
 * - Click handler triggers openAssistant
 * - Icon and text content
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OpenAssistantButton } from "@/components/open-assistant-button";

// Mock openAssistant function
const mockOpenAssistant = vi.fn();

vi.mock("@/components/unified-chat", () => ({
  openAssistant: () => mockOpenAssistant(),
}));

describe("OpenAssistantButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Button Rendering", () => {
    it("should render a button element", () => {
      render(<OpenAssistantButton />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should display 'Try the Assistant' text", () => {
      render(<OpenAssistantButton />);

      expect(screen.getByText("Try the Assistant")).toBeInTheDocument();
    });

    it("should render chat icon SVG", () => {
      const { container } = render(<OpenAssistantButton />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have correct icon dimensions", () => {
      const { container } = render(<OpenAssistantButton />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-5", "h-5");
    });

    it("should render icon with stroke styling", () => {
      const { container } = render(<OpenAssistantButton />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("fill", "none");
      expect(svg).toHaveAttribute("stroke", "currentColor");
    });

    it("should render path element in icon", () => {
      const { container } = render(<OpenAssistantButton />);

      const path = container.querySelector("path");
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute("stroke-linecap", "round");
      expect(path).toHaveAttribute("stroke-linejoin", "round");
    });
  });

  describe("Click Handler", () => {
    it("should call openAssistant when clicked", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOpenAssistant).toHaveBeenCalled();
    });

    it("should call openAssistant once per click", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOpenAssistant).toHaveBeenCalledTimes(1);
    });

    it("should call openAssistant multiple times on multiple clicks", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOpenAssistant).toHaveBeenCalledTimes(3);
    });
  });

  describe("Gradient Styling", () => {
    it("should have gradient background classes", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-gradient-to-r");
      expect(button).toHaveClass("from-violet-600");
      expect(button).toHaveClass("via-blue-600");
      expect(button).toHaveClass("to-cyan-600");
    });

    it("should have hover gradient classes", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:from-violet-500");
      expect(button).toHaveClass("hover:via-blue-500");
      expect(button).toHaveClass("hover:to-cyan-500");
    });

    it("should have shadow styling", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("shadow-lg");
    });
  });

  describe("Layout Styling", () => {
    it("should be inline-flex layout", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("inline-flex");
    });

    it("should align items center", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("items-center");
    });

    it("should have gap between icon and text", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("gap-2");
    });

    it("should be rounded", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("rounded-lg");
    });

    it("should have horizontal padding", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("px-6");
    });

    it("should have vertical padding", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("py-3");
    });
  });

  describe("Text Styling", () => {
    it("should have white text color", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-white");
    });

    it("should have small text size", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-sm");
    });

    it("should have semibold font weight", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("font-semibold");
    });
  });

  describe("Transition", () => {
    it("should have transition-all class", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-all");
    });
  });

  describe("Accessibility", () => {
    it("should be focusable", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button");
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it("should have accessible text content", () => {
      render(<OpenAssistantButton />);

      const button = screen.getByRole("button", { name: /try the assistant/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe("Icon Path", () => {
    it("should have chat bubble path data", () => {
      const { container } = render(<OpenAssistantButton />);

      const path = container.querySelector("path");
      const d = path?.getAttribute("d");

      // Path should contain the chat bubble shape
      expect(d).toContain("M8 12h.01");
      expect(d).toContain("M12 12h.01");
      expect(d).toContain("M16 12h.01");
    });

    it("should have stroke width of 2", () => {
      const { container } = render(<OpenAssistantButton />);

      const path = container.querySelector("path");
      expect(path).toHaveAttribute("stroke-width", "2");
    });
  });
});
