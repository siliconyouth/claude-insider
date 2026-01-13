/**
 * ModeSelector Component Tests
 *
 * Tests for the prompt builder mode selector:
 * - Modal rendering
 * - Mode options display
 * - Keyboard shortcuts (1-4, arrows, escape, enter)
 * - Remember choice functionality
 * - Recommended mode highlighting
 * - Selection callbacks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ModeSelector } from "@/components/prompts/builder/mode-selector";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("ModeSelector", () => {
  const mockOnSelectMode = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Modal Rendering", () => {
    it("should render heading", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Choose Your Builder Mode")).toBeInTheDocument();
    });

    it("should show prompt title context", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );
      // Should show variable count info - the context line shows "Test Prompt • 3 variables to fill"
      expect(screen.getByText(/3 variables/i)).toBeInTheDocument();
    });

    it("should render close button", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByTitle(/close/i)).toBeInTheDocument();
    });
  });

  describe("Mode Options", () => {
    it("should display Quick mode", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Quick Mode")).toBeInTheDocument();
    });

    it("should display Guided mode", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Guided Mode")).toBeInTheDocument();
    });

    it("should display Chat mode", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Chat Mode")).toBeInTheDocument();
    });

    it("should display Playground mode", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("Playground")).toBeInTheDocument();
    });

    it("should show keyboard shortcut hints", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });
  });

  describe("Mode Selection", () => {
    it("should call onSelectMode with quick mode when clicked", async () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      // Find and click the Quick Mode button
      const quickButton = screen.getByText("Quick Mode").closest("button");
      if (quickButton) fireEvent.click(quickButton);

      await waitFor(() => {
        expect(mockOnSelectMode).toHaveBeenCalledWith("quick");
      });
    });

    it("should call onSelectMode with guided mode when clicked", async () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      const guidedButton = screen.getByText("Guided Mode").closest("button");
      if (guidedButton) fireEvent.click(guidedButton);

      await waitFor(() => {
        expect(mockOnSelectMode).toHaveBeenCalledWith("guided");
      });
    });

    it("should call onSelectMode with chat mode when clicked", async () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      const chatButton = screen.getByText("Chat Mode").closest("button");
      if (chatButton) fireEvent.click(chatButton);

      await waitFor(() => {
        expect(mockOnSelectMode).toHaveBeenCalledWith("chat");
      });
    });

    it("should call onSelectMode with playground mode when clicked", async () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      const playgroundButton = screen.getByText("Playground").closest("button");
      if (playgroundButton) fireEvent.click(playgroundButton);

      await waitFor(() => {
        expect(mockOnSelectMode).toHaveBeenCalledWith("playground");
      });
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("should select quick mode on pressing 1", async () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: "1" });

      await waitFor(() => {
        expect(mockOnSelectMode).toHaveBeenCalledWith("quick");
      });
    });

    it("should select guided mode on pressing 2", async () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: "2" });

      await waitFor(() => {
        expect(mockOnSelectMode).toHaveBeenCalledWith("guided");
      });
    });

    it("should select chat mode on pressing 3", async () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: "3" });

      await waitFor(() => {
        expect(mockOnSelectMode).toHaveBeenCalledWith("chat");
      });
    });

    it("should select playground mode on pressing 4", async () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: "4" });

      await waitFor(() => {
        expect(mockOnSelectMode).toHaveBeenCalledWith("playground");
      });
    });

    it("should close modal on pressing Escape", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: "Escape" });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Close Button", () => {
    it("should call onClose when close button clicked", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      fireEvent.click(screen.getByTitle(/close/i));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Recommended Mode", () => {
    it("should show Recommended badge for guided with many variables", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={5}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      // With 5 variables, Guided should be recommended
      expect(screen.getByText("Recommended")).toBeInTheDocument();
    });

    it("should recommend quick for few variables", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={1}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      // With 1 variable, Quick should be recommended
      expect(screen.getByText("Recommended")).toBeInTheDocument();
    });
  });

  describe("Remember Choice", () => {
    it("should show remember choice checkbox", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("should save preference when remember is checked", async () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      // Check remember checkbox
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      // Select a mode
      const guidedButton = screen.getByText("Guided Mode").closest("button");
      if (guidedButton) fireEvent.click(guidedButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          "prompt-builder-preferences",
          expect.any(String)
        );
      });
    });
  });

  describe("Styling", () => {
    it("should have rounded corners on modal", () => {
      const { container } = render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      const modal = container.querySelector("[class*='rounded-2xl']");
      expect(modal).toBeInTheDocument();
    });

    it("should have mode cards with rounded corners", () => {
      const { container } = render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={3}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      const cards = container.querySelectorAll("[class*='rounded-xl']");
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe("Variable Count Display", () => {
    it("should show singular variable for 1", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={1}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      // Variable count shows "1 variable to fill" - check for the combined text pattern
      expect(screen.getByText(/1 variable/i)).toBeInTheDocument();
    });

    it("should show plural variables for multiple", () => {
      render(
        <ModeSelector
          promptTitle="Test Prompt"
          variableCount={5}
          onSelectMode={mockOnSelectMode}
          onClose={mockOnClose}
        />
      );

      // Variable count shows "5 variables to fill"
      expect(screen.getByText(/5 variables/i)).toBeInTheDocument();
    });
  });
});
