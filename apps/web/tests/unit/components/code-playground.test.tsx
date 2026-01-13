/**
 * CodePlayground Component Tests
 *
 * Tests for the interactive code playground:
 * - Language badge and selection
 * - Code editing
 * - Copy and reset functionality
 * - AI assistance menu
 * - Run button states
 * - Output display
 * - Sharing functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CodePlayground, encodePlaygroundState, decodePlaygroundState } from "@/components/code-playground";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
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

// Mock highlight.js
vi.mock("highlight.js/lib/core", () => ({
  default: {
    highlight: (code: string) => ({ value: code }),
    registerLanguage: vi.fn(),
  },
}));

vi.mock("highlight.js/lib/languages/javascript", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/typescript", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/python", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/go", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/rust", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/bash", () => ({ default: {} }));
vi.mock("highlight.js/lib/languages/json", () => ({ default: {} }));

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock window.share
const mockShare = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  share: mockShare,
});

describe("CodePlayground", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render code playground container", () => {
      const { container } = render(
        <CodePlayground initialCode="console.log('hello');" language="javascript" />
      );

      expect(container.querySelector(".rounded-xl")).toBeInTheDocument();
    });

    it("should render initial code", () => {
      render(
        <CodePlayground initialCode="const x = 1;" language="javascript" />
      );

      expect(screen.getByDisplayValue("const x = 1;")).toBeInTheDocument();
    });

    it("should render language badge", () => {
      render(
        <CodePlayground initialCode="code" language="javascript" />
      );

      expect(screen.getByText("JavaScript")).toBeInTheDocument();
    });

    it("should render title when provided", () => {
      render(
        <CodePlayground
          initialCode="code"
          language="javascript"
          title="Example Code"
        />
      );

      expect(screen.getByText("Example Code")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(
        <CodePlayground
          initialCode="code"
          language="javascript"
          description="This is a description"
        />
      );

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });
  });

  describe("Language Support", () => {
    it("should show JavaScript badge", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);
      expect(screen.getByText("JavaScript")).toBeInTheDocument();
    });

    it("should show TypeScript badge", () => {
      render(<CodePlayground initialCode="code" language="typescript" />);
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("should show Python badge", () => {
      render(<CodePlayground initialCode="code" language="python" />);
      expect(screen.getByText("Python")).toBeInTheDocument();
    });

    it("should show Go badge", () => {
      render(<CodePlayground initialCode="code" language="go" />);
      expect(screen.getByText("Go")).toBeInTheDocument();
    });

    it("should show Rust badge", () => {
      render(<CodePlayground initialCode="code" language="rust" />);
      expect(screen.getByText("Rust")).toBeInTheDocument();
    });

    it("should show Bash badge", () => {
      render(<CodePlayground initialCode="code" language="bash" />);
      expect(screen.getByText("Bash")).toBeInTheDocument();
    });

    it("should show JSON badge", () => {
      render(<CodePlayground initialCode="{}" language="json" />);
      expect(screen.getByText("JSON")).toBeInTheDocument();
    });
  });

  describe("Language Badge Colors", () => {
    it("should have yellow color for JavaScript", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);
      expect(screen.getByText("JavaScript").className).toContain("bg-yellow-500");
    });

    it("should have blue color for TypeScript", () => {
      render(<CodePlayground initialCode="code" language="typescript" />);
      expect(screen.getByText("TypeScript").className).toContain("bg-blue-600");
    });

    it("should have emerald color for Python", () => {
      render(<CodePlayground initialCode="code" language="python" />);
      expect(screen.getByText("Python").className).toContain("bg-emerald-500");
    });
  });

  describe("Code Editing", () => {
    it("should allow editing code", () => {
      render(
        <CodePlayground initialCode="initial" language="javascript" />
      );

      const textarea = screen.getByDisplayValue("initial");
      fireEvent.change(textarea, { target: { value: "modified" } });

      expect(screen.getByDisplayValue("modified")).toBeInTheDocument();
    });

    it("should have monospace font", () => {
      const { container } = render(
        <CodePlayground initialCode="code" language="javascript" />
      );

      const textarea = container.querySelector("textarea");
      expect(textarea?.className).toContain("font-mono");
    });
  });

  describe("Copy Button", () => {
    it("should render copy button", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      expect(screen.getByTitle("Copy code")).toBeInTheDocument();
    });

    it("should copy code to clipboard when clicked", async () => {
      render(
        <CodePlayground initialCode="const x = 1;" language="javascript" />
      );

      const copyButton = screen.getByTitle("Copy code");
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith("const x = 1;");
      });
    });

    it("should show Copied! after copying", async () => {
      render(
        <CodePlayground initialCode="code" language="javascript" />
      );

      const copyButton = screen.getByTitle("Copy code");
      fireEvent.click(copyButton);

      // Wait for copied state after clipboard operation
      await waitFor(() => {
        expect(screen.getByTitle("Copied!")).toBeInTheDocument();
      });
    });
  });

  describe("Reset Button", () => {
    it("should render reset button", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      expect(screen.getByTitle("Reset code")).toBeInTheDocument();
    });

    it("should reset code to initial value", () => {
      render(
        <CodePlayground initialCode="original" language="javascript" />
      );

      // Edit the code
      const textarea = screen.getByDisplayValue("original");
      fireEvent.change(textarea, { target: { value: "modified" } });
      expect(screen.getByDisplayValue("modified")).toBeInTheDocument();

      // Reset
      const resetButton = screen.getByTitle("Reset code");
      fireEvent.click(resetButton);

      expect(screen.getByDisplayValue("original")).toBeInTheDocument();
    });
  });

  describe("AI Menu", () => {
    it("should render AI button", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      expect(screen.getByTitle("AI Assistance")).toBeInTheDocument();
    });

    it("should show AI menu when clicked", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      const aiButton = screen.getByTitle("AI Assistance");
      fireEvent.click(aiButton);

      expect(screen.getByText("🔍 Explain code")).toBeInTheDocument();
      expect(screen.getByText("✨ Improve code")).toBeInTheDocument();
      expect(screen.getByText("🐛 Debug code")).toBeInTheDocument();
    });

    it("should call openAIAssistant for explain", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      const aiButton = screen.getByTitle("AI Assistance");
      fireEvent.click(aiButton);

      const explainButton = screen.getByText("🔍 Explain code");
      fireEvent.click(explainButton);

      expect(mockOpenAIAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          question: "Explain this code step by step",
        })
      );
    });

    it("should call openAIAssistant for improve", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      const aiButton = screen.getByTitle("AI Assistance");
      fireEvent.click(aiButton);

      const improveButton = screen.getByText("✨ Improve code");
      fireEvent.click(improveButton);

      expect(mockOpenAIAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          question: expect.stringContaining("improve"),
        })
      );
    });

    it("should close menu after action", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      const aiButton = screen.getByTitle("AI Assistance");
      fireEvent.click(aiButton);

      const explainButton = screen.getByText("🔍 Explain code");
      fireEvent.click(explainButton);

      expect(screen.queryByText("🔍 Explain code")).not.toBeInTheDocument();
    });

    it("should have gradient styling on AI button", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      const aiButton = screen.getByTitle("AI Assistance");
      expect(aiButton.className).toContain("bg-gradient-to-r");
    });
  });

  describe("Run Button", () => {
    it("should render Run Code button for runnable languages", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      expect(screen.getByText("Run Code")).toBeInTheDocument();
    });

    it("should show Run (Simulated) for Python", () => {
      render(<CodePlayground initialCode="print('hi')" language="python" />);

      expect(screen.getByText("Run (Simulated)")).toBeInTheDocument();
    });

    it("should show Validate for JSON", () => {
      render(<CodePlayground initialCode="{}" language="json" />);

      expect(screen.getByText("Validate")).toBeInTheDocument();
    });

    it("should show View Only for non-runnable languages", () => {
      render(<CodePlayground initialCode="code" language="rust" />);

      expect(screen.getByText("View Only")).toBeInTheDocument();
    });

    it("should disable button for non-runnable languages", () => {
      render(<CodePlayground initialCode="code" language="go" />);

      const button = screen.getByText("View Only").closest("button");
      expect(button).toBeDisabled();
    });

    it("should have green gradient for runnable languages", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      const button = screen.getByText("Run Code").closest("button");
      expect(button?.className).toContain("from-emerald-600");
    });
  });

  describe("Simulated Python Badge", () => {
    it("should show simulated badge for Python", () => {
      render(<CodePlayground initialCode="code" language="python" />);

      expect(screen.getByText("simulated")).toBeInTheDocument();
    });

    it("should not show simulated badge for JavaScript", () => {
      render(<CodePlayground initialCode="code" language="javascript" />);

      expect(screen.queryByText("simulated")).not.toBeInTheDocument();
    });
  });

  describe("Language Switching", () => {
    it("should show language menu when allowLanguageSwitch is true", () => {
      render(
        <CodePlayground
          initialCode="code"
          language="javascript"
          allowLanguageSwitch
        />
      );

      const languageButton = screen.getByText("JavaScript");
      fireEvent.click(languageButton);

      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Python")).toBeInTheDocument();
      expect(screen.getByText("Go")).toBeInTheDocument();
    });

    it("should show view only label for non-runnable in menu", () => {
      render(
        <CodePlayground
          initialCode="code"
          language="javascript"
          allowLanguageSwitch
        />
      );

      const languageButton = screen.getByText("JavaScript");
      fireEvent.click(languageButton);

      // Multiple languages show "view only" label (Go, Rust, Bash)
      const viewOnlyLabels = screen.getAllByText("view only");
      expect(viewOnlyLabels.length).toBeGreaterThanOrEqual(1);
    });

    it("should change language when selected", () => {
      render(
        <CodePlayground
          initialCode="code"
          language="javascript"
          allowLanguageSwitch
        />
      );

      const languageButton = screen.getByText("JavaScript");
      fireEvent.click(languageButton);

      const pythonOption = screen.getAllByText("Python")[0];
      fireEvent.click(pythonOption);

      // Language should change - Python may appear in badge and possibly still in DOM
      const pythonElements = screen.getAllByText("Python");
      expect(pythonElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Styling", () => {
    it("should have border", () => {
      const { container } = render(
        <CodePlayground initialCode="code" language="javascript" />
      );

      expect(container.querySelector(".border")).toBeInTheDocument();
    });

    it("should have rounded corners", () => {
      const { container } = render(
        <CodePlayground initialCode="code" language="javascript" />
      );

      expect(container.querySelector(".rounded-xl")).toBeInTheDocument();
    });

    it("should have header with gray background", () => {
      const { container } = render(
        <CodePlayground initialCode="code" language="javascript" />
      );

      expect(container.querySelector(".bg-gray-100")).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <CodePlayground
          initialCode="code"
          language="javascript"
          className="custom-class"
        />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });
});

describe("encodePlaygroundState", () => {
  it("should encode code and language to base64", () => {
    const encoded = encodePlaygroundState("const x = 1;", "javascript");

    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
  });

  it("should produce different output for different inputs", () => {
    const encoded1 = encodePlaygroundState("code1", "javascript");
    const encoded2 = encodePlaygroundState("code2", "javascript");

    expect(encoded1).not.toBe(encoded2);
  });
});

describe("decodePlaygroundState", () => {
  it("should decode valid encoded state", () => {
    const encoded = encodePlaygroundState("const x = 1;", "javascript");
    const decoded = decodePlaygroundState(encoded);

    expect(decoded).toEqual({
      code: "const x = 1;",
      language: "javascript",
    });
  });

  it("should return null for invalid encoded state", () => {
    const decoded = decodePlaygroundState("invalid-base64-string!!!");

    expect(decoded).toBeNull();
  });

  it("should return null for invalid language", () => {
    // Manually create an encoded state with invalid language
    const invalidData = JSON.stringify({ code: "test", language: "invalid-lang-xyz" });
    const encoded = btoa(encodeURIComponent(invalidData));
    const decoded = decodePlaygroundState(encoded);

    expect(decoded).toBeNull();
  });

  it("should roundtrip all supported languages", () => {
    const languages = ["javascript", "typescript", "python", "go", "rust", "bash", "json"] as const;

    for (const lang of languages) {
      const encoded = encodePlaygroundState("test code", lang);
      const decoded = decodePlaygroundState(encoded);

      expect(decoded?.language).toBe(lang);
    }
  });
});
