/**
 * VersionUpdatePopup Component Tests
 *
 * Tests for the version update notification system:
 * - VersionPopupProvider context
 * - VersionUpdatePopupContent UI
 * - useVersionPopup and useVersionPopupControl hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  VersionPopupProvider,
  useVersionPopupControl,
  useVersionPopup,
  APP_VERSION,
} from "@/components/version-update-popup";
import { renderHook, act } from "@testing-library/react";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock build info
vi.mock("@/data/build-info.json", () => ({
  default: { version: "1.21.0" },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, "location", {
  value: { reload: mockReload },
  writable: true,
});

describe("APP_VERSION", () => {
  it("should export the version from build info", () => {
    expect(APP_VERSION).toBe("1.21.0");
  });
});

describe("useVersionPopupControl", () => {
  it("should return no-op function outside provider", () => {
    const { result } = renderHook(() => useVersionPopupControl());

    // Should not throw
    expect(() => result.current.openVersionPopup()).not.toThrow();
  });

  it("should return openVersionPopup function inside provider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VersionPopupProvider>{children}</VersionPopupProvider>
    );

    const { result } = renderHook(() => useVersionPopupControl(), { wrapper });

    expect(typeof result.current.openVersionPopup).toBe("function");
  });
});

describe("useVersionPopup", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should return clearVersionHistory function", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VersionPopupProvider>{children}</VersionPopupProvider>
    );

    const { result } = renderHook(() => useVersionPopup(), { wrapper });

    expect(typeof result.current.clearVersionHistory).toBe("function");
  });

  it("should return openVersionPopup function", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VersionPopupProvider>{children}</VersionPopupProvider>
    );

    const { result } = renderHook(() => useVersionPopup(), { wrapper });

    expect(typeof result.current.openVersionPopup).toBe("function");
  });

  it("should remove localStorage and reload when clearVersionHistory called", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <VersionPopupProvider>{children}</VersionPopupProvider>
    );

    const { result } = renderHook(() => useVersionPopup(), { wrapper });

    act(() => {
      result.current.clearVersionHistory();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("claude-insider-last-seen-version");
    expect(mockReload).toHaveBeenCalled();
  });
});

describe("VersionPopupProvider", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should render children", () => {
    render(
      <VersionPopupProvider>
        <div data-testid="child">Child content</div>
      </VersionPopupProvider>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should not show popup by default", () => {
    render(
      <VersionPopupProvider>
        <div>Content</div>
      </VersionPopupProvider>
    );

    expect(screen.queryByText("What's New")).not.toBeInTheDocument();
  });
});

describe("VersionUpdatePopup UI", () => {
  // Component to trigger popup
  function PopupTrigger() {
    const { openVersionPopup } = useVersionPopupControl();
    return (
      <button onClick={openVersionPopup} data-testid="trigger">
        Open Popup
      </button>
    );
  }

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("Opening and Closing", () => {
    it("should open popup when triggered", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(screen.getByText("What's New")).toBeInTheDocument();
    });

    it("should show version number", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(screen.getByText("Version 1.21.0")).toBeInTheDocument();
    });

    it("should close popup when backdrop is clicked", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));
      expect(screen.getByText("What's New")).toBeInTheDocument();

      // Click backdrop (first element with animate-fade-in)
      const backdrop = document.querySelector(".bg-black\\/50");
      fireEvent.click(backdrop!);

      expect(screen.queryByText("What's New")).not.toBeInTheDocument();
    });

    it("should close popup when close button is clicked", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));
      expect(screen.getByText("What's New")).toBeInTheDocument();

      const closeButton = screen.getByLabelText("Close");
      fireEvent.click(closeButton);

      expect(screen.queryByText("What's New")).not.toBeInTheDocument();
    });

    it("should close popup when Got it button is clicked", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));
      expect(screen.getByText("What's New")).toBeInTheDocument();

      const gotItButton = screen.getByText("Got it!");
      fireEvent.click(gotItButton);

      expect(screen.queryByText("What's New")).not.toBeInTheDocument();
    });

    it("should save version to localStorage on dismiss", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));
      fireEvent.click(screen.getByText("Got it!"));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "claude-insider-last-seen-version",
        "1.21.0"
      );
    });
  });

  describe("Version Type Badge", () => {
    it("should show release type badge", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      // v1.21.0 is a minor release based on CHANGELOG
      expect(screen.getByText("New Features")).toBeInTheDocument();
    });
  });

  describe("Changelog Highlights", () => {
    it("should show changelog highlights", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      // v1.21.0 highlights should be visible
      // At least one highlight should be visible
      const highlights = screen.getAllByRole("listitem");
      expect(highlights.length).toBeGreaterThan(0);
    });

    it("should show release date", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(screen.getByText(/Released/)).toBeInTheDocument();
    });
  });

  describe("Footer Actions", () => {
    it("should show View Full Changelog link", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      const changelogLink = screen.getByText("View Full Changelog");
      expect(changelogLink).toBeInTheDocument();
      expect(changelogLink.closest("a")).toHaveAttribute("href", "/changelog");
    });

    it("should close popup when View Full Changelog is clicked", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));
      fireEvent.click(screen.getByText("View Full Changelog"));

      expect(screen.queryByText("What's New")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have backdrop blur", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(document.querySelector(".backdrop-blur-sm")).toBeInTheDocument();
    });

    it("should have z-50 for proper stacking", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(document.querySelectorAll(".z-50").length).toBeGreaterThan(0);
    });

    it("should have scale-in animation", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(document.querySelector(".animate-scale-in")).toBeInTheDocument();
    });

    it("should have gradient header accent", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(document.querySelector(".bg-gradient-to-r")).toBeInTheDocument();
    });

    it("should have party emoji", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(screen.getByText("🎉")).toBeInTheDocument();
    });
  });

  describe("Modal Structure", () => {
    it("should have max-w-md for modal width", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(document.querySelector(".max-w-md")).toBeInTheDocument();
    });

    it("should have rounded modal", () => {
      render(
        <VersionPopupProvider>
          <PopupTrigger />
        </VersionPopupProvider>
      );

      fireEvent.click(screen.getByTestId("trigger"));

      expect(document.querySelector(".rounded-2xl")).toBeInTheDocument();
    });
  });
});

describe("Context Isolation", () => {
  it("should not affect components outside provider", () => {
    const OutsideComponent = () => {
      const { openVersionPopup } = useVersionPopupControl();
      return (
        <button onClick={openVersionPopup} data-testid="outside">
          Outside
        </button>
      );
    };

    render(
      <>
        <OutsideComponent />
        <VersionPopupProvider>
          <div>Inside</div>
        </VersionPopupProvider>
      </>
    );

    // Should not throw when clicking outside component
    expect(() => {
      fireEvent.click(screen.getByTestId("outside"));
    }).not.toThrow();
  });
});
