/**
 * UseWithAssistantButton Component Tests
 *
 * Tests for the use with AI assistant button:
 * - Initial rendering
 * - Variant styles (primary, secondary, ghost)
 * - Size variants (sm, md, lg)
 * - Variable detection
 * - Click behavior (with/without variables)
 * - Loading state
 * - Builder modal
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UseWithAssistantButton } from "@/components/prompts/use-with-assistant-button";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock dynamic import for builder
vi.mock("next/dynamic", () => ({
  default: () => {
    const DynamicComponent = ({ onClose }: { onClose: () => void }) => (
      <div data-testid="interactive-builder">
        <button onClick={onClose}>Close Builder</button>
      </div>
    );
    return DynamicComponent;
  },
}));

// Mock openAIAssistant
const mockOpenAIAssistant = vi.fn();
vi.mock("@/components/unified-chat/unified-chat-provider", () => ({
  openAIAssistant: (...args: unknown[]) => mockOpenAIAssistant(...args),
}));

// Mock fetch for tracking
global.fetch = vi.fn().mockResolvedValue({ ok: true });

describe("UseWithAssistantButton", () => {
  const defaultProps = {
    promptId: "prompt-1",
    promptTitle: "Test Prompt",
    promptContent: "You are a helpful assistant.",
  };

  const propsWithVariables = {
    ...defaultProps,
    promptContent: "You are a {{role}}. Help with {{task}}.",
    variables: [
      { name: "role", description: "The role to assume", required: true },
      { name: "task", description: "The task to help with", required: true },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<UseWithAssistantButton {...defaultProps} />)).not.toThrow();
    });

    it("should render a button", () => {
      render(<UseWithAssistantButton {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should show 'Use with AI' text", () => {
      render(<UseWithAssistantButton {...defaultProps} />);
      expect(screen.getByText("Use with AI")).toBeInTheDocument();
    });

    it("should show sparkles icon for primary variant", () => {
      const { container } = render(
        <UseWithAssistantButton {...defaultProps} variant="primary" />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Variant Styles", () => {
    it("should have gradient background for primary variant", () => {
      render(<UseWithAssistantButton {...defaultProps} variant="primary" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("from-violet-600");
      expect(button.className).toContain("via-blue-600");
      expect(button.className).toContain("to-cyan-600");
    });

    it("should have border for secondary variant", () => {
      render(<UseWithAssistantButton {...defaultProps} variant="secondary" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("border");
    });

    it("should have transparent background for ghost variant", () => {
      render(<UseWithAssistantButton {...defaultProps} variant="ghost" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-transparent");
    });

    it("should default to primary variant", () => {
      render(<UseWithAssistantButton {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("from-violet-600");
    });
  });

  describe("Size Variants", () => {
    it("should have sm size styles", () => {
      render(<UseWithAssistantButton {...defaultProps} size="sm" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("px-3");
      expect(button.className).toContain("py-1.5");
    });

    it("should have md size styles (default)", () => {
      render(<UseWithAssistantButton {...defaultProps} size="md" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("px-4");
      expect(button.className).toContain("py-2");
    });

    it("should have lg size styles", () => {
      render(<UseWithAssistantButton {...defaultProps} size="lg" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("px-5");
      expect(button.className).toContain("py-2.5");
    });
  });

  describe("Variable Detection", () => {
    it("should auto-detect variables from content", () => {
      const contentWithVars = "Hello {{name}}, your task is {{task}}";
      render(
        <UseWithAssistantButton
          {...defaultProps}
          promptContent={contentWithVars}
          variables={[]}
        />
      );

      // Click should open builder since variables were detected
      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByTestId("interactive-builder")).toBeInTheDocument();
    });

    it("should use provided variables over auto-detection", () => {
      render(<UseWithAssistantButton {...propsWithVariables} />);

      // Click should open builder
      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByTestId("interactive-builder")).toBeInTheDocument();
    });
  });

  describe("Click Behavior - No Variables", () => {
    it("should call openAIAssistant directly when no variables", async () => {
      render(<UseWithAssistantButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockOpenAIAssistant).toHaveBeenCalled();
      });
    });

    it("should track usage when clicked without variables", async () => {
      render(<UseWithAssistantButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/prompts/prompt-1/use",
          expect.objectContaining({
            method: "POST",
          })
        );
      });
    });

    it("should pass correct context to openAIAssistant", async () => {
      render(
        <UseWithAssistantButton {...defaultProps} category="coding" />
      );

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(mockOpenAIAssistant).toHaveBeenCalledWith(
          expect.objectContaining({
            context: expect.objectContaining({
              page: expect.objectContaining({
                category: "coding",
              }),
            }),
            question: "You are a helpful assistant.",
          })
        );
      });
    });
  });

  describe("Click Behavior - With Variables", () => {
    it("should open builder when variables exist", () => {
      render(<UseWithAssistantButton {...propsWithVariables} />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByTestId("interactive-builder")).toBeInTheDocument();
    });

    it("should not call openAIAssistant directly when variables exist", () => {
      render(<UseWithAssistantButton {...propsWithVariables} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenAIAssistant).not.toHaveBeenCalled();
    });
  });

  describe("Builder Modal", () => {
    it("should show builder when showBuilder is true", () => {
      render(<UseWithAssistantButton {...propsWithVariables} />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByTestId("interactive-builder")).toBeInTheDocument();
    });

    it("should close builder when onClose is called", async () => {
      render(<UseWithAssistantButton {...propsWithVariables} />);

      // Open builder
      fireEvent.click(screen.getByRole("button"));
      expect(screen.getByTestId("interactive-builder")).toBeInTheDocument();

      // Close builder
      fireEvent.click(screen.getByText("Close Builder"));

      await waitFor(() => {
        expect(screen.queryByTestId("interactive-builder")).not.toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should be disabled while tracking", async () => {
      // Make fetch slow
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(<UseWithAssistantButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      // Button should be disabled during tracking
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should show spinner when tracking", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      const { container } = render(<UseWithAssistantButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      // Should show spinner (animate-spin class)
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      render(<UseWithAssistantButton {...defaultProps} className="custom-class" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("custom-class");
    });
  });

  describe("Accessibility", () => {
    it("should have focus-visible ring", () => {
      render(<UseWithAssistantButton {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("focus-visible:ring-2");
    });

    it("should have proper button role", () => {
      render(<UseWithAssistantButton {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle tracking failure silently", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

      render(<UseWithAssistantButton {...defaultProps} />);

      fireEvent.click(screen.getByRole("button"));

      // Should still call openAIAssistant despite tracking failure
      await waitFor(() => {
        expect(mockOpenAIAssistant).toHaveBeenCalled();
      });
    });
  });
});
