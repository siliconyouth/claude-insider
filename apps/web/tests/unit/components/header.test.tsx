/**
 * Header Component Tests
 *
 * Tests for the main site header:
 * - Logo and branding
 * - Desktop navigation (dropdowns, links, donate)
 * - Mobile menu toggle
 * - Utility components
 * - Active page highlighting
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "@/components/header";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      docs: "Docs",
      resources: "Resources",
      getStarted: "Get Started",
    };
    return translations[key] || key;
  },
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock child components
vi.mock("@/components/universal-search", () => ({
  UniversalSearch: ({ expanded }: { expanded?: boolean }) => (
    <div data-testid="universal-search" data-expanded={expanded}>Search</div>
  ),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}));

vi.mock("@/components/auth", () => ({
  UserMenu: () => <div data-testid="user-menu">User</div>,
}));

vi.mock("@/components/notifications/notification-bell", () => ({
  NotificationBell: () => <div data-testid="notification-bell">Notifications</div>,
}));

vi.mock("@/components/messaging", () => ({
  InboxDropdown: () => <div data-testid="inbox-dropdown">Inbox</div>,
}));

vi.mock("@/components/nav-dropdown", () => ({
  NavDropdown: ({ label, href, isActive }: { label: string; href: string; isActive?: boolean }) => (
    <div data-testid={`nav-dropdown-${label.toLowerCase()}`} data-active={isActive} data-href={href}>
      {label}
    </div>
  ),
  NavLink: ({ label, href, isActive }: { label: string; href: string; isActive?: boolean }) => (
    <a href={href} data-testid={`nav-link-${label.toLowerCase()}`} data-active={isActive}>
      {label}
    </a>
  ),
}));

vi.mock("@/components/gradient-logo", () => ({
  GradientLogo: ({ size }: { size: number }) => (
    <div data-testid="gradient-logo" data-size={size}>Logo</div>
  ),
}));

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Structure", () => {
    it("should render header element", () => {
      render(<Header />);

      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("should render navigation", () => {
      render(<Header />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should be sticky positioned", () => {
      render(<Header />);

      const header = screen.getByRole("banner");
      expect(header.className).toContain("sticky");
      expect(header.className).toContain("top-0");
    });

    it("should have high z-index", () => {
      render(<Header />);

      const header = screen.getByRole("banner");
      expect(header.className).toContain("z-50");
    });

    it("should have backdrop blur", () => {
      render(<Header />);

      const header = screen.getByRole("banner");
      expect(header.className).toContain("backdrop-blur");
    });
  });

  describe("Logo", () => {
    it("should render gradient logo", () => {
      render(<Header />);

      expect(screen.getByTestId("gradient-logo")).toBeInTheDocument();
    });

    it("should render logo with size 32", () => {
      render(<Header />);

      const logo = screen.getByTestId("gradient-logo");
      expect(logo).toHaveAttribute("data-size", "32");
    });

    it("should render brand name", () => {
      render(<Header />);

      expect(screen.getByText("Claude Insider")).toBeInTheDocument();
    });

    it("should link logo to home page", () => {
      render(<Header />);

      const logoLink = screen.getByText("Claude Insider").closest("a");
      expect(logoLink).toHaveAttribute("href", "https://www.claudeinsider.com");
    });
  });

  describe("Desktop Navigation", () => {
    it("should render Docs dropdown", () => {
      render(<Header />);

      expect(screen.getByTestId("nav-dropdown-docs")).toBeInTheDocument();
    });

    it("should render Resources dropdown", () => {
      render(<Header />);

      expect(screen.getByTestId("nav-dropdown-resources")).toBeInTheDocument();
    });

    it("should render Prompts link", () => {
      render(<Header />);

      expect(screen.getByTestId("nav-link-prompts")).toBeInTheDocument();
    });

    it("should render Community link", () => {
      render(<Header />);

      expect(screen.getByTestId("nav-link-community")).toBeInTheDocument();
    });

    it("should link Prompts to /prompts", () => {
      render(<Header />);

      const promptsLink = screen.getByTestId("nav-link-prompts");
      expect(promptsLink).toHaveAttribute("href", "/prompts");
    });

    it("should link Community to /users", () => {
      render(<Header />);

      const communityLink = screen.getByTestId("nav-link-community");
      expect(communityLink).toHaveAttribute("href", "/users");
    });
  });

  describe("Donate Button", () => {
    it("should render donate button", () => {
      render(<Header />);

      expect(screen.getByText("Donate")).toBeInTheDocument();
    });

    it("should link to /donate", () => {
      render(<Header />);

      const donateLink = screen.getByText("Donate").closest("a");
      expect(donateLink).toHaveAttribute("href", "/donate");
    });

    it("should have pink gradient styling", () => {
      render(<Header />);

      const donateLink = screen.getByText("Donate").closest("a");
      expect(donateLink?.className).toContain("from-pink-500");
    });
  });

  describe("Utility Components", () => {
    it("should render UniversalSearch", () => {
      render(<Header />);

      expect(screen.getAllByTestId("universal-search").length).toBeGreaterThanOrEqual(1);
    });

    it("should render ThemeToggle", () => {
      render(<Header />);

      expect(screen.getAllByTestId("theme-toggle").length).toBeGreaterThanOrEqual(1);
    });

    it("should render InboxDropdown", () => {
      render(<Header />);

      expect(screen.getAllByTestId("inbox-dropdown").length).toBeGreaterThanOrEqual(1);
    });

    it("should render NotificationBell", () => {
      render(<Header />);

      expect(screen.getAllByTestId("notification-bell").length).toBeGreaterThanOrEqual(1);
    });

    it("should render UserMenu", () => {
      render(<Header />);

      expect(screen.getAllByTestId("user-menu").length).toBeGreaterThanOrEqual(1);
    });

    it("should render expanded search on desktop", () => {
      render(<Header />);

      const searches = screen.getAllByTestId("universal-search");
      const expandedSearch = searches.find(s => s.getAttribute("data-expanded") === "true");
      expect(expandedSearch).toBeDefined();
    });
  });

  describe("Mobile Menu", () => {
    it("should render mobile menu button", () => {
      render(<Header />);

      const menuButton = screen.getByLabelText("Open menu");
      expect(menuButton).toBeInTheDocument();
    });

    it("should have aria-expanded false initially", () => {
      render(<Header />);

      const menuButton = screen.getByLabelText("Open menu");
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
    });

    it("should toggle menu open on click", () => {
      render(<Header />);

      const menuButton = screen.getByLabelText("Open menu");
      fireEvent.click(menuButton);

      expect(screen.getByLabelText("Close menu")).toBeInTheDocument();
    });

    it("should show mobile menu content when open", () => {
      render(<Header />);

      const menuButton = screen.getByLabelText("Open menu");
      fireEvent.click(menuButton);

      // Mobile menu links should be visible (Prompts/Community appear in both desktop nav and mobile menu)
      expect(screen.getAllByText("Prompts").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Community").length).toBeGreaterThanOrEqual(1);
    });

    it("should toggle menu closed on second click", () => {
      render(<Header />);

      const menuButton = screen.getByLabelText("Open menu");
      fireEvent.click(menuButton);

      const closeButton = screen.getByLabelText("Close menu");
      fireEvent.click(closeButton);

      expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
    });

    it("should have Support Us button in mobile menu", () => {
      render(<Header />);

      const menuButton = screen.getByLabelText("Open menu");
      fireEvent.click(menuButton);

      expect(screen.getByText("Support Us")).toBeInTheDocument();
    });
  });

  describe("Active Page Highlighting", () => {
    it("should highlight docs when activePage is docs", () => {
      render(<Header activePage="docs" />);

      const docsDropdown = screen.getByTestId("nav-dropdown-docs");
      expect(docsDropdown).toHaveAttribute("data-active", "true");
    });

    it("should highlight resources when activePage is resources", () => {
      render(<Header activePage="resources" />);

      const resourcesDropdown = screen.getByTestId("nav-dropdown-resources");
      expect(resourcesDropdown).toHaveAttribute("data-active", "true");
    });

    it("should highlight prompts when activePage is prompts", () => {
      render(<Header activePage="prompts" />);

      const promptsLink = screen.getByTestId("nav-link-prompts");
      expect(promptsLink).toHaveAttribute("data-active", "true");
    });

    it("should highlight community when activePage is community", () => {
      render(<Header activePage="community" />);

      const communityLink = screen.getByTestId("nav-link-community");
      expect(communityLink).toHaveAttribute("data-active", "true");
    });

    it("should not highlight when no activePage", () => {
      render(<Header />);

      const docsDropdown = screen.getByTestId("nav-dropdown-docs");
      expect(docsDropdown).toHaveAttribute("data-active", "false");
    });
  });

  describe("Mobile Menu Links", () => {
    it("should link to /docs in mobile menu", () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText("Open menu"));

      const docsLink = screen.getByRole("link", { name: "Docs" });
      expect(docsLink).toHaveAttribute("href", "/docs");
    });

    it("should link to /resources in mobile menu", () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText("Open menu"));

      const resourcesLink = screen.getByRole("link", { name: "Resources" });
      expect(resourcesLink).toHaveAttribute("href", "/resources");
    });

    it("should link to /prompts in mobile menu", () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText("Open menu"));

      // Get the mobile menu link specifically
      const links = screen.getAllByText("Prompts");
      const mobileLink = links.find(l => l.closest("a")?.getAttribute("href") === "/prompts");
      expect(mobileLink).toBeDefined();
    });

    it("should close mobile menu when link is clicked", () => {
      render(<Header />);

      fireEvent.click(screen.getByLabelText("Open menu"));

      const docsLink = screen.getByRole("link", { name: "Docs" });
      fireEvent.click(docsLink);

      // Menu should be closed
      expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have border-b", () => {
      render(<Header />);

      const header = screen.getByRole("banner");
      expect(header.className).toContain("border-b");
    });

    it("should have max-width container", () => {
      const { container } = render(<Header />);

      expect(container.querySelector(".max-w-7xl")).toBeInTheDocument();
    });

    it("should have fixed height", () => {
      const { container } = render(<Header />);

      expect(container.querySelector(".h-16")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible mobile menu button", () => {
      render(<Header />);

      const menuButton = screen.getByLabelText("Open menu");
      expect(menuButton).toHaveAttribute("type", "button");
    });

    it("should have focus-visible ring on menu button", () => {
      render(<Header />);

      const menuButton = screen.getByLabelText("Open menu");
      expect(menuButton.className).toContain("focus-visible:ring");
    });
  });
});
