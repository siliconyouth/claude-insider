/**
 * MCPValidationPanel Component Tests
 *
 * Tests for the MCP validation panel:
 * - Loading state
 * - Empty state (no result)
 * - Valid configuration display
 * - Invalid configuration with errors
 * - Warnings display
 * - Server count display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MCPValidationPanel } from "@/components/mcp-playground/mcp-validation-panel";
import type { ValidationResult } from "@/lib/mcp/schema";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

describe("MCPValidationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should render loading spinner when isValidating is true", () => {
      const { container } = render(<MCPValidationPanel result={null} isValidating={true} />);
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should show 'Validating...' text when loading", () => {
      render(<MCPValidationPanel result={null} isValidating={true} />);
      expect(screen.getByText("Validating...")).toBeInTheDocument();
    });

    it("should not show other content when loading", () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        serverCount: 1,
      };
      render(<MCPValidationPanel result={result} isValidating={true} />);
      expect(screen.queryByText("Valid Configuration")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render without crashing with null result", () => {
      expect(() => render(<MCPValidationPanel result={null} />)).not.toThrow();
    });

    it("should show instruction text when no result", () => {
      render(<MCPValidationPanel result={null} />);
      expect(screen.getByText("Enter an MCP configuration to validate")).toBeInTheDocument();
    });

    it("should show server icon in empty state", () => {
      const { container } = render(<MCPValidationPanel result={null} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Valid Configuration", () => {
    const validResult: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      serverCount: 3,
    };

    it("should show 'Valid Configuration' text", () => {
      render(<MCPValidationPanel result={validResult} />);
      expect(screen.getByText("Valid Configuration")).toBeInTheDocument();
    });

    it("should show success message when valid with no warnings", () => {
      render(<MCPValidationPanel result={validResult} />);
      expect(screen.getByText("Your MCP configuration is valid and ready to use!")).toBeInTheDocument();
    });

    it("should show copy instruction", () => {
      render(<MCPValidationPanel result={validResult} />);
      expect(screen.getByText("Copy the configuration to your Claude settings file.")).toBeInTheDocument();
    });

    it("should have emerald background for valid header", () => {
      const { container } = render(<MCPValidationPanel result={validResult} />);
      const header = container.querySelector(".bg-emerald-500\\/10");
      expect(header).toBeInTheDocument();
    });

    it("should show check circle icon for valid", () => {
      const { container } = render(<MCPValidationPanel result={validResult} />);
      expect(container.querySelector(".text-emerald-500")).toBeInTheDocument();
    });
  });

  describe("Invalid Configuration", () => {
    const invalidResult: ValidationResult = {
      valid: false,
      errors: [
        { message: "Invalid JSON syntax" },
        { message: "Missing required field", path: "mcpServers.myServer.command" },
        { message: "Type error", line: 5, column: 10 },
      ],
      warnings: [],
      serverCount: 0,
    };

    it("should show error count text", () => {
      render(<MCPValidationPanel result={invalidResult} />);
      expect(screen.getByText("3 Errors Found")).toBeInTheDocument();
    });

    it("should show 'Errors' heading", () => {
      render(<MCPValidationPanel result={invalidResult} />);
      expect(screen.getByText("Errors")).toBeInTheDocument();
    });

    it("should render all error messages", () => {
      render(<MCPValidationPanel result={invalidResult} />);
      expect(screen.getByText("Invalid JSON syntax")).toBeInTheDocument();
      expect(screen.getByText("Missing required field")).toBeInTheDocument();
      expect(screen.getByText("Type error")).toBeInTheDocument();
    });

    it("should show error path when provided", () => {
      render(<MCPValidationPanel result={invalidResult} />);
      expect(screen.getByText("at mcpServers.myServer.command")).toBeInTheDocument();
    });

    it("should show line number when provided", () => {
      render(<MCPValidationPanel result={invalidResult} />);
      expect(screen.getByText(/Line 5/)).toBeInTheDocument();
    });

    it("should show column number when provided", () => {
      render(<MCPValidationPanel result={invalidResult} />);
      expect(screen.getByText(/Column 10/)).toBeInTheDocument();
    });

    it("should have red background for invalid header", () => {
      const { container } = render(<MCPValidationPanel result={invalidResult} />);
      const header = container.querySelector(".bg-red-500\\/10");
      expect(header).toBeInTheDocument();
    });

    it("should not show success message when invalid", () => {
      render(<MCPValidationPanel result={invalidResult} />);
      expect(screen.queryByText("Your MCP configuration is valid and ready to use!")).not.toBeInTheDocument();
    });

    it("should show singular 'Error' when only 1 error", () => {
      const singleError: ValidationResult = {
        valid: false,
        errors: [{ message: "Single error" }],
        warnings: [],
        serverCount: 0,
      };
      render(<MCPValidationPanel result={singleError} />);
      expect(screen.getByText("1 Error Found")).toBeInTheDocument();
    });
  });

  describe("Warnings Display", () => {
    const resultWithWarnings: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [
        { message: "Deprecated field used" },
        { message: "Consider using environment variable", path: "mcpServers.api.args" },
      ],
      serverCount: 1,
    };

    it("should show 'Warnings' heading when warnings exist", () => {
      render(<MCPValidationPanel result={resultWithWarnings} />);
      expect(screen.getByText("Warnings")).toBeInTheDocument();
    });

    it("should render all warning messages", () => {
      render(<MCPValidationPanel result={resultWithWarnings} />);
      expect(screen.getByText("Deprecated field used")).toBeInTheDocument();
      expect(screen.getByText("Consider using environment variable")).toBeInTheDocument();
    });

    it("should show warning path when provided", () => {
      render(<MCPValidationPanel result={resultWithWarnings} />);
      expect(screen.getByText("at mcpServers.api.args")).toBeInTheDocument();
    });

    it("should not show success message when valid with warnings", () => {
      render(<MCPValidationPanel result={resultWithWarnings} />);
      expect(screen.queryByText("Your MCP configuration is valid and ready to use!")).not.toBeInTheDocument();
    });

    it("should have amber styling for warnings", () => {
      const { container } = render(<MCPValidationPanel result={resultWithWarnings} />);
      expect(container.querySelector(".bg-amber-500\\/5")).toBeInTheDocument();
    });
  });

  describe("Mixed Errors and Warnings", () => {
    const mixedResult: ValidationResult = {
      valid: false,
      errors: [{ message: "Critical error" }],
      warnings: [{ message: "Minor warning" }],
      serverCount: 1,
    };

    it("should show both errors and warnings sections", () => {
      render(<MCPValidationPanel result={mixedResult} />);
      expect(screen.getByText("Errors")).toBeInTheDocument();
      expect(screen.getByText("Warnings")).toBeInTheDocument();
    });

    it("should show border between errors and warnings", () => {
      const { container } = render(<MCPValidationPanel result={mixedResult} />);
      // The warnings section has border-t class when errors exist
      const warningsSection = container.querySelector(".border-t.ui-border");
      expect(warningsSection).toBeInTheDocument();
    });
  });

  describe("Server Count", () => {
    it("should show server count (singular)", () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        serverCount: 1,
      };
      render(<MCPValidationPanel result={result} />);
      expect(screen.getByText("1 server defined")).toBeInTheDocument();
    });

    it("should show server count (plural)", () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        serverCount: 5,
      };
      render(<MCPValidationPanel result={result} />);
      expect(screen.getByText("5 servers defined")).toBeInTheDocument();
    });

    it("should show zero servers", () => {
      const result: ValidationResult = {
        valid: false,
        errors: [{ message: "Empty config" }],
        warnings: [],
        serverCount: 0,
      };
      render(<MCPValidationPanel result={result} />);
      expect(screen.getByText("0 servers defined")).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <MCPValidationPanel result={null} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("should apply custom className when loading", () => {
      const { container } = render(
        <MCPValidationPanel result={null} isValidating={true} className="loading-class" />
      );
      expect(container.firstChild).toHaveClass("loading-class");
    });

    it("should apply custom className with result", () => {
      const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
        serverCount: 1,
      };
      const { container } = render(
        <MCPValidationPanel result={result} className="result-class" />
      );
      expect(container.firstChild).toHaveClass("result-class");
    });
  });

  describe("Styling", () => {
    it("should have rounded corners", () => {
      const { container } = render(<MCPValidationPanel result={null} />);
      expect(container.firstChild).toHaveClass("rounded-xl");
    });

    it("should have border", () => {
      const { container } = render(<MCPValidationPanel result={null} />);
      expect((container.firstChild as HTMLElement).className).toContain("border");
    });
  });
});
