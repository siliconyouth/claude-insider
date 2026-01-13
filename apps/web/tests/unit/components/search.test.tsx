/**
 * Search Component Tests
 *
 * Tests for the search modal:
 * - Search button and keyboard shortcut
 * - Modal open/close behavior
 * - Search input and results
 * - Keyboard navigation
 * - Search history
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Search } from "@/components/search";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock search utilities with simple mock Fuse
const mockSearchDocs = [
  { title: "Getting Started", description: "Introduction to Claude Code", url: "/docs/getting-started", category: "Documentation" },
  { title: "Configuration", description: "Configure your setup", url: "/docs/configuration", category: "Documentation" },
  { title: "API Reference", description: "API documentation", url: "/docs/api", category: "API" },
];

class MockFuse {
  private items: typeof mockSearchDocs;
  constructor(items: typeof mockSearchDocs) {
    this.items = items;
  }
  search(query: string, _options?: { limit?: number }) {
    if (!query) return [];
    const results = this.items.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );
    return results.map(item => ({ item, score: 0.5 }));
  }
}

vi.mock("@/lib/search", () => ({
  buildSearchIndex: () => mockSearchDocs,
  createSearchInstance: (docs: typeof mockSearchDocs) => new MockFuse(docs),
}));

// Use vi.hoisted for search history mock state
const { mockSearchHistory } = vi.hoisted(() => ({
  mockSearchHistory: { value: [] as { query: string; timestamp: number }[] },
}));

vi.mock("@/lib/search-history", () => ({
  getSearchHistory: () => mockSearchHistory.value,
  addToSearchHistory: vi.fn(),
  clearSearchHistory: vi.fn(() => {
    mockSearchHistory.value = [];
  }),
}));

// Mock skeleton component
vi.mock("@/components/skeleton", () => ({
  SkeletonSearchResult: () => <div data-testid="skeleton-result">Loading...</div>,
}));

// Mock focus trap hook
vi.mock("@/hooks/use-focus-trap", () => ({
  useFocusTrap: ({ onEscape, onClickOutside }: { onEscape?: () => void; onClickOutside?: () => void }) => ({
    containerRef: { current: null },
    onEscape,
    onClickOutside,
  }),
}));

// Mock announcer hook
const mockAnnounce = vi.fn();
vi.mock("@/hooks/use-aria-live", () => ({
  useAnnouncer: () => ({ announce: mockAnnounce }),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock createPortal to render in same container
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe("Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchHistory.value = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Search Button", () => {
    it("should render search button", () => {
      render(<Search />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should have search icon", () => {
      const { container } = render(<Search />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should show keyboard shortcut", () => {
      render(<Search />);

      expect(screen.getByText("K")).toBeInTheDocument();
    });

    it("should have accessible label", () => {
      render(<Search />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", expect.stringContaining("Search"));
    });

    it("should have aria-haspopup", () => {
      render(<Search />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
    });
  });

  describe("Modal Open/Close", () => {
    it("should not show modal initially", () => {
      render(<Search />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should open modal when button clicked", async () => {
      render(<Search />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should have sr-only title in modal", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Search documentation")).toBeInTheDocument();
      });
    });

    it("should show close button in modal", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByLabelText("Close search")).toBeInTheDocument();
      });
    });

    it("should close modal when close button clicked", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Close search"));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should close modal when backdrop clicked", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Click on the dialog backdrop
      const dialog = screen.getByRole("dialog");
      fireEvent.click(dialog);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should open modal on Cmd+K", async () => {
      render(<Search />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should open modal on Ctrl+K", async () => {
      render(<Search />);

      fireEvent.keyDown(document, { key: "k", ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should close modal on Escape", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Search Input", () => {
    it("should render search input in modal", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search documentation...")).toBeInTheDocument();
      });
    });

    it("should have type search", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const input = screen.getByPlaceholderText("Search documentation...");
        expect(input).toHaveAttribute("type", "search");
      });
    });

    it("should show clear button when query entered", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      const input = await screen.findByPlaceholderText("Search documentation...");
      fireEvent.change(input, { target: { value: "test" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
      });
    });

    it("should clear input when clear button clicked", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      const input = await screen.findByPlaceholderText("Search documentation...");
      fireEvent.change(input, { target: { value: "test" } });

      await waitFor(() => {
        expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Clear search"));

      expect(input).toHaveValue("");
    });
  });

  describe("Search Hint", () => {
    it("should show search hint initially", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Type at least 2 characters to search")).toBeInTheDocument();
      });
    });

    it("should show keyboard navigation hints", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Navigate")).toBeInTheDocument();
        expect(screen.getByText("Select")).toBeInTheDocument();
        expect(screen.getByText("Close")).toBeInTheDocument();
      });
    });
  });

  describe("No Results", () => {
    it("should show no results message for unmatched query", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      const input = await screen.findByPlaceholderText("Search documentation...");
      fireEvent.change(input, { target: { value: "xyznonexistent" } });

      await waitFor(() => {
        expect(screen.getByText(/No results found/)).toBeInTheDocument();
      });
    });

    it("should show the query in no results message", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      const input = await screen.findByPlaceholderText("Search documentation...");
      fireEvent.change(input, { target: { value: "xyznonexistent" } });

      await waitFor(() => {
        expect(screen.getByText(/"xyznonexistent"/)).toBeInTheDocument();
      });
    });
  });

  describe("Search History", () => {
    it("should show search history when available", async () => {
      mockSearchHistory.value = [
        { query: "claude", timestamp: Date.now() },
        { query: "api", timestamp: Date.now() - 1000 },
      ];

      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Recent searches")).toBeInTheDocument();
      });
    });

    it("should show history items", async () => {
      mockSearchHistory.value = [
        { query: "installation", timestamp: Date.now() },
      ];

      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("installation")).toBeInTheDocument();
      });
    });

    it("should show clear all button", async () => {
      mockSearchHistory.value = [
        { query: "test", timestamp: Date.now() },
      ];

      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText("Clear all")).toBeInTheDocument();
      });
    });

    it("should populate query when history item clicked", async () => {
      mockSearchHistory.value = [
        { query: "getting", timestamp: Date.now() },
      ];

      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const historyButton = screen.getByText("getting");
        fireEvent.click(historyButton);
      });

      const input = screen.getByPlaceholderText("Search documentation...");
      expect(input).toHaveValue("getting");
    });
  });

  describe("Footer", () => {
    it("should show Fuse.js credit", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText(/Fuse.js/)).toBeInTheDocument();
      });
    });

    it("should show close hint", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByText(/click outside to close/)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have role dialog on modal", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should have aria-modal true", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
      });
    });

    it("should have aria-labelledby", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toHaveAttribute("aria-labelledby", "search-dialog-title");
      });
    });

    it("should have accessible input", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const input = screen.getByPlaceholderText("Search documentation...");
        expect(input).toHaveAttribute("aria-label", "Search");
      });
    });
  });

  describe("Styling", () => {
    it("should have rounded button", () => {
      render(<Search />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("rounded-lg");
    });

    it("should have focus ring on button", () => {
      render(<Search />);

      const button = screen.getByRole("button");
      expect(button.className).toContain("focus-visible:ring");
    });

    it("should have backdrop blur on modal", async () => {
      render(<Search />);

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog.className).toContain("backdrop-blur");
      });
    });
  });
});
