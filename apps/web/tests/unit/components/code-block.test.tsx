/**
 * CodeBlock Component Tests
 *
 * Tests for the code block component:
 * - Syntax highlighting with highlight.js
 * - Language detection and display
 * - Copy to clipboard functionality
 * - Ask AI integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { CodeBlock } from "@/components/code-block";

// Mock highlight.js
vi.mock("highlight.js/lib/core", () => ({
  default: {
    registerLanguage: vi.fn(),
    highlightElement: vi.fn(),
    getLanguage: vi.fn((lang: string) => {
      const supported = ["javascript", "typescript", "python", "bash", "json"];
      return supported.includes(lang) ? {} : undefined;
    }),
  },
}));

// Mock all language imports
vi.mock("highlight.js/lib/languages/javascript", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/typescript", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/python", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/bash", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/json", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/xml", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/css", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/markdown", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/yaml", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/sql", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/go", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/rust", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/java", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/c", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/cpp", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/csharp", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/php", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/ruby", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/swift", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/kotlin", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/scala", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/dockerfile", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/graphql", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/r", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/perl", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/lua", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/ini", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/diff", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/makefile", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/nginx", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/apache", () => ({ default: vi.fn() }));

// Mock unified-chat
const mockOpenAIAssistant = vi.fn();
vi.mock("@/components/unified-chat", () => ({
  openAIAssistant: (args: unknown) => mockOpenAIAssistant(args),
}));

// Mock ai-context
vi.mock("@/lib/ai-context", () => ({
  getPageContext: vi.fn(() => ({
    title: "Test Page",
    path: "/test",
  })),
}));

describe("CodeBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render code content", () => {
      render(
        <CodeBlock className="language-javascript">
          const x = 1;
        </CodeBlock>
      );

      expect(screen.getByText("const x = 1;")).toBeInTheDocument();
    });

    it("should render within pre and code elements", () => {
      const { container } = render(
        <CodeBlock className="language-javascript">
          console.log('hello');
        </CodeBlock>
      );

      expect(container.querySelector("pre")).toBeInTheDocument();
      expect(container.querySelector("code")).toBeInTheDocument();
    });

    it("should render multi-line code", () => {
      render(
        <CodeBlock className="language-javascript">
          {`function test() {
  return true;
}`}
        </CodeBlock>
      );

      expect(screen.getByText(/function test/)).toBeInTheDocument();
      expect(screen.getByText(/return true/)).toBeInTheDocument();
    });
  });

  describe("Language Detection", () => {
    it("should detect JavaScript language", () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      expect(screen.getByText("JavaScript")).toBeInTheDocument();
    });

    it("should detect TypeScript language", () => {
      render(
        <CodeBlock className="language-typescript">
          code
        </CodeBlock>
      );

      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("should detect Python language", () => {
      render(
        <CodeBlock className="language-python">
          code
        </CodeBlock>
      );

      expect(screen.getByText("Python")).toBeInTheDocument();
    });

    it("should detect Bash language", () => {
      render(
        <CodeBlock className="language-bash">
          code
        </CodeBlock>
      );

      expect(screen.getByText("Bash")).toBeInTheDocument();
    });

    it("should detect JSON language", () => {
      render(
        <CodeBlock className="language-json">
          code
        </CodeBlock>
      );

      expect(screen.getByText("JSON")).toBeInTheDocument();
    });

    it("should show language alias (ts -> TypeScript)", () => {
      render(
        <CodeBlock className="language-ts">
          code
        </CodeBlock>
      );

      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("should show language alias (py -> Python)", () => {
      render(
        <CodeBlock className="language-py">
          code
        </CodeBlock>
      );

      expect(screen.getByText("Python")).toBeInTheDocument();
    });

    it("should fallback to plaintext for unknown languages", () => {
      render(
        <CodeBlock className="language-unknown">
          code
        </CodeBlock>
      );

      expect(screen.getByText("unknown")).toBeInTheDocument();
    });

    it("should use Text display when no language specified", () => {
      render(
        <CodeBlock>
          code
        </CodeBlock>
      );

      // "plaintext" maps to "Text" in languageConfig
      expect(screen.getByText("Text")).toBeInTheDocument();
    });
  });

  describe("Language Badge Colors", () => {
    it("should apply JavaScript color", () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      const badge = screen.getByText("JavaScript");
      expect(badge).toHaveClass("bg-yellow-500");
    });

    it("should apply TypeScript color", () => {
      render(
        <CodeBlock className="language-typescript">
          code
        </CodeBlock>
      );

      const badge = screen.getByText("TypeScript");
      expect(badge).toHaveClass("bg-blue-600");
    });

    it("should apply Python color", () => {
      render(
        <CodeBlock className="language-python">
          code
        </CodeBlock>
      );

      const badge = screen.getByText("Python");
      expect(badge).toHaveClass("bg-emerald-500");
    });

    it("should apply Bash color", () => {
      render(
        <CodeBlock className="language-bash">
          code
        </CodeBlock>
      );

      const badge = screen.getByText("Bash");
      expect(badge).toHaveClass("bg-teal-600");
    });

    it("should apply default color for unknown language", () => {
      render(
        <CodeBlock className="language-foobar">
          code
        </CodeBlock>
      );

      const badge = screen.getByText("foobar");
      expect(badge).toHaveClass("bg-gray-600");
    });
  });

  describe("Copy Functionality", () => {
    it("should show copy button", () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      expect(screen.getByRole("button", { name: /copy code/i })).toBeInTheDocument();
    });

    it("should copy code to clipboard when clicked", async () => {
      render(
        <CodeBlock className="language-javascript">
          const x = 1;
        </CodeBlock>
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const x = 1;");
    });

    it("should show copied state after clicking", async () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
      });

      expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
    });

    it("should reset copied state after timeout", async () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
      });

      expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByRole("button", { name: /copy code/i })).toBeInTheDocument();
    });

    it("should show checkmark icon when copied", async () => {
      const { container } = render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
      });

      // Check icon should have green color
      const checkIcon = container.querySelector(".text-green-400");
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe("Ask AI Functionality", () => {
    it("should show Ask AI button", () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      expect(screen.getByRole("button", { name: /ask ai/i })).toBeInTheDocument();
    });

    it("should call openAIAssistant when clicked", () => {
      render(
        <CodeBlock className="language-javascript">
          const x = 1;
        </CodeBlock>
      );

      fireEvent.click(screen.getByRole("button", { name: /ask ai/i }));

      expect(mockOpenAIAssistant).toHaveBeenCalledWith({
        context: {
          page: { title: "Test Page", path: "/test" },
          content: {
            type: "code",
            code: "const x = 1;",
            language: "JavaScript",
          },
        },
      });
    });

    it("should pass correct language name for aliases", () => {
      render(
        <CodeBlock className="language-ts">
          type X = string;
        </CodeBlock>
      );

      fireEvent.click(screen.getByRole("button", { name: /ask ai/i }));

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

  describe("Syntax Highlighting", () => {
    it("should call highlightElement for supported languages", async () => {
      const hljs = await import("highlight.js/lib/core");

      render(
        <CodeBlock className="language-javascript">
          const x = 1;
        </CodeBlock>
      );

      expect(hljs.default.highlightElement).toHaveBeenCalled();
    });

    it("should not highlight plaintext", async () => {
      const hljs = await import("highlight.js/lib/core");

      render(
        <CodeBlock className="language-plaintext">
          plain text
        </CodeBlock>
      );

      expect(hljs.default.highlightElement).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("should have rounded corners", () => {
      const { container } = render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      const pre = container.querySelector("pre");
      expect(pre).toHaveClass("rounded-lg");
    });

    it("should have dark background", () => {
      const { container } = render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      const pre = container.querySelector("pre");
      expect(pre).toHaveClass("bg-gray-900");
    });

    it("should have horizontal overflow scroll", () => {
      const { container } = render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      const pre = container.querySelector("pre");
      expect(pre).toHaveClass("overflow-x-auto");
    });

    it("should apply className to code element", () => {
      const { container } = render(
        <CodeBlock className="language-typescript custom-class">
          code
        </CodeBlock>
      );

      const code = container.querySelector("code");
      expect(code).toHaveClass("language-typescript");
      expect(code).toHaveClass("custom-class");
    });
  });

  describe("Button Visibility", () => {
    it("should have action buttons in group", () => {
      const { container } = render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      expect(container.querySelector(".group")).toBeInTheDocument();
    });

    it("should have buttons with transition opacity", () => {
      const { container } = render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      const buttonContainer = container.querySelector(".opacity-0");
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass("group-hover:opacity-100");
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label on copy button", () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      expect(screen.getByRole("button", { name: /copy code/i })).toHaveAttribute(
        "aria-label"
      );
    });

    it("should have aria-label on Ask AI button", () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      expect(screen.getByRole("button", { name: /ask ai/i })).toHaveAttribute(
        "aria-label"
      );
    });

    it("should have title attribute on buttons", () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      expect(screen.getByRole("button", { name: /copy code/i })).toHaveAttribute(
        "title"
      );
      expect(screen.getByRole("button", { name: /ask ai/i })).toHaveAttribute(
        "title"
      );
    });

    it("should have focus ring styles on buttons", () => {
      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      const copyButton = screen.getByRole("button", { name: /copy code/i });
      expect(copyButton).toHaveClass("focus:ring-2");
    });
  });

  describe("Various Languages", () => {
    const languages = [
      { class: "language-css", display: "CSS", color: "bg-purple-500" },
      { class: "language-html", display: "HTML", color: "bg-orange-500" },
      { class: "language-sql", display: "SQL", color: "bg-indigo-500" },
      { class: "language-go", display: "Go", color: "bg-cyan-500" },
      { class: "language-rust", display: "Rust", color: "bg-amber-700" },
      { class: "language-java", display: "Java", color: "bg-red-600" },
      { class: "language-ruby", display: "Ruby", color: "bg-red-500" },
      { class: "language-swift", display: "Swift", color: "bg-orange-400" },
      { class: "language-kotlin", display: "Kotlin", color: "bg-violet-600" },
      { class: "language-dockerfile", display: "Dockerfile", color: "bg-sky-400" },
    ];

    languages.forEach(({ class: className, display, color }) => {
      it(`should display ${display} with correct color`, () => {
        render(
          <CodeBlock className={className}>
            code
          </CodeBlock>
        );

        const badge = screen.getByText(display);
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass(color);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle clipboard error gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.reject(new Error("Clipboard error"))),
        },
      });

      render(
        <CodeBlock className="language-javascript">
          code
        </CodeBlock>
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /copy code/i }));
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
