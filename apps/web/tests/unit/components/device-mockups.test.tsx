/**
 * DeviceMockups Component Tests
 *
 * Tests for the device mockup components:
 * - MacBookMockup: SVG-based MacBook Pro mockup
 * - IPhone17ProMax: SVG-based iPhone 17 Pro Max mockup
 * - IPhoneMockup: Deprecated alias for IPhone17ProMax
 * - MacBookTerminalContent: Terminal content display
 * - IPhoneScreenContent: Mobile screenshot display
 * - DeviceShowcase: Combined device showcase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MacBookMockup,
  IPhone17ProMax,
  IPhoneMockup,
  DeviceShowcase,
} from "@/components/device-mockups";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: vi.fn(({ onLoad, onError, className, alt, src, priority, fill, sizes, ...props }) => (
    <img
      data-testid="next-image"
      src={src}
      alt={alt}
      className={className}
      data-priority={priority ? "true" : undefined}
      data-fill={fill ? "true" : undefined}
      data-sizes={sizes}
      {...props}
    />
  )),
}));

describe("MacBookMockup", () => {
  describe("SVG Structure", () => {
    it("should render SVG with correct viewBox", () => {
      const { container } = render(<MacBookMockup />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 800 520");
    });

    it("should have gradient definitions", () => {
      const { container } = render(<MacBookMockup />);

      expect(container.querySelector("#macbook-body")).toBeInTheDocument();
      expect(container.querySelector("#macbook-bezel")).toBeInTheDocument();
      expect(container.querySelector("#macbook-hinge")).toBeInTheDocument();
      expect(container.querySelector("#edge-highlight")).toBeInTheDocument();
    });

    it("should render main body rectangle", () => {
      const { container } = render(<MacBookMockup />);

      const mainBody = container.querySelector('rect[x="20"][y="10"]');
      expect(mainBody).toBeInTheDocument();
      expect(mainBody).toHaveAttribute("width", "760");
      expect(mainBody).toHaveAttribute("height", "460");
    });

    it("should render screen bezel", () => {
      const { container } = render(<MacBookMockup />);

      const bezel = container.querySelector('rect[x="32"][y="22"]');
      expect(bezel).toBeInTheDocument();
      expect(bezel).toHaveAttribute("width", "736");
    });

    it("should render notch/camera area", () => {
      const { container } = render(<MacBookMockup />);

      const notch = container.querySelector("path");
      expect(notch).toBeInTheDocument();

      // Camera circles
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThanOrEqual(2);
    });

    it("should render hinge", () => {
      const { container } = render(<MacBookMockup />);

      const hinge = container.querySelector('rect[y="470"]');
      expect(hinge).toBeInTheDocument();
    });

    it("should render trackpad notch", () => {
      const { container } = render(<MacBookMockup />);

      const trackpad = container.querySelector('rect[x="340"][y="470"]');
      expect(trackpad).toBeInTheDocument();
      expect(trackpad).toHaveAttribute("width", "120");
    });
  });

  describe("Shadow Effect", () => {
    it("should render shadow element", () => {
      const { container } = render(<MacBookMockup />);

      // Shadow is the first child div after the relative container
      const shadowDiv = container.querySelector(".absolute.-bottom-6");
      expect(shadowDiv).toBeInTheDocument();
    });

    it("should have drop-shadow filter on SVG", () => {
      const { container } = render(<MacBookMockup />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveStyle({ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.3))" });
    });
  });

  describe("Screen Content Area", () => {
    it("should render screen content overlay", () => {
      const { container } = render(<MacBookMockup />);

      const overlay = container.querySelector(".absolute.overflow-hidden");
      expect(overlay).toBeInTheDocument();
    });

    it("should have correct screen positioning", () => {
      const { container } = render(<MacBookMockup />);

      const overlay = container.querySelector(".absolute.overflow-hidden");
      expect(overlay).toHaveStyle({
        top: "4.6%",
        left: "4.3%",
        width: "91.4%",
        height: "82%",
      });
    });

    it("should render default terminal content when no children", () => {
      const { container } = render(<MacBookMockup />);

      // Default content shows terminal with version info
      expect(container.textContent).toContain("Claude Insider");
      expect(container.textContent).toContain("v1.21.0");
    });

    it("should render custom children", () => {
      render(
        <MacBookMockup>
          <div data-testid="custom-content">Custom Screen Content</div>
        </MacBookMockup>
      );

      expect(screen.getByTestId("custom-content")).toBeInTheDocument();
      expect(screen.getByText("Custom Screen Content")).toBeInTheDocument();
    });
  });

  describe("CSS Classes", () => {
    it("should have relative container", () => {
      const { container } = render(<MacBookMockup />);

      expect(container.firstChild).toHaveClass("relative");
    });

    it("should apply custom className", () => {
      const { container } = render(<MacBookMockup className="custom-class" />);

      expect(container.firstChild).toHaveClass("relative", "custom-class");
    });

    it("should have full width SVG", () => {
      const { container } = render(<MacBookMockup />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-full", "h-auto");
    });
  });
});

describe("IPhone17ProMax", () => {
  describe("SVG Structure", () => {
    it("should render SVG with correct viewBox", () => {
      const { container } = render(<IPhone17ProMax />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 236 480");
    });

    it("should have titanium gradient definitions", () => {
      const { container } = render(<IPhone17ProMax />);

      expect(container.querySelector("#iphone17-titanium")).toBeInTheDocument();
      expect(container.querySelector("#iphone17-edge")).toBeInTheDocument();
      expect(container.querySelector("#iphone17-button")).toBeInTheDocument();
    });

    it("should have screen inset filter", () => {
      const { container } = render(<IPhone17ProMax />);

      expect(container.querySelector("#screen-inset")).toBeInTheDocument();
    });

    it("should render main titanium body", () => {
      const { container } = render(<IPhone17ProMax />);

      const body = container.querySelector('rect[x="0"][y="0"]');
      expect(body).toBeInTheDocument();
      expect(body).toHaveAttribute("width", "236");
      expect(body).toHaveAttribute("height", "480");
      expect(body).toHaveAttribute("rx", "36");
    });

    it("should render screen area", () => {
      const { container } = render(<IPhone17ProMax />);

      // Screen at x=6, y=6 (frameWidth)
      const screen = container.querySelector('rect[x="6"][y="6"]');
      expect(screen).toBeInTheDocument();
      expect(screen).toHaveAttribute("width", "224");
      expect(screen).toHaveAttribute("height", "468");
    });
  });

  describe("Hardware Elements", () => {
    it("should render side buttons", () => {
      const { container } = render(<IPhone17ProMax />);

      // Action button
      const actionButton = container.querySelector('rect[x="-1.5"][y="85"]');
      expect(actionButton).toBeInTheDocument();

      // Volume buttons
      const volumeUp = container.querySelector('rect[x="-1.5"][y="120"]');
      const volumeDown = container.querySelector('rect[x="-1.5"][y="160"]');
      expect(volumeUp).toBeInTheDocument();
      expect(volumeDown).toBeInTheDocument();

      // Power button (on right side at x = width - 0.5 = 235.5)
      const powerButton = container.querySelector('rect[y="130"][height="50"]');
      expect(powerButton).toBeInTheDocument();
    });

    it("should render Dynamic Island", () => {
      const { container } = render(<IPhone17ProMax />);

      // Dynamic Island at y=14, centered
      const diRect = container.querySelector('rect[y="14"][height="18"]');
      expect(diRect).toBeInTheDocument();
      expect(diRect).toHaveAttribute("width", "60");
    });

    it("should render camera lens in Dynamic Island", () => {
      const { container } = render(<IPhone17ProMax />);

      // Multiple circles for camera lens effect
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThanOrEqual(3);
    });

    it("should render home indicator", () => {
      const { container } = render(<IPhone17ProMax />);

      // Home indicator at bottom (y = height - 14 = 466)
      const homeIndicator = container.querySelector('rect[y="466"]');
      expect(homeIndicator).toBeInTheDocument();
      expect(homeIndicator).toHaveAttribute("width", "70");
    });
  });

  describe("foreignObject for Content", () => {
    it("should render foreignObject for screen content", () => {
      const { container } = render(<IPhone17ProMax />);

      const foreignObject = container.querySelector("foreignObject");
      expect(foreignObject).toBeInTheDocument();
      expect(foreignObject).toHaveAttribute("x", "6");
      expect(foreignObject).toHaveAttribute("y", "6");
      expect(foreignObject).toHaveAttribute("width", "224");
      expect(foreignObject).toHaveAttribute("height", "468");
    });

    it("should render default screen content when no children", () => {
      render(<IPhone17ProMax />);

      // Default content is IPhoneScreenContent with mobile screenshot
      expect(screen.getByTestId("next-image")).toBeInTheDocument();
      expect(screen.getByAltText("Claude Insider mobile homepage")).toBeInTheDocument();
    });

    it("should render custom children", () => {
      render(
        <IPhone17ProMax>
          <div data-testid="custom-iphone-content">Custom iPhone Content</div>
        </IPhone17ProMax>
      );

      expect(screen.getByTestId("custom-iphone-content")).toBeInTheDocument();
    });
  });

  describe("Shadow Effect", () => {
    it("should render ground shadow", () => {
      const { container } = render(<IPhone17ProMax />);

      const shadow = container.querySelector(".absolute.-bottom-4");
      expect(shadow).toBeInTheDocument();
    });

    it("should have drop-shadow filter on SVG", () => {
      const { container } = render(<IPhone17ProMax />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveStyle({ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" });
    });
  });

  describe("CSS Classes", () => {
    it("should have relative container", () => {
      const { container } = render(<IPhone17ProMax />);

      expect(container.firstChild).toHaveClass("relative");
    });

    it("should apply custom className", () => {
      const { container } = render(<IPhone17ProMax className="iphone-custom" />);

      expect(container.firstChild).toHaveClass("relative", "iphone-custom");
    });
  });
});

describe("IPhoneMockup (Deprecated Alias)", () => {
  it("should render same as IPhone17ProMax", () => {
    const { container: aliasContainer } = render(<IPhoneMockup />);
    const { container: originalContainer } = render(<IPhone17ProMax />);

    // Both should have the same SVG structure
    expect(aliasContainer.querySelector("svg")).toHaveAttribute("viewBox", "0 0 236 480");
    expect(originalContainer.querySelector("svg")).toHaveAttribute("viewBox", "0 0 236 480");
  });

  it("should accept same props", () => {
    render(
      <IPhoneMockup className="deprecated-test">
        <div data-testid="alias-content">Alias Content</div>
      </IPhoneMockup>
    );

    expect(screen.getByTestId("alias-content")).toBeInTheDocument();
  });
});

describe("MacBookTerminalContent", () => {
  beforeEach(() => {
    // Render MacBookMockup without children to get default terminal content
    render(<MacBookMockup />);
  });

  describe("Terminal Chrome", () => {
    it("should render terminal window buttons", () => {
      const { container } = render(<MacBookMockup />);

      // Traffic light buttons
      const buttons = container.querySelectorAll(".rounded-full");
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it("should render terminal title", () => {
      const { container } = render(<MacBookMockup />);

      expect(container.textContent).toContain("Terminal — claude-insider — zsh");
    });
  });

  describe("Content Display", () => {
    it("should show command prompt", () => {
      const { container } = render(<MacBookMockup />);

      expect(container.textContent).toContain("~/claude-insider");
      expect(container.textContent).toContain("pnpm dev");
    });

    it("should show version info", () => {
      const { container } = render(<MacBookMockup />);

      expect(container.textContent).toContain("Claude Insider");
      expect(container.textContent).toContain("v1.21.0");
    });

    it("should show feature counts", () => {
      const { container } = render(<MacBookMockup />);

      expect(container.textContent).toContain("Features: 75");
      expect(container.textContent).toContain("Resources: 3,012");
      expect(container.textContent).toContain("Prompts: 800+");
    });

    it("should show feature checkmarks", () => {
      const { container } = render(<MacBookMockup />);

      expect(container.textContent).toContain("Interactive Prompt Builder");
      expect(container.textContent).toContain("100% Screenshot Coverage");
      expect(container.textContent).toContain("E2EE Matrix Protocol");
      expect(container.textContent).toContain("50+ Achievements");
      expect(container.textContent).toContain("RAG v8.0");
    });

    it("should show ready status", () => {
      const { container } = render(<MacBookMockup />);

      expect(container.textContent).toContain("Ready on http://localhost:3001");
    });
  });

  describe("Styling", () => {
    it("should have dark background", () => {
      const { container } = render(<MacBookMockup />);

      const terminal = container.querySelector(".bg-\\[\\#0d1117\\]");
      expect(terminal).toBeInTheDocument();
    });

    it("should use monospace font", () => {
      const { container } = render(<MacBookMockup />);

      const terminal = container.querySelector(".font-mono");
      expect(terminal).toBeInTheDocument();
    });
  });
});

describe("IPhoneScreenContent", () => {
  it("should render image with correct src", () => {
    render(<IPhone17ProMax />);

    const image = screen.getByTestId("next-image");
    expect(image).toHaveAttribute("src", "/images/mobile-screenshot.png");
  });

  it("should render image with correct alt text", () => {
    render(<IPhone17ProMax />);

    expect(screen.getByAltText("Claude Insider mobile homepage")).toBeInTheDocument();
  });

  it("should use priority loading for LCP optimization", () => {
    render(<IPhone17ProMax />);

    const image = screen.getByTestId("next-image");
    expect(image).toHaveAttribute("data-priority", "true");
  });

  it("should use fill mode", () => {
    render(<IPhone17ProMax />);

    const image = screen.getByTestId("next-image");
    expect(image).toHaveAttribute("data-fill", "true");
  });

  it("should have correct sizes attribute", () => {
    render(<IPhone17ProMax />);

    const image = screen.getByTestId("next-image");
    expect(image).toHaveAttribute("data-sizes", "240px");
  });

  it("should use object-cover styling", () => {
    render(<IPhone17ProMax />);

    const image = screen.getByTestId("next-image");
    expect(image).toHaveClass("object-cover", "object-top");
  });
});

describe("DeviceShowcase", () => {
  describe("Structure", () => {
    it("should render container with minimum height", () => {
      const { container } = render(<DeviceShowcase />);

      expect(container.firstChild).toHaveClass("relative", "min-h-[520px]", "lg:min-h-[600px]");
    });

    it("should apply custom className", () => {
      const { container } = render(<DeviceShowcase className="showcase-custom" />);

      expect(container.firstChild).toHaveClass("showcase-custom");
    });
  });

  describe("Ambient Glow Effects", () => {
    it("should render ambient glow container", () => {
      const { container } = render(<DeviceShowcase />);

      const glowContainer = container.querySelector(".absolute.inset-0.-z-10.overflow-hidden");
      expect(glowContainer).toBeInTheDocument();
    });

    it("should render multiple glow orbs", () => {
      const { container } = render(<DeviceShowcase />);

      const glowContainer = container.querySelector(".absolute.inset-0.-z-10");
      const glowOrbs = glowContainer?.querySelectorAll(".rounded-full");
      expect(glowOrbs?.length).toBe(3);
    });

    it("should have violet glow", () => {
      const { container } = render(<DeviceShowcase />);

      expect(container.querySelector(".bg-violet-500\\/15")).toBeInTheDocument();
    });

    it("should have cyan glow", () => {
      const { container } = render(<DeviceShowcase />);

      expect(container.querySelector(".bg-cyan-500\\/15")).toBeInTheDocument();
    });

    it("should have blue glow", () => {
      const { container } = render(<DeviceShowcase />);

      expect(container.querySelector(".bg-blue-500\\/10")).toBeInTheDocument();
    });
  });

  describe("MacBook Positioning", () => {
    it("should render MacBook container", () => {
      const { container } = render(<DeviceShowcase />);

      const macbookContainer = container.querySelector(".absolute.top-\\[12\\%\\].-right-\\[10\\%\\]");
      expect(macbookContainer).toBeInTheDocument();
    });

    it("should have max width constraint", () => {
      const { container } = render(<DeviceShowcase />);

      const macbookContainer = container.querySelector(".max-w-\\[600px\\]");
      expect(macbookContainer).toBeInTheDocument();
    });

    it("should have hover scale effect", () => {
      const { container } = render(<DeviceShowcase />);

      const macbookContainer = container.querySelector(".hover\\:scale-\\[1\\.01\\]");
      expect(macbookContainer).toBeInTheDocument();
    });

    it("should render MacBookMockup component", () => {
      const { container } = render(<DeviceShowcase />);

      // MacBook SVG with viewBox 800x520
      const macbookSvg = container.querySelector('svg[viewBox="0 0 800 520"]');
      expect(macbookSvg).toBeInTheDocument();
    });
  });

  describe("iPhone Positioning", () => {
    it("should render iPhone container with responsive positioning", () => {
      const { container } = render(<DeviceShowcase />);

      const iphoneContainer = container.querySelector(".right-\\[-15\\%\\].sm\\:right-\\[-12\\%\\].lg\\:right-\\[-10\\%\\]");
      expect(iphoneContainer).toBeInTheDocument();
    });

    it("should have responsive width", () => {
      const { container } = render(<DeviceShowcase />);

      const iphoneContainer = container.querySelector(".w-\\[160px\\].sm\\:w-\\[200px\\].lg\\:w-\\[240px\\]");
      expect(iphoneContainer).toBeInTheDocument();
    });

    it("should have higher z-index than MacBook", () => {
      const { container } = render(<DeviceShowcase />);

      const iphoneContainer = container.querySelector(".z-10");
      expect(iphoneContainer).toBeInTheDocument();
    });

    it("should have hover scale effect", () => {
      const { container } = render(<DeviceShowcase />);

      const iphoneContainer = container.querySelector(".hover\\:scale-\\[1\\.02\\]");
      expect(iphoneContainer).toBeInTheDocument();
    });

    it("should render IPhone17ProMax component", () => {
      const { container } = render(<DeviceShowcase />);

      // iPhone SVG with viewBox 236x480
      const iphoneSvg = container.querySelector('svg[viewBox="0 0 236 480"]');
      expect(iphoneSvg).toBeInTheDocument();
    });
  });

  describe("Both Devices", () => {
    it("should render both MacBook and iPhone SVGs", () => {
      const { container } = render(<DeviceShowcase />);

      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(2);
    });

    it("should show mobile screenshot in iPhone", () => {
      render(<DeviceShowcase />);

      expect(screen.getByAltText("Claude Insider mobile homepage")).toBeInTheDocument();
    });

    it("should show terminal content in MacBook", () => {
      const { container } = render(<DeviceShowcase />);

      expect(container.textContent).toContain("Claude Insider");
      expect(container.textContent).toContain("v1.21.0");
    });
  });
});

describe("SVG Gradient Specifications", () => {
  describe("MacBook Gradients", () => {
    it("should have correct aluminum body gradient stops", () => {
      const { container } = render(<MacBookMockup />);

      const gradient = container.querySelector("#macbook-body");
      const stops = gradient?.querySelectorAll("stop");
      expect(stops?.length).toBe(3);
      expect(stops?.[0]).toHaveAttribute("offset", "0%");
      expect(stops?.[1]).toHaveAttribute("offset", "50%");
      expect(stops?.[2]).toHaveAttribute("offset", "100%");
    });

    it("should have vertical gradient direction", () => {
      const { container } = render(<MacBookMockup />);

      const gradient = container.querySelector("#macbook-body");
      expect(gradient).toHaveAttribute("x1", "0%");
      expect(gradient).toHaveAttribute("y1", "0%");
      expect(gradient).toHaveAttribute("x2", "0%");
      expect(gradient).toHaveAttribute("y2", "100%");
    });
  });

  describe("iPhone Gradients", () => {
    it("should have titanium gradient with multiple stops", () => {
      const { container } = render(<IPhone17ProMax />);

      const gradient = container.querySelector("#iphone17-titanium");
      const stops = gradient?.querySelectorAll("stop");
      expect(stops?.length).toBe(7);
    });

    it("should have diagonal gradient direction", () => {
      const { container } = render(<IPhone17ProMax />);

      const gradient = container.querySelector("#iphone17-titanium");
      expect(gradient).toHaveAttribute("x1", "0%");
      expect(gradient).toHaveAttribute("y1", "0%");
      expect(gradient).toHaveAttribute("x2", "100%");
      expect(gradient).toHaveAttribute("y2", "100%");
    });
  });
});

describe("Accessibility", () => {
  it("should have accessible alt text for iPhone image", () => {
    render(<IPhone17ProMax />);

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("alt", "Claude Insider mobile homepage");
  });

  it("should render semantic structure", () => {
    const { container } = render(<DeviceShowcase />);

    // Main container is a div
    expect(container.firstChild?.nodeName).toBe("DIV");
  });
});

describe("Responsive Design", () => {
  describe("DeviceShowcase", () => {
    it("should have responsive min-height", () => {
      const { container } = render(<DeviceShowcase />);

      expect(container.firstChild).toHaveClass("min-h-[520px]", "lg:min-h-[600px]");
    });

    it("should have responsive iPhone sizing", () => {
      const { container } = render(<DeviceShowcase />);

      const iphoneContainer = container.querySelector('[class*="w-[160px]"]');
      expect(iphoneContainer).toHaveClass("sm:w-[200px]", "lg:w-[240px]");
    });

    it("should have responsive iPhone positioning", () => {
      const { container } = render(<DeviceShowcase />);

      const iphoneContainer = container.querySelector('[class*="right-[-15%]"]');
      expect(iphoneContainer).toHaveClass("sm:right-[-12%]", "lg:right-[-10%]");
    });
  });

  describe("MacBookMockup", () => {
    it("should use full width", () => {
      const { container } = render(<MacBookMockup />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-full");
    });

    it("should maintain aspect ratio", () => {
      const { container } = render(<MacBookMockup />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("h-auto");
    });
  });

  describe("Terminal Content Font Sizes", () => {
    it("should have responsive terminal font sizes", () => {
      const { container } = render(<MacBookMockup />);

      const terminal = container.querySelector('[class*="text-[8px]"]');
      expect(terminal).toHaveClass("sm:text-[9px]", "lg:text-[10px]");
    });
  });
});

describe("Transition and Animation Classes", () => {
  describe("MacBook Container", () => {
    it("should have transition duration", () => {
      const { container } = render(<DeviceShowcase />);

      const macbookContainer = container.querySelector(".transition-transform.duration-700.ease-out");
      expect(macbookContainer).toBeInTheDocument();
    });
  });

  describe("iPhone Container", () => {
    it("should have transition all", () => {
      const { container } = render(<DeviceShowcase />);

      const iphoneContainer = container.querySelector(".transition-all.duration-500.ease-out");
      expect(iphoneContainer).toBeInTheDocument();
    });
  });

  describe("Terminal Pulse Animation", () => {
    it("should have pulse animation on status indicator", () => {
      const { container } = render(<MacBookMockup />);

      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });
});
