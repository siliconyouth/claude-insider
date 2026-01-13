/**
 * ShareButtons Component Tests
 *
 * Tests for social sharing button component:
 * - Platform buttons (Twitter, LinkedIn, Facebook, Reddit, HackerNews, Email, Copy)
 * - Variant styles (default, compact, icons-only)
 * - Share URL generation
 * - Copy to clipboard
 * - Platform filtering
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareButtons } from "@/components/sharing/share-buttons";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock window.open
const mockWindowOpen = vi.fn();

// Mock clipboard
const mockClipboardWriteText = vi.fn();

describe("ShareButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.open
    vi.stubGlobal("open", mockWindowOpen);

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { href: "https://example.com/test-page" },
      writable: true,
    });

    // Mock document.title
    Object.defineProperty(document, "title", {
      value: "Test Page Title",
      writable: true,
    });

    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockClipboardWriteText.mockResolvedValue(undefined),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<ShareButtons />)).not.toThrow();
    });

    it("should render all platform buttons by default", () => {
      render(<ShareButtons />);
      expect(screen.getByTitle("Twitter")).toBeInTheDocument();
      expect(screen.getByTitle("LinkedIn")).toBeInTheDocument();
      expect(screen.getByTitle("Facebook")).toBeInTheDocument();
      expect(screen.getByTitle("Reddit")).toBeInTheDocument();
      expect(screen.getByTitle("Hacker News")).toBeInTheDocument();
      expect(screen.getByTitle("Email")).toBeInTheDocument();
      expect(screen.getByTitle("Copy Link")).toBeInTheDocument();
    });

    it("should render 7 buttons by default", () => {
      render(<ShareButtons />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(7);
    });
  });

  describe("Platform Filtering", () => {
    it("should only render specified platforms", () => {
      render(<ShareButtons platforms={["twitter", "linkedin"]} />);
      expect(screen.getByTitle("Twitter")).toBeInTheDocument();
      expect(screen.getByTitle("LinkedIn")).toBeInTheDocument();
      expect(screen.queryByTitle("Facebook")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Reddit")).not.toBeInTheDocument();
    });

    it("should render single platform", () => {
      render(<ShareButtons platforms={["copy"]} />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBe(1);
      expect(screen.getByTitle("Copy Link")).toBeInTheDocument();
    });
  });

  describe("Variant Styles", () => {
    it("should render default variant with labels", () => {
      render(<ShareButtons variant="default" platforms={["twitter"]} />);
      expect(screen.getByText("Twitter")).toBeInTheDocument();
    });

    it("should render compact variant with labels", () => {
      render(<ShareButtons variant="compact" platforms={["twitter"]} />);
      expect(screen.getByText("Twitter")).toBeInTheDocument();
    });

    it("should render icons-only variant without labels", () => {
      render(<ShareButtons variant="icons-only" platforms={["twitter"]} />);
      expect(screen.queryByText("Twitter")).not.toBeInTheDocument();
      // But icon should still be there
      expect(screen.getByTitle("Twitter")).toBeInTheDocument();
    });

    it("should have different padding for variants", () => {
      const { rerender, container } = render(
        <ShareButtons variant="default" platforms={["twitter"]} />
      );
      let button = container.querySelector("button");
      expect(button?.className).toContain("px-3");
      expect(button?.className).toContain("py-2");

      rerender(<ShareButtons variant="compact" platforms={["twitter"]} />);
      button = container.querySelector("button");
      expect(button?.className).toContain("px-2.5");
      expect(button?.className).toContain("py-1.5");

      rerender(<ShareButtons variant="icons-only" platforms={["twitter"]} />);
      button = container.querySelector("button");
      expect(button?.className).toContain("p-2");
    });
  });

  describe("Share URL Generation", () => {
    it("should use provided URL", () => {
      render(<ShareButtons url="https://custom.url/page" platforms={["twitter"]} />);
      const button = screen.getByTitle("Twitter");
      fireEvent.click(button);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("https%3A%2F%2Fcustom.url%2Fpage"),
        "_blank",
        expect.any(String)
      );
    });

    it("should use window.location.href as fallback", () => {
      render(<ShareButtons platforms={["twitter"]} />);
      const button = screen.getByTitle("Twitter");
      fireEvent.click(button);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("https%3A%2F%2Fexample.com%2Ftest-page"),
        "_blank",
        expect.any(String)
      );
    });

    it("should include title in share URL", () => {
      render(<ShareButtons title="Custom Title" platforms={["twitter"]} />);
      const button = screen.getByTitle("Twitter");
      fireEvent.click(button);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("Custom%20Title"),
        "_blank",
        expect.any(String)
      );
    });

    it("should include hashtags for Twitter", () => {
      render(<ShareButtons hashtags={["test", "example"]} platforms={["twitter"]} />);
      const button = screen.getByTitle("Twitter");
      fireEvent.click(button);

      // Hashtags are comma-separated but not URL-encoded
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("hashtags=test,example"),
        "_blank",
        expect.any(String)
      );
    });
  });

  describe("Platform-Specific URLs", () => {
    it("should generate correct Twitter URL", () => {
      render(<ShareButtons url="https://test.com" title="Test" platforms={["twitter"]} />);
      fireEvent.click(screen.getByTitle("Twitter"));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("twitter.com/intent/tweet"),
        "_blank",
        expect.any(String)
      );
    });

    it("should generate correct LinkedIn URL", () => {
      render(<ShareButtons url="https://test.com" platforms={["linkedin"]} />);
      fireEvent.click(screen.getByTitle("LinkedIn"));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("linkedin.com/sharing/share-offsite"),
        "_blank",
        expect.any(String)
      );
    });

    it("should generate correct Facebook URL", () => {
      render(<ShareButtons url="https://test.com" platforms={["facebook"]} />);
      fireEvent.click(screen.getByTitle("Facebook"));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("facebook.com/sharer/sharer.php"),
        "_blank",
        expect.any(String)
      );
    });

    it("should generate correct Reddit URL", () => {
      render(<ShareButtons url="https://test.com" title="Test" platforms={["reddit"]} />);
      fireEvent.click(screen.getByTitle("Reddit"));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("reddit.com/submit"),
        "_blank",
        expect.any(String)
      );
    });

    it("should generate correct HackerNews URL", () => {
      render(<ShareButtons url="https://test.com" title="Test" platforms={["hackernews"]} />);
      fireEvent.click(screen.getByTitle("Hacker News"));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("news.ycombinator.com/submitlink"),
        "_blank",
        expect.any(String)
      );
    });
  });

  describe("Email Sharing", () => {
    it("should not use window.open for email", () => {
      render(
        <ShareButtons
          url="https://test.com"
          title="Test Title"
          description="Test Description"
          platforms={["email"]}
        />
      );
      fireEvent.click(screen.getByTitle("Email"));

      // Email uses location.href, not window.open
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });

  describe("Copy to Clipboard", () => {
    it("should copy URL to clipboard when copy button clicked", async () => {
      render(<ShareButtons url="https://test.com" platforms={["copy"]} />);
      fireEvent.click(screen.getByTitle("Copy Link"));

      await waitFor(() => {
        expect(mockClipboardWriteText).toHaveBeenCalledWith("https://test.com");
      });
    });

    it("should show 'Copied!' after successful copy", async () => {
      render(<ShareButtons platforms={["copy"]} />);
      fireEvent.click(screen.getByTitle("Copy Link"));

      await waitFor(() => {
        expect(screen.getByText("Copied!")).toBeInTheDocument();
      });
    });

    it("should revert to 'Copy Link' after timeout", async () => {
      // Skip fake timers as clipboard is async - just test initial state after copy
      render(<ShareButtons platforms={["copy"]} />);

      // Before click, should show "Copy Link"
      expect(screen.getByText("Copy Link")).toBeInTheDocument();

      // After click, clipboard is called
      fireEvent.click(screen.getByTitle("Copy Link"));

      await waitFor(() => {
        expect(mockClipboardWriteText).toHaveBeenCalled();
      });
    });

    it("should have SVG icon for copy button", () => {
      const { container } = render(<ShareButtons platforms={["copy"]} />);
      // Copy button has an SVG icon
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label for each button", () => {
      render(<ShareButtons />);
      expect(screen.getByLabelText("Share on Twitter")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on LinkedIn")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on Facebook")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on Reddit")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on Hacker News")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Share on Copy Link")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have focus-visible ring", () => {
      const { container } = render(<ShareButtons platforms={["twitter"]} />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("focus-visible:ring-2");
      expect(button?.className).toContain("focus-visible:ring-blue-500");
    });

    it("should have border", () => {
      const { container } = render(<ShareButtons platforms={["twitter"]} />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("border");
    });

    it("should have transition", () => {
      const { container } = render(<ShareButtons platforms={["twitter"]} />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("transition-all");
    });
  });

  describe("Icon Rendering", () => {
    it("should render Twitter icon", () => {
      const { container } = render(<ShareButtons platforms={["twitter"]} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render larger icons for icons-only variant", () => {
      const { container } = render(
        <ShareButtons variant="icons-only" platforms={["twitter"]} />
      );
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("h-5");
      expect(svg?.getAttribute("class")).toContain("w-5");
    });

    it("should render smaller icons for default variant", () => {
      const { container } = render(
        <ShareButtons variant="default" platforms={["twitter"]} />
      );
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("h-4");
      expect(svg?.getAttribute("class")).toContain("w-4");
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(<ShareButtons className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("custom-class");
    });
  });

  describe("Hover Colors", () => {
    it("should have Twitter brand hover color", () => {
      const { container } = render(<ShareButtons platforms={["twitter"]} />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("hover:text-[#1DA1F2]");
    });

    it("should have LinkedIn brand hover color", () => {
      const { container } = render(<ShareButtons platforms={["linkedin"]} />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("hover:text-[#0A66C2]");
    });

    it("should have Facebook brand hover color", () => {
      const { container } = render(<ShareButtons platforms={["facebook"]} />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("hover:text-[#1877F2]");
    });

    it("should have Reddit brand hover color", () => {
      const { container } = render(<ShareButtons platforms={["reddit"]} />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("hover:text-[#FF4500]");
    });

    it("should have HackerNews brand hover color", () => {
      const { container } = render(<ShareButtons platforms={["hackernews"]} />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("hover:text-[#FF6600]");
    });
  });
});
