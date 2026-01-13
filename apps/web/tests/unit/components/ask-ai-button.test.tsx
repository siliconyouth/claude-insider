/**
 * AskAIButton Component Tests
 *
 * Tests for the Ask AI contextual button:
 * - Variant styles (icon, text, pill, inline)
 * - Size variants (sm, md, lg)
 * - Position classes
 * - Click handling
 * - Hover visibility
 * - AskAIWrapper component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AskAIButton, AskAIWrapper } from "@/components/ask-ai/ask-ai-button";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock unified chat
const mockOpenAIAssistant = vi.fn();
vi.mock("@/components/unified-chat", () => ({
  openAIAssistant: (params: unknown) => mockOpenAIAssistant(params),
}));

// Mock ai-context
vi.mock("@/lib/ai-context", () => ({
  extractContextFromElement: vi.fn(() => ({
    page: { title: "Test Page", path: "/test" },
    content: { text: "Extracted content" },
  })),
  getPageContext: vi.fn(() => ({
    title: "Test Page",
    path: "/test",
  })),
}));

describe("AskAIButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<AskAIButton />)).not.toThrow();
    });

    it("should render a button element", () => {
      render(<AskAIButton />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render sparkles icon", () => {
      const { container } = render(<AskAIButton />);

      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should have accessible label", () => {
      render(<AskAIButton />);

      expect(screen.getByLabelText("Ask AI")).toBeInTheDocument();
    });

    it("should have title attribute", () => {
      render(<AskAIButton />);

      expect(screen.getByTitle("Ask AI")).toBeInTheDocument();
    });

    it("should accept custom label", () => {
      render(<AskAIButton label="Ask Claude" />);

      expect(screen.getByLabelText("Ask Claude")).toBeInTheDocument();
    });
  });

  describe("Variant Styles", () => {
    it("should render icon variant by default", () => {
      render(<AskAIButton />);

      const button = screen.getByRole("button");
      // Icon variant has gradient background
      expect(button.className).toContain("from-violet-600");
    });

    it("should not show text label in icon variant", () => {
      render(<AskAIButton variant="icon" />);

      // Should only have icon, no text
      expect(screen.queryByText("Ask AI")).not.toBeInTheDocument();
    });

    it("should show text label in text variant", () => {
      render(<AskAIButton variant="text" />);

      expect(screen.getByText("Ask AI")).toBeInTheDocument();
    });

    it("should have text variant styling", () => {
      render(<AskAIButton variant="text" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("text-blue-600");
    });

    it("should show text label in pill variant", () => {
      render(<AskAIButton variant="pill" />);

      expect(screen.getByText("Ask AI")).toBeInTheDocument();
    });

    it("should have pill variant styling", () => {
      render(<AskAIButton variant="pill" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-blue-100");
      expect(button.className).toContain("border");
    });

    it("should show text label in inline variant", () => {
      render(<AskAIButton variant="inline" />);

      expect(screen.getByText("Ask AI")).toBeInTheDocument();
    });

    it("should have inline variant styling", () => {
      render(<AskAIButton variant="inline" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("text-blue-600");
      expect(button.className).toContain("underline-offset-2");
    });
  });

  describe("Size Variants", () => {
    it("should render small size", () => {
      render(<AskAIButton size="sm" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("w-6");
      expect(button.className).toContain("h-6");
    });

    it("should render small size by default", () => {
      // Default size is "sm"
      render(<AskAIButton />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("w-6");
      expect(button.className).toContain("h-6");
    });

    it("should render medium size", () => {
      render(<AskAIButton size="md" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("w-8");
      expect(button.className).toContain("h-8");
    });

    it("should render large size", () => {
      render(<AskAIButton size="lg" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("w-10");
      expect(button.className).toContain("h-10");
    });

    it("should have small icon for small size", () => {
      const { container } = render(<AskAIButton size="sm" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("h-3.5");
      expect(svg?.getAttribute("class")).toContain("w-3.5");
    });

    it("should have medium icon for medium size", () => {
      const { container } = render(<AskAIButton size="md" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("h-4");
      expect(svg?.getAttribute("class")).toContain("w-4");
    });

    it("should have large icon for large size", () => {
      const { container } = render(<AskAIButton size="lg" />);

      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("h-5");
      expect(svg?.getAttribute("class")).toContain("w-5");
    });

    it("should use padding for text variant instead of fixed size", () => {
      render(<AskAIButton variant="text" size="sm" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("px-2");
      expect(button.className).toContain("py-1");
      expect(button.className).toContain("text-xs");
    });

    it("should use medium padding for text variant", () => {
      render(<AskAIButton variant="text" size="md" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("px-3");
      expect(button.className).toContain("py-1.5");
      expect(button.className).toContain("text-sm");
    });

    it("should use large padding for text variant", () => {
      render(<AskAIButton variant="text" size="lg" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("px-4");
      expect(button.className).toContain("py-2");
      expect(button.className).toContain("text-base");
    });
  });

  describe("Position Classes", () => {
    it("should have top-right position by default", () => {
      render(<AskAIButton />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("absolute");
      expect(button.className).toContain("top-2");
      expect(button.className).toContain("right-2");
    });

    it("should have top-left position", () => {
      render(<AskAIButton position="top-left" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("top-2");
      expect(button.className).toContain("left-2");
    });

    it("should have bottom-right position", () => {
      render(<AskAIButton position="bottom-right" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bottom-2");
      expect(button.className).toContain("right-2");
    });

    it("should have bottom-left position", () => {
      render(<AskAIButton position="bottom-left" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("bottom-2");
      expect(button.className).toContain("left-2");
    });

    it("should not have absolute position for inline", () => {
      render(<AskAIButton position="inline" />);

      const button = screen.getByRole("button");
      // Inline position doesn't add position classes (no absolute)
      expect(button.className).not.toContain("absolute");
      expect(button.className).not.toContain("top-2");
      expect(button.className).not.toContain("right-2");
    });
  });

  describe("Click Handling", () => {
    it("should call openAIAssistant when clicked", () => {
      render(<AskAIButton />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenAIAssistant).toHaveBeenCalled();
    });

    it("should open with pre-filled question when question prop is provided", () => {
      render(<AskAIButton question="What is this?" />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenAIAssistant).toHaveBeenCalledWith({ question: "What is this?" });
    });

    it("should open with context when context prop is provided", () => {
      const context = { text: "Some context" };
      render(<AskAIButton context={context} />);

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenAIAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            content: context,
          }),
        })
      );
    });
  });

  describe("Hover Visibility", () => {
    it("should be visible by default", () => {
      render(<AskAIButton />);

      const button = screen.getByRole("button");
      expect(button.className).not.toContain("opacity-0");
    });

    it("should be hidden initially when showOnHover is true", () => {
      render(<AskAIButton showOnHover={true} />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("opacity-0");
      expect(button.className).toContain("pointer-events-none");
    });

    it("should become visible on mouse enter when showOnHover", () => {
      render(<AskAIButton showOnHover={true} />);

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);

      expect(button.className).toContain("opacity-100");
    });

    it("should become hidden on mouse leave when showOnHover", () => {
      render(<AskAIButton showOnHover={true} />);

      const button = screen.getByRole("button");
      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);

      expect(button.className).toContain("opacity-0");
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      render(<AskAIButton className="custom-class" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("custom-class");
    });
  });

  describe("Styling", () => {
    it("should have rounded-lg", () => {
      render(<AskAIButton />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("rounded-lg");
    });

    it("should have focus ring", () => {
      render(<AskAIButton />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("focus-visible:ring-2");
      expect(button.className).toContain("focus-visible:ring-blue-500");
    });

    it("should have transition", () => {
      render(<AskAIButton />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("transition-all");
    });

    it("should have shadow for icon variant", () => {
      render(<AskAIButton variant="icon" />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("shadow-lg");
    });
  });
});

describe("AskAIWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <AskAIWrapper>
          <div data-testid="child">Child Content</div>
        </AskAIWrapper>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should render AskAIButton", () => {
      render(
        <AskAIWrapper>
          <div>Content</div>
        </AskAIWrapper>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should have relative and group classes", () => {
      const { container } = render(
        <AskAIWrapper>
          <div>Content</div>
        </AskAIWrapper>
      );

      expect(container.querySelector(".relative")).toBeInTheDocument();
      expect(container.querySelector(".group")).toBeInTheDocument();
    });
  });

  describe("Props Forwarding", () => {
    it("should forward context prop to button", () => {
      const context = { text: "Wrapper context" };
      render(
        <AskAIWrapper context={context}>
          <div>Content</div>
        </AskAIWrapper>
      );

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenAIAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            content: context,
          }),
        })
      );
    });

    it("should forward question prop to button", () => {
      render(
        <AskAIWrapper question="Wrapper question?">
          <div>Content</div>
        </AskAIWrapper>
      );

      fireEvent.click(screen.getByRole("button"));

      expect(mockOpenAIAssistant).toHaveBeenCalledWith({ question: "Wrapper question?" });
    });

    it("should forward buttonPosition prop", () => {
      render(
        <AskAIWrapper buttonPosition="bottom-left">
          <div>Content</div>
        </AskAIWrapper>
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("bottom-2");
      expect(button.className).toContain("left-2");
    });

    it("should forward buttonVariant prop", () => {
      render(
        <AskAIWrapper buttonVariant="pill">
          <div>Content</div>
        </AskAIWrapper>
      );

      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-blue-100");
    });
  });

  describe("Hover Behavior", () => {
    it("should show on hover by default", () => {
      render(
        <AskAIWrapper>
          <div>Content</div>
        </AskAIWrapper>
      );

      const button = screen.getByRole("button");
      // Should have group-hover classes
      expect(button.className).toContain("group-hover:opacity-100");
    });

    it("should not use hover when showOnHover is false", () => {
      render(
        <AskAIWrapper showOnHover={false}>
          <div>Content</div>
        </AskAIWrapper>
      );

      const button = screen.getByRole("button");
      expect(button.className).not.toContain("group-hover:opacity-100");
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className to wrapper", () => {
      const { container } = render(
        <AskAIWrapper className="custom-wrapper">
          <div>Content</div>
        </AskAIWrapper>
      );

      expect(container.querySelector(".custom-wrapper")).toBeInTheDocument();
    });
  });
});
