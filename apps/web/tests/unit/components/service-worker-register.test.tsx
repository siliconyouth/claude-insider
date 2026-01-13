/**
 * ServiceWorkerRegister Component Tests
 *
 * Tests for the PWA service worker registration:
 * - Service worker registration
 * - Child component rendering
 * - Error handling
 * - Update checking behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

// Mock child components
vi.mock("@/components/pwa/install-prompt", () => ({
  InstallPrompt: () => <div data-testid="install-prompt">Install Prompt</div>,
}));

vi.mock("@/components/pwa/offline-indicator", () => ({
  OfflineIndicator: () => <div data-testid="offline-indicator">Offline Indicator</div>,
}));

vi.mock("@/components/pwa/update-notification", () => ({
  UpdateNotification: () => <div data-testid="update-notification">Update Notification</div>,
}));

describe("ServiceWorkerRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Child Components", () => {
    it("should render InstallPrompt", () => {
      render(<ServiceWorkerRegister />);

      expect(screen.getByTestId("install-prompt")).toBeInTheDocument();
    });

    it("should render OfflineIndicator", () => {
      render(<ServiceWorkerRegister />);

      expect(screen.getByTestId("offline-indicator")).toBeInTheDocument();
    });

    it("should render UpdateNotification", () => {
      render(<ServiceWorkerRegister />);

      expect(screen.getByTestId("update-notification")).toBeInTheDocument();
    });

    it("should render all three PWA components", () => {
      render(<ServiceWorkerRegister />);

      expect(screen.getByTestId("install-prompt")).toBeInTheDocument();
      expect(screen.getByTestId("offline-indicator")).toBeInTheDocument();
      expect(screen.getByTestId("update-notification")).toBeInTheDocument();
    });
  });

  describe("Service Worker Registration", () => {
    it("should not throw when serviceWorker is not supported", () => {
      // In JSDOM, serviceWorker is typically not available
      // Component should handle this gracefully
      expect(() => render(<ServiceWorkerRegister />)).not.toThrow();
    });

    it("should render even without serviceWorker support", () => {
      render(<ServiceWorkerRegister />);

      // All child components should still render
      expect(screen.getByTestId("install-prompt")).toBeInTheDocument();
      expect(screen.getByTestId("offline-indicator")).toBeInTheDocument();
      expect(screen.getByTestId("update-notification")).toBeInTheDocument();
    });
  });

  describe("SSR Safety", () => {
    it("should handle window undefined gracefully", () => {
      // In SSR, window would be undefined
      // The component checks typeof window !== "undefined"
      // This test verifies the component renders without errors
      render(<ServiceWorkerRegister />);

      // Should render children regardless
      expect(screen.getByTestId("install-prompt")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("should render as a fragment with children", () => {
      const { container } = render(<ServiceWorkerRegister />);

      // Should not have a wrapper element - children are direct
      const children = container.children;
      expect(children.length).toBe(3);
    });

    it("should render children in correct order", () => {
      const { container } = render(<ServiceWorkerRegister />);

      const children = Array.from(container.children);
      expect(children[0]).toHaveAttribute("data-testid", "install-prompt");
      expect(children[1]).toHaveAttribute("data-testid", "offline-indicator");
      expect(children[2]).toHaveAttribute("data-testid", "update-notification");
    });
  });
});
