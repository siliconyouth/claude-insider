/**
 * MCPToolbar Component Tests
 *
 * Tests for the MCP toolbar component:
 * - Initial rendering
 * - Template button
 * - Format button
 * - Copy button
 * - Share button
 * - Export button
 * - Reset button
 * - Success states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MCPToolbar } from "@/components/mcp-playground/mcp-toolbar";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock toast hook
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockInfo = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
    info: mockInfo,
  }),
}));

// Mock MCP validator
const mockFormatMCPConfig = vi.fn((config: string) => config);
const mockEncodeConfigForURL = vi.fn(() => "encoded-config");
vi.mock("@/lib/mcp/validator", () => ({
  formatMCPConfig: (config: string) => mockFormatMCPConfig(config),
  encodeConfigForURL: (config: string) => mockEncodeConfigForURL(config),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe("MCPToolbar", () => {
  const defaultConfig = '{"mcpServers":{}}';
  const currentConfig = '{"mcpServers":{"test":{}}}';

  const defaultProps = {
    config: currentConfig,
    onConfigChange: vi.fn(),
    onOpenTemplates: vi.fn(),
    onOpenExport: vi.fn(),
    defaultConfig,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFormatMCPConfig.mockImplementation((config) => config);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<MCPToolbar {...defaultProps} />)).not.toThrow();
    });

    it("should render Templates button", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByText("Templates")).toBeInTheDocument();
    });

    it("should render Format button", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByTitle("Format JSON (Ctrl+Shift+F)")).toBeInTheDocument();
    });

    it("should render Copy button", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByTitle("Copy to clipboard")).toBeInTheDocument();
    });

    it("should render Share button", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByTitle("Copy shareable link")).toBeInTheDocument();
    });

    it("should render Export button", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByTitle("Export configuration for Claude Desktop or Claude Code")).toBeInTheDocument();
    });

    it("should render Reset button", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByTitle("Reset to default configuration")).toBeInTheDocument();
    });
  });

  describe("Templates Button", () => {
    it("should call onOpenTemplates when clicked", () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByText("Templates"));

      expect(defaultProps.onOpenTemplates).toHaveBeenCalled();
    });

    it("should have gradient styling", () => {
      render(<MCPToolbar {...defaultProps} />);
      const button = screen.getByText("Templates").closest("button");
      expect(button?.className).toContain("from-violet-600");
    });
  });

  describe("Format Button", () => {
    it("should call formatMCPConfig when clicked", () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Format JSON (Ctrl+Shift+F)"));

      expect(mockFormatMCPConfig).toHaveBeenCalledWith(currentConfig);
    });

    it("should call onConfigChange when format changes content", () => {
      mockFormatMCPConfig.mockReturnValue('{\n  "mcpServers": {}\n}');

      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Format JSON (Ctrl+Shift+F)"));

      expect(defaultProps.onConfigChange).toHaveBeenCalledWith('{\n  "mcpServers": {}\n}');
    });

    it("should show success toast when formatted", () => {
      mockFormatMCPConfig.mockReturnValue("formatted-config");

      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Format JSON (Ctrl+Shift+F)"));

      expect(mockSuccess).toHaveBeenCalledWith("Formatted", "JSON has been formatted");
    });

    it("should not call onConfigChange if format returns same content", () => {
      mockFormatMCPConfig.mockReturnValue(currentConfig);

      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Format JSON (Ctrl+Shift+F)"));

      expect(defaultProps.onConfigChange).not.toHaveBeenCalled();
    });
  });

  describe("Copy Button", () => {
    it("should copy config to clipboard when clicked", async () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Copy to clipboard"));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(currentConfig);
      });
    });

    it("should show success toast after copy", async () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Copy to clipboard"));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("Copied!", "Configuration copied to clipboard");
      });
    });

    it("should show 'Copied!' text after successful copy", async () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Copy to clipboard"));

      await waitFor(() => {
        expect(screen.getByText("Copied!")).toBeInTheDocument();
      });
    });

    it("should show error toast on clipboard failure", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error("Clipboard error"));

      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Copy to clipboard"));

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Failed to copy", "Please try again or copy manually");
      });
    });
  });

  describe("Share Button", () => {
    it("should encode config and copy share URL", async () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Copy shareable link"));

      await waitFor(() => {
        expect(mockEncodeConfigForURL).toHaveBeenCalledWith(currentConfig);
      });
    });

    it("should copy share URL to clipboard", async () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Copy shareable link"));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining("/mcp-playground?config=encoded-config")
        );
      });
    });

    it("should show success toast after share", async () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Copy shareable link"));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("Link copied!", "Share URL copied to clipboard");
      });
    });

    it("should show error toast on share failure", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error("Clipboard error"));

      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Copy shareable link"));

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Failed to create share link", "Please try again");
      });
    });
  });

  describe("Export Button", () => {
    it("should call onOpenExport when clicked", () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Export configuration for Claude Desktop or Claude Code"));

      expect(defaultProps.onOpenExport).toHaveBeenCalled();
    });
  });

  describe("Reset Button", () => {
    it("should call onConfigChange with defaultConfig when clicked", () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Reset to default configuration"));

      expect(defaultProps.onConfigChange).toHaveBeenCalledWith(defaultConfig);
    });

    it("should show info toast after reset", () => {
      render(<MCPToolbar {...defaultProps} />);

      fireEvent.click(screen.getByTitle("Reset to default configuration"));

      expect(mockInfo).toHaveBeenCalledWith("Reset", "Configuration reset to default");
    });

    it("should not reset if config equals defaultConfig", () => {
      render(<MCPToolbar {...defaultProps} config={defaultConfig} />);

      fireEvent.click(screen.getByTitle("Reset to default configuration"));

      expect(defaultProps.onConfigChange).not.toHaveBeenCalled();
      expect(mockInfo).not.toHaveBeenCalled();
    });
  });

  describe("Button Labels", () => {
    it("should show Format label", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByText("Format")).toBeInTheDocument();
    });

    it("should show Copy label", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByText("Copy")).toBeInTheDocument();
    });

    it("should show Share label", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByText("Share")).toBeInTheDocument();
    });

    it("should show Export label", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByText("Export")).toBeInTheDocument();
    });

    it("should show Reset label", () => {
      render(<MCPToolbar {...defaultProps} />);
      expect(screen.getByText("Reset")).toBeInTheDocument();
    });
  });

  describe("Divider", () => {
    it("should render divider between Templates and other buttons", () => {
      const { container } = render(<MCPToolbar {...defaultProps} />);
      const divider = container.querySelector(".h-6.w-px");
      expect(divider).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(<MCPToolbar {...defaultProps} className="custom-class" />);
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Styling", () => {
    it("should have flex container", () => {
      const { container } = render(<MCPToolbar {...defaultProps} />);
      expect(container.firstChild).toHaveClass("flex", "items-center");
    });

    it("should have gap between buttons", () => {
      const { container } = render(<MCPToolbar {...defaultProps} />);
      expect(container.firstChild).toHaveClass("gap-2");
    });

    it("should have flex-wrap for responsiveness", () => {
      const { container } = render(<MCPToolbar {...defaultProps} />);
      expect(container.firstChild).toHaveClass("flex-wrap");
    });
  });
});
