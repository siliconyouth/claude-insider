/**
 * Error Pages Component Tests
 *
 * Tests for route-specific error pages (404, 500, 403, maintenance, generic).
 * Part of the UX System - Pillar 5: Error Boundaries with Style
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  NotFoundPage,
  ServerErrorPage,
  ForbiddenPage,
  MaintenancePage,
  GenericErrorPage,
} from "@/components/error-pages";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Error Pages", () => {
  // Mock window methods
  const mockHistoryBack = vi.fn();
  const mockLocationReload = vi.fn();
  const originalHistory = window.history;
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.history.back
    Object.defineProperty(window, "history", {
      value: { back: mockHistoryBack },
      writable: true,
    });

    // Mock window.location.reload
    Object.defineProperty(window, "location", {
      value: { reload: mockLocationReload },
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, "history", {
      value: originalHistory,
      writable: true,
    });
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
    vi.useRealTimers();
  });

  describe("NotFoundPage", () => {
    describe("Rendering", () => {
      it("should render 404 status code", () => {
        render(<NotFoundPage />);

        expect(screen.getByText("404")).toBeInTheDocument();
      });

      it("should render default title", () => {
        render(<NotFoundPage />);

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          "Page Not Found"
        );
      });

      it("should render default description", () => {
        render(<NotFoundPage />);

        expect(
          screen.getByText(
            "The page you're looking for doesn't exist or has been moved."
          )
        ).toBeInTheDocument();
      });

      it("should render search input by default", () => {
        render(<NotFoundPage />);

        expect(
          screen.getByPlaceholderText("Search documentation...")
        ).toBeInTheDocument();
      });

      it("should render Go Home link", () => {
        render(<NotFoundPage />);

        const homeLink = screen.getByRole("link", { name: /go home/i });
        expect(homeLink).toHaveAttribute("href", "/");
      });

      it("should render Go Back button", () => {
        render(<NotFoundPage />);

        expect(
          screen.getByRole("button", { name: /go back/i })
        ).toBeInTheDocument();
      });

      it("should render popular pages links", () => {
        render(<NotFoundPage />);

        expect(
          screen.getByRole("link", { name: /getting started/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("link", { name: /configuration/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("link", { name: /api reference/i })
        ).toBeInTheDocument();
      });
    });

    describe("Custom Props", () => {
      it("should render custom title", () => {
        render(<NotFoundPage title="Custom 404 Title" />);

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          "Custom 404 Title"
        );
      });

      it("should render custom description", () => {
        render(<NotFoundPage description="Custom description text" />);

        expect(screen.getByText("Custom description text")).toBeInTheDocument();
      });

      it("should hide search when showSearch is false", () => {
        render(<NotFoundPage showSearch={false} />);

        expect(
          screen.queryByPlaceholderText("Search documentation...")
        ).not.toBeInTheDocument();
      });
    });

    describe("Interactions", () => {
      it("should call history.back when Go Back is clicked", () => {
        render(<NotFoundPage />);

        const backButton = screen.getByRole("button", { name: /go back/i });
        fireEvent.click(backButton);

        expect(mockHistoryBack).toHaveBeenCalledTimes(1);
      });

      it("should update search input value", () => {
        render(<NotFoundPage />);

        const input = screen.getByPlaceholderText("Search documentation...");
        fireEvent.change(input, { target: { value: "test query" } });

        expect(input).toHaveValue("test query");
      });

      it("should dispatch keyboard event on search submit", () => {
        const dispatchEventSpy = vi.spyOn(document, "dispatchEvent");
        render(<NotFoundPage />);

        const input = screen.getByPlaceholderText("Search documentation...");
        fireEvent.change(input, { target: { value: "test" } });

        const form = input.closest("form");
        expect(form).not.toBeNull();
        fireEvent.submit(form!);

        expect(dispatchEventSpy).toHaveBeenCalled();
        dispatchEventSpy.mockRestore();
      });

      it("should not dispatch event on empty search", () => {
        const dispatchEventSpy = vi.spyOn(document, "dispatchEvent");
        render(<NotFoundPage />);

        const input = screen.getByPlaceholderText("Search documentation...");
        const form = input.closest("form");
        fireEvent.submit(form!);

        // Event should not be dispatched for empty query
        const keyboardEvents = dispatchEventSpy.mock.calls.filter(
          (call) => call[0] instanceof KeyboardEvent
        );
        expect(keyboardEvents.length).toBe(0);
        dispatchEventSpy.mockRestore();
      });
    });

    describe("Icons", () => {
      it("should render search icon in 404 overlay", () => {
        const { container } = render(<NotFoundPage />);

        const svg = container.querySelector("svg.animate-pulse");
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe("ServerErrorPage", () => {
    describe("Rendering", () => {
      it("should render 500 status code", () => {
        render(<ServerErrorPage />);

        expect(screen.getByText("500")).toBeInTheDocument();
      });

      it("should render Server Error heading", () => {
        render(<ServerErrorPage />);

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          "Server Error"
        );
      });

      it("should render error description", () => {
        render(<ServerErrorPage />);

        expect(
          screen.getByText(
            "Something went wrong on our end. Our team has been notified."
          )
        ).toBeInTheDocument();
      });

      it("should render Go Home link", () => {
        render(<ServerErrorPage />);

        const homeLink = screen.getByRole("link", { name: /go home/i });
        expect(homeLink).toHaveAttribute("href", "/");
      });
    });

    describe("Reset Functionality", () => {
      it("should render Try Again button when reset is provided", () => {
        const mockReset = vi.fn();
        render(<ServerErrorPage reset={mockReset} />);

        expect(
          screen.getByRole("button", { name: /try again/i })
        ).toBeInTheDocument();
      });

      it("should call reset when Try Again is clicked", () => {
        const mockReset = vi.fn();
        render(<ServerErrorPage reset={mockReset} />);

        const retryButton = screen.getByRole("button", { name: /try again/i });
        fireEvent.click(retryButton);

        expect(mockReset).toHaveBeenCalledTimes(1);
      });

      it("should not render Try Again button without reset", () => {
        render(<ServerErrorPage />);

        expect(
          screen.queryByRole("button", { name: /try again/i })
        ).not.toBeInTheDocument();
      });
    });

    describe("Auto-Retry Countdown", () => {
      it("should show countdown when reset is provided", () => {
        const mockReset = vi.fn();
        render(<ServerErrorPage reset={mockReset} />);

        expect(screen.getByText(/auto-retrying in 30s/i)).toBeInTheDocument();
      });

      it("should show Cancel button during countdown", () => {
        const mockReset = vi.fn();
        render(<ServerErrorPage reset={mockReset} />);

        expect(
          screen.getByRole("button", { name: /cancel/i })
        ).toBeInTheDocument();
      });

      it("should decrement countdown over time", async () => {
        vi.useFakeTimers();
        const mockReset = vi.fn();
        render(<ServerErrorPage reset={mockReset} />);

        expect(screen.getByText(/auto-retrying in 30s/i)).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(1000);
        });

        expect(screen.getByText(/auto-retrying in 29s/i)).toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(5000);
        });

        expect(screen.getByText(/auto-retrying in 24s/i)).toBeInTheDocument();
      });

      it("should call reset when countdown reaches zero", async () => {
        vi.useFakeTimers();
        const mockReset = vi.fn();
        render(<ServerErrorPage reset={mockReset} />);

        act(() => {
          vi.advanceTimersByTime(30000);
        });

        expect(mockReset).toHaveBeenCalled();
      });

      it("should stop countdown when Cancel is clicked", async () => {
        vi.useFakeTimers();
        const mockReset = vi.fn();
        render(<ServerErrorPage reset={mockReset} />);

        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(
          screen.queryByText(/auto-retrying in/i)
        ).not.toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(35000);
        });

        expect(mockReset).not.toHaveBeenCalled();
      });
    });

    describe("Error Details", () => {
      it("should not show error details by default", () => {
        const error = new Error("Test error message");
        render(<ServerErrorPage error={error} />);

        expect(
          screen.queryByText("Test error message")
        ).not.toBeInTheDocument();
      });

      it("should show error details when showDetails is true", () => {
        const error = new Error("Test error message");
        render(<ServerErrorPage error={error} showDetails={true} />);

        expect(screen.getByText("Test error message")).toBeInTheDocument();
      });

      it("should not show error details without error object", () => {
        const { container } = render(<ServerErrorPage showDetails={true} />);

        // Should not render error details div
        expect(
          container.querySelector(".bg-red-50, .bg-red-900\\/20")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("ForbiddenPage", () => {
    describe("Rendering", () => {
      it("should render 403 status code", () => {
        render(<ForbiddenPage />);

        expect(screen.getByText("403")).toBeInTheDocument();
      });

      it("should render Access Denied heading", () => {
        render(<ForbiddenPage />);

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          "Access Denied"
        );
      });

      it("should render default message", () => {
        render(<ForbiddenPage />);

        expect(
          screen.getByText(
            "You don't have permission to access this resource."
          )
        ).toBeInTheDocument();
      });

      it("should render Go Home link", () => {
        render(<ForbiddenPage />);

        const homeLink = screen.getByRole("link", { name: /go home/i });
        expect(homeLink).toHaveAttribute("href", "/");
      });

      it("should render Go Back button", () => {
        render(<ForbiddenPage />);

        expect(
          screen.getByRole("button", { name: /go back/i })
        ).toBeInTheDocument();
      });
    });

    describe("Custom Props", () => {
      it("should render custom message", () => {
        render(
          <ForbiddenPage message="Admin access required for this section." />
        );

        expect(
          screen.getByText("Admin access required for this section.")
        ).toBeInTheDocument();
      });
    });

    describe("Interactions", () => {
      it("should call history.back when Go Back is clicked", () => {
        render(<ForbiddenPage />);

        const backButton = screen.getByRole("button", { name: /go back/i });
        fireEvent.click(backButton);

        expect(mockHistoryBack).toHaveBeenCalledTimes(1);
      });
    });

    describe("Icons", () => {
      it("should render shield icon", () => {
        const { container } = render(<ForbiddenPage />);

        // Shield icon has specific path for the checkmark
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe("MaintenancePage", () => {
    describe("Rendering", () => {
      it("should render Under Maintenance heading", () => {
        render(<MaintenancePage />);

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          "Under Maintenance"
        );
      });

      it("should render default message", () => {
        render(<MaintenancePage />);

        expect(
          screen.getByText(
            "We're performing scheduled maintenance. We'll be back shortly."
          )
        ).toBeInTheDocument();
      });

      it("should render Check Status button", () => {
        render(<MaintenancePage />);

        expect(
          screen.getByRole("button", { name: /check status/i })
        ).toBeInTheDocument();
      });

      it("should not show estimated time by default", () => {
        render(<MaintenancePage />);

        expect(
          screen.queryByText(/estimated time/i)
        ).not.toBeInTheDocument();
      });
    });

    describe("Custom Props", () => {
      it("should render custom message", () => {
        render(<MaintenancePage message="Upgrading database infrastructure." />);

        expect(
          screen.getByText("Upgrading database infrastructure.")
        ).toBeInTheDocument();
      });

      it("should render estimated time when provided", () => {
        render(<MaintenancePage estimatedTime="30 minutes" />);

        expect(
          screen.getByText(/estimated time: 30 minutes/i)
        ).toBeInTheDocument();
      });
    });

    describe("Interactions", () => {
      it("should call location.reload when Check Status is clicked", () => {
        render(<MaintenancePage />);

        const checkButton = screen.getByRole("button", {
          name: /check status/i,
        });
        fireEvent.click(checkButton);

        expect(mockLocationReload).toHaveBeenCalledTimes(1);
      });
    });

    describe("Icons", () => {
      it("should render animated gear icon", () => {
        const { container } = render(<MaintenancePage />);

        const svg = container.querySelector("svg.animate-spin-slow");
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe("GenericErrorPage", () => {
    describe("Rendering", () => {
      it("should render custom status code", () => {
        render(
          <GenericErrorPage
            statusCode={418}
            title="I'm a Teapot"
            description="The server refuses to brew coffee."
          />
        );

        expect(screen.getByText("418")).toBeInTheDocument();
      });

      it("should render custom title", () => {
        render(
          <GenericErrorPage
            statusCode={418}
            title="I'm a Teapot"
            description="The server refuses to brew coffee."
          />
        );

        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          "I'm a Teapot"
        );
      });

      it("should render custom description", () => {
        render(
          <GenericErrorPage
            statusCode={418}
            title="I'm a Teapot"
            description="The server refuses to brew coffee."
          />
        );

        expect(
          screen.getByText("The server refuses to brew coffee.")
        ).toBeInTheDocument();
      });

      it("should render default actions when not provided", () => {
        render(
          <GenericErrorPage
            statusCode={418}
            title="I'm a Teapot"
            description="Test"
          />
        );

        expect(
          screen.getByRole("link", { name: /go home/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /go back/i })
        ).toBeInTheDocument();
      });
    });

    describe("Custom Icon", () => {
      it("should render custom icon when provided", () => {
        render(
          <GenericErrorPage
            statusCode={418}
            title="I'm a Teapot"
            description="Test"
            icon={<span data-testid="custom-icon">☕</span>}
          />
        );

        expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
        expect(screen.getByText("☕")).toBeInTheDocument();
      });

      it("should not render icon container without icon", () => {
        const { container } = render(
          <GenericErrorPage
            statusCode={418}
            title="I'm a Teapot"
            description="Test"
          />
        );

        // The icon container should have only the status code
        const statusCodeElement = screen.getByText("418");
        const parent = statusCodeElement.parentElement;
        expect(parent?.querySelectorAll(".absolute")).toHaveLength(0);
      });
    });

    describe("Custom Actions", () => {
      it("should render custom actions when provided", () => {
        render(
          <GenericErrorPage
            statusCode={503}
            title="Service Unavailable"
            description="Test"
            actions={
              <button data-testid="custom-action">Custom Action</button>
            }
          />
        );

        expect(screen.getByTestId("custom-action")).toBeInTheDocument();
        expect(
          screen.queryByRole("link", { name: /go home/i })
        ).not.toBeInTheDocument();
      });
    });

    describe("Interactions", () => {
      it("should call history.back when Go Back is clicked", () => {
        render(
          <GenericErrorPage
            statusCode={502}
            title="Bad Gateway"
            description="Test"
          />
        );

        const backButton = screen.getByRole("button", { name: /go back/i });
        fireEvent.click(backButton);

        expect(mockHistoryBack).toHaveBeenCalledTimes(1);
      });
    });

    describe("Various Status Codes", () => {
      const statusCodes = [
        { code: 400, title: "Bad Request" },
        { code: 401, title: "Unauthorized" },
        { code: 502, title: "Bad Gateway" },
        { code: 503, title: "Service Unavailable" },
        { code: 504, title: "Gateway Timeout" },
      ];

      statusCodes.forEach(({ code, title }) => {
        it(`should render ${code} error page correctly`, () => {
          render(
            <GenericErrorPage
              statusCode={code}
              title={title}
              description={`${title} error`}
            />
          );

          expect(screen.getByText(String(code))).toBeInTheDocument();
          expect(
            screen.getByRole("heading", { level: 1 })
          ).toHaveTextContent(title);
        });
      });
    });
  });

  describe("Shared Styles", () => {
    it("NotFoundPage should have container styles", () => {
      const { container } = render(<NotFoundPage />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("min-h-[60vh]");
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("justify-center");
    });

    it("ServerErrorPage should have card styles", () => {
      const { container } = render(<ServerErrorPage />);

      const card = container.querySelector(".rounded-2xl");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("max-w-md");
      expect(card).toHaveClass("shadow-lg");
    });

    it("all error pages should have animate-fade-in-up animation", () => {
      const { container: c1 } = render(<NotFoundPage />);
      const { container: c2 } = render(<ForbiddenPage />);
      const { container: c3 } = render(<MaintenancePage />);

      expect(c1.querySelector(".animate-fade-in-up")).toBeInTheDocument();
      expect(c2.querySelector(".animate-fade-in-up")).toBeInTheDocument();
      expect(c3.querySelector(".animate-fade-in-up")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("NotFoundPage should have heading level 1", () => {
      render(<NotFoundPage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("ServerErrorPage should have heading level 1", () => {
      render(<ServerErrorPage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("ForbiddenPage should have heading level 1", () => {
      render(<ForbiddenPage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("MaintenancePage should have heading level 1", () => {
      render(<MaintenancePage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("GenericErrorPage should have heading level 1", () => {
      render(
        <GenericErrorPage
          statusCode={500}
          title="Error"
          description="Test"
        />
      );

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("icons should have aria-hidden attribute", () => {
      const { container } = render(<NotFoundPage />);

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it("status code should have select-none class", () => {
      render(<NotFoundPage />);

      const statusCode = screen.getByText("404");
      expect(statusCode).toHaveClass("select-none");
    });
  });
});
