/**
 * AccessibleModal Component Tests
 *
 * Tests for the accessible dialog/modal components:
 * - AccessibleModal: Main modal with focus trap and ARIA
 * - ConfirmationDialog: Specialized confirmation modal
 * - AlertDialog: Alert modal with variant icons
 * - Drawer: Slide-in panel from left or right
 * - Tooltip: Accessible tooltip
 * - SkipLinks: Enhanced skip navigation links
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  AccessibleModal,
  ConfirmationDialog,
  AlertDialog,
  Drawer,
  Tooltip,
  SkipLinks,
} from "@/components/accessible-modal";

// Mock createPortal to render inline for testing
vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock focus trap hook
const mockContainerRef = { current: null };
vi.mock("@/hooks/use-focus-trap", () => ({
  useFocusTrap: vi.fn(() => ({
    containerRef: mockContainerRef,
  })),
}));

// Mock announcer hook
const mockAnnounce = vi.fn();
vi.mock("@/hooks/use-aria-live", () => ({
  useAnnouncer: vi.fn(() => ({
    announce: mockAnnounce,
  })),
}));

// Mock reduced motion hook
vi.mock("@/hooks/use-animations", () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe("AccessibleModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Visibility", () => {
    it("should not render when isOpen is false", () => {
      render(
        <AccessibleModal isOpen={false} onClose={() => {}} title="Test Modal">
          <div>Modal content</div>
        </AccessibleModal>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Modal content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should render children", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Modal content</div>
        </AccessibleModal>
      );

      expect(screen.getByText("Modal content")).toBeInTheDocument();
    });
  });

  describe("Title and Description", () => {
    it("should render title", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="My Title">
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByText("My Title")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Title"
          description="This is a description"
        >
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("should not render description when not provided", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Title">
          <div>Content</div>
        </AccessibleModal>
      );

      // Only title should be in heading
      const headings = screen.getAllByRole("heading");
      expect(headings).toHaveLength(1);
    });
  });

  describe("Close Button", () => {
    it("should show close button by default", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Title">
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("button", { name: /close dialog/i })).toBeInTheDocument();
    });

    it("should hide close button when showCloseButton is false", () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Title"
          showCloseButton={false}
        >
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.queryByRole("button", { name: /close dialog/i })).not.toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
      const handleClose = vi.fn();

      render(
        <AccessibleModal isOpen={true} onClose={handleClose} title="Title">
          <div>Content</div>
        </AccessibleModal>
      );

      fireEvent.click(screen.getByRole("button", { name: /close dialog/i }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("ARIA Attributes", () => {
    it("should have dialog role", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Title">
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have aria-modal true", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Title">
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("should have aria-labelledby pointing to title", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="My Title">
          <div>Content</div>
        </AccessibleModal>
      );

      const dialog = screen.getByRole("dialog");
      const labelId = dialog.getAttribute("aria-labelledby");
      expect(labelId).toBeTruthy();

      // The title should have this ID
      const title = screen.getByText("My Title");
      expect(title).toHaveAttribute("id", labelId);
    });

    it("should have aria-describedby when description provided", () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Title"
          description="Description text"
        >
          <div>Content</div>
        </AccessibleModal>
      );

      const dialog = screen.getByRole("dialog");
      const descId = dialog.getAttribute("aria-describedby");
      expect(descId).toBeTruthy();

      const description = screen.getByText("Description text");
      expect(description).toHaveAttribute("id", descId);
    });

    it("should use custom ariaLabelledBy when provided", () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Title"
          ariaLabelledBy="custom-label-id"
        >
          <div>Content</div>
        </AccessibleModal>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby", "custom-label-id");
    });
  });

  describe("Size Variants", () => {
    it("should apply sm size class", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Title" size="sm">
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-sm");
    });

    it("should apply md size class by default", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Title">
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-md");
    });

    it("should apply lg size class", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Title" size="lg">
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-lg");
    });

    it("should apply xl size class", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Title" size="xl">
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-xl");
    });

    it("should apply full size class", () => {
      render(
        <AccessibleModal isOpen={true} onClose={() => {}} title="Title" size="full">
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-[95vw]");
    });
  });

  describe("Announcements", () => {
    it("should announce on open when announceOnOpen is true", () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Important Dialog"
          announceOnOpen={true}
        >
          <div>Content</div>
        </AccessibleModal>
      );

      expect(mockAnnounce).toHaveBeenCalledWith("Dialog opened: Important Dialog");
    });

    it("should not announce when announceOnOpen is false", () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Title"
          announceOnOpen={false}
        >
          <div>Content</div>
        </AccessibleModal>
      );

      expect(mockAnnounce).not.toHaveBeenCalled();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={() => {}}
          title="Title"
          className="custom-modal"
        >
          <div>Content</div>
        </AccessibleModal>
      );

      expect(screen.getByRole("dialog")).toHaveClass("custom-modal");
    });
  });
});

describe("ConfirmationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render when open", () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm Action"
          message="Are you sure?"
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Confirm Action")).toBeInTheDocument();
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      render(
        <ConfirmationDialog
          isOpen={false}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm Action"
          message="Are you sure?"
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Buttons", () => {
    it("should show default button texts", () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Title"
          message="Message"
        />
      );

      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    });

    it("should show custom button texts", () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Title"
          message="Message"
          confirmText="Yes, delete"
          cancelText="No, keep"
        />
      );

      expect(screen.getByRole("button", { name: "No, keep" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument();
    });

    it("should call onClose when cancel is clicked", () => {
      const handleClose = vi.fn();

      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={handleClose}
          onConfirm={() => {}}
          title="Title"
          message="Message"
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should call onConfirm when confirm is clicked", () => {
      const handleConfirm = vi.fn();

      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={handleConfirm}
          title="Title"
          message="Message"
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("Variants", () => {
    it("should apply danger variant styling", () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete Item"
          message="This action cannot be undone."
          variant="danger"
        />
      );

      const confirmButton = screen.getByRole("button", { name: "Confirm" });
      expect(confirmButton).toHaveClass("bg-red-600");
    });

    it("should apply default variant styling", () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm"
          message="Proceed?"
          variant="default"
        />
      );

      const confirmButton = screen.getByRole("button", { name: "Confirm" });
      expect(confirmButton).toHaveClass("bg-gradient-to-r");
    });
  });

  describe("Loading State", () => {
    it("should show loading text when isLoading", () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Title"
          message="Message"
          isLoading={true}
        />
      );

      expect(screen.getByRole("button", { name: "Loading..." })).toBeInTheDocument();
    });

    it("should disable buttons when isLoading", () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Title"
          message="Message"
          isLoading={true}
        />
      );

      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
    });
  });
});

describe("AlertDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render when open", () => {
      render(
        <AlertDialog
          isOpen={true}
          onClose={() => {}}
          title="Alert"
          message="Something happened!"
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Alert")).toBeInTheDocument();
      expect(screen.getByText("Something happened!")).toBeInTheDocument();
    });

    it("should show default button text", () => {
      render(
        <AlertDialog
          isOpen={true}
          onClose={() => {}}
          title="Alert"
          message="Message"
        />
      );

      expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
    });

    it("should show custom button text", () => {
      render(
        <AlertDialog
          isOpen={true}
          onClose={() => {}}
          title="Alert"
          message="Message"
          buttonText="Got it"
        />
      );

      expect(screen.getByRole("button", { name: "Got it" })).toBeInTheDocument();
    });

    it("should call onClose when button is clicked", () => {
      const handleClose = vi.fn();

      render(
        <AlertDialog
          isOpen={true}
          onClose={handleClose}
          title="Alert"
          message="Message"
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "OK" }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Variants", () => {
    it("should render info variant with icon", () => {
      const { container } = render(
        <AlertDialog
          isOpen={true}
          onClose={() => {}}
          title="Info"
          message="Message"
          variant="info"
        />
      );

      const icon = container.querySelector("svg.text-blue-500");
      expect(icon).toBeInTheDocument();
    });

    it("should render success variant with icon", () => {
      const { container } = render(
        <AlertDialog
          isOpen={true}
          onClose={() => {}}
          title="Success"
          message="Message"
          variant="success"
        />
      );

      const icon = container.querySelector("svg.text-green-500");
      expect(icon).toBeInTheDocument();
    });

    it("should render warning variant with icon", () => {
      const { container } = render(
        <AlertDialog
          isOpen={true}
          onClose={() => {}}
          title="Warning"
          message="Message"
          variant="warning"
        />
      );

      const icon = container.querySelector("svg.text-yellow-500");
      expect(icon).toBeInTheDocument();
    });

    it("should render error variant with icon", () => {
      const { container } = render(
        <AlertDialog
          isOpen={true}
          onClose={() => {}}
          title="Error"
          message="Message"
          variant="error"
        />
      );

      const icon = container.querySelector("svg.text-red-500");
      expect(icon).toBeInTheDocument();
    });
  });
});

describe("Drawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Visibility", () => {
    it("should not render when closed", () => {
      render(
        <Drawer isOpen={false} onClose={() => {}} title="Drawer">
          <div>Drawer content</div>
        </Drawer>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render when open", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer">
          <div>Drawer content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Drawer content")).toBeInTheDocument();
    });
  });

  describe("Position", () => {
    it("should position on right by default", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toHaveClass("right-0");
      expect(screen.getByRole("dialog")).toHaveClass("border-l");
    });

    it("should position on left when specified", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer" position="left">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toHaveClass("left-0");
      expect(screen.getByRole("dialog")).toHaveClass("border-r");
    });
  });

  describe("Size", () => {
    it("should apply sm size", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer" size="sm">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-xs");
    });

    it("should apply md size by default", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-md");
    });

    it("should apply lg size", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer" size="lg">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toHaveClass("max-w-lg");
    });
  });

  describe("Close Button", () => {
    it("should have close button", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole("button", { name: /close drawer/i })).toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
      const handleClose = vi.fn();

      render(
        <Drawer isOpen={true} onClose={handleClose} title="Drawer">
          <div>Content</div>
        </Drawer>
      );

      fireEvent.click(screen.getByRole("button", { name: /close drawer/i }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Overlay", () => {
    it("should show overlay by default", () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer">
          <div>Content</div>
        </Drawer>
      );

      expect(container.querySelector(".bg-black\\/50")).toBeInTheDocument();
    });

    it("should hide overlay when showOverlay is false", () => {
      const { container } = render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer" showOverlay={false}>
          <div>Content</div>
        </Drawer>
      );

      expect(container.querySelector(".bg-black\\/50")).not.toBeInTheDocument();
    });
  });

  describe("ARIA", () => {
    it("should have dialog role", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have aria-modal true", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="Drawer">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("should have aria-label with title", () => {
      render(
        <Drawer isOpen={true} onClose={() => {}} title="My Drawer">
          <div>Content</div>
        </Drawer>
      );

      expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "My Drawer");
    });
  });
});

describe("Tooltip", () => {
  describe("Rendering", () => {
    it("should render children", () => {
      render(
        <Tooltip content="Tooltip text">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.getByRole("button", { name: "Hover me" })).toBeInTheDocument();
    });

    it("should render tooltip content", () => {
      render(
        <Tooltip content="Helpful tip">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(screen.getByText("Helpful tip")).toBeInTheDocument();
    });
  });

  describe("Position", () => {
    it("should position top by default", () => {
      render(
        <Tooltip content="Tip">
          <button>Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("tooltip")).toHaveClass("bottom-full");
    });

    it("should position bottom", () => {
      render(
        <Tooltip content="Tip" position="bottom">
          <button>Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("tooltip")).toHaveClass("top-full");
    });

    it("should position left", () => {
      render(
        <Tooltip content="Tip" position="left">
          <button>Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("tooltip")).toHaveClass("right-full");
    });

    it("should position right", () => {
      render(
        <Tooltip content="Tip" position="right">
          <button>Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("tooltip")).toHaveClass("left-full");
    });
  });

  describe("Delay", () => {
    it("should apply default delay", () => {
      render(
        <Tooltip content="Tip">
          <button>Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("tooltip")).toHaveStyle({ transitionDelay: "300ms" });
    });

    it("should apply custom delay", () => {
      render(
        <Tooltip content="Tip" delay={500}>
          <button>Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("tooltip")).toHaveStyle({ transitionDelay: "500ms" });
    });
  });

  describe("ARIA", () => {
    it("should have tooltip role", () => {
      render(
        <Tooltip content="Tip">
          <button>Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("should connect trigger to tooltip with aria-describedby", () => {
      render(
        <Tooltip content="Tip">
          <button>Button</button>
        </Tooltip>
      );

      const tooltip = screen.getByRole("tooltip");
      const tooltipId = tooltip.getAttribute("id");
      expect(tooltipId).toBeTruthy();

      // The wrapper div should have aria-describedby
      const trigger = screen.getByRole("button").parentElement;
      expect(trigger).toHaveAttribute("aria-describedby", tooltipId);
    });
  });

  describe("Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <Tooltip content="Tip" className="custom-tooltip">
          <button>Button</button>
        </Tooltip>
      );

      expect(container.querySelector(".custom-tooltip")).toBeInTheDocument();
    });

    it("should have pointer-events-none on tooltip", () => {
      render(
        <Tooltip content="Tip">
          <button>Button</button>
        </Tooltip>
      );

      expect(screen.getByRole("tooltip")).toHaveClass("pointer-events-none");
    });
  });
});

describe("SkipLinks", () => {
  describe("Default Behavior", () => {
    it("should render default skip link", () => {
      render(<SkipLinks />);

      const link = screen.getByRole("link", { name: "Skip to main content" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "#main-content");
    });
  });

  describe("Custom Links", () => {
    it("should render custom links", () => {
      render(
        <SkipLinks
          links={[
            { id: "content", label: "Skip to content" },
            { id: "nav", label: "Skip to navigation" },
          ]}
        />
      );

      expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
        "href",
        "#content"
      );
      expect(screen.getByRole("link", { name: "Skip to navigation" })).toHaveAttribute(
        "href",
        "#nav"
      );
    });

    it("should render multiple links", () => {
      render(
        <SkipLinks
          links={[
            { id: "main", label: "Main" },
            { id: "footer", label: "Footer" },
            { id: "sidebar", label: "Sidebar" },
          ]}
        />
      );

      expect(screen.getAllByRole("link")).toHaveLength(3);
    });
  });

  describe("Accessibility", () => {
    it("should be screen reader only by default", () => {
      const { container } = render(<SkipLinks />);

      expect(container.querySelector(".sr-only")).toBeInTheDocument();
    });

    it("should have high z-index when focused", () => {
      render(<SkipLinks />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("z-[9999]");
    });

    it("should have fixed positioning", () => {
      render(<SkipLinks />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("fixed");
    });
  });
});

describe("Focus Trap Integration", () => {
  it("should enable focus trap when modal is open", async () => {
    const { useFocusTrap } = await import("@/hooks/use-focus-trap");

    render(
      <AccessibleModal isOpen={true} onClose={() => {}} title="Title">
        <div>Content</div>
      </AccessibleModal>
    );

    expect(useFocusTrap).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      })
    );
  });

  it("should pass closeOnEscape option", async () => {
    const { useFocusTrap } = await import("@/hooks/use-focus-trap");

    render(
      <AccessibleModal
        isOpen={true}
        onClose={() => {}}
        title="Title"
        closeOnEscape={true}
      >
        <div>Content</div>
      </AccessibleModal>
    );

    expect(useFocusTrap).toHaveBeenCalledWith(
      expect.objectContaining({
        closeOnEscape: true,
      })
    );
  });

  it("should pass closeOnClickOutside option", async () => {
    const { useFocusTrap } = await import("@/hooks/use-focus-trap");

    render(
      <AccessibleModal
        isOpen={true}
        onClose={() => {}}
        title="Title"
        closeOnClickOutside={false}
      >
        <div>Content</div>
      </AccessibleModal>
    );

    expect(useFocusTrap).toHaveBeenCalledWith(
      expect.objectContaining({
        closeOnClickOutside: false,
      })
    );
  });
});
