/**
 * MCPExportModal Component Tests
 *
 * Tests for the MCP export modal component:
 * - Modal visibility
 * - Export options rendering
 * - Copy JSON functionality
 * - Claude Desktop export
 * - Claude Code export
 * - Download functionality
 * - Success/error states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MCPExportModal } from "@/components/mcp-playground/mcp-export-modal";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock toast hook
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();
Object.assign(URL, {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

describe("MCPExportModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    config: '{"mcpServers":{"test":{}}}',
    serverCount: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Modal Visibility", () => {
    it("should render when isOpen is true", () => {
      render(<MCPExportModal {...defaultProps} />);

      expect(screen.getByText("Export Configuration")).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      render(<MCPExportModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Export Configuration")).not.toBeInTheDocument();
    });

    it("should call onClose when backdrop is clicked", () => {
      render(<MCPExportModal {...defaultProps} />);

      const backdrop = document.querySelector(".bg-black\\/50");
      fireEvent.click(backdrop!);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it("should call onClose when close button is clicked", () => {
      render(<MCPExportModal {...defaultProps} />);

      const closeButton = screen.getByLabelText("Close");
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe("Header", () => {
    it("should show Export Configuration title", () => {
      render(<MCPExportModal {...defaultProps} />);

      expect(screen.getByText("Export Configuration")).toBeInTheDocument();
    });

    it("should show server count singular", () => {
      render(<MCPExportModal {...defaultProps} serverCount={1} />);

      expect(screen.getByText("1 server configured")).toBeInTheDocument();
    });

    it("should show server count plural", () => {
      render(<MCPExportModal {...defaultProps} serverCount={3} />);

      expect(screen.getByText("3 servers configured")).toBeInTheDocument();
    });
  });

  describe("Export Options", () => {
    it("should show Copy JSON option", () => {
      render(<MCPExportModal {...defaultProps} />);

      expect(screen.getByText("Copy JSON")).toBeInTheDocument();
      expect(screen.getByText("Copy the raw configuration to clipboard")).toBeInTheDocument();
    });

    it("should show Claude Desktop option", () => {
      render(<MCPExportModal {...defaultProps} />);

      expect(screen.getByText("Claude Desktop")).toBeInTheDocument();
      expect(screen.getByText("Copy with file path instructions for Claude Desktop")).toBeInTheDocument();
    });

    it("should show Claude Code option", () => {
      render(<MCPExportModal {...defaultProps} />);

      expect(screen.getByText("Claude Code")).toBeInTheDocument();
      expect(screen.getByText("Copy with setup instructions for Claude Code CLI")).toBeInTheDocument();
    });

    it("should show Download File option", () => {
      render(<MCPExportModal {...defaultProps} />);

      expect(screen.getByText("Download File")).toBeInTheDocument();
      expect(screen.getByText("Download as mcp-config.json file")).toBeInTheDocument();
    });
  });

  describe("Copy JSON", () => {
    it("should copy config to clipboard when Copy JSON clicked", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Copy JSON"));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('{"mcpServers":{"test":{}}}');
      });
    });

    it("should show success toast after copy", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Copy JSON"));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("Copied!", "Configuration copied to clipboard");
      });
    });

    it("should show error toast on copy failure", async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error("Clipboard error"));

      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Copy JSON"));

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Failed to copy", "Please try again");
      });
    });
  });

  describe("Claude Desktop Export", () => {
    it("should copy instructions with platform paths", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Claude Desktop"));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
        const copiedContent = mockClipboard.writeText.mock.calls[0][0];
        expect(copiedContent).toContain("# Claude Desktop MCP Configuration");
        expect(copiedContent).toContain("~/Library/Application Support/Claude/claude_desktop_config.json");
        expect(copiedContent).toContain("%APPDATA%\\Claude\\claude_desktop_config.json");
        expect(copiedContent).toContain("~/.config/Claude/claude_desktop_config.json");
      });
    });

    it("should include config in instructions", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Claude Desktop"));

      await waitFor(() => {
        const copiedContent = mockClipboard.writeText.mock.calls[0][0];
        expect(copiedContent).toContain('{"mcpServers":{"test":{}}}');
      });
    });

    it("should show instructions copied toast", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Claude Desktop"));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("Copied!", "Instructions copied to clipboard");
      });
    });
  });

  describe("Claude Code Export", () => {
    it("should copy instructions with bash commands", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Claude Code"));

      await waitFor(() => {
        const copiedContent = mockClipboard.writeText.mock.calls[0][0];
        expect(copiedContent).toContain("# Claude Code MCP Configuration");
        expect(copiedContent).toContain("mkdir -p .claude");
        expect(copiedContent).toContain(".claude/settings.json");
      });
    });

    it("should include config in bash heredoc", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Claude Code"));

      await waitFor(() => {
        const copiedContent = mockClipboard.writeText.mock.calls[0][0];
        expect(copiedContent).toContain("cat > .claude/settings.json << 'EOF'");
        expect(copiedContent).toContain('{"mcpServers":{"test":{}}}');
        expect(copiedContent).toContain("EOF");
      });
    });
  });

  describe("Download Functionality", () => {
    it("should show success toast after download", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Download File"));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("Downloaded!", "mcp-config.json saved");
      });
    });

    it("should call URL.createObjectURL for blob", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Download File"));

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });

    it("should revoke object URL after download", async () => {
      render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Download File"));

      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalled();
      });
    });
  });

  describe("Copied State", () => {
    it("should show check icon after successful copy", async () => {
      const { container } = render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Copy JSON"));

      await waitFor(() => {
        const checkIcon = container.querySelector(".text-emerald-500");
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it("should have emerald background after copy", async () => {
      const { container } = render(<MCPExportModal {...defaultProps} />);

      fireEvent.click(screen.getByText("Copy JSON"));

      await waitFor(() => {
        const iconContainer = container.querySelector(".bg-emerald-500\\/10");
        expect(iconContainer).toBeInTheDocument();
      });
    });
  });

  describe("Preview Section", () => {
    it("should show Configuration Preview label", () => {
      render(<MCPExportModal {...defaultProps} />);

      expect(screen.getByText("Configuration Preview")).toBeInTheDocument();
    });

    it("should show truncated config preview", () => {
      render(<MCPExportModal {...defaultProps} />);

      expect(screen.getByText('{"mcpServers":{"test":{}}}')).toBeInTheDocument();
    });

    it("should add ellipsis for long configs", () => {
      // Create a config that's definitely longer than 300 characters
      const longConfig = JSON.stringify({
        mcpServers: {
          server1: { command: "npx", args: ["arg1", "arg2", "arg3", "arg4", "arg5", "arg6", "arg7", "arg8", "arg9", "arg10"] },
          server2: { command: "node", args: ["script.js", "with", "many", "args", "here", "to", "make", "it", "long"] },
          server3: { command: "python", args: ["-m", "module", "--option", "value", "--another", "option", "--more"] },
          server4: { command: "ruby", args: ["script.rb", "--verbose", "--debug", "--trace", "--profile"] },
          server5: { command: "go", args: ["run", "main.go", "--config", "/path/to/config.json", "--log-level", "debug"] },
        },
      });

      const { container } = render(<MCPExportModal {...defaultProps} config={longConfig} />);

      // The config should be truncated at 300 chars, so we should see "..."
      const preElement = container.querySelector("pre");
      expect(preElement?.textContent).toContain("...");
    });
  });

  describe("Styling", () => {
    it("should have modal with rounded corners", () => {
      render(<MCPExportModal {...defaultProps} />);

      const modal = document.querySelector(".rounded-2xl");
      expect(modal).toBeInTheDocument();
    });

    it("should have backdrop blur", () => {
      render(<MCPExportModal {...defaultProps} />);

      const backdrop = document.querySelector(".backdrop-blur-sm");
      expect(backdrop).toBeInTheDocument();
    });

    it("should have export buttons with hover effect", () => {
      render(<MCPExportModal {...defaultProps} />);

      const buttons = document.querySelectorAll(".hover\\:border-blue-500\\/50");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
