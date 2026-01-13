/**
 * LinkPreview Component Tests
 *
 * Tests for the link preview component:
 * - Loading state
 * - Error state
 * - Card and inline variants
 * - Image and video display
 * - Site info with favicon
 * - Title and description
 * - Click handling
 * - LinkPreviewList
 * - Size variants
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LinkPreview, LinkPreviewCard, LinkPreviewList, LinkPreviewSkeleton } from "@/components/chat/link-preview";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock unfurl utilities
const mockUnfurl = vi.fn();
vi.mock("@/lib/chat/unfurl", () => ({
  getLinkUnfurler: () => ({
    unfurl: mockUnfurl,
  }),
  getDomainName: (url: string) => new URL(url).hostname.replace("www.", ""),
  getYouTubeVideoId: (url: string) => {
    if (url.includes("youtube.com/watch")) {
      return "dQw4w9WgXcQ";
    }
    return null;
  },
  isVideoUrl: (url: string) => url.includes("youtube.com") || url.includes("vimeo.com"),
}));

describe("LinkPreview", () => {
  const mockUnfurlData = {
    url: "https://example.com/article",
    title: "Amazing Article Title",
    description: "This is a fascinating article about something interesting.",
    image: "https://example.com/image.jpg",
    siteName: "Example Site",
    favicon: "https://example.com/favicon.ico",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnfurl.mockResolvedValue({ data: mockUnfurlData });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should show skeleton while loading", () => {
      mockUnfurl.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<LinkPreview url="https://example.com" />);

      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });

    it("should not show skeleton when data is pre-provided", () => {
      const { container } = render(
        <LinkPreview url="https://example.com" data={mockUnfurlData} />
      );

      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeNull();
    });
  });

  describe("Error State", () => {
    it("should show minimal link on error", async () => {
      mockUnfurl.mockResolvedValue({ error: "Failed to fetch" });
      render(<LinkPreview url="https://example.com" />);

      await waitFor(() => {
        const link = screen.getByText("example.com");
        expect(link).toBeInTheDocument();
        expect(link.tagName).toBe("A");
      });
    });

    it("should show minimal link when no data returned", async () => {
      mockUnfurl.mockResolvedValue({});
      render(<LinkPreview url="https://example.com" />);

      await waitFor(() => {
        expect(screen.getByText("example.com")).toBeInTheDocument();
      });
    });
  });

  describe("Card Variant", () => {
    it("should render card by default", async () => {
      render(<LinkPreview url="https://example.com" data={mockUnfurlData} />);

      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    it("should display title", async () => {
      render(<LinkPreview url="https://example.com" data={mockUnfurlData} />);

      expect(screen.getByText("Amazing Article Title")).toBeInTheDocument();
    });

    it("should display description", async () => {
      render(<LinkPreview url="https://example.com" data={mockUnfurlData} />);

      expect(screen.getByText(/This is a fascinating article/)).toBeInTheDocument();
    });

    it("should display site name", async () => {
      render(<LinkPreview url="https://example.com" data={mockUnfurlData} />);

      expect(screen.getByText("Example Site")).toBeInTheDocument();
    });

    it("should display image", async () => {
      render(<LinkPreview url="https://example.com" data={mockUnfurlData} />);

      // Alt text is the title when available
      const img = screen.getByAltText("Amazing Article Title");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    it("should display favicon", async () => {
      const { container } = render(<LinkPreview url="https://example.com" data={mockUnfurlData} />);

      const favicon = container.querySelector('img[src="https://example.com/favicon.ico"]');
      expect(favicon).toBeInTheDocument();
    });
  });

  describe("Inline Variant", () => {
    it("should render inline when variant is inline", async () => {
      render(<LinkPreview url="https://example.com" data={mockUnfurlData} variant="inline" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should show title in inline mode", async () => {
      render(<LinkPreview url="https://example.com" data={mockUnfurlData} variant="inline" />);

      expect(screen.getByText("Amazing Article Title")).toBeInTheDocument();
    });
  });

  describe("Click Handling", () => {
    it("should call onClick when provided", async () => {
      const onClick = vi.fn();
      render(<LinkPreview url="https://example.com" data={mockUnfurlData} onClick={onClick} />);

      fireEvent.click(screen.getByRole("article"));
      expect(onClick).toHaveBeenCalled();
    });

    it("should open URL in new tab when no onClick", async () => {
      const windowOpen = vi.spyOn(window, "open").mockImplementation(() => null);
      render(<LinkPreview url="https://example.com" data={mockUnfurlData} />);

      fireEvent.click(screen.getByRole("article"));
      expect(windowOpen).toHaveBeenCalledWith(
        "https://example.com/article",
        "_blank",
        "noopener,noreferrer"
      );
    });
  });

  describe("Size Variants", () => {
    it("should render small size", () => {
      const { container } = render(
        <LinkPreview url="https://example.com" data={mockUnfurlData} size="sm" />
      );

      const card = container.querySelector("[class*='max-w-[320px]']");
      expect(card).toBeInTheDocument();
    });

    it("should render medium size by default", () => {
      const { container } = render(
        <LinkPreview url="https://example.com" data={mockUnfurlData} />
      );

      const card = container.querySelector("[class*='max-w-sm']");
      expect(card).toBeInTheDocument();
    });

    it("should render large size", () => {
      const { container } = render(
        <LinkPreview url="https://example.com" data={mockUnfurlData} size="lg" />
      );

      const card = container.querySelector("[class*='max-w-md']");
      expect(card).toBeInTheDocument();
    });
  });

  describe("YouTube Videos", () => {
    it("should show YouTube thumbnail", () => {
      const youtubeData = {
        ...mockUnfurlData,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      };
      render(<LinkPreview url={youtubeData.url} data={youtubeData} />);

      // YouTube thumbnails use title as alt text
      const img = screen.getByAltText("Amazing Article Title");
      expect(img).toHaveAttribute("src", expect.stringContaining("youtube.com/vi/dQw4w9WgXcQ"));
    });

    it("should show play button overlay for video URLs", () => {
      const youtubeData = {
        ...mockUnfurlData,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      };
      const { container } = render(<LinkPreview url={youtubeData.url} data={youtubeData} />);

      const playButton = container.querySelector("[class*='bg-red-600']");
      expect(playButton).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <LinkPreview url="https://example.com" data={mockUnfurlData} className="custom-class" />
      );

      const article = container.querySelector(".custom-class");
      expect(article).toBeInTheDocument();
    });
  });
});

describe("LinkPreviewCard", () => {
  const mockData = {
    url: "https://example.com",
    title: "Card Title",
    description: "Card description text",
    image: "https://example.com/image.jpg",
    siteName: "Example",
    favicon: "https://example.com/favicon.ico",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render article element", () => {
    render(<LinkPreviewCard data={mockData} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("should show title", () => {
    render(<LinkPreviewCard data={mockData} />);
    expect(screen.getByText("Card Title")).toBeInTheDocument();
  });

  it("should handle missing image gracefully", () => {
    const dataWithoutImage = { ...mockData, image: undefined };
    render(<LinkPreviewCard data={dataWithoutImage} />);

    expect(screen.queryByAltText("Preview")).not.toBeInTheDocument();
  });

  it("should handle missing favicon", () => {
    const dataWithoutFavicon = { ...mockData, favicon: undefined };
    const { container } = render(<LinkPreviewCard data={dataWithoutFavicon} />);

    // Should show globe icon fallback
    const globeIcon = container.querySelector("svg");
    expect(globeIcon).toBeInTheDocument();
  });

  it("should fall back to domain when no siteName", () => {
    const dataWithoutSiteName = { ...mockData, siteName: undefined };
    render(<LinkPreviewCard data={dataWithoutSiteName} />);

    expect(screen.getByText("example.com")).toBeInTheDocument();
  });

  it("should be clickable", () => {
    const onClick = vi.fn();
    render(<LinkPreviewCard data={mockData} onClick={onClick} />);

    fireEvent.click(screen.getByRole("article"));
    expect(onClick).toHaveBeenCalled();
  });

  it("should have hover effects", () => {
    const { container } = render(<LinkPreviewCard data={mockData} />);
    const card = container.querySelector("[class*='hover:border-blue-500']");
    expect(card).toBeInTheDocument();
  });
});

describe("LinkPreviewList", () => {
  const mockUrls = [
    "https://example1.com",
    "https://example2.com",
    "https://example3.com",
    "https://example4.com",
    "https://example5.com",
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnfurl.mockImplementation((url: string) => Promise.resolve({
      data: {
        url,
        title: `Title for ${new URL(url).hostname}`,
        description: "Description",
      },
    }));
  });

  it("should render nothing when no URLs", () => {
    const { container } = render(<LinkPreviewList urls={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should limit to maxPreviews", async () => {
    render(<LinkPreviewList urls={mockUrls} maxPreviews={2} />);

    // Should show "+3 more links" text
    await waitFor(() => {
      expect(screen.getByText("+3 more links")).toBeInTheDocument();
    });
  });

  it("should use default maxPreviews of 3", async () => {
    render(<LinkPreviewList urls={mockUrls} />);

    await waitFor(() => {
      expect(screen.getByText("+2 more links")).toBeInTheDocument();
    });
  });

  it("should show singular 'link' for one remaining", async () => {
    render(<LinkPreviewList urls={mockUrls.slice(0, 4)} maxPreviews={3} />);

    await waitFor(() => {
      expect(screen.getByText("+1 more link")).toBeInTheDocument();
    });
  });

  it("should not show remaining count when all displayed", () => {
    render(<LinkPreviewList urls={mockUrls.slice(0, 2)} maxPreviews={3} />);
    expect(screen.queryByText(/more link/)).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <LinkPreviewList urls={["https://example.com"]} className="custom-list" />
    );
    expect(container.querySelector(".custom-list")).toBeInTheDocument();
  });

  it("should accept size prop", () => {
    render(<LinkPreviewList urls={["https://example.com"]} size="lg" />);
    // Size is passed to child LinkPreview components
    expect(screen.queryByText(/example/)).toBeDefined();
  });
});

describe("LinkPreviewSkeleton", () => {
  it("should render skeleton", () => {
    const { container } = render(<LinkPreviewSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("should have proper card styling", () => {
    const { container } = render(<LinkPreviewSkeleton />);
    expect(container.querySelector("[class*='rounded-xl']")).toBeInTheDocument();
  });

  it("should render small size skeleton", () => {
    const { container } = render(<LinkPreviewSkeleton size="sm" />);
    expect(container.querySelector("[class*='max-w-[320px]']")).toBeInTheDocument();
  });

  it("should render large size skeleton", () => {
    const { container } = render(<LinkPreviewSkeleton size="lg" />);
    expect(container.querySelector("[class*='max-w-md']")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<LinkPreviewSkeleton className="custom-skeleton" />);
    expect(container.querySelector(".custom-skeleton")).toBeInTheDocument();
  });

  it("should have image placeholder area", () => {
    const { container } = render(<LinkPreviewSkeleton />);
    // Should have aspect ratio container for image
    const imageArea = container.querySelector("[class*='aspect-']");
    expect(imageArea).toBeInTheDocument();
  });
});
