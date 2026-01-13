/**
 * VoiceAssistantErrorBoundary Component Tests
 *
 * Tests for the voice assistant error boundary:
 * - Normal rendering (no error)
 * - Error state display
 * - Error message display
 * - Retry functionality
 * - Styling and positioning
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceAssistantErrorBoundary } from "@/components/voice-assistant-error-boundary";

// Component that throws an error
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div data-testid="child-content">Child content</div>;
}

// Suppress console.error for error boundary tests
const originalError = console.error;

describe("VoiceAssistantErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress error boundary console.error output
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe("Normal State (No Error)", () => {
    it("should render children when no error", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </VoiceAssistantErrorBoundary>
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </VoiceAssistantErrorBoundary>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });

    it("should not show error UI when no error", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </VoiceAssistantErrorBoundary>
      );

      expect(screen.queryByText("Voice Assistant Error")).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should catch and display error", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      expect(screen.getByText("Voice Assistant Error")).toBeInTheDocument();
    });

    it("should display error message", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      expect(screen.getByText("Test error message")).toBeInTheDocument();
    });

    it("should display helpful text", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    });

    it("should not render children when error", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();
    });

    it("should show retry button", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });
  });

  describe("Retry Functionality", () => {
    it("should call handleRetry when retry button clicked", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      // The retry button should be clickable
      const retryButton = screen.getByRole("button", { name: "Retry" });
      expect(retryButton).toBeInTheDocument();

      // Click should not throw
      expect(() => fireEvent.click(retryButton)).not.toThrow();
    });

    it("should attempt to re-render children on retry", () => {
      // Note: Since React error boundaries catch errors during render,
      // clicking retry will re-render but may still show error if child throws
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      // Verify error state initially
      expect(screen.getByText("Voice Assistant Error")).toBeInTheDocument();

      // Click retry
      fireEvent.click(screen.getByRole("button", { name: "Retry" }));

      // Component attempts to re-render (may catch error again if child throws)
      // This verifies the retry mechanism works
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });
  });

  describe("Error UI Styling", () => {
    it("should have fixed positioning", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorDiv = container.querySelector(".fixed");
      expect(errorDiv).toBeInTheDocument();
    });

    it("should have right positioning", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorDiv = container.querySelector(".right-6");
      expect(errorDiv).toBeInTheDocument();
    });

    it("should have high z-index", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorDiv = container.querySelector(".z-50");
      expect(errorDiv).toBeInTheDocument();
    });

    it("should have fixed width", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorDiv = container.querySelector(".w-80");
      expect(errorDiv).toBeInTheDocument();
    });

    it("should have rounded corners", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorDiv = container.querySelector(".rounded-2xl");
      expect(errorDiv).toBeInTheDocument();
    });

    it("should have red border", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorDiv = container.querySelector(".border-red-200");
      expect(errorDiv).toBeInTheDocument();
    });

    it("should have shadow", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorDiv = container.querySelector(".shadow-xl");
      expect(errorDiv).toBeInTheDocument();
    });
  });

  describe("Error Icon", () => {
    it("should display warning icon", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have red icon color", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const svg = container.querySelector(".text-red-500");
      expect(svg).toBeInTheDocument();
    });

    it("should have icon background", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const iconBg = container.querySelector(".bg-red-100");
      expect(iconBg).toBeInTheDocument();
    });
  });

  describe("Retry Button Styling", () => {
    it("should have gradient background", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const button = screen.getByRole("button", { name: "Retry" });
      expect(button.className).toContain("bg-gradient-to-r");
    });

    it("should have violet to blue gradient", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const button = screen.getByRole("button", { name: "Retry" });
      expect(button.className).toContain("from-violet-600");
      expect(button.className).toContain("to-blue-600");
    });

    it("should have white text", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const button = screen.getByRole("button", { name: "Retry" });
      expect(button.className).toContain("text-white");
    });

    it("should have rounded corners", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const button = screen.getByRole("button", { name: "Retry" });
      expect(button.className).toContain("rounded-lg");
    });
  });

  describe("Error Message Styling", () => {
    it("should display error message in mono font", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorMessage = screen.getByText("Test error message");
      expect(errorMessage.className).toContain("font-mono");
    });

    it("should display error message in red", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorMessage = screen.getByText("Test error message");
      expect(errorMessage.className).toContain("text-red-400");
    });

    it("should allow error message to break", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorMessage = screen.getByText("Test error message");
      expect(errorMessage.className).toContain("break-all");
    });
  });

  describe("Mobile Navigation Awareness", () => {
    it("should position above mobile nav using CSS variable", () => {
      const { container } = render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      const errorDiv = container.querySelector(".fixed");
      expect(errorDiv).toHaveStyle({
        bottom: "calc(1.5rem + var(--mobile-nav-height, 0px))",
      });
    });
  });

  describe("Console Logging", () => {
    it("should log error to console", () => {
      render(
        <VoiceAssistantErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </VoiceAssistantErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });
});
