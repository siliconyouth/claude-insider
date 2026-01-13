/**
 * Toast Component Tests
 *
 * Tests for the toast notification system.
 * Note: Tests focus on hook behavior and context, as portal-based rendering
 * is challenging to test with fake timers due to useEffect-based mounting.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, renderHook, act } from "@testing-library/react";
import { ToastProvider, useToast, type ToastType } from "@/components/toast";
import { ReactNode } from "react";

// Wrapper for testing hooks
function wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe("Toast System", () => {
  describe("useToast hook", () => {
    it("should return no-op functions when used outside provider", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
      expect(typeof result.current.addToast).toBe("function");
      expect(typeof result.current.removeToast).toBe("function");
      expect(typeof result.current.success).toBe("function");
      expect(typeof result.current.error).toBe("function");
      expect(typeof result.current.info).toBe("function");
      expect(typeof result.current.warning).toBe("function");
    });

    it("should not throw when calling methods outside provider", () => {
      const { result } = renderHook(() => useToast());

      expect(() => result.current.success("test")).not.toThrow();
      expect(() => result.current.error("test")).not.toThrow();
      expect(() => result.current.info("test")).not.toThrow();
      expect(() => result.current.warning("test")).not.toThrow();
    });

    it("should return empty string for toast ID when outside provider", () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.success("test")).toBe("");
      expect(result.current.addToast({ type: "success", title: "test" })).toBe("");
    });
  });

  describe("useToast with ToastProvider", () => {
    it("should add toast via success method", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success("Success Title", "Success description");
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]?.type).toBe("success");
      expect(result.current.toasts[0]?.title).toBe("Success Title");
      expect(result.current.toasts[0]?.description).toBe("Success description");
    });

    it("should add toast via error method", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.error("Error Title", "Error description");
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]?.type).toBe("error");
      expect(result.current.toasts[0]?.title).toBe("Error Title");
    });

    it("should add toast via info method", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.info("Info Title");
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]?.type).toBe("info");
      expect(result.current.toasts[0]?.title).toBe("Info Title");
    });

    it("should add toast via warning method", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.warning("Warning Title");
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]?.type).toBe("warning");
      expect(result.current.toasts[0]?.title).toBe("Warning Title");
    });

    it("should add toast via addToast method", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.addToast({
          type: "success",
          title: "Custom Toast",
          description: "Custom description",
          duration: 5000,
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]?.title).toBe("Custom Toast");
      expect(result.current.toasts[0]?.duration).toBe(5000);
    });

    it("should return unique toast ID", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      let id1: string = "";
      let id2: string = "";

      act(() => {
        id1 = result.current.success("Toast 1");
        id2 = result.current.success("Toast 2");
      });

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it("should remove toast by ID", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      let toastId: string = "";

      act(() => {
        toastId = result.current.success("Toast to remove");
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it("should support multiple toasts", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success("Toast 1");
        result.current.error("Toast 2");
        result.current.info("Toast 3");
      });

      expect(result.current.toasts).toHaveLength(3);
    });

    it("should remove only specified toast", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      let id1: string = "";
      let id2: string = "";
      let id3: string = "";

      act(() => {
        id1 = result.current.success("Toast 1");
        id2 = result.current.error("Toast 2");
        id3 = result.current.info("Toast 3");
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.removeToast(id2);
      });

      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts.find((t) => t.id === id1)).toBeTruthy();
      expect(result.current.toasts.find((t) => t.id === id2)).toBeFalsy();
      expect(result.current.toasts.find((t) => t.id === id3)).toBeTruthy();
    });

    it("should handle toast without description", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success("Title only");
      });

      expect(result.current.toasts[0]?.description).toBeUndefined();
    });

    it("should generate toast ID with toast- prefix", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      let id: string = "";

      act(() => {
        id = result.current.success("Test");
      });

      expect(id).toMatch(/^toast-/);
    });
  });

  describe("ToastProvider", () => {
    it("should render children", () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should provide context to nested components", () => {
      function NestedComponent() {
        const toast = useToast();
        return <span data-testid="count">{toast.toasts.length}</span>;
      }

      render(
        <ToastProvider>
          <NestedComponent />
        </ToastProvider>
      );

      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });
  });

  describe("Toast Type", () => {
    it("should have valid toast types", () => {
      const validTypes: ToastType[] = ["success", "error", "info", "warning"];

      validTypes.forEach((type) => {
        expect(["success", "error", "info", "warning"]).toContain(type);
      });
    });
  });

  describe("Toast ID Generation", () => {
    it("should include timestamp in ID", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      const before = Date.now();

      let id: string = "";
      act(() => {
        id = result.current.success("Test");
      });

      const after = Date.now();

      // Extract timestamp from ID (format: toast-{timestamp}-{random})
      const parts = id.split("-");
      const timestamp = parseInt(parts[1] || "0", 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it("should include random component in ID", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      const ids: string[] = [];

      act(() => {
        for (let i = 0; i < 10; i++) {
          ids.push(result.current.success(`Test ${i}`));
        }
      });

      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("Edge Cases", () => {
    it("should handle removing non-existent toast ID", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success("Test");
      });

      expect(result.current.toasts).toHaveLength(1);

      // Should not throw
      act(() => {
        result.current.removeToast("non-existent-id");
      });

      // Toast should still be there
      expect(result.current.toasts).toHaveLength(1);
    });

    it("should handle empty title", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success("");
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]?.title).toBe("");
    });

    it("should handle special characters in title", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      const specialTitle = "<script>alert('XSS')</script>";

      act(() => {
        result.current.success(specialTitle);
      });

      expect(result.current.toasts[0]?.title).toBe(specialTitle);
    });

    it("should handle unicode in title and description", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.success("Hello 👋 World", "Description with emoji 🎉");
      });

      expect(result.current.toasts[0]?.title).toBe("Hello 👋 World");
      expect(result.current.toasts[0]?.description).toBe("Description with emoji 🎉");
    });

    it("should handle very long title", () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      const longTitle = "A".repeat(1000);

      act(() => {
        result.current.success(longTitle);
      });

      expect(result.current.toasts[0]?.title).toBe(longTitle);
    });
  });
});
