/**
 * Skeleton Component Tests
 *
 * Tests for the loading skeleton components.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonSearchResult,
  SkeletonList,
  SkeletonDocPage,
  SkeletonHero,
  SkeletonSidebar,
  SkeletonWrapper,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonProfile,
} from "@/components/skeleton";

describe("Skeleton", () => {
  describe("Base Skeleton", () => {
    it("should render a div element", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild;
      expect(skeleton).toBeInstanceOf(HTMLDivElement);
    });

    it("should have animate-pulse class for shimmer effect", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("animate-pulse");
    });

    it("should have rounded-md class", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("rounded-md");
    });

    it("should have aria-hidden for accessibility", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveAttribute("aria-hidden", "true");
    });

    it("should accept custom className", () => {
      const { container } = render(<Skeleton className="h-10 w-20" />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("h-10");
      expect(skeleton).toHaveClass("w-20");
    });

    it("should have dark mode background classes", () => {
      const { container } = render(<Skeleton />);

      const skeleton = container.firstChild as HTMLElement;
      expect(skeleton).toHaveClass("bg-gray-200");
      expect(skeleton).toHaveClass("dark:bg-[#262626]");
    });
  });

  describe("SkeletonText", () => {
    it("should render 3 lines by default", () => {
      const { container } = render(<SkeletonText />);

      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons).toHaveLength(3);
    });

    it("should render specified number of lines", () => {
      const { container } = render(<SkeletonText lines={5} />);

      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons).toHaveLength(5);
    });

    it("should render 1 line when specified", () => {
      const { container } = render(<SkeletonText lines={1} />);

      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons).toHaveLength(1);
    });

    it("should have last line shorter (w-4/5)", () => {
      const { container } = render(<SkeletonText lines={3} />);

      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      const lastSkeleton = skeletons[2] as HTMLElement;
      expect(lastSkeleton).toHaveClass("w-4/5");
    });

    it("should have other lines full width", () => {
      const { container } = render(<SkeletonText lines={3} />);

      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      const firstSkeleton = skeletons[0] as HTMLElement;
      expect(firstSkeleton).toHaveClass("w-full");
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonText className="my-custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("my-custom-class");
    });

    it("should have space-y-2 for spacing between lines", () => {
      const { container } = render(<SkeletonText />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("space-y-2");
    });
  });

  describe("SkeletonCard", () => {
    it("should render a card structure", () => {
      const { container } = render(<SkeletonCard />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("p-6");
    });

    it("should have card background colors", () => {
      const { container } = render(<SkeletonCard />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("bg-white");
      expect(card).toHaveClass("dark:bg-[#111111]");
    });

    it("should have border styling", () => {
      const { container } = render(<SkeletonCard />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("border");
    });

    it("should contain multiple skeleton elements", () => {
      const { container } = render(<SkeletonCard />);

      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons.length).toBeGreaterThan(3);
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonCard className="my-card" />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("my-card");
    });
  });

  describe("SkeletonSearchResult", () => {
    it("should render search result skeleton", () => {
      const { container } = render(<SkeletonSearchResult />);

      const result = container.firstChild as HTMLElement;
      expect(result).toHaveClass("flex");
      expect(result).toHaveClass("items-start");
    });

    it("should have icon skeleton", () => {
      const { container } = render(<SkeletonSearchResult />);

      // First skeleton should be the icon (6x6)
      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      const iconSkeleton = skeletons[0] as HTMLElement;
      expect(iconSkeleton).toHaveClass("h-6");
      expect(iconSkeleton).toHaveClass("w-6");
    });

    it("should have content area with multiple skeletons", () => {
      const { container } = render(<SkeletonSearchResult />);

      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      // icon + title + description + meta
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonSearchResult className="custom-search" />);

      const result = container.firstChild as HTMLElement;
      expect(result).toHaveClass("custom-search");
    });
  });

  describe("SkeletonList", () => {
    it("should render 5 items by default", () => {
      const { container } = render(<SkeletonList />);

      // Each item has avatar + 2 text lines = 3 skeletons per item
      const items = container.querySelectorAll(".flex.items-center.gap-3");
      expect(items).toHaveLength(5);
    });

    it("should render specified count of items", () => {
      const { container } = render(<SkeletonList count={3} />);

      const items = container.querySelectorAll(".flex.items-center.gap-3");
      expect(items).toHaveLength(3);
    });

    it("should render 10 items when specified", () => {
      const { container } = render(<SkeletonList count={10} />);

      const items = container.querySelectorAll(".flex.items-center.gap-3");
      expect(items).toHaveLength(10);
    });

    it("should have circular avatars", () => {
      const { container } = render(<SkeletonList count={1} />);

      const avatar = container.querySelector(".rounded-full");
      expect(avatar).toBeInTheDocument();
    });

    it("should have space-y-3 spacing", () => {
      const { container } = render(<SkeletonList />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("space-y-3");
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonList className="my-list" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("my-list");
    });
  });

  describe("SkeletonDocPage", () => {
    it("should render documentation skeleton structure", () => {
      const { container } = render(<SkeletonDocPage />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("space-y-6");
    });

    it("should have title skeleton", () => {
      const { container } = render(<SkeletonDocPage />);

      // Title is h-10 w-2/3
      const titleSkeleton = container.querySelector(".h-10.w-2\\/3");
      expect(titleSkeleton).toBeInTheDocument();
    });

    it("should have code block skeleton", () => {
      const { container } = render(<SkeletonDocPage />);

      // Code block is h-32
      const codeBlockSkeleton = container.querySelector(".h-32");
      expect(codeBlockSkeleton).toBeInTheDocument();
    });

    it("should contain SkeletonText components", () => {
      const { container } = render(<SkeletonDocPage />);

      const skeletons = container.querySelectorAll('[aria-hidden="true"]');
      expect(skeletons.length).toBeGreaterThan(10);
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonDocPage className="doc-page" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("doc-page");
    });
  });

  describe("SkeletonHero", () => {
    it("should render hero skeleton with center alignment", () => {
      const { container } = render(<SkeletonHero />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("text-center");
    });

    it("should have button skeletons", () => {
      const { container } = render(<SkeletonHero />);

      // Buttons are h-12 rounded-lg
      const buttonSkeletons = container.querySelectorAll(".h-12.rounded-lg");
      expect(buttonSkeletons.length).toBeGreaterThanOrEqual(2);
    });

    it("should have centered content", () => {
      const { container } = render(<SkeletonHero />);

      const centeredElements = container.querySelectorAll(".mx-auto");
      expect(centeredElements.length).toBeGreaterThan(0);
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonHero className="my-hero" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("my-hero");
    });
  });

  describe("SkeletonSidebar", () => {
    it("should render sidebar skeleton structure", () => {
      const { container } = render(<SkeletonSidebar />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("space-y-6");
    });

    it("should have multiple sections", () => {
      const { container } = render(<SkeletonSidebar />);

      // Each section has space-y-2
      const sections = container.querySelectorAll(".space-y-2");
      expect(sections.length).toBeGreaterThanOrEqual(3);
    });

    it("should have navigation item skeletons", () => {
      const { container } = render(<SkeletonSidebar />);

      // Nav items are h-8 rounded-md
      const navItems = container.querySelectorAll(".h-8.rounded-md");
      expect(navItems.length).toBeGreaterThan(0);
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonSidebar className="my-sidebar" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("my-sidebar");
    });
  });

  describe("SkeletonWrapper", () => {
    it("should show skeleton when isLoading is true", () => {
      render(
        <SkeletonWrapper
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonWrapper>
      );

      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
      expect(screen.queryByTestId("content")).not.toBeInTheDocument();
    });

    it("should show children when isLoading is false", () => {
      render(
        <SkeletonWrapper
          isLoading={false}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonWrapper>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });

    it("should toggle between states", () => {
      const { rerender } = render(
        <SkeletonWrapper
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonWrapper>
      );

      expect(screen.getByTestId("skeleton")).toBeInTheDocument();

      rerender(
        <SkeletonWrapper
          isLoading={false}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonWrapper>
      );

      expect(screen.getByTestId("content")).toBeInTheDocument();
    });
  });

  describe("SkeletonButton", () => {
    it("should render button skeleton", () => {
      const { container } = render(<SkeletonButton />);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("w-24");
      expect(button).toHaveClass("rounded-lg");
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonButton className="w-32 h-12" />);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass("w-32");
      expect(button).toHaveClass("h-12");
    });
  });

  describe("SkeletonAvatar", () => {
    it("should render medium size by default", () => {
      const { container } = render(<SkeletonAvatar />);

      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass("h-10");
      expect(avatar).toHaveClass("w-10");
    });

    it("should render small size", () => {
      const { container } = render(<SkeletonAvatar size="sm" />);

      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass("h-8");
      expect(avatar).toHaveClass("w-8");
    });

    it("should render large size", () => {
      const { container } = render(<SkeletonAvatar size="lg" />);

      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass("h-16");
      expect(avatar).toHaveClass("w-16");
    });

    it("should be circular", () => {
      const { container } = render(<SkeletonAvatar />);

      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass("rounded-full");
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonAvatar className="border-2" />);

      const avatar = container.firstChild as HTMLElement;
      expect(avatar).toHaveClass("border-2");
    });
  });

  describe("SkeletonProfile", () => {
    it("should render profile skeleton structure", () => {
      const { container } = render(<SkeletonProfile />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("max-w-5xl");
      expect(wrapper).toHaveClass("mx-auto");
    });

    it("should have hero cover section", () => {
      const { container } = render(<SkeletonProfile />);

      // Cover has aspect ratio class
      const cover = container.querySelector('[class*="aspect-"]');
      expect(cover).toBeInTheDocument();
    });

    it("should have stats bar", () => {
      const { container } = render(<SkeletonProfile />);

      // Stats bar has grid-cols-3 or grid-cols-6
      const statsBar = container.querySelector('[class*="grid-cols-"]');
      expect(statsBar).toBeInTheDocument();
    });

    it("should not show tabs by default", () => {
      const { container } = render(<SkeletonProfile />);

      // Tab header has border-b pattern in specific structure
      // When showTabs is false, there should be fewer sections
      const allDivs = container.querySelectorAll("div");
      const withTabs = render(<SkeletonProfile showTabs={true} />);
      const allDivsWithTabs = withTabs.container.querySelectorAll("div");

      expect(allDivsWithTabs.length).toBeGreaterThan(allDivs.length);
    });

    it("should show tabs when showTabs is true", () => {
      const { container } = render(<SkeletonProfile showTabs={true} />);

      // Tab content has specific structure with tab placeholders
      const tabPlaceholders = container.querySelectorAll(".h-20.rounded-xl");
      expect(tabPlaceholders.length).toBeGreaterThan(0);
    });

    it("should have achievements section", () => {
      const { container } = render(<SkeletonProfile />);

      // Achievement icons are w-10 h-10 rounded-lg
      const achievementIcons = container.querySelectorAll(".w-10.h-10.rounded-lg");
      expect(achievementIcons.length).toBeGreaterThan(0);
    });

    it("should accept custom className", () => {
      const { container } = render(<SkeletonProfile className="my-profile" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("my-profile");
    });
  });
});
