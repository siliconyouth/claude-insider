/**
 * Footer Component Tests
 *
 * Tests for the site footer:
 * - Brand section with logo
 * - Link columns (Features, Documentation, Resources, Project, Legal)
 * - Social links
 * - Bottom bar with copyright and utilities
 * - AI Assistant action button
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Footer } from "@/components/footer";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      features: "Features",
      documentationTitle: "Documentation",
      resourcesTitle: "Resources",
      project: "Project",
      legal: "Legal",
      documentation: "Documentation",
      resources: "Resources",
      gettingStarted: "Getting Started",
      configuration: "Configuration",
      apiReference: "API Reference",
      tipsTricks: "Tips & Tricks",
      tutorials: "Tutorials",
      examples: "Examples",
      changelog: "Changelog",
      donate: "Donate",
      privacy: "Privacy",
      terms: "Terms",
      disclaimer: "Disclaimer",
      accessibility: "Accessibility",
      copyrightShort: "Claude Insider",
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
vi.mock("@/components/footer-language-selector", () => ({
  FooterLanguageSelector: () => <div data-testid="footer-language-selector">Language</div>,
}));

vi.mock("@/components/sound-toggle", () => ({
  SoundToggle: () => <div data-testid="sound-toggle">Sound</div>,
}));

vi.mock("@/components/monochrome-logo", () => ({
  MonochromeLogo: ({ size, variant }: { size: number; variant: string }) => (
    <div data-testid="monochrome-logo" data-size={size} data-variant={variant}>
      Logo
    </div>
  ),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}));

// Mock unified-chat
const mockOpenAIAssistant = vi.fn();
vi.mock("@/components/unified-chat", () => ({
  openAIAssistant: () => mockOpenAIAssistant(),
}));

// Mock version-update-popup
const mockOpenVersionPopup = vi.fn();
vi.mock("@/components/version-update-popup", () => ({
  useVersionPopupControl: () => ({
    openVersionPopup: mockOpenVersionPopup,
  }),
  APP_VERSION: "1.21.0",
}));

describe("Footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Structure", () => {
    it("should render footer element", () => {
      render(<Footer />);

      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("should render brand section", () => {
      render(<Footer />);

      expect(screen.getByText("Claude Insider")).toBeInTheDocument();
    });

    it("should render brand description", () => {
      render(<Footer />);

      expect(
        screen.getByText(/comprehensive guide to Claude AI/i)
      ).toBeInTheDocument();
    });
  });

  describe("Logo", () => {
    it("should render monochrome logo in brand section", () => {
      render(<Footer />);

      const logos = screen.getAllByTestId("monochrome-logo");
      expect(logos.length).toBeGreaterThanOrEqual(1);
    });

    it("should use contrast variant for logo", () => {
      render(<Footer />);

      const logos = screen.getAllByTestId("monochrome-logo");
      expect(logos[0]).toHaveAttribute("data-variant", "contrast");
    });
  });

  describe("Link Columns", () => {
    it("should render Features column", () => {
      render(<Footer />);

      expect(screen.getByText("Features")).toBeInTheDocument();
    });

    it("should render Documentation column", () => {
      render(<Footer />);

      // The column title
      expect(screen.getAllByText("Documentation").length).toBeGreaterThanOrEqual(1);
    });

    it("should render Resources column", () => {
      render(<Footer />);

      expect(screen.getAllByText("Resources").length).toBeGreaterThanOrEqual(1);
    });

    it("should render Project column", () => {
      render(<Footer />);

      expect(screen.getByText("Project")).toBeInTheDocument();
    });

    it("should render Legal column", () => {
      render(<Footer />);

      expect(screen.getByText("Legal")).toBeInTheDocument();
    });
  });

  describe("Features Links", () => {
    it("should have Documentation link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /Documentation/i })).toHaveAttribute(
        "href",
        "/docs"
      );
    });

    it("should have Resources link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /^Resources$/i })).toHaveAttribute(
        "href",
        "/resources"
      );
    });

    it("should have MCP Playground link with badge", () => {
      render(<Footer />);

      expect(screen.getByText("MCP Playground")).toBeInTheDocument();
      expect(screen.getAllByText("New").length).toBeGreaterThanOrEqual(1);
    });

    it("should have Prompt Library link", () => {
      render(<Footer />);

      expect(screen.getByText("Prompt Library")).toBeInTheDocument();
    });

    it("should have Chat link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute(
        "href",
        "/inbox"
      );
    });
  });

  describe("AI Assistant Button", () => {
    it("should render AI Assistant button", () => {
      render(<Footer />);

      expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    });

    it("should call openAIAssistant when clicked", () => {
      render(<Footer />);

      const button = screen.getByRole("button", { name: /AI Assistant/i });
      fireEvent.click(button);

      expect(mockOpenAIAssistant).toHaveBeenCalled();
    });

    it("should have keyboard shortcut in title", () => {
      render(<Footer />);

      const button = screen.getByRole("button", { name: /AI Assistant/i });
      expect(button).toHaveAttribute("title", expect.stringContaining("Cmd"));
    });
  });

  describe("Documentation Links", () => {
    it("should have Getting Started link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /Getting Started/i })).toHaveAttribute(
        "href",
        "/docs/getting-started"
      );
    });

    it("should have Configuration link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /Configuration/i })).toHaveAttribute(
        "href",
        "/docs/configuration"
      );
    });

    it("should have external Official Docs link", () => {
      render(<Footer />);

      const link = screen.getByRole("link", { name: /Official Docs/i });
      expect(link).toHaveAttribute("href", "https://docs.anthropic.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Resources Links", () => {
    it("should have MCP Servers link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /MCP Servers/i })).toHaveAttribute(
        "href",
        "/resources/mcp-servers"
      );
    });

    it("should have Submit Resource link with badge", () => {
      render(<Footer />);

      const link = screen.getByRole("link", { name: /Submit Resource/i });
      expect(link).toHaveAttribute("href", "/resources/submit");
    });
  });

  describe("Project Links", () => {
    it("should have GitHub external link", () => {
      render(<Footer />);

      // GitHub appears multiple times (Project column + social links), get all and check one has the right attributes
      const links = screen.getAllByRole("link", { name: /GitHub/i });
      const externalLink = links.find(link => link.getAttribute("href")?.includes("github.com"));
      expect(externalLink).toBeDefined();
      expect(externalLink).toHaveAttribute("target", "_blank");
    });

    it("should have Changelog link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /Changelog/i })).toHaveAttribute(
        "href",
        "/changelog"
      );
    });

    it("should have Donate link with highlight styling", () => {
      render(<Footer />);

      const link = screen.getByRole("link", { name: /Donate/i });
      expect(link).toHaveAttribute("href", "/donate");
      expect(link.className).toContain("pink");
    });
  });

  describe("Legal Links", () => {
    it("should have Privacy link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /Privacy/i })).toHaveAttribute(
        "href",
        "/privacy"
      );
    });

    it("should have Terms link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /Terms/i })).toHaveAttribute(
        "href",
        "/terms"
      );
    });

    it("should have Disclaimer link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /Disclaimer/i })).toHaveAttribute(
        "href",
        "/disclaimer"
      );
    });

    it("should have Accessibility link", () => {
      render(<Footer />);

      expect(screen.getByRole("link", { name: /Accessibility/i })).toHaveAttribute(
        "href",
        "/accessibility"
      );
    });
  });

  describe("Social Links", () => {
    it("should have GitHub social link", () => {
      render(<Footer />);

      const links = screen.getAllByLabelText("GitHub");
      expect(links.length).toBeGreaterThanOrEqual(1);
    });

    it("should have X/Twitter social link", () => {
      render(<Footer />);

      const link = screen.getByLabelText("X (Twitter)");
      expect(link).toHaveAttribute("href", "https://x.com/claudeinsider");
    });

    it("should open social links in new tab", () => {
      render(<Footer />);

      const link = screen.getByLabelText("X (Twitter)");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Bottom Bar", () => {
    it("should render copyright text", () => {
      render(<Footer />);

      expect(screen.getByText(/©/)).toBeInTheDocument();
    });

    it("should include current year in copyright", () => {
      render(<Footer />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(String(currentYear)))).toBeInTheDocument();
    });

    it("should have author attribution", () => {
      render(<Footer />);

      expect(screen.getByText("Vladimir Dukelic")).toBeInTheDocument();
    });
  });

  describe("Version Button", () => {
    it("should render version button", () => {
      render(<Footer />);

      const versionButton = screen.getByText(/v1\.21\.0/);
      expect(versionButton).toBeInTheDocument();
    });

    it("should call openVersionPopup when clicked", () => {
      render(<Footer />);

      const versionButton = screen.getByText(/v1\.21\.0/);
      fireEvent.click(versionButton);

      expect(mockOpenVersionPopup).toHaveBeenCalled();
    });

    it("should have tooltip about changelog", () => {
      render(<Footer />);

      const versionButton = screen.getByText(/v1\.21\.0/);
      expect(versionButton).toHaveAttribute("title", "View version changelog");
    });
  });

  describe("Utility Components", () => {
    it("should render FooterLanguageSelector", () => {
      render(<Footer />);

      expect(screen.getByTestId("footer-language-selector")).toBeInTheDocument();
    });

    it("should render SoundToggle", () => {
      render(<Footer />);

      expect(screen.getByTestId("sound-toggle")).toBeInTheDocument();
    });

    it("should render ThemeToggle", () => {
      render(<Footer />);

      expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    });

    it("should have separator dividers between utilities", () => {
      const { container } = render(<Footer />);

      // Look for divider elements
      const dividers = container.querySelectorAll(".w-px.h-4");
      expect(dividers.length).toBe(2);
    });
  });

  describe("Styling", () => {
    it("should have border-t on footer", () => {
      render(<Footer />);

      const footer = screen.getByRole("contentinfo");
      expect(footer.className).toContain("border-t");
    });

    it("should have gray background", () => {
      render(<Footer />);

      const footer = screen.getByRole("contentinfo");
      expect(footer.className).toContain("bg-gray-50");
    });

    it("should have max-width container", () => {
      const { container } = render(<Footer />);

      expect(container.querySelector(".max-w-\\[1440px\\]")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label on home links", () => {
      render(<Footer />);

      const homeLinks = screen.getAllByLabelText("Claude Insider home");
      expect(homeLinks.length).toBeGreaterThanOrEqual(1);
    });

    it("should have aria-labels on social links", () => {
      render(<Footer />);

      expect(screen.getByLabelText("X (Twitter)")).toBeInTheDocument();
    });
  });

  describe("Grid Layout", () => {
    it("should have 5-column grid for link columns on large screens", () => {
      const { container } = render(<Footer />);

      expect(container.querySelector(".lg\\:grid-cols-5")).toBeInTheDocument();
    });

    it("should have 2-column grid on small screens", () => {
      const { container } = render(<Footer />);

      expect(container.querySelector(".grid-cols-2")).toBeInTheDocument();
    });
  });
});
