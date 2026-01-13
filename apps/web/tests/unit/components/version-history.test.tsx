/**
 * VersionHistory Component Tests
 *
 * Tests for the version history component:
 * - Expandable panel
 * - Version list display
 * - Fetch on expand
 * - Version detail modal
 * - Diff view toggle
 * - Restore functionality
 * - Loading and empty states
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VersionHistory } from "@/components/prompts/version-history";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

describe("VersionHistory", () => {
  const mockVersions = [
    {
      id: "v1",
      versionNumber: 1,
      content: "Original content",
      variables: [{ name: "task", description: "The task to perform" }],
      changeSummary: "Initial version",
      createdAt: "2024-01-01T00:00:00Z",
      createdBy: {
        id: "user-1",
        name: "John Doe",
        image: "https://example.com/avatar.jpg",
      },
    },
    {
      id: "v2",
      versionNumber: 2,
      content: "Updated content with changes",
      variables: [{ name: "task", description: "The task to perform" }],
      changeSummary: "Fixed typo",
      createdAt: "2024-01-02T00:00:00Z",
      createdBy: {
        id: "user-1",
        name: "John Doe",
        image: null,
      },
    },
    {
      id: "v3",
      versionNumber: 3,
      content: "Latest content",
      variables: [],
      changeSummary: null,
      createdAt: "2024-01-03T00:00:00Z",
      createdBy: null,
    },
  ];

  const defaultProps = {
    promptId: "prompt-1",
    promptSlug: "test-prompt",
    currentContent: "Current content for comparison",
    canEdit: true,
    onRestore: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ versions: mockVersions }),
    });
    mockConfirm.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<VersionHistory {...defaultProps} />)).not.toThrow();
    });

    it("should show 'Version History' title", () => {
      render(<VersionHistory {...defaultProps} />);
      expect(screen.getByText("Version History")).toBeInTheDocument();
    });

    it("should be collapsed by default", () => {
      render(<VersionHistory {...defaultProps} />);
      expect(screen.queryByText("Initial version")).not.toBeInTheDocument();
    });

    it("should have expand button", () => {
      render(<VersionHistory {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should have history icon", () => {
      const { container } = render(<VersionHistory {...defaultProps} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Expand/Collapse", () => {
    it("should expand when header clicked", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/prompts/prompt-1/versions");
      });
    });

    it("should show loading spinner while fetching", async () => {
      mockFetch.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ versions: mockVersions }),
        }), 100))
      );

      const { container } = render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(container.querySelector(".animate-spin")).toBeInTheDocument();
      });
    });

    it("should show versions after fetch", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("Initial version")).toBeInTheDocument();
        expect(screen.getByText("Fixed typo")).toBeInTheDocument();
      });
    });

    it("should rotate chevron when expanded", () => {
      const { container } = render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      const chevron = container.querySelector(".rotate-90");
      expect(chevron).toBeInTheDocument();
    });

    it("should collapse when clicked again", async () => {
      render(<VersionHistory {...defaultProps} />);

      // Expand
      fireEvent.click(screen.getByText("Version History"));
      await waitFor(() => {
        expect(screen.getByText("Initial version")).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(screen.getByText("Version History"));
      expect(screen.queryByText("Initial version")).not.toBeInTheDocument();
    });
  });

  describe("Version List", () => {
    it("should show version count badge", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("3 versions")).toBeInTheDocument();
      });
    });

    it("should show version numbers", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
        expect(screen.getByText("v2")).toBeInTheDocument();
        expect(screen.getByText("v3")).toBeInTheDocument();
      });
    });

    it("should show author name when available", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
      });
    });

    it("should show 'System' when no author", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("System")).toBeInTheDocument();
      });
    });

    it("should show author image when available", async () => {
      const { container } = render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      // Wait for versions to load first
      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      // Now find the author image
      const imgs = container.querySelectorAll('img[alt=""]');
      const authorImg = Array.from(imgs).find(img => img.getAttribute("src") === "https://example.com/avatar.jpg");
      expect(authorImg).toBeInTheDocument();
    });

    it("should show date for each version", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("1/1/2024")).toBeInTheDocument();
      });
    });

    it("should show change summary as title", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("Initial version")).toBeInTheDocument();
        expect(screen.getByText("Fixed typo")).toBeInTheDocument();
      });
    });

    it("should show default title when no change summary", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("Version 3")).toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty message when no versions", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ versions: [] }),
      });

      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText(/No version history yet/)).toBeInTheDocument();
      });
    });
  });

  describe("Version Detail Modal", () => {
    it("should open modal when view button clicked", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle("View version");
      fireEvent.click(viewButtons[0]);

      expect(screen.getByText("Original content")).toBeInTheDocument();
    });

    it("should show version content in modal", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle("View version");
      fireEvent.click(viewButtons[0]);

      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByText("Original content")).toBeInTheDocument();
    });

    it("should close modal when X button clicked", async () => {
      const { container } = render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle("View version");
      fireEvent.click(viewButtons[0]);

      expect(screen.getByText("Original content")).toBeInTheDocument();

      // Find the X close button in the modal header (has XIcon svg)
      const modal = container.querySelector(".fixed.inset-0");
      const xButton = modal?.querySelector("button:has(svg.lucide-x)") as HTMLElement;
      fireEvent.click(xButton);

      await waitFor(() => {
        // Modal should be closed - check for Content label that only appears in modal
        expect(screen.queryByText("Content")).not.toBeInTheDocument();
      });
    });

    it("should close modal when Close button clicked", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle("View version");
      fireEvent.click(viewButtons[0]);

      const closeButton = screen.getByText("Close");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Content")).not.toBeInTheDocument();
      });
    });
  });

  describe("Diff View", () => {
    it("should toggle diff view when button clicked", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle("View version");
      fireEvent.click(viewButtons[0]);

      const diffButton = screen.getByText("Show Diff");
      fireEvent.click(diffButton);

      expect(screen.getByText("Hide Diff")).toBeInTheDocument();
      expect(screen.getByText("Changes from this version to current")).toBeInTheDocument();
    });

    it("should show diff content", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle("View version");
      fireEvent.click(viewButtons[0]);

      const diffButton = screen.getByText("Show Diff");
      fireEvent.click(diffButton);

      // Diff should show removed/added lines
      expect(screen.getByText("Changes from this version to current")).toBeInTheDocument();
    });
  });

  describe("Restore Functionality", () => {
    it("should show restore button when canEdit is true", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getAllByTitle("Restore this version").length).toBeGreaterThan(0);
      });
    });

    it("should not show restore button when canEdit is false", async () => {
      render(<VersionHistory {...defaultProps} canEdit={false} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      expect(screen.queryByTitle("Restore this version")).not.toBeInTheDocument();
    });

    it("should show confirmation dialog before restore", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByTitle("Restore this version");
      fireEvent.click(restoreButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining("Restore version 1")
      );
    });

    it("should not restore when user cancels", async () => {
      mockConfirm.mockReturnValue(false);

      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByTitle("Restore this version");
      fireEvent.click(restoreButtons[0]);

      expect(mockFetch).toHaveBeenCalledTimes(1); // Only the initial fetch
    });

    it("should call API to restore version", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByTitle("Restore this version");
      fireEvent.click(restoreButtons[0]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/prompts/prompt-1/versions",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ action: "restore", versionId: "v1" }),
          })
        );
      });
    });

    it("should call onRestore callback after successful restore", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByTitle("Restore this version");
      fireEvent.click(restoreButtons[0]);

      await waitFor(() => {
        expect(defaultProps.onRestore).toHaveBeenCalledWith("Original content");
      });
    });

    it("should show restore button in modal when canEdit", async () => {
      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle("View version");
      fireEvent.click(viewButtons[0]);

      expect(screen.getByText("Restore This Version")).toBeInTheDocument();
    });

    it("should not show restore button in modal when canEdit is false", async () => {
      render(<VersionHistory {...defaultProps} canEdit={false} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle("View version");
      fireEvent.click(viewButtons[0]);

      expect(screen.queryByText("Restore This Version")).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch error gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error fetching versions:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it("should handle restore error gracefully", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ versions: mockVersions }),
        })
        .mockRejectedValueOnce(new Error("Restore failed"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<VersionHistory {...defaultProps} />);
      fireEvent.click(screen.getByText("Version History"));

      await waitFor(() => {
        expect(screen.getByText("v1")).toBeInTheDocument();
      });

      const restoreButtons = screen.getAllByTitle("Restore this version");
      fireEvent.click(restoreButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error restoring version:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <VersionHistory {...defaultProps} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Styling", () => {
    it("should have rounded corners", () => {
      const { container } = render(<VersionHistory {...defaultProps} />);
      expect(container.firstChild).toHaveClass("rounded-xl");
    });

    it("should have border", () => {
      const { container } = render(<VersionHistory {...defaultProps} />);
      expect((container.firstChild as HTMLElement).className).toContain("border");
    });
  });
});
