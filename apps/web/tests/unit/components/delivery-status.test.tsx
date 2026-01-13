/**
 * DeliveryStatus Components Tests
 *
 * Tests for WhatsApp/iMessage-style delivery status indicators:
 * - DeliveryCheckmark (icon display)
 * - MessageDeliveryStatus (with timestamp)
 * - DeliveryStatusText (text only)
 * - DeliveryStatusBadge (badge styling)
 * - RetryButton (failed message retry)
 * - ReadReceiptAvatars (avatar stack)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  DeliveryCheckmark,
  MessageDeliveryStatus,
  DeliveryStatusText,
  DeliveryStatusBadge,
  RetryButton,
  ReadReceiptAvatars,
} from "@/components/chat/delivery-status";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock delivery status type
vi.mock("@/lib/chat/types", () => ({
  // Type-only export, no runtime value needed
}));

describe("DeliveryCheckmark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<DeliveryCheckmark status="sent" />)).not.toThrow();
    });

    it("should render a span element", () => {
      const { container } = render(<DeliveryCheckmark status="sent" />);
      expect(container.querySelector("span")).toBeInTheDocument();
    });

    it("should render SVG icon", () => {
      const { container } = render(<DeliveryCheckmark status="sent" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Status Display", () => {
    it("should show sending status with spinner", () => {
      const { container } = render(<DeliveryCheckmark status="sending" />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("animate-spin");
    });

    it("should show sent status with single check", () => {
      render(<DeliveryCheckmark status="sent" />);
      expect(screen.getByLabelText("Sent")).toBeInTheDocument();
    });

    it("should show delivered status with double check", () => {
      render(<DeliveryCheckmark status="delivered" />);
      expect(screen.getByLabelText("Delivered")).toBeInTheDocument();
    });

    it("should show read status with blue double check", () => {
      const { container } = render(<DeliveryCheckmark status="read" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("text-blue-500");
    });

    it("should show failed status with error icon", () => {
      const { container } = render(<DeliveryCheckmark status="failed" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("text-red-500");
    });
  });

  describe("Size Variants", () => {
    it("should render xs size", () => {
      const { container } = render(<DeliveryCheckmark status="sent" size="xs" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("h-3");
      expect(span?.className).toContain("w-3");
    });

    it("should render sm size by default", () => {
      const { container } = render(<DeliveryCheckmark status="sent" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("h-3.5");
      expect(span?.className).toContain("w-3.5");
    });

    it("should render md size", () => {
      const { container } = render(<DeliveryCheckmark status="sent" size="md" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("h-4");
      expect(span?.className).toContain("w-4");
    });
  });

  describe("Tooltip", () => {
    it("should show tooltip by default", () => {
      render(<DeliveryCheckmark status="sent" />);
      expect(screen.getByTitle("Message sent to server")).toBeInTheDocument();
    });

    it("should hide tooltip when showTooltip is false", () => {
      render(<DeliveryCheckmark status="sent" showTooltip={false} />);
      expect(screen.queryByTitle("Message sent to server")).not.toBeInTheDocument();
    });

    it("should show correct tooltip for each status", () => {
      const { rerender } = render(<DeliveryCheckmark status="sending" />);
      expect(screen.getByTitle("Sending message...")).toBeInTheDocument();

      rerender(<DeliveryCheckmark status="delivered" />);
      expect(screen.getByTitle("Message delivered to recipient")).toBeInTheDocument();

      rerender(<DeliveryCheckmark status="read" />);
      expect(screen.getByTitle("Message read by recipient")).toBeInTheDocument();

      rerender(<DeliveryCheckmark status="failed" />);
      expect(screen.getByTitle("Message failed to send. Tap to retry.")).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(<DeliveryCheckmark status="sent" className="custom-class" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("custom-class");
    });
  });
});

describe("MessageDeliveryStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Own Message Display", () => {
    it("should render for own messages", () => {
      const { container } = render(
        <MessageDeliveryStatus status="sent" isOwnMessage={true} />
      );
      expect(container.querySelector("span")).toBeInTheDocument();
    });

    it("should not render for other users messages", () => {
      const { container } = render(
        <MessageDeliveryStatus status="sent" isOwnMessage={false} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Timestamp Display", () => {
    it("should show formatted time when sentAt provided", () => {
      render(
        <MessageDeliveryStatus
          status="sent"
          isOwnMessage={true}
          sentAt="2024-01-15T10:30:00Z"
        />
      );
      // Time formatting is locale-dependent but should contain text
      expect(screen.getByText(/\d/)).toBeInTheDocument();
    });

    it("should not show time when sentAt not provided", () => {
      render(
        <MessageDeliveryStatus status="sent" isOwnMessage={true} />
      );
      // Should not have any time text (looking for time pattern)
      // The component only shows time when sentAt is provided
      expect(screen.queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should render xs size by default", () => {
      const { container } = render(
        <MessageDeliveryStatus status="sent" isOwnMessage={true} />
      );
      const span = container.querySelector("span");
      expect(span?.className).toContain("h-3");
    });

    it("should render specified size", () => {
      const { container } = render(
        <MessageDeliveryStatus status="sent" isOwnMessage={true} size="md" />
      );
      const span = container.querySelector("span");
      expect(span?.className).toContain("h-5");
    });
  });
});

describe("DeliveryStatusText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Full Text Display", () => {
    it("should show 'Sending' for sending status", () => {
      render(<DeliveryStatusText status="sending" />);
      expect(screen.getByText("Sending")).toBeInTheDocument();
    });

    it("should show 'Sent' for sent status", () => {
      render(<DeliveryStatusText status="sent" />);
      expect(screen.getByText("Sent")).toBeInTheDocument();
    });

    it("should show 'Delivered' for delivered status", () => {
      render(<DeliveryStatusText status="delivered" />);
      expect(screen.getByText("Delivered")).toBeInTheDocument();
    });

    it("should show 'Read' for read status", () => {
      render(<DeliveryStatusText status="read" />);
      expect(screen.getByText("Read")).toBeInTheDocument();
    });

    it("should show 'Failed' for failed status", () => {
      render(<DeliveryStatusText status="failed" />);
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
  });

  describe("Abbreviated Text", () => {
    it("should show abbreviated text when abbreviated=true", () => {
      render(<DeliveryStatusText status="sending" abbreviated={true} />);
      expect(screen.getByText("Sending")).toBeInTheDocument();
    });
  });

  describe("Color Styling", () => {
    it("should have gray color for sent", () => {
      const { container } = render(<DeliveryStatusText status="sent" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("text-gray-400");
    });

    it("should have blue color for read", () => {
      const { container } = render(<DeliveryStatusText status="read" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("text-blue-500");
    });

    it("should have red color for failed", () => {
      const { container } = render(<DeliveryStatusText status="failed" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("text-red-500");
    });
  });
});

describe("DeliveryStatusBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<DeliveryStatusBadge status="sent" />)).not.toThrow();
    });

    it("should render label text", () => {
      render(<DeliveryStatusBadge status="sent" />);
      expect(screen.getByText("Sent")).toBeInTheDocument();
    });

    it("should render icon by default", () => {
      const { container } = render(<DeliveryStatusBadge status="sent" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Icon Display", () => {
    it("should hide icon when showIcon is false", () => {
      const { container } = render(<DeliveryStatusBadge status="sent" showIcon={false} />);
      expect(container.querySelector("svg")).not.toBeInTheDocument();
    });
  });

  describe("Background Colors", () => {
    it("should have gray background for sent", () => {
      const { container } = render(<DeliveryStatusBadge status="sent" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("bg-gray-100");
    });

    it("should have blue background for read", () => {
      const { container } = render(<DeliveryStatusBadge status="read" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("bg-blue-50");
    });

    it("should have red background for failed", () => {
      const { container } = render(<DeliveryStatusBadge status="failed" />);
      const span = container.querySelector("span");
      expect(span?.className).toContain("bg-red-50");
    });
  });

  describe("Size Variants", () => {
    it("should render sm size by default", () => {
      const { container } = render(<DeliveryStatusBadge status="sent" />);
      const textSpan = screen.getByText("Sent");
      expect(textSpan.className).toContain("text-xs");
    });

    it("should render md size", () => {
      const { container } = render(<DeliveryStatusBadge status="sent" size="md" />);
      const textSpan = screen.getByText("Sent");
      expect(textSpan.className).toContain("text-sm");
    });
  });
});

describe("RetryButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<RetryButton onRetry={() => {}} />)).not.toThrow();
    });

    it("should render a button element", () => {
      render(<RetryButton onRetry={() => {}} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should show 'Tap to retry' text", () => {
      render(<RetryButton onRetry={() => {}} />);
      expect(screen.getByText("Tap to retry")).toBeInTheDocument();
    });
  });

  describe("Click Handling", () => {
    it("should call onRetry when clicked", () => {
      const handleRetry = vi.fn();
      render(<RetryButton onRetry={handleRetry} />);
      fireEvent.click(screen.getByRole("button"));
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("Retrying State", () => {
    it("should show 'Retrying...' when isRetrying", () => {
      render(<RetryButton onRetry={() => {}} isRetrying={true} />);
      expect(screen.getByText("Retrying...")).toBeInTheDocument();
    });

    it("should be disabled when isRetrying", () => {
      render(<RetryButton onRetry={() => {}} isRetrying={true} />);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should show spinner when isRetrying", () => {
      const { container } = render(<RetryButton onRetry={() => {}} isRetrying={true} />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("animate-spin");
    });
  });

  describe("Size Variants", () => {
    it("should render sm size by default", () => {
      render(<RetryButton onRetry={() => {}} />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("text-xs");
    });

    it("should render md size", () => {
      render(<RetryButton onRetry={() => {}} size="md" />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("text-sm");
    });
  });

  describe("Styling", () => {
    it("should have red styling", () => {
      render(<RetryButton onRetry={() => {}} />);
      const button = screen.getByRole("button");
      expect(button.className).toContain("bg-red-50");
      expect(button.className).toContain("text-red-600");
    });

    it("should have title attribute", () => {
      render(<RetryButton onRetry={() => {}} />);
      expect(screen.getByTitle("Tap to retry sending")).toBeInTheDocument();
    });
  });
});

describe("ReadReceiptAvatars", () => {
  const mockReaders = [
    { userId: "1", userName: "Alice", userAvatar: "https://example.com/alice.jpg" },
    { userId: "2", userName: "Bob" },
    { userId: "3", userName: "Charlie" },
    { userId: "4", userName: "Diana" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<ReadReceiptAvatars readBy={mockReaders} />)).not.toThrow();
    });

    it("should return null when readBy is empty", () => {
      const { container } = render(<ReadReceiptAvatars readBy={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Avatar Display", () => {
    it("should show max 3 avatars by default", () => {
      const { container } = render(<ReadReceiptAvatars readBy={mockReaders} />);
      // 3 avatars + 1 overflow indicator (direct children of flex container)
      // Note: img elements inside also have rounded-full, so we count direct children
      const wrapper = container.firstChild as HTMLElement;
      const avatarDivs = wrapper?.querySelectorAll(":scope > div");
      expect(avatarDivs?.length).toBe(4); // 3 displayed + 1 overflow
    });

    it("should respect maxAvatars prop", () => {
      const { container } = render(<ReadReceiptAvatars readBy={mockReaders} maxAvatars={2} />);
      // 2 avatars + 1 overflow indicator
      const wrapper = container.firstChild as HTMLElement;
      const avatarDivs = wrapper?.querySelectorAll(":scope > div");
      expect(avatarDivs?.length).toBe(3); // 2 displayed + 1 overflow
    });

    it("should show overflow count", () => {
      render(<ReadReceiptAvatars readBy={mockReaders} maxAvatars={2} />);
      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("should not show overflow when all fit", () => {
      render(<ReadReceiptAvatars readBy={mockReaders.slice(0, 2)} maxAvatars={3} />);
      expect(screen.queryByText(/\+\d/)).not.toBeInTheDocument();
    });
  });

  describe("Avatar Content", () => {
    it("should render image when userAvatar provided", () => {
      const { container } = render(
        <ReadReceiptAvatars readBy={[mockReaders[0]]} />
      );
      const img = container.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img?.getAttribute("src")).toBe("https://example.com/alice.jpg");
    });

    it("should render initial when no userAvatar", () => {
      render(<ReadReceiptAvatars readBy={[mockReaders[1]]} />);
      expect(screen.getByText("B")).toBeInTheDocument();
    });

    it("should render 'U' for missing userName", () => {
      render(<ReadReceiptAvatars readBy={[{ userId: "5" }]} />);
      expect(screen.getByText("U")).toBeInTheDocument();
    });
  });

  describe("Size Variants", () => {
    it("should render sm size by default", () => {
      const { container } = render(<ReadReceiptAvatars readBy={[mockReaders[1]]} />);
      const avatar = container.querySelector(".w-4");
      expect(avatar).toBeInTheDocument();
    });

    it("should render md size", () => {
      const { container } = render(<ReadReceiptAvatars readBy={[mockReaders[1]]} size="md" />);
      const avatar = container.querySelector(".w-5");
      expect(avatar).toBeInTheDocument();
    });
  });

  describe("Title Tooltip", () => {
    it("should show tooltip with reader names", () => {
      const { container } = render(<ReadReceiptAvatars readBy={mockReaders.slice(0, 2)} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.getAttribute("title")).toBe("Read by Alice, Bob");
    });

    it("should show 'User' for missing userName", () => {
      const { container } = render(<ReadReceiptAvatars readBy={[{ userId: "5" }]} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.getAttribute("title")).toBe("Read by User");
    });
  });
});
