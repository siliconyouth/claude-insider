/**
 * BotChallenge Component Tests
 *
 * Tests for the bot verification challenge component:
 * - Visibility based on isOpen
 * - Slider challenge
 * - Math challenge
 * - Bypass for signed-in users
 * - Challenge switching
 * - Callbacks
 * - useBotChallenge hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BotChallenge, useBotChallenge } from "@/components/security/bot-challenge";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock createPortal to render in place
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Mock focus trap hook
vi.mock("@/hooks/use-focus-trap", () => ({
  useFocusTrap: () => ({
    containerRef: { current: null },
  }),
}));

// Mock SliderPuzzle
const mockSliderOnSuccess = vi.fn();
vi.mock("@/components/security/slider-puzzle", () => ({
  SliderPuzzle: ({ onSuccess, onSuspicious, instruction }: {
    onSuccess: (metadata: Record<string, unknown>) => void;
    onSuspicious?: (reason: string) => void;
    difficulty?: string;
    instruction?: string;
  }) => (
    <div data-testid="slider-puzzle">
      <p>{instruction}</p>
      <input
        type="range"
        role="slider"
        onChange={(e) => {
          if (e.target.value === "100") {
            onSuccess({ completed: true });
          }
        }}
      />
      <button data-testid="slider-fail" onClick={() => onSuspicious?.("suspicious")}>
        Fail
      </button>
    </div>
  ),
}));

// Mock fetch for session bypass
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("BotChallenge", () => {
  const mockOnSuccess = vi.fn();
  const mockOnDismiss = vi.fn();
  const mockOnFailure = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: "session-token" }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Visibility", () => {
    it("should render when isOpen is true", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.getByText("Security Check")).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      render(
        <BotChallenge
          isOpen={false}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.queryByText("Security Check")).not.toBeInTheDocument();
    });

    it("should render backdrop overlay when open", () => {
      const { container } = render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
      const backdrop = container.querySelector("[class*='fixed inset-0']");
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe("Default Challenge Message", () => {
    it("should show default verification message", async () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
      await waitFor(() => {
        expect(screen.getByText(/Please verify you're human/)).toBeInTheDocument();
      });
    });

    it("should show custom reason when provided", async () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          reason="Unusual activity detected"
        />
      );
      await waitFor(() => {
        expect(screen.getByText("Unusual activity detected")).toBeInTheDocument();
      });
    });
  });

  describe("Slider Challenge", () => {
    it("should render slider challenge by default", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="slider"
        />
      );
      expect(screen.getByTestId("slider-puzzle")).toBeInTheDocument();
    });

    it("should show slider instruction", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="slider"
        />
      );
      expect(screen.getByText("Slide to unlock")).toBeInTheDocument();
    });

    it("should call onSuccess when slider completed", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="slider"
        />
      );

      const slider = screen.getByRole("slider");
      fireEvent.change(slider, { target: { value: "100" } });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe("Math Challenge", () => {
    it("should render math challenge when specified", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
        />
      );
      expect(screen.getByText("Solve this simple math problem:")).toBeInTheDocument();
    });

    it("should show math question", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
        />
      );
      // Should display a math question like "5 + 3 = ?"
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    it("should have input for answer", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
        />
      );
      expect(screen.getByPlaceholderText("Your answer")).toBeInTheDocument();
    });

    it("should have verify button", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
        />
      );
      expect(screen.getByRole("button", { name: "Verify" })).toBeInTheDocument();
    });

    it("should show error on wrong answer", async () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
        />
      );

      const input = screen.getByPlaceholderText("Your answer");
      fireEvent.change(input, { target: { value: "999999" } });
      fireEvent.click(screen.getByRole("button", { name: "Verify" }));

      await waitFor(() => {
        expect(screen.getByText(/Incorrect answer/)).toBeInTheDocument();
      });
    });

    it("should not submit with empty input", async () => {
      // Note: HTML5 number inputs don't accept non-numeric characters
      // So we test the empty input case instead (button should be disabled or no action)
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
        />
      );

      const input = screen.getByPlaceholderText("Your answer");
      // Input is empty by default
      expect(input).toHaveValue(null);

      // Click verify - should not call onSuccess since input is empty
      fireEvent.click(screen.getByRole("button", { name: "Verify" }));

      // Verify button should be disabled when empty, or no error should appear
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Signed-In User Bypass", () => {
    it("should show bypass button when signed in", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          isSignedIn={true}
        />
      );
      expect(screen.getByText(/Skip - I'm signed in/)).toBeInTheDocument();
    });

    it("should not show bypass button when not signed in", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          isSignedIn={false}
        />
      );
      expect(screen.queryByText(/Skip - I'm signed in/)).not.toBeInTheDocument();
    });

    it("should call API when bypass clicked", async () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          isSignedIn={true}
        />
      );

      fireEvent.click(screen.getByText(/Skip - I'm signed in/));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/challenge/verify-session", {
          method: "POST",
        });
      });
    });

    it("should call onSuccess after successful bypass", async () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          isSignedIn={true}
        />
      );

      fireEvent.click(screen.getByText(/Skip - I'm signed in/));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should show close button when signed in", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          isSignedIn={true}
        />
      );
      expect(screen.getByLabelText("Close")).toBeInTheDocument();
    });

    it("should call onDismiss when close clicked", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          isSignedIn={true}
        />
      );

      fireEvent.click(screen.getByLabelText("Close"));
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });

  describe("Challenge Switching", () => {
    it("should show switch challenge button", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
      expect(screen.getByText("Try a different challenge")).toBeInTheDocument();
    });

    it("should switch from slider to math", async () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="slider"
        />
      );

      fireEvent.click(screen.getByText("Try a different challenge"));

      await waitFor(() => {
        expect(screen.getByText("Solve this simple math problem:")).toBeInTheDocument();
      });
    });

    it("should switch from math to slider", async () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
        />
      );

      fireEvent.click(screen.getByText("Try a different challenge"));

      await waitFor(() => {
        expect(screen.getByTestId("slider-puzzle")).toBeInTheDocument();
      });
    });
  });

  describe("Attempt Counter", () => {
    it("should not show counter initially", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
        />
      );
      expect(screen.queryByText(/Attempts:/)).not.toBeInTheDocument();
    });

    it("should show counter after failed attempt", async () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
        />
      );

      const input = screen.getByPlaceholderText("Your answer");
      fireEvent.change(input, { target: { value: "999999" } });
      fireEvent.click(screen.getByRole("button", { name: "Verify" }));

      await waitFor(() => {
        expect(screen.getByText(/Attempts: 1\/3/)).toBeInTheDocument();
      });
    });
  });

  describe("Difficulty Levels", () => {
    it("should accept easy difficulty", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
          difficulty="easy"
        />
      );
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    it("should accept hard difficulty", () => {
      render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
          challengeType="math"
          difficulty="hard"
        />
      );
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have rounded modal", () => {
      const { container } = render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
      const modal = container.querySelector("[class*='rounded-2xl']");
      expect(modal).toBeInTheDocument();
    });

    it("should have shield icon", () => {
      const { container } = render(
        <BotChallenge
          isOpen={true}
          onSuccess={mockOnSuccess}
          onDismiss={mockOnDismiss}
        />
      );
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });
});

describe("useBotChallenge", () => {
  const TestComponent = () => {
    const { isOpen, showChallenge, handleDismiss, isVerified } = useBotChallenge();

    return (
      <div>
        <button onClick={() => showChallenge()}>Show</button>
        <button onClick={() => handleDismiss()}>Dismiss</button>
        <span data-testid="status">{isOpen ? "open" : "closed"}</span>
        <span data-testid="verified">{isVerified() ? "yes" : "no"}</span>
      </div>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage
    sessionStorage.clear();
  });

  it("should start closed", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("status")).toHaveTextContent("closed");
  });

  it("should open on showChallenge", async () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("Show"));

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("open");
    });
  });

  it("should close on handleDismiss", async () => {
    render(<TestComponent />);
    fireEvent.click(screen.getByText("Show"));
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("open");
    });

    fireEvent.click(screen.getByText("Dismiss"));
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("closed");
    });
  });

  it("should return not verified initially", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("verified")).toHaveTextContent("no");
  });
});
