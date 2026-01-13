/**
 * TableOfContents Component Tests
 *
 * Tests for the documentation table of contents:
 * - Heading extraction from article
 * - Scroll spy with IntersectionObserver
 * - Active heading highlighting
 * - Smooth scroll on click
 *
 * Note: Uses innerHTML in test setup (not production code) to create DOM fixtures.
 * This is safe as it's controlled test data, not user input.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TableOfContents } from "@/components/table-of-contents";

// Mock IntersectionObserver
let mockIntersectionCallback: IntersectionObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin = "";
  thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback) {
    mockIntersectionCallback = callback;
  }

  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock scrollIntoView
const mockScrollIntoView = vi.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

// Mock history.pushState
const mockPushState = vi.fn();
Object.defineProperty(window, "history", {
  value: { pushState: mockPushState },
  writable: true,
});

// Helper to create test DOM structure
function createTestArticle(headings: Array<{ tag: string; id?: string; text: string }>) {
  const article = document.createElement("article");
  headings.forEach(({ tag, id, text }) => {
    const heading = document.createElement(tag);
    if (id) heading.id = id;
    heading.textContent = text;
    article.appendChild(heading);
  });
  document.body.appendChild(article);
  return article;
}

describe("TableOfContents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.textContent = "";
  });

  afterEach(() => {
    document.body.textContent = "";
  });

  describe("Without Headings", () => {
    it("should render nothing when no article exists", () => {
      const { container } = render(<TableOfContents />);

      expect(container.firstChild).toBeNull();
    });

    it("should render nothing when article has no headings", () => {
      const article = document.createElement("article");
      const p = document.createElement("p");
      p.textContent = "Just some text";
      article.appendChild(p);
      document.body.appendChild(article);

      const { container } = render(<TableOfContents />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("With Headings", () => {
    beforeEach(() => {
      createTestArticle([
        { tag: "h2", id: "intro", text: "Introduction" },
        { tag: "h3", id: "basics", text: "Basics" },
        { tag: "h2", id: "advanced", text: "Advanced Topics" },
        { tag: "h3", id: "tips", text: "Pro Tips" },
      ]);
    });

    it("should render nav element", () => {
      render(<TableOfContents />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should render On this page title", () => {
      render(<TableOfContents />);

      expect(screen.getByText("On this page")).toBeInTheDocument();
    });

    it("should render all headings", () => {
      render(<TableOfContents />);

      // Text appears both in DOM heading and TOC link, so check for at least 2
      expect(screen.getAllByText("Introduction").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("Basics").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("Advanced Topics").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("Pro Tips").length).toBeGreaterThanOrEqual(2);
    });

    it("should create links for each heading", () => {
      render(<TableOfContents />);

      expect(screen.getByRole("link", { name: "Introduction" })).toHaveAttribute("href", "#intro");
      expect(screen.getByRole("link", { name: "Basics" })).toHaveAttribute("href", "#basics");
      expect(screen.getByRole("link", { name: "Advanced Topics" })).toHaveAttribute("href", "#advanced");
      expect(screen.getByRole("link", { name: "Pro Tips" })).toHaveAttribute("href", "#tips");
    });

    it("should observe all headings with IntersectionObserver", () => {
      render(<TableOfContents />);

      // Should observe 4 headings
      expect(mockObserve).toHaveBeenCalledTimes(4);
    });

    it("should disconnect observer on unmount", () => {
      const { unmount } = render(<TableOfContents />);

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe("Custom Content Selector", () => {
    it("should use custom selector", () => {
      const div = document.createElement("div");
      div.className = "custom-content";
      const h2 = document.createElement("h2");
      h2.id = "custom-heading";
      h2.textContent = "Custom Section";
      div.appendChild(h2);
      document.body.appendChild(div);

      render(<TableOfContents contentSelector=".custom-content" />);

      // Text appears both in DOM heading and TOC link
      expect(screen.getAllByText("Custom Section").length).toBeGreaterThanOrEqual(2);
    });

    it("should render nothing when custom selector not found", () => {
      createTestArticle([{ tag: "h2", text: "Regular Article" }]);

      const { container } = render(<TableOfContents contentSelector=".nonexistent" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("ID Generation", () => {
    it("should use existing IDs", () => {
      createTestArticle([{ tag: "h2", id: "existing-id", text: "Has ID" }]);

      render(<TableOfContents />);

      expect(screen.getByRole("link", { name: "Has ID" })).toHaveAttribute("href", "#existing-id");
    });

    it("should generate IDs for headings without them", () => {
      createTestArticle([{ tag: "h2", text: "No ID Heading" }]);

      render(<TableOfContents />);

      // Should generate slug from text
      const heading = document.querySelector("h2");
      expect(heading?.id).toBe("no-id-heading");
    });

    it("should slugify text correctly", () => {
      createTestArticle([
        { tag: "h2", text: "Getting Started with API" },
        { tag: "h2", text: "What's New?" },
      ]);

      render(<TableOfContents />);

      const headings = document.querySelectorAll("h2");
      expect(headings[0].id).toBe("getting-started-with-api");
      expect(headings[1].id).toBe("what-s-new");
    });
  });

  describe("Heading Levels", () => {
    beforeEach(() => {
      createTestArticle([
        { tag: "h2", id: "h2-heading", text: "H2 Heading" },
        { tag: "h3", id: "h3-heading", text: "H3 Heading" },
      ]);
    });

    it("should indent H3 headings", () => {
      render(<TableOfContents />);

      // Get the link in the TOC (not the heading in the DOM)
      const h3Link = screen.getByRole("link", { name: "H3 Heading" });
      const h3Item = h3Link.closest("li");
      expect(h3Item).toHaveClass("ml-3");
    });

    it("should not indent H2 headings", () => {
      render(<TableOfContents />);

      // Get the link in the TOC (not the heading in the DOM)
      const h2Link = screen.getByRole("link", { name: "H2 Heading" });
      const h2Item = h2Link.closest("li");
      expect(h2Item).not.toHaveClass("ml-3");
    });
  });

  describe("Click Handling", () => {
    beforeEach(() => {
      createTestArticle([{ tag: "h2", id: "test-heading", text: "Test Heading" }]);
    });

    it("should prevent default click behavior", () => {
      render(<TableOfContents />);

      const link = screen.getByRole("link", { name: "Test Heading" });
      const event = new MouseEvent("click", { bubbles: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      link.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should scroll to heading on click", () => {
      render(<TableOfContents />);

      const link = screen.getByRole("link", { name: "Test Heading" });
      fireEvent.click(link);

      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
    });

    it("should update URL hash on click", () => {
      render(<TableOfContents />);

      const link = screen.getByRole("link", { name: "Test Heading" });
      fireEvent.click(link);

      expect(mockPushState).toHaveBeenCalledWith(null, "", "#test-heading");
    });
  });

  describe("Active Heading", () => {
    beforeEach(() => {
      createTestArticle([
        { tag: "h2", id: "first", text: "First Section" },
        { tag: "h2", id: "second", text: "Second Section" },
      ]);
    });

    it("should highlight active heading on intersection", async () => {
      render(<TableOfContents />);

      // Simulate intersection
      const firstHeading = document.getElementById("first");
      mockIntersectionCallback(
        [{ isIntersecting: true, target: firstHeading }] as IntersectionObserverEntry[],
        {} as IntersectionObserver
      );

      await waitFor(() => {
        const activeLink = screen.getByRole("link", { name: "First Section" });
        expect(activeLink.className).toContain("border-cyan-500");
        expect(activeLink.className).toContain("text-cyan-500");
      });
    });

    it("should apply active styles to clicked heading", () => {
      render(<TableOfContents />);

      const link = screen.getByRole("link", { name: "Second Section" });
      fireEvent.click(link);

      // After click, the link should be styled as active
      expect(link.className).toContain("border-cyan-500");
    });
  });

  describe("Styling", () => {
    beforeEach(() => {
      createTestArticle([{ tag: "h2", id: "heading", text: "Heading" }]);
    });

    it("should be hidden on smaller screens", () => {
      render(<TableOfContents />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("hidden", "xl:block");
    });

    it("should have fixed width", () => {
      render(<TableOfContents />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("w-56");
    });

    it("should have sticky positioning", () => {
      const { container } = render(<TableOfContents />);

      expect(container.querySelector(".sticky")).toBeInTheDocument();
    });

    it("should have overflow auto for long TOCs", () => {
      const { container } = render(<TableOfContents />);

      expect(container.querySelector(".overflow-y-auto")).toBeInTheDocument();
    });

    it("should have left border on links", () => {
      render(<TableOfContents />);

      const link = screen.getByRole("link", { name: "Heading" });
      expect(link).toHaveClass("border-l-2");
    });

    it("should have inactive link styling", () => {
      render(<TableOfContents />);

      const link = screen.getByRole("link", { name: "Heading" });
      expect(link.className).toContain("border-transparent");
      expect(link.className).toContain("text-gray-500");
    });
  });

  describe("Multiple Intersections", () => {
    beforeEach(() => {
      createTestArticle([
        { tag: "h2", id: "one", text: "One" },
        { tag: "h2", id: "two", text: "Two" },
        { tag: "h2", id: "three", text: "Three" },
      ]);
    });

    it("should update active heading as user scrolls", async () => {
      render(<TableOfContents />);

      // First heading intersects
      mockIntersectionCallback(
        [{ isIntersecting: true, target: document.getElementById("one") }] as IntersectionObserverEntry[],
        {} as IntersectionObserver
      );

      await waitFor(() => {
        expect(screen.getByRole("link", { name: "One" }).className).toContain("text-cyan-500");
      });

      // Second heading intersects
      mockIntersectionCallback(
        [{ isIntersecting: true, target: document.getElementById("two") }] as IntersectionObserverEntry[],
        {} as IntersectionObserver
      );

      await waitFor(() => {
        expect(screen.getByRole("link", { name: "Two" }).className).toContain("text-cyan-500");
      });
    });
  });
});
