/**
 * MCPServerList Component Tests
 *
 * Tests for the MCP server list component:
 * - Empty state
 * - Invalid JSON handling
 * - Server list rendering
 * - Toggle enable/disable
 * - Remove server
 * - Server icons
 * - Environment variable indicator
 * - Add server button
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MCPServerList } from "@/components/mcp-playground/mcp-server-list";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

describe("MCPServerList", () => {
  const defaultProps = {
    config: '{"mcpServers":{}}',
    onConfigChange: vi.fn(),
    onAddServer: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Empty State", () => {
    it("should show empty state when no servers", () => {
      render(<MCPServerList {...defaultProps} />);

      expect(screen.getByText("No servers configured")).toBeInTheDocument();
    });

    it("should show 'Add your first server' link in empty state", () => {
      render(<MCPServerList {...defaultProps} />);

      expect(screen.getByText("Add your first server →")).toBeInTheDocument();
    });

    it("should call onAddServer when 'Add your first server' clicked", () => {
      render(<MCPServerList {...defaultProps} />);

      fireEvent.click(screen.getByText("Add your first server →"));

      expect(defaultProps.onAddServer).toHaveBeenCalled();
    });
  });

  describe("Invalid JSON Handling", () => {
    it("should show error state for invalid JSON", () => {
      render(<MCPServerList {...defaultProps} config="not valid json" />);

      expect(screen.getByText("Fix JSON errors to manage servers")).toBeInTheDocument();
    });

    it("should show error icon for invalid JSON", () => {
      const { container } = render(<MCPServerList {...defaultProps} config="invalid" />);

      const warningIcon = container.querySelector(".text-amber-600");
      expect(warningIcon).toBeInTheDocument();
    });

    it("should show error when mcpServers is not an object", () => {
      render(<MCPServerList {...defaultProps} config='{"mcpServers":"not an object"}' />);

      expect(screen.getByText("Fix JSON errors to manage servers")).toBeInTheDocument();
    });
  });

  describe("Header", () => {
    const configWithServers = JSON.stringify({
      mcpServers: {
        filesystem: { command: "npx", args: [] },
      },
    });

    it("should show Configured Servers heading", () => {
      render(<MCPServerList {...defaultProps} config={configWithServers} />);

      expect(screen.getByText("Configured Servers")).toBeInTheDocument();
    });

    it("should show server count badge", () => {
      render(<MCPServerList {...defaultProps} config={configWithServers} />);

      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("should show Add button in header", () => {
      render(<MCPServerList {...defaultProps} config={configWithServers} />);

      expect(screen.getByText("Add")).toBeInTheDocument();
    });

    it("should call onAddServer when Add button clicked", () => {
      render(<MCPServerList {...defaultProps} config={configWithServers} />);

      fireEvent.click(screen.getByText("Add"));

      expect(defaultProps.onAddServer).toHaveBeenCalled();
    });
  });

  describe("Server List Rendering", () => {
    const multiServerConfig = JSON.stringify({
      mcpServers: {
        filesystem: { command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"] },
        github: { command: "npx", args: ["-y", "@modelcontextprotocol/server-github"] },
        postgres: { command: "npx", args: ["-y", "@modelcontextprotocol/server-postgres"] },
      },
    });

    it("should render all servers", () => {
      render(<MCPServerList {...defaultProps} config={multiServerConfig} />);

      expect(screen.getByText("filesystem")).toBeInTheDocument();
      expect(screen.getByText("github")).toBeInTheDocument();
      expect(screen.getByText("postgres")).toBeInTheDocument();
    });

    it("should show server count of 3", () => {
      render(<MCPServerList {...defaultProps} config={multiServerConfig} />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should show package name for servers", () => {
      render(<MCPServerList {...defaultProps} config={multiServerConfig} />);

      expect(screen.getByText("@modelcontextprotocol/server-filesystem")).toBeInTheDocument();
    });
  });

  describe("Toggle Enable/Disable", () => {
    const configWithServer = JSON.stringify({
      mcpServers: {
        filesystem: { command: "npx", args: [] },
      },
    });

    it("should show toggle switch for each server", () => {
      render(<MCPServerList {...defaultProps} config={configWithServer} />);

      const toggleButton = screen.getByTitle("Disable server");
      expect(toggleButton).toBeInTheDocument();
    });

    it("should call onConfigChange when toggle clicked", () => {
      render(<MCPServerList {...defaultProps} config={configWithServer} />);

      fireEvent.click(screen.getByTitle("Disable server"));

      expect(defaultProps.onConfigChange).toHaveBeenCalled();
    });

    it("should add disabled field when disabling", () => {
      render(<MCPServerList {...defaultProps} config={configWithServer} />);

      fireEvent.click(screen.getByTitle("Disable server"));

      const newConfig = JSON.parse(defaultProps.onConfigChange.mock.calls[0][0]);
      expect(newConfig.mcpServers.filesystem.disabled).toBe(true);
    });

    it("should remove disabled field when enabling", () => {
      const disabledConfig = JSON.stringify({
        mcpServers: {
          filesystem: { command: "npx", args: [], disabled: true },
        },
      });

      render(<MCPServerList {...defaultProps} config={disabledConfig} />);

      fireEvent.click(screen.getByTitle("Enable server"));

      const newConfig = JSON.parse(defaultProps.onConfigChange.mock.calls[0][0]);
      expect(newConfig.mcpServers.filesystem.disabled).toBeUndefined();
    });

    it("should show Disabled badge for disabled server", () => {
      const disabledConfig = JSON.stringify({
        mcpServers: {
          filesystem: { command: "npx", args: [], disabled: true },
        },
      });

      render(<MCPServerList {...defaultProps} config={disabledConfig} />);

      expect(screen.getByText("Disabled")).toBeInTheDocument();
    });

    it("should show strikethrough for disabled server name", () => {
      const disabledConfig = JSON.stringify({
        mcpServers: {
          filesystem: { command: "npx", args: [], disabled: true },
        },
      });

      const { container } = render(<MCPServerList {...defaultProps} config={disabledConfig} />);

      const serverName = container.querySelector(".line-through");
      expect(serverName).toBeInTheDocument();
    });
  });

  describe("Remove Server", () => {
    const configWithServer = JSON.stringify({
      mcpServers: {
        filesystem: { command: "npx", args: [] },
      },
    });

    it("should show remove button for each server", () => {
      render(<MCPServerList {...defaultProps} config={configWithServer} />);

      const removeButton = screen.getByTitle("Remove server");
      expect(removeButton).toBeInTheDocument();
    });

    it("should call onConfigChange when remove clicked", () => {
      render(<MCPServerList {...defaultProps} config={configWithServer} />);

      fireEvent.click(screen.getByTitle("Remove server"));

      expect(defaultProps.onConfigChange).toHaveBeenCalled();
    });

    it("should remove server from config", () => {
      const multiConfig = JSON.stringify({
        mcpServers: {
          filesystem: { command: "npx", args: [] },
          github: { command: "npx", args: [] },
        },
      });

      render(<MCPServerList {...defaultProps} config={multiConfig} />);

      const removeButtons = screen.getAllByTitle("Remove server");
      fireEvent.click(removeButtons[0]);

      const newConfig = JSON.parse(defaultProps.onConfigChange.mock.calls[0][0]);
      expect(newConfig.mcpServers.filesystem).toBeUndefined();
      expect(newConfig.mcpServers.github).toBeDefined();
    });
  });

  describe("Server Icons", () => {
    it("should show filesystem icon for filesystem server", () => {
      const config = JSON.stringify({
        mcpServers: { filesystem: { command: "npx", args: [] } },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.getByText("📁")).toBeInTheDocument();
    });

    it("should show github icon for github server", () => {
      const config = JSON.stringify({
        mcpServers: { github: { command: "npx", args: [] } },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.getByText("🐙")).toBeInTheDocument();
    });

    it("should show postgres icon for postgres server", () => {
      const config = JSON.stringify({
        mcpServers: { postgres: { command: "npx", args: [] } },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.getByText("🐘")).toBeInTheDocument();
    });

    it("should show docker icon for docker server", () => {
      const config = JSON.stringify({
        mcpServers: { docker: { command: "npx", args: [] } },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.getByText("🐳")).toBeInTheDocument();
    });

    it("should show default icon for unknown server", () => {
      const config = JSON.stringify({
        mcpServers: { "custom-server": { command: "node", args: [] } },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.getByText("📦")).toBeInTheDocument();
    });

    it("should match icon by package name", () => {
      const config = JSON.stringify({
        mcpServers: {
          "my-custom-name": {
            command: "npx",
            args: ["-y", "@org/server-slack"],
          },
        },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.getByText("💬")).toBeInTheDocument();
    });
  });

  describe("Environment Variable Indicator", () => {
    it("should show ENV badge when server has env vars", () => {
      const config = JSON.stringify({
        mcpServers: {
          github: {
            command: "npx",
            args: [],
            env: { GITHUB_TOKEN: "token123" },
          },
        },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.getByText("ENV")).toBeInTheDocument();
    });

    it("should not show ENV badge when no env vars", () => {
      const config = JSON.stringify({
        mcpServers: {
          filesystem: { command: "npx", args: [] },
        },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.queryByText("ENV")).not.toBeInTheDocument();
    });

    it("should not show ENV badge for empty env object", () => {
      const config = JSON.stringify({
        mcpServers: {
          filesystem: { command: "npx", args: [], env: {} },
        },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.queryByText("ENV")).not.toBeInTheDocument();
    });
  });

  describe("Browse Templates Link", () => {
    const configWithServer = JSON.stringify({
      mcpServers: { filesystem: { command: "npx", args: [] } },
    });

    it("should show 'Browse templates' link when servers exist", () => {
      render(<MCPServerList {...defaultProps} config={configWithServer} />);

      expect(screen.getByText("Browse templates to add more →")).toBeInTheDocument();
    });

    it("should call onAddServer when link clicked", () => {
      render(<MCPServerList {...defaultProps} config={configWithServer} />);

      fireEvent.click(screen.getByText("Browse templates to add more →"));

      expect(defaultProps.onAddServer).toHaveBeenCalled();
    });

    it("should not show 'Browse templates' link in empty state", () => {
      render(<MCPServerList {...defaultProps} />);

      expect(screen.queryByText("Browse templates to add more →")).not.toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <MCPServerList {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Styling", () => {
    const configWithServer = JSON.stringify({
      mcpServers: { filesystem: { command: "npx", args: [] } },
    });

    it("should have rounded corners", () => {
      const { container } = render(<MCPServerList {...defaultProps} config={configWithServer} />);

      expect(container.firstChild).toHaveClass("rounded-xl");
    });

    it("should have border", () => {
      const { container } = render(<MCPServerList {...defaultProps} config={configWithServer} />);

      expect(container.firstChild).toHaveClass("border");
    });

    it("should have gradient Add button", () => {
      render(<MCPServerList {...defaultProps} config={configWithServer} />);

      const addButton = screen.getByText("Add").closest("button");
      expect(addButton?.className).toContain("from-violet-600");
      expect(addButton?.className).toContain("to-cyan-600");
    });

    it("should have emerald toggle for enabled server", () => {
      const { container } = render(<MCPServerList {...defaultProps} config={configWithServer} />);

      const toggle = container.querySelector(".bg-emerald-500");
      expect(toggle).toBeInTheDocument();
    });

    it("should have gray toggle for disabled server", () => {
      const disabledConfig = JSON.stringify({
        mcpServers: { filesystem: { command: "npx", args: [], disabled: true } },
      });

      const { container } = render(<MCPServerList {...defaultProps} config={disabledConfig} />);

      const toggle = container.querySelector(".bg-gray-300");
      expect(toggle).toBeInTheDocument();
    });
  });

  describe("Command Display", () => {
    it("should show command and args when no package name", () => {
      const config = JSON.stringify({
        mcpServers: {
          "custom-server": {
            command: "node",
            args: ["server.js", "--port", "3000"],
          },
        },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.getByText("node server.js --port 3000")).toBeInTheDocument();
    });

    it("should show package name over command when available", () => {
      const config = JSON.stringify({
        mcpServers: {
          filesystem: {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
          },
        },
      });

      render(<MCPServerList {...defaultProps} config={config} />);

      expect(screen.getByText("@modelcontextprotocol/server-filesystem")).toBeInTheDocument();
    });
  });
});
