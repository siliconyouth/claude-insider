/**
 * LazyImage Component Tests
 *
 * Tests for the lazy loading image components:
 * - LazyImage: Main lazy loading image with blur placeholder
 * - BlurUpImage: Simpler blur-up effect with base64 placeholder
 * - ResponsiveLazyImage: Responsive fill image with lazy loading
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LazyImage, BlurUpImage, ResponsiveLazyImage } from "@/components/lazy-image";

// Track intersection observer state
let mockIsIntersecting = false;
const mockRef = { current: null };

vi.mock("@/hooks/use-intersection-observer", () => ({
  useIntersectionObserver: vi.fn(({ triggerOnce: _triggerOnce, enabled = true }) => ({
    ref: mockRef,
    isIntersecting: enabled ? mockIsIntersecting : false,
    entry: null,
  })),
}));

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock Skeleton component
vi.mock("@/components/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock next/image - handle boolean props specially
vi.mock("next/image", () => ({
  default: vi.fn(({ onLoad, onError, className, alt, src, priority, fill, ...props }) => (
    <img
      data-testid="next-image"
      src={src}
      alt={alt}
      className={className}
      onLoad={onLoad}
      onError={onError}
      data-priority={priority ? "true" : undefined}
      data-fill={fill ? "true" : undefined}
      {...props}
    />
  )),
}));

describe("LazyImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsIntersecting = false;
  });

  describe("Initial Render", () => {
    it("should render container with background", () => {
      const { container } = render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      expect(container.querySelector(".relative.overflow-hidden")).toBeInTheDocument();
    });

    it("should apply containerClassName", () => {
      const { container } = render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          containerClassName="custom-container"
        />
      );

      expect(container.querySelector(".custom-container")).toBeInTheDocument();
    });

    it("should set aspect ratio from width/height", () => {
      const { container } = render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      const div = container.firstChild as HTMLElement;
      expect(div.style.aspectRatio).toBe("800/600");
    });

    it("should use explicit aspectRatio over width/height", () => {
      const { container } = render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          aspectRatio="16/9"
        />
      );

      const div = container.firstChild as HTMLElement;
      expect(div.style.aspectRatio).toBe("16/9");
    });
  });

  describe("Placeholder", () => {
    it("should show skeleton by default when not loaded", () => {
      render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });

    it("should hide skeleton when showSkeleton is false", () => {
      render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          showSkeleton={false}
        />
      );

      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });

    it("should show blur placeholder when provided", () => {
      const { container } = render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          blurPlaceholder="data:image/jpeg;base64,abc123"
        />
      );

      const blurDiv = container.querySelector(".blur-lg");
      expect(blurDiv).toBeInTheDocument();
      expect(blurDiv).toHaveStyle({
        backgroundImage: "url(data:image/jpeg;base64,abc123)",
      });
    });

    it("should show custom placeholder when provided", () => {
      render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          customPlaceholder={<div data-testid="custom-placeholder">Loading...</div>}
        />
      );

      expect(screen.getByTestId("custom-placeholder")).toBeInTheDocument();
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });

    it("should prioritize blur placeholder over custom", () => {
      const { container } = render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          blurPlaceholder="data:image/jpeg;base64,abc123"
          customPlaceholder={<div data-testid="custom-placeholder">Loading...</div>}
        />
      );

      expect(container.querySelector(".blur-lg")).toBeInTheDocument();
      expect(screen.queryByTestId("custom-placeholder")).not.toBeInTheDocument();
    });
  });

  describe("Lazy Loading", () => {
    it("should not render image when not intersecting", () => {
      mockIsIntersecting = false;

      render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
    });

    it("should render image when intersecting", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      expect(screen.getByTestId("next-image")).toBeInTheDocument();
    });

    it("should pass rootMargin to intersection observer", async () => {
      const { useIntersectionObserver } = await import("@/hooks/use-intersection-observer");

      render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          rootMargin="300px"
        />
      );

      expect(useIntersectionObserver).toHaveBeenCalledWith(
        expect.objectContaining({
          rootMargin: "300px",
        })
      );
    });
  });

  describe("Loading State", () => {
    it("should have opacity-0 when not loaded", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      const img = screen.getByTestId("next-image");
      expect(img).toHaveClass("opacity-0");
    });

    it("should have opacity-100 after load", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      const img = screen.getByTestId("next-image");
      fireEvent.load(img);

      expect(img).toHaveClass("opacity-100");
    });

    it("should hide placeholder after load", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      // Before load - skeleton visible
      expect(screen.getByTestId("skeleton")).toBeInTheDocument();

      // Trigger load
      fireEvent.load(screen.getByTestId("next-image"));

      // After load - skeleton hidden
      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });

    it("should apply custom fade duration", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          fadeDuration={1000}
        />
      );

      const img = screen.getByTestId("next-image");
      expect(img).toHaveStyle({ transitionDuration: "1000ms" });
    });
  });

  describe("Error State", () => {
    it("should show error state on image error", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      const img = screen.getByTestId("next-image");
      fireEvent.error(img);

      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });

    it("should hide image on error", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      const img = screen.getByTestId("next-image");
      fireEvent.error(img);

      expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
    });

    it("should show broken image icon on error", () => {
      mockIsIntersecting = true;

      const { container } = render(
        <LazyImage src="/test.jpg" alt="Test image" width={800} height={600} />
      );

      const img = screen.getByTestId("next-image");
      fireEvent.error(img);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Image Props", () => {
    it("should pass src to image", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage src="/hero.jpg" alt="Test image" width={800} height={600} />
      );

      expect(screen.getByTestId("next-image")).toHaveAttribute("src", "/hero.jpg");
    });

    it("should pass alt to image", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage src="/test.jpg" alt="Beautiful sunset" width={800} height={600} />
      );

      expect(screen.getByTestId("next-image")).toHaveAttribute("alt", "Beautiful sunset");
    });

    it("should pass width and height to image", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage src="/test.jpg" alt="Test image" width={1200} height={800} />
      );

      const img = screen.getByTestId("next-image");
      expect(img).toHaveAttribute("width", "1200");
      expect(img).toHaveAttribute("height", "800");
    });

    it("should pass className to image", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          className="custom-image"
        />
      );

      expect(screen.getByTestId("next-image")).toHaveClass("custom-image");
    });

    it("should pass additional props to image", () => {
      mockIsIntersecting = true;

      render(
        <LazyImage
          src="/test.jpg"
          alt="Test image"
          width={800}
          height={600}
          priority
          quality={90}
        />
      );

      const img = screen.getByTestId("next-image");
      expect(img).toHaveAttribute("data-priority", "true");
      expect(img).toHaveAttribute("quality", "90");
    });
  });
});

describe("BlurUpImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render image", () => {
      render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={800}
          height={600}
        />
      );

      expect(screen.getByTestId("next-image")).toBeInTheDocument();
    });

    it("should render blur placeholder", () => {
      const { container } = render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={800}
          height={600}
        />
      );

      const blurDiv = container.querySelector("[style*='blur']");
      expect(blurDiv).toBeInTheDocument();
    });

    it("should set aspect ratio", () => {
      const { container } = render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={1920}
          height={1080}
        />
      );

      const div = container.firstChild as HTMLElement;
      expect(div.style.aspectRatio).toBe("1920/1080");
    });

    it("should apply className", () => {
      const { container } = render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={800}
          height={600}
          className="custom-class"
        />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });

  describe("Loading Transition", () => {
    it("should show placeholder initially", () => {
      const { container } = render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={800}
          height={600}
        />
      );

      // Placeholder should be visible (opacity-100)
      const blurDiv = container.querySelector(".opacity-100.scale-110");
      expect(blurDiv).toBeInTheDocument();
    });

    it("should have image at opacity-0 initially", () => {
      render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={800}
          height={600}
        />
      );

      const img = screen.getByTestId("next-image");
      expect(img).toHaveClass("opacity-0");
    });

    it("should fade in image on load", () => {
      render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={800}
          height={600}
        />
      );

      const img = screen.getByTestId("next-image");
      fireEvent.load(img);

      expect(img).toHaveClass("opacity-100");
    });

    it("should fade out placeholder on load", () => {
      const { container } = render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={800}
          height={600}
        />
      );

      const img = screen.getByTestId("next-image");
      fireEvent.load(img);

      // After load, placeholder should have opacity-0
      const blurDiv = container.querySelector(".opacity-0.scale-110");
      expect(blurDiv).toBeInTheDocument();
    });
  });

  describe("Priority Loading", () => {
    it("should pass priority prop to image", () => {
      render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={800}
          height={600}
          priority
        />
      );

      expect(screen.getByTestId("next-image")).toHaveAttribute("data-priority", "true");
    });
  });

  describe("Placeholder Styling", () => {
    it("should have blur filter on placeholder", () => {
      const { container } = render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,abc123"
          width={800}
          height={600}
        />
      );

      const blurDiv = container.querySelector(".scale-110") as HTMLElement;
      expect(blurDiv.style.filter).toBe("blur(20px)");
    });

    it("should set background image from placeholder", () => {
      const { container } = render(
        <BlurUpImage
          src="/test.jpg"
          alt="Test image"
          placeholder="data:image/jpeg;base64,xyz789"
          width={800}
          height={600}
        />
      );

      const blurDiv = container.querySelector(".scale-110") as HTMLElement;
      // Browser may add quotes around URL value
      expect(blurDiv.style.backgroundImage).toContain("data:image/jpeg;base64,xyz789");
    });
  });
});

describe("ResponsiveLazyImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsIntersecting = false;
  });

  describe("Rendering", () => {
    it("should render container", () => {
      const { container } = render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
        />
      );

      expect(container.querySelector(".relative.overflow-hidden")).toBeInTheDocument();
    });

    it("should set aspect ratio", () => {
      const { container } = render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="21/9"
        />
      );

      const div = container.firstChild as HTMLElement;
      expect(div.style.aspectRatio).toBe("21/9");
    });

    it("should apply containerClassName", () => {
      const { container } = render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
          containerClassName="hero-container"
        />
      );

      expect(container.querySelector(".hero-container")).toBeInTheDocument();
    });

    it("should apply className to image", () => {
      mockIsIntersecting = true;

      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
          className="hero-image"
        />
      );

      const img = screen.getByTestId("next-image");
      expect(img).toHaveClass("hero-image");
    });
  });

  describe("Skeleton", () => {
    it("should show skeleton when not loaded", () => {
      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
        />
      );

      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });

    it("should hide skeleton after load", () => {
      mockIsIntersecting = true;

      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
        />
      );

      const img = screen.getByTestId("next-image");
      fireEvent.load(img);

      expect(screen.queryByTestId("skeleton")).not.toBeInTheDocument();
    });
  });

  describe("Lazy Loading", () => {
    it("should not load image when not intersecting", () => {
      mockIsIntersecting = false;

      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
        />
      );

      expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
    });

    it("should load image when intersecting", () => {
      mockIsIntersecting = true;

      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
        />
      );

      expect(screen.getByTestId("next-image")).toBeInTheDocument();
    });
  });

  describe("Priority Loading", () => {
    it("should load immediately when priority is true", async () => {
      mockIsIntersecting = false;
      const { useIntersectionObserver } = await import("@/hooks/use-intersection-observer");

      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
          priority
        />
      );

      // With priority, enabled should be false
      expect(useIntersectionObserver).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );

      // Image should still render due to priority
      expect(screen.getByTestId("next-image")).toBeInTheDocument();
    });

    it("should pass priority prop to image", () => {
      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
          priority
        />
      );

      expect(screen.getByTestId("next-image")).toHaveAttribute("data-priority", "true");
    });
  });

  describe("Sizes", () => {
    it("should use default sizes", () => {
      mockIsIntersecting = true;

      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
        />
      );

      expect(screen.getByTestId("next-image")).toHaveAttribute("sizes", "100vw");
    });

    it("should use custom sizes", () => {
      mockIsIntersecting = true;

      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      );

      expect(screen.getByTestId("next-image")).toHaveAttribute(
        "sizes",
        "(max-width: 768px) 100vw, 50vw"
      );
    });
  });

  describe("Fill Mode", () => {
    it("should use fill prop for responsive sizing", () => {
      mockIsIntersecting = true;

      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
        />
      );

      expect(screen.getByTestId("next-image")).toHaveAttribute("data-fill", "true");
    });

    it("should have object-cover for fill mode", () => {
      mockIsIntersecting = true;

      render(
        <ResponsiveLazyImage
          src="/test.jpg"
          alt="Test image"
          aspectRatio="16/9"
        />
      );

      expect(screen.getByTestId("next-image")).toHaveClass("object-cover");
    });
  });
});

describe("Accessibility", () => {
  beforeEach(() => {
    mockIsIntersecting = true;
  });

  it("should have alt text on LazyImage", () => {
    render(
      <LazyImage src="/test.jpg" alt="Descriptive alt text" width={800} height={600} />
    );

    expect(screen.getByAltText("Descriptive alt text")).toBeInTheDocument();
  });

  it("should have alt text on BlurUpImage", () => {
    render(
      <BlurUpImage
        src="/test.jpg"
        alt="Another description"
        placeholder="data:image/jpeg;base64,abc"
        width={800}
        height={600}
      />
    );

    expect(screen.getByAltText("Another description")).toBeInTheDocument();
  });

  it("should have alt text on ResponsiveLazyImage", () => {
    render(
      <ResponsiveLazyImage
        src="/test.jpg"
        alt="Responsive image description"
        aspectRatio="16/9"
      />
    );

    expect(screen.getByAltText("Responsive image description")).toBeInTheDocument();
  });
});

describe("Edge Cases", () => {
  beforeEach(() => {
    mockIsIntersecting = true;
  });

  it("should handle missing width/height without aspectRatio", () => {
    const { container } = render(
      <LazyImage
        src="/test.jpg"
        alt="Test image"
        width={undefined as unknown as number}
        height={undefined as unknown as number}
      />
    );

    // Should still render without crashing
    expect(container.firstChild).toBeInTheDocument();
  });

  it("should render container even with problematic src", () => {
    mockIsIntersecting = true;
    const { container } = render(
      <LazyImage src="/invalid-path.jpg" alt="Invalid source" width={800} height={600} />
    );

    // Container should still render
    expect(container.querySelector(".relative.overflow-hidden")).toBeInTheDocument();
    expect(screen.getByTestId("next-image")).toBeInTheDocument();
  });

  it("should handle empty alt", () => {
    render(
      <LazyImage src="/test.jpg" alt="" width={800} height={600} />
    );

    expect(screen.getByTestId("next-image")).toHaveAttribute("alt", "");
  });

  it("should handle various aspect ratio formats", () => {
    const ratios = ["16/9", "4/3", "1/1", "21/9"];

    ratios.forEach((ratio) => {
      const { container, unmount } = render(
        <LazyImage src="/test.jpg" alt="Test" width={800} height={600} aspectRatio={ratio} />
      );

      const div = container.firstChild as HTMLElement;
      expect(div.style.aspectRatio).toBe(ratio);
      unmount();
    });
  });
});
