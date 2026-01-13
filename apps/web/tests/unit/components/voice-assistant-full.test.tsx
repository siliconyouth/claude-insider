/**
 * VoiceAssistantFull Component Tests
 *
 * Tests for the full-page voice assistant:
 * - Initial rendering
 * - Message display
 * - Input field
 * - Voice selection
 * - Preferences persistence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VoiceAssistantFull } from "@/components/voice-assistant-full";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/test-page",
}));

// Mock Vercel analytics
vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

// Mock claude-utils
vi.mock("@/lib/claude-utils", () => ({
  markdownToSpeakableText: (text: string) => text,
}));

// Mock assistant-context
vi.mock("@/lib/assistant-context", () => ({
  getConversationHistory: () => [],
  saveConversationHistory: vi.fn(),
  clearConversationHistory: vi.fn(),
  getPageContent: () => "Test page content",
  getVisibleSection: () => "Test section",
  getSuggestedQuestions: () => ["Question 1", "Question 2"],
}));

// Mock speech recognition
vi.mock("@/lib/speech-recognition", () => ({
  isSpeechRecognitionSupported: () => false,
  VoiceRecognizer: vi.fn(),
}));

// Mock api credits
vi.mock("@/hooks/use-api-credits", () => ({
  triggerCreditsRefresh: vi.fn(),
}));

// Mock chat message components
vi.mock("@/components/chat/chat-message", () => ({
  ChatMessage: ({ message }: { message: { content: string } }) => (
    <div data-testid="chat-message">{message.content}</div>
  ),
  ChatMessageLoading: () => <div data-testid="chat-message-loading">Loading...</div>,
  ChatMessageStreaming: ({ content }: { content: string }) => (
    <div data-testid="chat-message-streaming">{content}</div>
  ),
  ChatMessageAction: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chat-message-action">{children}</div>
  ),
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

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe("VoiceAssistantFull", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<VoiceAssistantFull />)).not.toThrow();
    });

    it("should render input field", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        const input = screen.getByRole("textbox");
        expect(input).toBeInTheDocument();
      });
    });

    it("should render send button with title", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        // Send button has title="Send message"
        expect(screen.getByTitle("Send message")).toBeInTheDocument();
      });
    });
  });

  describe("Input Handling", () => {
    it("should allow typing in input", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        const input = screen.getByRole("textbox");
        fireEvent.change(input, { target: { value: "Test message" } });
        expect(input).toHaveValue("Test message");
      });
    });

    it("should have placeholder text", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        const input = screen.getByRole("textbox");
        expect(input).toHaveAttribute("placeholder");
      });
    });
  });

  describe("Voice Selection", () => {
    it("should load voice preference from localStorage", async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === "claude-insider-voice") return "daniel";
        return null;
      });

      render(<VoiceAssistantFull />);

      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("claude-insider-voice");
      });
    });

    it("should load auto-speak preference from localStorage", async () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === "claude-insider-auto-speak") return "false";
        return null;
      });

      render(<VoiceAssistantFull />);

      await waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("claude-insider-auto-speak");
      });
    });

    it("should read voice preference on mount", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        // On mount, component reads voice preference
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith("claude-insider-voice");
      });
    });
  });

  describe("Voice Menu", () => {
    it("should render voice menu button", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        expect(screen.getByTitle(/Voice/i)).toBeInTheDocument();
      });
    });
  });

  describe("Auto-Speak Toggle", () => {
    it("should render auto-speak toggle", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        // Look for auto-speak related button
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Messages Container", () => {
    it("should have messages container", () => {
      const { container } = render(<VoiceAssistantFull />);

      // Messages area should have overflow for scrolling
      expect(container.querySelector(".overflow-y-auto")).toBeInTheDocument();
    });

    it("should render empty state initially", async () => {
      render(<VoiceAssistantFull />);

      // No chat messages initially (empty array returned from mock)
      await waitFor(() => {
        expect(screen.queryByTestId("chat-message")).not.toBeInTheDocument();
      });
    });
  });

  describe("Styling", () => {
    it("should have flex container", () => {
      const { container } = render(<VoiceAssistantFull />);

      expect(container.querySelector(".flex")).toBeInTheDocument();
    });

    it("should have full height styling", () => {
      const { container } = render(<VoiceAssistantFull />);

      expect(container.querySelector(".h-full")).toBeInTheDocument();
    });
  });

  describe("Keyboard Handling", () => {
    it("should handle Enter key in input", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        const input = screen.getByRole("textbox");
        fireEvent.keyDown(input, { key: "Enter" });
        // Should not throw
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible input", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        const input = screen.getByRole("textbox");
        expect(input).toBeInTheDocument();
      });
    });

    it("should have accessible buttons", async () => {
      render(<VoiceAssistantFull />);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        buttons.forEach(button => {
          // Each button should have aria-label, title, or visible text
          const hasAriaLabel = button.hasAttribute("aria-label");
          const hasTitle = button.hasAttribute("title");
          const hasText = (button.textContent?.trim().length || 0) > 0;
          expect(hasAriaLabel || hasTitle || hasText).toBeTruthy();
        });
      });
    });
  });
});
