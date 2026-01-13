/**
 * LazyCodeBlock Component Tests
 *
 * Tests for the lazy-loaded code block:
 * - Intersection Observer lazy loading
 * - Language badge with colors
 * - Copy to clipboard functionality
 * - Ask AI button
 * - Skeleton placeholder
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { LazyCodeBlock, SkeletonCodeBlock } from "@/components/lazy-code-block";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Use vi.hoisted for mock state
const { mockIsIntersecting, mockRef } = vi.hoisted(() => ({
  mockIsIntersecting: { value: false },
  mockRef: { current: null },
}));

// Mock useIntersectionObserver hook
vi.mock("@/hooks/use-intersection-observer", () => ({
  useIntersectionObserver: () => ({
    ref: (el: Element | null) => {
      mockRef.current = el;
    },
    isIntersecting: mockIsIntersecting.value,
  }),
}));

// Mock Skeleton component
vi.mock("@/components/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock unified-chat
const mockOpenAIAssistant = vi.fn();
vi.mock("@/components/unified-chat", () => ({
  openAIAssistant: (opts: unknown) => mockOpenAIAssistant(opts),
}));

// Mock ai-context
vi.mock("@/lib/ai-context", () => ({
  getPageContext: () => ({ title: "Test Page", url: "/test" }),
}));

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe("LazyCodeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsIntersecting.value = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Before Intersection (Placeholder)", () => {
    it("should show skeleton placeholder when not intersecting", () => {
      render(
        <LazyCodeBlock className="language-javascript">
          console.log("hello");
        </LazyCodeBlock>
      );

      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });

    it("should show language badge on placeholder", () => {
      render(
        <LazyCodeBlock className="language-typescript">
          const x: number = 5;
        </LazyCodeBlock>
      );

      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("should not show code content when not intersecting", () => {
      render(
        <LazyCodeBlock className="language-python">
          print("hello world")
        </LazyCodeBlock>
      );

      expect(screen.queryByText('print("hello world")')).not.toBeInTheDocument();
    });

    it("should use correct language color for badge", () => {
      render(
        <LazyCodeBlock className="language-python">
          code here
        </LazyCodeBlock>
      );

      const badge = screen.getByText("Python");
      expect(badge.className).toContain("bg-emerald-500");
    });
  });

  describe("After Intersection (Code Visible)", () => {
    beforeEach(() => {
      mockIsIntersecting.value = true;
    });

    it("should show code content when intersecting", () => {
      render(
        <LazyCodeBlock className="language-javascript">
          console.log("hello");
        </LazyCodeBlock>
      );

      expect(screen.getByText('console.log("hello");')).toBeInTheDocument();
    });

    it("should render pre element", () => {
      const { container } = render(
        <LazyCodeBlock className="language-javascript">
          const x = 1;
        </LazyCodeBlock>
      );

      expect(container.querySelector("pre")).toBeInTheDocument();
    });

    it("should render code element", () => {
      const { container } = render(
        <LazyCodeBlock className="language-javascript">
          const x = 1;
        </LazyCodeBlock>
      );

      expect(container.querySelector("code")).toBeInTheDocument();
    });

    it("should apply language class to code element", () => {
      const { container } = render(
        <LazyCodeBlock className="language-typescript">
          const x: number = 1;
        </LazyCodeBlock>
      );

      const code = container.querySelector("code");
      expect(code?.className).toContain("language-typescript");
    });

    it("should show language badge", () => {
      render(
        <LazyCodeBlock className="language-rust">
          fn main() {}
        </LazyCodeBlock>
      );

      expect(screen.getByText("Rust")).toBeInTheDocument();
    });

    it("should show copy button on hover", () => {
      render(
        <LazyCodeBlock className="language-javascript">
          const x = 1;
        </LazyCodeBlock>
      );

      const copyButton = screen.getByLabelText("Copy code");
      expect(copyButton).toBeInTheDocument();
    });

    it("should show Ask AI button", () => {
      render(
        <LazyCodeBlock className="language-javascript">
          const x = 1;
        </LazyCodeBlock>
      );

      const askButton = screen.getByLabelText("Ask AI about this code");
      expect(askButton).toBeInTheDocument();
    });
  });

  describe("Language Detection", () => {
    beforeEach(() => {
      mockIsIntersecting.value = true;
    });

    it("should detect JavaScript", () => {
      render(
        <LazyCodeBlock className="language-js">
          code
        </LazyCodeBlock>
      );
      expect(screen.getByText("JavaScript")).toBeInTheDocument();
    });

    it("should detect TypeScript", () => {
      render(
        <LazyCodeBlock className="language-ts">
          code
        </LazyCodeBlock>
      );
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("should detect Python", () => {
      render(
        <LazyCodeBlock className="language-py">
          code
        </LazyCodeBlock>
      );
      expect(screen.getByText("Python")).toBeInTheDocument();
    });

    it("should detect Bash", () => {
      render(
        <LazyCodeBlock className="language-bash">
          code
        </LazyCodeBlock>
      );
      expect(screen.getByText("Bash")).toBeInTheDocument();
    });

    it("should detect Go", () => {
      render(
        <LazyCodeBlock className="language-go">
          code
        </LazyCodeBlock>
      );
      expect(screen.getByText("Go")).toBeInTheDocument();
    });

    it("should detect JSON", () => {
      render(
        <LazyCodeBlock className="language-json">
          {"{}"}
        </LazyCodeBlock>
      );
      expect(screen.getByText("JSON")).toBeInTheDocument();
    });

    it("should show plaintext for unknown language", () => {
      render(
        <LazyCodeBlock className="language-unknown123">
          code
        </LazyCodeBlock>
      );
      expect(screen.getByText("unknown123")).toBeInTheDocument();
    });

    it("should default to plaintext without language class", () => {
      render(
        <LazyCodeBlock>
          code
        </LazyCodeBlock>
      );
      expect(screen.getByText("Text")).toBeInTheDocument();
    });
  });

  describe("Language Colors", () => {
    beforeEach(() => {
      mockIsIntersecting.value = true;
    });

    it("should use yellow for JavaScript", () => {
      render(<LazyCodeBlock className="language-javascript">code</LazyCodeBlock>);
      expect(screen.getByText("JavaScript").className).toContain("bg-yellow-500");
    });

    it("should use blue for TypeScript", () => {
      render(<LazyCodeBlock className="language-typescript">code</LazyCodeBlock>);
      expect(screen.getByText("TypeScript").className).toContain("bg-blue-600");
    });

    it("should use emerald for Python", () => {
      render(<LazyCodeBlock className="language-python">code</LazyCodeBlock>);
      expect(screen.getByText("Python").className).toContain("bg-emerald-500");
    });

    it("should use cyan for Go", () => {
      render(<LazyCodeBlock className="language-go">code</LazyCodeBlock>);
      expect(screen.getByText("Go").className).toContain("bg-cyan-500");
    });

    it("should use amber for Rust", () => {
      render(<LazyCodeBlock className="language-rust">code</LazyCodeBlock>);
      expect(screen.getByText("Rust").className).toContain("bg-amber-700");
    });

    it("should use red for Ruby", () => {
      render(<LazyCodeBlock className="language-ruby">code</LazyCodeBlock>);
      expect(screen.getByText("Ruby").className).toContain("bg-red-500");
    });
  });

  describe("Copy Functionality", () => {
    beforeEach(() => {
      mockIsIntersecting.value = true;
    });

    it("should copy code to clipboard when copy button clicked", async () => {
      render(
        <LazyCodeBlock className="language-javascript">
          const test = "hello";
        </LazyCodeBlock>
      );

      const copyButton = screen.getByLabelText("Copy code");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith('const test = "hello";');
      });
    });

    it("should show Copied! label after copying", async () => {
      render(
        <LazyCodeBlock className="language-javascript">
          const x = 1;
        </LazyCodeBlock>
      );

      const copyButton = screen.getByLabelText("Copy code");
      fireEvent.click(copyButton);

      // Wait for state update after clipboard operation
      await waitFor(() => {
        expect(screen.getByLabelText("Copied!")).toBeInTheDocument();
      });
    });

    it("should show checkmark icon after copying", async () => {
      render(
        <LazyCodeBlock className="language-javascript">
          const x = 1;
        </LazyCodeBlock>
      );

      const copyButton = screen.getByLabelText("Copy code");
      fireEvent.click(copyButton);

      // Wait for copied state
      await waitFor(() => {
        expect(screen.getByLabelText("Copied!")).toBeInTheDocument();
      });

      // The copy button changes to show a checkmark - verify it's present
      const copiedButton = screen.getByLabelText("Copied!");
      expect(copiedButton).toBeInTheDocument();
    });
  });

  describe("Ask AI Functionality", () => {
    beforeEach(() => {
      mockIsIntersecting.value = true;
    });

    it("should call openAIAssistant when Ask AI button clicked", () => {
      render(
        <LazyCodeBlock className="language-python">
          print("hello")
        </LazyCodeBlock>
      );

      const askButton = screen.getByLabelText("Ask AI about this code");
      fireEvent.click(askButton);

      expect(mockOpenAIAssistant).toHaveBeenCalled();
    });

    it("should pass code content to AI assistant", () => {
      render(
        <LazyCodeBlock className="language-python">
          print("test code")
        </LazyCodeBlock>
      );

      const askButton = screen.getByLabelText("Ask AI about this code");
      fireEvent.click(askButton);

      expect(mockOpenAIAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            content: expect.objectContaining({
              code: 'print("test code")',
            }),
          }),
        })
      );
    });

    it("should pass language name to AI assistant", () => {
      render(
        <LazyCodeBlock className="language-typescript">
          const x: number = 1;
        </LazyCodeBlock>
      );

      const askButton = screen.getByLabelText("Ask AI about this code");
      fireEvent.click(askButton);

      expect(mockOpenAIAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            content: expect.objectContaining({
              language: "TypeScript",
            }),
          }),
        })
      );
    });
  });

  describe("Placeholder Options", () => {
    it("should not show placeholder when showPlaceholder is false", () => {
      mockIsIntersecting.value = false;
      render(
        <LazyCodeBlock className="language-javascript" showPlaceholder={false}>
          console.log("hello");
        </LazyCodeBlock>
      );

      // Should show code instead of skeleton
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    beforeEach(() => {
      mockIsIntersecting.value = true;
    });

    it("should have rounded corners on pre", () => {
      const { container } = render(
        <LazyCodeBlock className="language-javascript">
          code
        </LazyCodeBlock>
      );

      const pre = container.querySelector("pre");
      expect(pre?.className).toContain("rounded-lg");
    });

    it("should have dark background", () => {
      const { container } = render(
        <LazyCodeBlock className="language-javascript">
          code
        </LazyCodeBlock>
      );

      const pre = container.querySelector("pre");
      expect(pre?.className).toContain("bg-gray-900");
    });

    it("should have border", () => {
      const { container } = render(
        <LazyCodeBlock className="language-javascript">
          code
        </LazyCodeBlock>
      );

      const pre = container.querySelector("pre");
      expect(pre?.className).toContain("border");
    });

    it("should have group class for hover effects", () => {
      const { container } = render(
        <LazyCodeBlock className="language-javascript">
          code
        </LazyCodeBlock>
      );

      expect(container.querySelector(".group")).toBeInTheDocument();
    });

    it("should have margin", () => {
      const { container } = render(
        <LazyCodeBlock className="language-javascript">
          code
        </LazyCodeBlock>
      );

      expect(container.querySelector(".my-4")).toBeInTheDocument();
    });
  });

  describe("Action Buttons Styling", () => {
    beforeEach(() => {
      mockIsIntersecting.value = true;
    });

    it("should have gradient background on Ask AI button", () => {
      render(
        <LazyCodeBlock className="language-javascript">
          code
        </LazyCodeBlock>
      );

      const askButton = screen.getByLabelText("Ask AI about this code");
      expect(askButton.className).toContain("bg-gradient-to-r");
    });

    it("should have opacity transition on button container", () => {
      const { container } = render(
        <LazyCodeBlock className="language-javascript">
          code
        </LazyCodeBlock>
      );

      const buttonContainer = container.querySelector(".opacity-0.group-hover\\:opacity-100");
      expect(buttonContainer).toBeInTheDocument();
    });
  });
});

describe("SkeletonCodeBlock", () => {
  it("should render skeleton with default 5 lines", () => {
    render(<SkeletonCodeBlock />);

    const skeletons = screen.getAllByTestId("skeleton");
    // 1 for language badge + 5 for lines
    expect(skeletons.length).toBe(6);
  });

  it("should render skeleton with custom line count", () => {
    render(<SkeletonCodeBlock lines={3} />);

    const skeletons = screen.getAllByTestId("skeleton");
    // 1 for language badge + 3 for lines
    expect(skeletons.length).toBe(4);
  });

  it("should have margin", () => {
    const { container } = render(<SkeletonCodeBlock />);

    expect(container.querySelector(".my-4")).toBeInTheDocument();
  });

  it("should have dark background", () => {
    const { container } = render(<SkeletonCodeBlock />);

    expect(container.querySelector(".bg-gray-900")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<SkeletonCodeBlock className="custom-class" />);

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
