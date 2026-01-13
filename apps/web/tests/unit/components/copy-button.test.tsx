/**
 * CopyButton Component Tests
 *
 * Tests for the copy-to-clipboard button component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CopyButton } from "@/components/copy-button";

describe("CopyButton", () => {
  let mockWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup clipboard mock before each test
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render a button", () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should have 'Copy code' aria-label initially", () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button", { name: /copy code/i });
      expect(button).toBeInTheDocument();
    });

    it("should have 'Copy code' title initially", () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("title", "Copy code");
    });

    it("should render copy icon initially", () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Copy Functionality", () => {
    it("should copy text to clipboard when clicked", async () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockWriteText).toHaveBeenCalledWith("Hello World");
    });

    it("should copy provided text prop", async () => {
      const testText = "const x = 42;";
      render(<CopyButton text={testText} />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockWriteText).toHaveBeenCalledWith(testText);
    });

    it("should handle multiline text", async () => {
      const multilineText = "line 1\nline 2\nline 3";
      render(<CopyButton text={multilineText} />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockWriteText).toHaveBeenCalledWith(multilineText);
    });
  });

  describe("Copied State", () => {
    it("should show 'Copied!' aria-label after clicking", async () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      expect(button).toHaveAttribute("aria-label", "Copied!");
    });

    it("should show 'Copied!' title after clicking", async () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      expect(button).toHaveAttribute("title", "Copied!");
    });

    it("should show check icon after successful copy", async () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      // Check icon has text-green-400 class
      const svg = button.querySelector("svg");
      expect(svg).toHaveClass("text-green-400");
    });

    it("should reset to initial state after 2 seconds", async () => {
      vi.useFakeTimers();

      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");

      // Click and wait for promise to resolve
      await act(async () => {
        fireEvent.click(button);
        // Let the promise resolve
        await Promise.resolve();
      });

      // Verify copied state
      expect(button).toHaveAttribute("aria-label", "Copied!");

      // Fast-forward 2 seconds
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Verify reset to initial state
      expect(button).toHaveAttribute("aria-label", "Copy code");
    });
  });

  describe("Error Handling", () => {
    it("should handle clipboard error gracefully", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      mockWriteText.mockRejectedValueOnce(new Error("Clipboard error"));

      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      expect(consoleError).toHaveBeenCalledWith("Failed to copy:", expect.any(Error));
      consoleError.mockRestore();
    });

    it("should not show copied state on error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockWriteText.mockRejectedValueOnce(new Error("Clipboard error"));

      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      // Button should remain in initial state
      expect(button).toHaveAttribute("aria-label", "Copy code");
    });
  });

  describe("Styling", () => {
    it("should have proper button classes", () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("absolute");
      expect(button).toHaveClass("rounded-lg");
    });

    it("should have opacity-0 class for hover reveal", () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("opacity-0");
      expect(button).toHaveClass("group-hover:opacity-100");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty text", async () => {
      render(<CopyButton text="" />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockWriteText).toHaveBeenCalledWith("");
    });

    it("should handle special characters", async () => {
      const specialText = "<script>alert('XSS')</script>";
      render(<CopyButton text={specialText} />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockWriteText).toHaveBeenCalledWith(specialText);
    });

    it("should handle unicode text", async () => {
      const unicodeText = "Hello 👋 世界";
      render(<CopyButton text={unicodeText} />);

      const button = screen.getByRole("button");

      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockWriteText).toHaveBeenCalledWith(unicodeText);
    });

    it("should handle multiple rapid clicks", async () => {
      render(<CopyButton text="Hello World" />);

      const button = screen.getByRole("button");

      // Click multiple times rapidly
      await act(async () => {
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);
      });

      expect(mockWriteText).toHaveBeenCalledTimes(3);
    });
  });
});
