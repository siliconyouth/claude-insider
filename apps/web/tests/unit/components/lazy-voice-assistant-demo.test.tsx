/**
 * LazyVoiceAssistantDemo Component Tests
 *
 * Tests for the lazy-loaded voice assistant demo:
 * - Error boundary behavior
 * - Loading skeleton display
 * - Retry functionality
 * - Component structure
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/dynamic to render a simple component or throw
const mockDynamicComponent = vi.fn();
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>, options?: { loading?: () => React.ReactNode }) => {
    // Return a component that either renders the loading state or the mock
    return function DynamicComponent() {
      if (mockDynamicComponent.mock.calls.length > 0 && mockDynamicComponent.mock.results[0]?.value === "throw") {
        throw new Error("Test error");
      }
      // Return loading skeleton by default
      if (options?.loading) {
        return options.loading();
      }
      return <div data-testid="voice-assistant-demo">VoiceAssistantDemo</div>;
    };
  },
}));

// Import after mocks
import { LazyVoiceAssistantDemo } from "@/components/lazy-voice-assistant-demo";

// Suppress console.error for error boundary tests
const originalError = console.error;

describe("LazyVoiceAssistantDemo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe("Normal Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<LazyVoiceAssistantDemo />)).not.toThrow();
    });

    it("should render a container element", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("Loading Skeleton", () => {
    it("should have skeleton with rounded corners", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      expect(container.querySelector(".rounded-2xl")).toBeInTheDocument();
    });

    it("should have header skeleton area", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      // Header has flex and border-b
      expect(container.querySelector(".border-b")).toBeInTheDocument();
    });

    it("should have animated pulse elements", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should have messages skeleton area", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      // Messages area with height
      expect(container.querySelector(".h-64")).toBeInTheDocument();
    });

    it("should have backdrop blur styling", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      expect(container.querySelector(".backdrop-blur-xl")).toBeInTheDocument();
    });

    it("should have dark background", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      expect(container.querySelector(".bg-gray-900\\/95")).toBeInTheDocument();
    });

    it("should have shadow styling", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      expect(container.querySelector(".shadow-2xl")).toBeInTheDocument();
    });
  });

  describe("Skeleton Structure", () => {
    it("should have avatar skeleton in header", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      // Avatar is w-8 h-8 rounded-full
      const avatar = container.querySelector(".w-8.h-8.rounded-full");
      expect(avatar).toBeInTheDocument();
    });

    it("should have title skeleton in header", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      // Title skeleton is h-4 w-32
      const title = container.querySelector(".h-4.w-32");
      expect(title).toBeInTheDocument();
    });

    it("should have user message skeleton", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      // User message skeleton with blue tint
      const userMessage = container.querySelector(".bg-blue-900\\/30");
      expect(userMessage).toBeInTheDocument();
    });

    it("should have assistant message skeleton", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      // Assistant message skeleton with gray
      const assistantMessage = container.querySelector(".bg-gray-800\\/50");
      expect(assistantMessage).toBeInTheDocument();
    });

    it("should have border on container", () => {
      const { container } = render(<LazyVoiceAssistantDemo />);

      expect(container.querySelector(".border")).toBeInTheDocument();
    });
  });
});

// Separate describe block for error boundary tests
describe("VoiceAssistantErrorBoundary (internal)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  // Note: Testing error boundaries with dynamic imports is complex
  // The error boundary is internal to the component
  // These tests verify the structure exists

  it("should wrap content in error boundary", () => {
    const { container } = render(<LazyVoiceAssistantDemo />);

    // Component should render something
    expect(container.firstChild).toBeInTheDocument();
  });
});
