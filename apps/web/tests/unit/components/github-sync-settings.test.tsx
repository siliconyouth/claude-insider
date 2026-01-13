/**
 * GitHubSyncSettings Component Tests
 *
 * Tests for the GitHub CLAUDE.md sync settings:
 * - Not connected state
 * - Connected state
 * - Repository selector
 * - Sync functionality
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GitHubSyncSettings } from "@/components/settings/github-sync-settings";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock sound hook
vi.mock("@/hooks/use-sound-effects", () => ({
  useSound: () => ({
    playSuccess: vi.fn(),
    playError: vi.fn(),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: (key: string) => mockLocalStorage[key] || null,
    setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
    removeItem: (key: string) => { delete mockLocalStorage[key]; },
    clear: () => { Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]); },
  },
  writable: true,
});

describe("GitHubSyncSettings", () => {
  const mockRepos = [
    {
      id: 1,
      name: "my-project",
      fullName: "user/my-project",
      description: "My awesome project",
      private: false,
      url: "https://github.com/user/my-project",
      defaultBranch: "main",
      lastPush: "2024-01-15T00:00:00Z",
      language: "TypeScript",
    },
    {
      id: 2,
      name: "private-repo",
      fullName: "user/private-repo",
      description: "Secret stuff",
      private: true,
      url: "https://github.com/user/private-repo",
      defaultBranch: "master",
      lastPush: "2024-01-10T00:00:00Z",
      language: "JavaScript",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ repos: mockRepos }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Not Connected State", () => {
    it("should show title when not connected", () => {
      render(<GitHubSyncSettings isGitHubConnected={false} />);
      expect(screen.getByText("GitHub CLAUDE.md Sync")).toBeInTheDocument();
    });

    it("should show description when not connected", () => {
      render(<GitHubSyncSettings isGitHubConnected={false} />);
      expect(screen.getByText(/Sync your CLAUDE.md configuration to your GitHub repositories/)).toBeInTheDocument();
    });

    it("should show Connect GitHub button", () => {
      render(<GitHubSyncSettings isGitHubConnected={false} />);
      expect(screen.getByRole("button", { name: "Connect GitHub" })).toBeInTheDocument();
    });

    it("should show prompt to connect", () => {
      render(<GitHubSyncSettings isGitHubConnected={false} />);
      expect(screen.getByText(/Connect your GitHub account to sync CLAUDE.md/)).toBeInTheDocument();
    });

    it("should call onConnectGitHub when button clicked", () => {
      const onConnectGitHub = vi.fn();
      render(<GitHubSyncSettings isGitHubConnected={false} onConnectGitHub={onConnectGitHub} />);

      fireEvent.click(screen.getByRole("button", { name: "Connect GitHub" }));

      expect(onConnectGitHub).toHaveBeenCalled();
    });

    it("should show GitHub icon", () => {
      const { container } = render(<GitHubSyncSettings isGitHubConnected={false} />);
      const svgIcon = container.querySelector('svg[fill="currentColor"]');
      expect(svgIcon).toBeInTheDocument();
    });
  });

  describe("Connected State", () => {
    it("should show different description when connected", () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);
      expect(screen.getByText(/Sync your personalized CLAUDE.md configuration/)).toBeInTheDocument();
    });

    it("should show Repository label", () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);
      expect(screen.getByText("Repository")).toBeInTheDocument();
    });

    it("should show repo selector placeholder", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        expect(screen.getByText("Select a repository...")).toBeInTheDocument();
      });
    });

    it("should show What is CLAUDE.md info box", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        expect(screen.getByText("What is CLAUDE.md?")).toBeInTheDocument();
      });
    });

    it("should fetch repositories on mount", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/github/repos");
      });
    });
  });

  describe("Repository Selector", () => {
    it("should open dropdown when clicked", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      expect(screen.getByPlaceholderText("Search repositories...")).toBeInTheDocument();
    });

    it("should show repositories in dropdown", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      expect(screen.getByText("my-project")).toBeInTheDocument();
      expect(screen.getByText("private-repo")).toBeInTheDocument();
    });

    it("should show repository language", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });

    it("should show Private indicator for private repos", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      expect(screen.getByText("Private")).toBeInTheDocument();
    });

    it("should filter repos by search query", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      fireEvent.change(screen.getByPlaceholderText("Search repositories..."), {
        target: { value: "private" },
      });

      expect(screen.getByText("private-repo")).toBeInTheDocument();
      expect(screen.queryByText("my-project")).not.toBeInTheDocument();
    });

    it("should show no results message when search has no matches", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      fireEvent.change(screen.getByPlaceholderText("Search repositories..."), {
        target: { value: "nonexistent" },
      });

      expect(screen.getByText("No matching repositories")).toBeInTheDocument();
    });

    it("should select repository when clicked", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      fireEvent.click(screen.getByText("my-project"));

      await waitFor(() => {
        expect(screen.getByText("user/my-project")).toBeInTheDocument();
      });
    });

    it("should show refresh button in dropdown", async () => {
      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      expect(screen.getByText("Refresh repository list")).toBeInTheDocument();
    });
  });

  describe("Sync Status", () => {
    it("should show sync status after selecting repo", async () => {
      // Mock the sync status check
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ repos: mockRepos }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ exists: false }) });

      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      fireEvent.click(screen.getByText("my-project"));

      await waitFor(() => {
        expect(screen.getByText(/CLAUDE.md will be created/)).toBeInTheDocument();
      });
    });

    it("should show update message when CLAUDE.md exists", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ repos: mockRepos }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ exists: true }) });

      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Select a repository..."));
      });

      fireEvent.click(screen.getByText("my-project"));

      await waitFor(() => {
        expect(screen.getByText(/CLAUDE.md exists in this repository/)).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error when repos fetch fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Failed to fetch repositories" }),
      });

      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        expect(screen.getByText("Failed to fetch repositories")).toBeInTheDocument();
      });
    });

    it("should show reconnect message when token expired", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ needsReconnect: true }),
      });

      render(<GitHubSyncSettings isGitHubConnected={true} />);

      await waitFor(() => {
        expect(screen.getByText("GitHub connection expired. Please reconnect your account.")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading skeleton while fetching repos", () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<GitHubSyncSettings isGitHubConnected={true} />);

      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });
  });
});
