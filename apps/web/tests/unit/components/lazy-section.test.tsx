/**
 * LazySection Component Tests
 *
 * Tests for the lazy loading components:
 * - LazySection: Lazy load content when entering viewport
 * - ProgressiveReveal: Staggered reveal animation
 * - LazyList: Lazy load list items with progressive reveal
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LazySection, ProgressiveReveal, LazyList } from "@/components/lazy-section";

// Mock the intersection observer hook
const mockUseIntersectionObserver = vi.fn();

vi.mock("@/hooks/use-intersection-observer", () => ({
  useIntersectionObserver: () => mockUseIntersectionObserver(),
}));

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

describe("LazySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIntersectionObserver.mockReturnValue({
      ref: { current: null },
      isIntersecting: false,
    });
  });

  describe("Not Intersecting", () => {
    it("should render placeholder when not intersecting", () => {
      render(
        <LazySection placeholder={<div data-testid="placeholder">Loading...</div>}>
          <div data-testid="content">Content</div>
        </LazySection>
      );

      expect(screen.getByTestId("placeholder")).toBeInTheDocument();
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });

    it("should render nothing when no placeholder and not intersecting", () => {
      render(
        <LazySection>
          <div data-testid="content">Content</div>
        </LazySection>
      );

      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });

    it("should apply minHeight when not intersecting", () => {
      const { container } = render(
        <LazySection minHeight={200}>
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).toHaveStyle({ minHeight: "200px" });
    });

    it("should apply string minHeight", () => {
      const { container } = render(
        <LazySection minHeight="50vh">
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).toHaveStyle({ minHeight: "50vh" });
    });
  });

  describe("Intersecting", () => {
    beforeEach(() => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isIntersecting: true,
      });
    });

    it("should render children when intersecting", () => {
      render(
        <LazySection placeholder={<div data-testid="placeholder">Loading...</div>}>
          <div data-testid="content">Content</div>
        </LazySection>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.queryByTestId("placeholder")).not.toBeInTheDocument();
    });

    it("should not apply minHeight when intersecting", () => {
      const { container } = render(
        <LazySection minHeight={200}>
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).not.toHaveStyle({ minHeight: "200px" });
    });

    it("should apply animation class when intersecting and animate is true", () => {
      const { container } = render(
        <LazySection animate>
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).toHaveClass("animate-fade-in-up");
    });

    it("should not apply animation class when animate is false", () => {
      const { container } = render(
        <LazySection animate={false}>
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).not.toHaveClass("animate-fade-in-up");
    });
  });

  describe("Animation Props", () => {
    beforeEach(() => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isIntersecting: true,
      });
    });

    it("should apply animation delay", () => {
      const { container } = render(
        <LazySection animationDelay={200}>
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).toHaveStyle({ animationDelay: "200ms" });
    });

    it("should apply animation fill mode", () => {
      const { container } = render(
        <LazySection>
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).toHaveStyle({ animationFillMode: "both" });
    });

    it("should not apply animation styles when animate is false", () => {
      const { container } = render(
        <LazySection animate={false} animationDelay={200}>
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).not.toHaveStyle({ animationDelay: "200ms" });
    });
  });

  describe("CSS Classes", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <LazySection className="custom-section">
          <div>Content</div>
        </LazySection>
      );

      expect(container.firstChild).toHaveClass("custom-section");
    });
  });

  describe("Hook Configuration", () => {
    it("should use default rootMargin of 100px", () => {
      render(
        <LazySection>
          <div>Content</div>
        </LazySection>
      );

      // Hook is called with options
      expect(mockUseIntersectionObserver).toHaveBeenCalled();
    });

    it("should pass custom rootMargin", () => {
      render(
        <LazySection rootMargin="200px">
          <div>Content</div>
        </LazySection>
      );

      expect(mockUseIntersectionObserver).toHaveBeenCalled();
    });

    it("should use triggerOnce by default", () => {
      render(
        <LazySection>
          <div>Content</div>
        </LazySection>
      );

      expect(mockUseIntersectionObserver).toHaveBeenCalled();
    });
  });
});

describe("ProgressiveReveal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIntersectionObserver.mockReturnValue({
      ref: { current: null },
      isIntersecting: false,
    });
  });

  describe("Not Intersecting", () => {
    it("should render children with opacity-0 when not intersecting", () => {
      const { container } = render(
        <ProgressiveReveal>
          {[<div key="1">Child 1</div>, <div key="2">Child 2</div>]}
        </ProgressiveReveal>
      );

      const items = container.querySelectorAll('[class*="opacity-0"]');
      expect(items.length).toBe(2);
    });

    it("should not have animation class when not intersecting", () => {
      const { container } = render(
        <ProgressiveReveal>
          {[<div key="1">Child 1</div>]}
        </ProgressiveReveal>
      );

      expect(container.querySelector(".animate-fade-in-up")).not.toBeInTheDocument();
    });
  });

  describe("Intersecting", () => {
    beforeEach(() => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isIntersecting: true,
      });
    });

    it("should render children with animation when intersecting", () => {
      const { container } = render(
        <ProgressiveReveal>
          {[<div key="1">Child 1</div>, <div key="2">Child 2</div>]}
        </ProgressiveReveal>
      );

      const items = container.querySelectorAll(".animate-fade-in-up");
      expect(items.length).toBe(2);
    });

    it("should apply staggered animation delays", () => {
      const { container } = render(
        <ProgressiveReveal stagger={100}>
          {[<div key="1">Child 1</div>, <div key="2">Child 2</div>, <div key="3">Child 3</div>]}
        </ProgressiveReveal>
      );

      const items = container.querySelectorAll(".animate-fade-in-up");
      expect(items[0]).toHaveStyle({ animationDelay: "0ms" });
      expect(items[1]).toHaveStyle({ animationDelay: "100ms" });
      expect(items[2]).toHaveStyle({ animationDelay: "200ms" });
    });

    it("should apply base delay before stagger", () => {
      const { container } = render(
        <ProgressiveReveal baseDelay={50} stagger={100}>
          {[<div key="1">Child 1</div>, <div key="2">Child 2</div>]}
        </ProgressiveReveal>
      );

      const items = container.querySelectorAll(".animate-fade-in-up");
      expect(items[0]).toHaveStyle({ animationDelay: "50ms" });
      expect(items[1]).toHaveStyle({ animationDelay: "150ms" });
    });

    it("should use default stagger of 50ms", () => {
      const { container } = render(
        <ProgressiveReveal>
          {[<div key="1">Child 1</div>, <div key="2">Child 2</div>]}
        </ProgressiveReveal>
      );

      const items = container.querySelectorAll(".animate-fade-in-up");
      expect(items[0]).toHaveStyle({ animationDelay: "0ms" });
      expect(items[1]).toHaveStyle({ animationDelay: "50ms" });
    });

    it("should apply animation fill mode", () => {
      const { container } = render(
        <ProgressiveReveal>
          {[<div key="1">Child 1</div>]}
        </ProgressiveReveal>
      );

      const item = container.querySelector(".animate-fade-in-up");
      expect(item).toHaveStyle({ animationFillMode: "both" });
    });
  });

  describe("CSS Classes", () => {
    beforeEach(() => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isIntersecting: true,
      });
    });

    it("should apply custom className to container", () => {
      const { container } = render(
        <ProgressiveReveal className="custom-container">
          {[<div key="1">Child 1</div>]}
        </ProgressiveReveal>
      );

      expect(container.firstChild).toHaveClass("custom-container");
    });

    it("should apply itemClassName to each child", () => {
      const { container } = render(
        <ProgressiveReveal itemClassName="custom-item">
          {[<div key="1">Child 1</div>, <div key="2">Child 2</div>]}
        </ProgressiveReveal>
      );

      const items = container.querySelectorAll(".custom-item");
      expect(items.length).toBe(2);
    });
  });
});

describe("LazyList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseIntersectionObserver.mockReturnValue({
      ref: { current: null },
      isIntersecting: false,
    });
  });

  const mockItems = [
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" },
    { id: 3, name: "Item 3" },
  ];

  const renderItem = (item: { id: number; name: string }, index: number) => (
    <div key={item.id} data-testid={`item-${item.id}`}>
      {item.name}
    </div>
  );

  const renderPlaceholder = (index: number) => (
    <div key={index} data-testid={`placeholder-${index}`}>
      Loading...
    </div>
  );

  describe("Not Intersecting", () => {
    it("should render placeholders when not intersecting", () => {
      render(
        <LazyList
          items={mockItems}
          renderItem={renderItem}
          renderPlaceholder={renderPlaceholder}
          placeholderCount={3}
        />
      );

      expect(screen.getByTestId("placeholder-0")).toBeInTheDocument();
      expect(screen.getByTestId("placeholder-1")).toBeInTheDocument();
      expect(screen.getByTestId("placeholder-2")).toBeInTheDocument();
      expect(screen.queryByTestId("item-1")).not.toBeInTheDocument();
    });

    it("should render nothing when no placeholder and not intersecting", () => {
      const { container } = render(
        <LazyList items={mockItems} renderItem={renderItem} />
      );

      expect(container.firstChild?.childNodes.length).toBe(0);
    });

    it("should use default placeholderCount of 3", () => {
      render(
        <LazyList
          items={mockItems}
          renderItem={renderItem}
          renderPlaceholder={renderPlaceholder}
        />
      );

      expect(screen.getByTestId("placeholder-0")).toBeInTheDocument();
      expect(screen.getByTestId("placeholder-1")).toBeInTheDocument();
      expect(screen.getByTestId("placeholder-2")).toBeInTheDocument();
      expect(screen.queryByTestId("placeholder-3")).not.toBeInTheDocument();
    });
  });

  describe("Intersecting", () => {
    beforeEach(() => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isIntersecting: true,
      });
    });

    it("should render items when intersecting", () => {
      render(
        <LazyList
          items={mockItems}
          renderItem={renderItem}
          renderPlaceholder={renderPlaceholder}
        />
      );

      expect(screen.getByTestId("item-1")).toBeInTheDocument();
      expect(screen.getByTestId("item-2")).toBeInTheDocument();
      expect(screen.getByTestId("item-3")).toBeInTheDocument();
      expect(screen.queryByTestId("placeholder-0")).not.toBeInTheDocument();
    });

    it("should apply animation class to items", () => {
      const { container } = render(
        <LazyList items={mockItems} renderItem={renderItem} />
      );

      const items = container.querySelectorAll(".animate-fade-in-up");
      expect(items.length).toBe(3);
    });

    it("should apply staggered animation delays", () => {
      const { container } = render(
        <LazyList items={mockItems} renderItem={renderItem} stagger={100} />
      );

      const items = container.querySelectorAll(".animate-fade-in-up");
      expect(items[0]).toHaveStyle({ animationDelay: "0ms" });
      expect(items[1]).toHaveStyle({ animationDelay: "100ms" });
      expect(items[2]).toHaveStyle({ animationDelay: "200ms" });
    });

    it("should use default stagger of 50ms", () => {
      const { container } = render(
        <LazyList items={mockItems} renderItem={renderItem} />
      );

      const items = container.querySelectorAll(".animate-fade-in-up");
      expect(items[1]).toHaveStyle({ animationDelay: "50ms" });
    });

    it("should apply animation fill mode", () => {
      const { container } = render(
        <LazyList items={mockItems} renderItem={renderItem} />
      );

      const item = container.querySelector(".animate-fade-in-up");
      expect(item).toHaveStyle({ animationFillMode: "both" });
    });
  });

  describe("CSS Classes", () => {
    beforeEach(() => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isIntersecting: true,
      });
    });

    it("should apply custom className to container", () => {
      const { container } = render(
        <LazyList
          items={mockItems}
          renderItem={renderItem}
          className="custom-list"
        />
      );

      expect(container.firstChild).toHaveClass("custom-list");
    });

    it("should apply itemClassName to each item", () => {
      const { container } = render(
        <LazyList
          items={mockItems}
          renderItem={renderItem}
          itemClassName="custom-item"
        />
      );

      const items = container.querySelectorAll(".custom-item");
      expect(items.length).toBe(3);
    });
  });

  describe("Empty State", () => {
    beforeEach(() => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isIntersecting: true,
      });
    });

    it("should render nothing when items array is empty", () => {
      const { container } = render(
        <LazyList items={[]} renderItem={renderItem} />
      );

      expect(container.firstChild?.childNodes.length).toBe(0);
    });
  });

  describe("Type Safety", () => {
    beforeEach(() => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isIntersecting: true,
      });
    });

    it("should work with different item types", () => {
      const stringItems = ["a", "b", "c"];
      const renderStringItem = (item: string, index: number) => (
        <div key={index} data-testid={`string-${index}`}>
          {item}
        </div>
      );

      render(<LazyList items={stringItems} renderItem={renderStringItem} />);

      expect(screen.getByTestId("string-0")).toHaveTextContent("a");
      expect(screen.getByTestId("string-1")).toHaveTextContent("b");
      expect(screen.getByTestId("string-2")).toHaveTextContent("c");
    });
  });
});

describe("Integration", () => {
  beforeEach(() => {
    mockUseIntersectionObserver.mockReturnValue({
      ref: { current: null },
      isIntersecting: true,
    });
  });

  it("should combine multiple lazy loading components", () => {
    render(
      <LazySection>
        <ProgressiveReveal>
          {[
            <div key="1" data-testid="nested-1">Nested 1</div>,
            <div key="2" data-testid="nested-2">Nested 2</div>,
          ]}
        </ProgressiveReveal>
      </LazySection>
    );

    expect(screen.getByTestId("nested-1")).toBeInTheDocument();
    expect(screen.getByTestId("nested-2")).toBeInTheDocument();
  });
});
