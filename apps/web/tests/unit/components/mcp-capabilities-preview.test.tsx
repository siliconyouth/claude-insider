/**
 * MCPCapabilitiesPreview Component Tests
 *
 * Tests for the MCP capabilities preview component:
 * - Empty state (no servers)
 * - Invalid JSON handling
 * - Known server capabilities
 * - Unknown server capabilities
 * - Summary totals
 * - Server list display
 * - Tools, resources, prompts badges
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MCPCapabilitiesPreview } from "@/components/mcp-playground/mcp-capabilities-preview";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock templates
vi.mock("@/lib/mcp/templates", () => ({
  ALL_TEMPLATES: [
    { id: "filesystem", packageName: "@modelcontextprotocol/server-filesystem" },
    { id: "github", packageName: "@modelcontextprotocol/server-github" },
    { id: "postgres", packageName: "@modelcontextprotocol/server-postgres" },
  ],
}));

describe("MCPCapabilitiesPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Empty State", () => {
    it("should show empty state when no servers configured", () => {
      const config = '{"mcpServers":{}}';
      render(<MCPCapabilitiesPreview config={config} />);

      expect(screen.getByText("Add servers to see their capabilities")).toBeInTheDocument();
    });

    it("should show empty state for empty mcpServers object", () => {
      const config = JSON.stringify({ mcpServers: {} });
      render(<MCPCapabilitiesPreview config={config} />);

      expect(screen.getByText("Add servers to see their capabilities")).toBeInTheDocument();
    });
  });

  describe("Invalid JSON Handling", () => {
    it("should show empty state for invalid JSON", () => {
      const config = "not valid json";
      render(<MCPCapabilitiesPreview config={config} />);

      expect(screen.getByText("Add servers to see their capabilities")).toBeInTheDocument();
    });

    it("should show empty state when mcpServers is missing", () => {
      const config = '{"someOtherField":{}}';
      render(<MCPCapabilitiesPreview config={config} />);

      expect(screen.getByText("Add servers to see their capabilities")).toBeInTheDocument();
    });

    it("should show empty state when mcpServers is not an object", () => {
      const config = '{"mcpServers":"not an object"}';
      render(<MCPCapabilitiesPreview config={config} />);

      expect(screen.getByText("Add servers to see their capabilities")).toBeInTheDocument();
    });
  });

  describe("Known Server Capabilities", () => {
    const filesystemConfig = JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/path"],
        },
      },
    });

    it("should show filesystem server capabilities", () => {
      render(<MCPCapabilitiesPreview config={filesystemConfig} />);

      expect(screen.getByText("filesystem")).toBeInTheDocument();
      expect(screen.getByText("Read, write, and manage files and directories")).toBeInTheDocument();
    });

    it("should show tools for known server", () => {
      render(<MCPCapabilitiesPreview config={filesystemConfig} />);

      expect(screen.getByText("read_file")).toBeInTheDocument();
      expect(screen.getByText("write_file")).toBeInTheDocument();
      expect(screen.getByText("list_directory")).toBeInTheDocument();
    });

    it("should show resources for known server", () => {
      render(<MCPCapabilitiesPreview config={filesystemConfig} />);

      expect(screen.getByText("file://*")).toBeInTheDocument();
    });

    it("should show check icon for known server", () => {
      const { container } = render(<MCPCapabilitiesPreview config={filesystemConfig} />);

      const checkIcon = container.querySelector(".text-emerald-500");
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe("Unknown Server Capabilities", () => {
    const unknownConfig = JSON.stringify({
      mcpServers: {
        "custom-server": {
          command: "node",
          args: ["server.js"],
        },
      },
    });

    it("should show unknown server name", () => {
      render(<MCPCapabilitiesPreview config={unknownConfig} />);

      expect(screen.getByText("custom-server")).toBeInTheDocument();
    });

    it("should show warning icon for unknown server", () => {
      const { container } = render(<MCPCapabilitiesPreview config={unknownConfig} />);

      const warningIcon = container.querySelector(".text-amber-500");
      expect(warningIcon).toBeInTheDocument();
    });

    it("should show capabilities not available message", () => {
      render(<MCPCapabilitiesPreview config={unknownConfig} />);

      expect(screen.getByText("Capabilities not available for this server")).toBeInTheDocument();
    });
  });

  describe("Summary Totals", () => {
    const multiServerConfig = JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
        },
        postgres: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-postgres"],
        },
      },
    });

    it("should show Capabilities Preview heading", () => {
      render(<MCPCapabilitiesPreview config={multiServerConfig} />);

      expect(screen.getByText("Capabilities Preview")).toBeInTheDocument();
    });

    it("should show Tools label", () => {
      render(<MCPCapabilitiesPreview config={multiServerConfig} />);

      expect(screen.getByText("Tools")).toBeInTheDocument();
    });

    it("should show Resources label", () => {
      render(<MCPCapabilitiesPreview config={multiServerConfig} />);

      expect(screen.getByText("Resources")).toBeInTheDocument();
    });

    it("should show Prompts label", () => {
      render(<MCPCapabilitiesPreview config={multiServerConfig} />);

      expect(screen.getByText("Prompts")).toBeInTheDocument();
    });

    it("should calculate total tools across servers", () => {
      render(<MCPCapabilitiesPreview config={multiServerConfig} />);

      // filesystem has 7 tools, postgres has 4 = 11 total
      expect(screen.getByText("11")).toBeInTheDocument();
    });
  });

  describe("Server List Display", () => {
    const multiServerConfig = JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
        },
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
      },
    });

    it("should render all configured servers", () => {
      render(<MCPCapabilitiesPreview config={multiServerConfig} />);

      expect(screen.getByText("filesystem")).toBeInTheDocument();
      expect(screen.getByText("github")).toBeInTheDocument();
    });

    it("should show package name when available", () => {
      render(<MCPCapabilitiesPreview config={multiServerConfig} />);

      expect(screen.getByText("@modelcontextprotocol/server-filesystem")).toBeInTheDocument();
    });
  });

  describe("Tools Display", () => {
    const githubConfig = JSON.stringify({
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
      },
    });

    it("should show tools count", () => {
      render(<MCPCapabilitiesPreview config={githubConfig} />);

      expect(screen.getByText(/Tools \(\d+\)/)).toBeInTheDocument();
    });

    it("should show first 6 tools", () => {
      render(<MCPCapabilitiesPreview config={githubConfig} />);

      expect(screen.getByText("search_repositories")).toBeInTheDocument();
      expect(screen.getByText("get_repository")).toBeInTheDocument();
    });

    it("should show +N more indicator when more than 6 tools", () => {
      render(<MCPCapabilitiesPreview config={githubConfig} />);

      // github has 7 tools, so should show +1 more
      expect(screen.getByText("+1 more")).toBeInTheDocument();
    });
  });

  describe("Resources Display", () => {
    const githubConfig = JSON.stringify({
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
        },
      },
    });

    it("should show resources count", () => {
      render(<MCPCapabilitiesPreview config={githubConfig} />);

      expect(screen.getByText(/Resources \(\d+\)/)).toBeInTheDocument();
    });

    it("should show resource patterns", () => {
      render(<MCPCapabilitiesPreview config={githubConfig} />);

      expect(screen.getByText("github://repo/*")).toBeInTheDocument();
      expect(screen.getByText("github://issue/*")).toBeInTheDocument();
    });
  });

  describe("Prompts Display", () => {
    const thinkingConfig = JSON.stringify({
      mcpServers: {
        "sequential-thinking": {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
        },
      },
    });

    it("should show prompts count for server with prompts", () => {
      render(<MCPCapabilitiesPreview config={thinkingConfig} />);

      expect(screen.getByText(/Prompts \(\d+\)/)).toBeInTheDocument();
    });

    it("should show prompt names", () => {
      render(<MCPCapabilitiesPreview config={thinkingConfig} />);

      expect(screen.getByText("think_step_by_step")).toBeInTheDocument();
      expect(screen.getByText("analyze_problem")).toBeInTheDocument();
    });
  });

  describe("Environment Variables", () => {
    const envConfig = JSON.stringify({
      mcpServers: {
        github: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: {
            GITHUB_TOKEN: "token123",
          },
        },
      },
    });

    it("should handle servers with env variables", () => {
      render(<MCPCapabilitiesPreview config={envConfig} />);

      expect(screen.getByText("github")).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const config = '{"mcpServers":{}}';
      const { container } = render(
        <MCPCapabilitiesPreview config={config} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Styling", () => {
    const config = JSON.stringify({
      mcpServers: {
        filesystem: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem"],
        },
      },
    });

    it("should have rounded corners", () => {
      const { container } = render(<MCPCapabilitiesPreview config={config} />);

      expect(container.firstChild).toHaveClass("rounded-xl");
    });

    it("should have border", () => {
      const { container } = render(<MCPCapabilitiesPreview config={config} />);

      expect(container.firstChild).toHaveClass("border");
    });

    it("should have gradient header", () => {
      const { container } = render(<MCPCapabilitiesPreview config={config} />);

      const header = container.querySelector(".from-violet-500\\/5");
      expect(header).toBeInTheDocument();
    });
  });
});
