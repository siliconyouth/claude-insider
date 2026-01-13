/**
 * ErrorBoundary Component Tests
 *
 * Tests for the error handling components:
 * - ErrorBoundary: Class component that catches errors
 * - InlineError: Simple inline error display
 * - AsyncErrorBoundary: ErrorBoundary with Suspense
 * - OfflineDetector: Detects online/offline status
 * - ErrorToast: Transient error notifications
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  ErrorBoundary,
  InlineError,
  OfflineDetector,
  ErrorToast,
} from "@/components/error-boundary";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: vi.fn(({ children, href, className }) => (
    <a href={href} className={className}>
      {children}
    </a>
  )),
}));

// Component that throws an error for testing
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
}

// Suppress console.error during error boundary tests
const originalConsoleError = console.error;

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("Normal Rendering", () => {
    it("should render children when no error", () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("First child")).toBeInTheDocument();
      expect(screen.getByText("Second child")).toBeInTheDocument();
    });
  });

  describe("Error Catching", () => {
    it("should catch and display error", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Unexpected Error")).toBeInTheDocument();
    });

    it("should call onError callback when error occurs", () => {
      const handleError = vi.fn();

      render(
        <ErrorBoundary onError={handleError}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(handleError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });

    it("should display default error message", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something unexpected happened. We're working on it.")).toBeInTheDocument();
    });
  });

  describe("Custom Fallback", () => {
    it("should render custom fallback when provided", () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom error UI")).toBeInTheDocument();
      expect(screen.queryByText("Unexpected Error")).not.toBeInTheDocument();
    });
  });

  describe("Severity Levels", () => {
    it("should apply warning severity styles", () => {
      render(
        <ErrorBoundary severity="warning">
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-blue-200");
    });

    it("should apply error severity styles", () => {
      render(
        <ErrorBoundary severity="error">
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-red-200");
    });

    it("should apply critical severity styles", () => {
      render(
        <ErrorBoundary severity="critical">
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-red-300");
    });
  });

  describe("Error Categories", () => {
    it("should display network error message", () => {
      render(
        <ErrorBoundary category="network">
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Connection Error")).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument();
    });

    it("should display render error message", () => {
      render(
        <ErrorBoundary category="render">
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Display Error")).toBeInTheDocument();
    });

    it("should display data error message", () => {
      render(
        <ErrorBoundary category="data">
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Data Error")).toBeInTheDocument();
    });

    it("should display auth error message", () => {
      render(
        <ErrorBoundary category="auth">
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Authentication Error")).toBeInTheDocument();
    });
  });

  describe("Retry Functionality", () => {
    it("should show Try Again button", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("should call onReset when Try Again is clicked", () => {
      const handleReset = vi.fn();

      render(
        <ErrorBoundary onReset={handleReset}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      expect(handleReset).toHaveBeenCalledTimes(1);
    });

    it("should show retry count", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      // Click try again
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      // Re-render to cause error again
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText(/retry attempt 1 of 3/i)).toBeInTheDocument();
    });

    it("should show max retries message after 3 attempts", () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      // Retry 3 times
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole("button", { name: /try again/i }));
        rerender(
          <ErrorBoundary>
            <ThrowError shouldThrow />
          </ErrorBoundary>
        );
      }

      expect(screen.getByText(/maximum retries reached/i)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should show Go Home link", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      const homeLink = screen.getByRole("link", { name: /go home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute("href", "/");
    });
  });

  describe("Error Details", () => {
    it("should show error details when showDetails is true", () => {
      render(
        <ErrorBoundary showDetails>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should hide error details when showDetails is false", () => {
      render(
        <ErrorBoundary showDetails={false}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.queryByText("Test error message")).not.toBeInTheDocument();
    });

    it("should toggle stack trace visibility", () => {
      render(
        <ErrorBoundary showDetails>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      const toggleButton = screen.getByRole("button", { name: /show stack trace/i });
      fireEvent.click(toggleButton);

      expect(screen.getByRole("button", { name: /hide stack trace/i })).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have alert role", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should have aria-live assertive", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
    });
  });
});

describe("InlineError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render error message", () => {
      render(<InlineError message="Something went wrong" />);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should have alert role", () => {
      render(<InlineError message="Error" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<InlineError message="Error" className="custom-error" />);

      expect(screen.getByRole("alert")).toHaveClass("custom-error");
    });

    it("should have error styling", () => {
      render(<InlineError message="Error" />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-red-200");
      expect(alert).toHaveClass("bg-red-50");
    });
  });

  describe("Retry Button", () => {
    it("should not show retry button by default", () => {
      render(<InlineError message="Error" />);

      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    });

    it("should show retry button when onRetry is provided", () => {
      render(<InlineError message="Error" onRetry={() => {}} />);

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    it("should call onRetry when clicked", () => {
      const handleRetry = vi.fn();
      render(<InlineError message="Error" onRetry={handleRetry} />);

      fireEvent.click(screen.getByRole("button", { name: /retry/i }));

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});

describe("OfflineDetector", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });

    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe("Online State", () => {
    it("should render children when online", () => {
      render(
        <OfflineDetector>
          <div>Online content</div>
        </OfflineDetector>
      );

      expect(screen.getByText("Online content")).toBeInTheDocument();
    });
  });

  describe("Offline State", () => {
    it("should show offline message when offline", () => {
      Object.defineProperty(navigator, "onLine", { value: false });

      render(
        <OfflineDetector>
          <div>Online content</div>
        </OfflineDetector>
      );

      expect(screen.getByText("You're Offline")).toBeInTheDocument();
      expect(screen.queryByText("Online content")).not.toBeInTheDocument();
    });

    it("should show custom offline fallback", () => {
      Object.defineProperty(navigator, "onLine", { value: false });

      render(
        <OfflineDetector offlineFallback={<div>Custom offline</div>}>
          <div>Online content</div>
        </OfflineDetector>
      );

      expect(screen.getByText("Custom offline")).toBeInTheDocument();
    });
  });

  describe("Event Listeners", () => {
    it("should add online/offline event listeners", () => {
      render(
        <OfflineDetector>
          <div>Content</div>
        </OfflineDetector>
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    });

    it("should remove event listeners on unmount", () => {
      const { unmount } = render(
        <OfflineDetector>
          <div>Content</div>
        </OfflineDetector>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    });

    it("should update state when going offline", () => {
      render(
        <OfflineDetector>
          <div>Online content</div>
        </OfflineDetector>
      );

      expect(screen.getByText("Online content")).toBeInTheDocument();

      // Simulate going offline
      act(() => {
        const offlineHandler = addEventListenerSpy.mock.calls.find(
          (call) => call[0] === "offline"
        )?.[1] as EventListener;
        offlineHandler?.(new Event("offline"));
      });

      expect(screen.getByText("You're Offline")).toBeInTheDocument();
    });

    it("should update state when going online", () => {
      Object.defineProperty(navigator, "onLine", { value: false });

      render(
        <OfflineDetector>
          <div>Online content</div>
        </OfflineDetector>
      );

      expect(screen.getByText("You're Offline")).toBeInTheDocument();

      // Simulate going online
      act(() => {
        const onlineHandler = addEventListenerSpy.mock.calls.find(
          (call) => call[0] === "online"
        )?.[1] as EventListener;
        onlineHandler?.(new Event("online"));
      });

      expect(screen.getByText("Online content")).toBeInTheDocument();
    });
  });
});

describe("ErrorToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render error message", () => {
      render(<ErrorToast message="Error occurred" onDismiss={() => {}} />);

      expect(screen.getByText("Error occurred")).toBeInTheDocument();
    });

    it("should have alert role", () => {
      render(<ErrorToast message="Error" onDismiss={() => {}} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should show dismiss button", () => {
      render(<ErrorToast message="Error" onDismiss={() => {}} />);

      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe("Retry Button", () => {
    it("should not show retry button by default", () => {
      render(<ErrorToast message="Error" onDismiss={() => {}} />);

      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    });

    it("should show retry button when onRetry is provided", () => {
      render(<ErrorToast message="Error" onDismiss={() => {}} onRetry={() => {}} />);

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    it("should call onRetry when clicked", () => {
      const handleRetry = vi.fn();
      render(<ErrorToast message="Error" onDismiss={() => {}} onRetry={handleRetry} />);

      fireEvent.click(screen.getByRole("button", { name: /retry/i }));

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("Dismiss", () => {
    it("should call onDismiss when dismiss button is clicked", () => {
      const handleDismiss = vi.fn();
      render(<ErrorToast message="Error" onDismiss={handleDismiss} />);

      fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it("should auto-dismiss after default duration", () => {
      const handleDismiss = vi.fn();
      render(<ErrorToast message="Error" onDismiss={handleDismiss} />);

      expect(handleDismiss).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it("should auto-dismiss after custom duration", () => {
      const handleDismiss = vi.fn();
      render(<ErrorToast message="Error" onDismiss={handleDismiss} duration={2000} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it("should clear timeout on unmount", () => {
      const handleDismiss = vi.fn();
      const { unmount } = render(<ErrorToast message="Error" onDismiss={handleDismiss} />);

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(handleDismiss).not.toHaveBeenCalled();
    });
  });

  describe("Styling", () => {
    it("should have fixed positioning", () => {
      render(<ErrorToast message="Error" onDismiss={() => {}} />);

      expect(screen.getByRole("alert")).toHaveClass("fixed");
    });

    it("should have high z-index", () => {
      render(<ErrorToast message="Error" onDismiss={() => {}} />);

      expect(screen.getByRole("alert")).toHaveClass("z-50");
    });
  });
});

describe("Error Recovery", () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("should recover after reset when error is fixed", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();

    // First, update the children to no longer throw
    // ErrorBoundary still shows error because hasError state is true
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Error boundary still shows error UI until reset
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Click try again - now the ErrorBoundary resets state and renders the updated children
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    // Now it should show the content since children no longer throw
    expect(screen.getByText("No error")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
