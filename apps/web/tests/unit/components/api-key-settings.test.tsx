/**
 * ApiKeySettings Component Tests
 *
 * Tests for the API key settings component:
 * - Loading state
 * - Empty state (no API key)
 * - Connected state (with API key)
 * - Add API key modal
 * - Model selection
 * - Usage statistics
 * - Delete confirmation
 * - Validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApiKeySettings } from "@/components/settings/api-key-settings";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock api-keys module
vi.mock("@/lib/api-keys", () => ({
  ANTHROPIC_URLS: {
    console: "https://console.anthropic.com",
    apiKeys: "https://console.anthropic.com/settings/keys",
    docs: "https://docs.anthropic.com",
    usage: "https://console.anthropic.com/usage",
    plans: "https://console.anthropic.com/plans",
  },
  getBestAvailableModel: vi.fn((models) => models[0] || null),
}));

// Mock triggerCreditsRefresh
vi.mock("@/hooks/use-api-credits", () => ({
  triggerCreditsRefresh: vi.fn(),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ApiKeySettings", () => {
  const mockApiKeysResponse = {
    apiKeys: [
      {
        id: "key-1",
        provider: "anthropic",
        keyHint: "sk-ant...xyz",
        isValid: true,
        lastValidatedAt: "2024-01-15T00:00:00Z",
        validationError: null,
        availableModels: [
          {
            id: "claude-3-5-sonnet-20241022",
            name: "Claude 3.5 Sonnet",
            description: "Best balance of speed and quality",
            tier: "sonnet",
            inputPrice: 3,
            outputPrice: 15,
          },
          {
            id: "claude-3-5-haiku-20241022",
            name: "Claude 3.5 Haiku",
            description: "Fastest model",
            tier: "haiku",
            inputPrice: 0.25,
            outputPrice: 1.25,
          },
        ],
        preferredModel: "claude-3-5-sonnet-20241022",
        usageThisMonth: {
          inputTokens: 150000,
          outputTokens: 50000,
          requests: 100,
        },
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-15T00:00:00Z",
      },
    ],
    aiPreferences: {
      useOwnApiKey: true,
      preferredProvider: "anthropic",
      preferredModel: "claude-3-5-sonnet-20241022",
      autoSelectBestModel: true,
    },
    allModels: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        description: "Best balance of speed and quality",
        tier: "sonnet",
        inputPrice: 3,
        outputPrice: 15,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiKeysResponse),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeleton initially", () => {
      // Make fetch hang to show loading
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<ApiKeySettings />);

      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe("Empty State (No API Key)", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ apiKeys: [], aiPreferences: null, allModels: [] }),
      });
    });

    it("should show Connect Your Anthropic Account heading", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Connect Your Anthropic Account")).toBeInTheDocument();
      });
    });

    it("should show benefits grid", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("AI Assistant")).toBeInTheDocument();
        expect(screen.getByText("Playground")).toBeInTheDocument();
        expect(screen.getByText("Latest Models")).toBeInTheDocument();
      });
    });

    it("should show Get API Key button", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Get API Key")).toBeInTheDocument();
      });
    });

    it("should show 'I have an API key' button", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("I have an API key - Add it now")).toBeInTheDocument();
      });
    });

    it("should open modal when 'I have an API key' clicked", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("I have an API key - Add it now"));
      });

      expect(screen.getByText("Add Anthropic API Key")).toBeInTheDocument();
    });
  });

  describe("Connected State (With API Key)", () => {
    it("should show Connected badge", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Connected")).toBeInTheDocument();
      });
    });

    it("should show key hint", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("sk-ant...xyz")).toBeInTheDocument();
      });
    });

    it("should show Anthropic API Key label", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Anthropic API Key")).toBeInTheDocument();
      });
    });

    it("should show Revalidate button", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Revalidate")).toBeInTheDocument();
      });
    });

    it("should show remove button", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByTitle("Remove API key")).toBeInTheDocument();
      });
    });
  });

  describe("Model Selection", () => {
    it("should show Preferred Model label", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Preferred Model")).toBeInTheDocument();
      });
    });

    it("should show available models", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        // Use getAllByText since "Claude 3.5 Sonnet" appears in both Recommended hint and model list
        const sonnetElements = screen.getAllByText("Claude 3.5 Sonnet");
        expect(sonnetElements.length).toBeGreaterThan(0);
        expect(screen.getByText("Claude 3.5 Haiku")).toBeInTheDocument();
      });
    });

    it("should show model descriptions", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Best balance of speed and quality")).toBeInTheDocument();
        expect(screen.getByText("Fastest model")).toBeInTheDocument();
      });
    });

    it("should show pricing for models", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("$3/M input • $15/M output")).toBeInTheDocument();
      });
    });

    it("should show RECOMMENDED badge for best model", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("RECOMMENDED")).toBeInTheDocument();
      });
    });

    it("should call API when model selected", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Claude 3.5 Haiku")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Claude 3.5 Haiku"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/user/api-keys",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("claude-3-5-haiku-20241022"),
          })
        );
      });
    });
  });

  describe("Usage Statistics", () => {
    it("should show This Month's Usage heading", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("This Month's Usage")).toBeInTheDocument();
      });
    });

    it("should show request count", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("Requests")).toBeInTheDocument();
      });
    });

    it("should show formatted input tokens", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("150.0K")).toBeInTheDocument();
        expect(screen.getByText("Input Tokens")).toBeInTheDocument();
      });
    });

    it("should show formatted output tokens", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("50.0K")).toBeInTheDocument();
        expect(screen.getByText("Output Tokens")).toBeInTheDocument();
      });
    });

    it("should show estimated cost", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Est. Cost")).toBeInTheDocument();
      });
    });
  });

  describe("Add API Key Modal", () => {
    it("should open modal when Update API key clicked", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Update API key"));
      });

      expect(screen.getByText("Add Anthropic API Key")).toBeInTheDocument();
    });

    it("should show API key input field", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Update API key"));
      });

      expect(screen.getByPlaceholderText("sk-ant-api03-...")).toBeInTheDocument();
    });

    it("should show security message", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Update API key"));
      });

      expect(screen.getByText(/Your API key is encrypted and stored securely/)).toBeInTheDocument();
    });

    it("should show Cancel and Validate buttons", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Update API key"));
      });

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Validate & Save")).toBeInTheDocument();
    });

    it("should close modal when Cancel clicked", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Update API key"));
      });

      fireEvent.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(screen.queryByText("Add Anthropic API Key")).not.toBeInTheDocument();
      });
    });

    it("should disable Validate & Save button when input is empty", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Update API key")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Update API key"));

      await waitFor(() => {
        expect(screen.getByText("Validate & Save")).toBeInTheDocument();
      });

      // Button should be disabled when input is empty
      const saveButton = screen.getByText("Validate & Save");
      expect(saveButton.closest("button")).toBeDisabled();
    });
  });

  describe("Delete Confirmation", () => {
    it("should show delete confirmation modal", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Remove API key"));
      });

      expect(screen.getByText("Remove API Key?")).toBeInTheDocument();
    });

    it("should show fallback message in delete modal", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Remove API key"));
      });

      expect(screen.getByText(/AI features will use the site's shared API credits/)).toBeInTheDocument();
    });

    it("should show Cancel and Remove buttons", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Remove API key"));
      });

      expect(screen.getAllByText("Cancel").length).toBeGreaterThan(0);
      expect(screen.getByText("Remove")).toBeInTheDocument();
    });

    it("should close delete modal when Cancel clicked", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Remove API key"));
      });

      const cancelButtons = screen.getAllByText("Cancel");
      fireEvent.click(cancelButtons[cancelButtons.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText("Remove API Key?")).not.toBeInTheDocument();
      });
    });

    it("should call delete API when Remove clicked", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByTitle("Remove API key"));
      });

      fireEvent.click(screen.getByText("Remove"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/user/api-keys?provider=anthropic",
          expect.objectContaining({ method: "DELETE" })
        );
      });
    });
  });

  describe("Validation", () => {
    it("should call validate API when Revalidate clicked", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Revalidate"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/user/api-keys/validate",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("anthropic"),
          })
        );
      });
    });

    it("should show Validating... while validating", async () => {
      // First call returns API keys, subsequent calls hang
      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApiKeysResponse),
          });
        }
        // Validation call hangs
        return new Promise(() => {});
      });

      render(<ApiKeySettings />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Revalidate")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Revalidate"));

      // Check for Validating... text
      await waitFor(() => {
        expect(screen.getByText("Validating...")).toBeInTheDocument();
      });
    });
  });

  describe("Help Links", () => {
    it("should show Anthropic Console link in header", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Anthropic Console")).toBeInTheDocument();
      });
    });

    it("should show Anthropic Docs link", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Anthropic Docs")).toBeInTheDocument();
      });
    });

    it("should show View Usage link", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("View Usage")).toBeInTheDocument();
      });
    });

    it("should show Billing & Plans link", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Billing & Plans")).toBeInTheDocument();
      });
    });
  });

  describe("Header", () => {
    it("should show Claude AI Integration heading", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Claude AI Integration")).toBeInTheDocument();
      });
    });

    it("should show description", async () => {
      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText(/Connect your Anthropic account to use AI features/)).toBeInTheDocument();
      });
    });
  });

  describe("Error States", () => {
    it("should show error message when validation fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiKeysResponse),
      }).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Invalid API key" }),
      });

      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Revalidate"));
      });

      await waitFor(() => {
        expect(screen.getByText("Invalid API key")).toBeInTheDocument();
      });
    });

    it("should show success message after successful action", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiKeysResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApiKeysResponse),
        });

      render(<ApiKeySettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Revalidate"));
      });

      await waitFor(() => {
        expect(screen.getByText("API key validated successfully!")).toBeInTheDocument();
      });
    });
  });

  describe("Needs Validation State", () => {
    it("should show Needs Validation badge when key not valid", async () => {
      const needsValidationResponse = {
        ...mockApiKeysResponse,
        apiKeys: [{ ...mockApiKeysResponse.apiKeys[0], isValid: false }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(needsValidationResponse),
      });

      render(<ApiKeySettings />);

      await waitFor(() => {
        expect(screen.getByText("Needs Validation")).toBeInTheDocument();
      });
    });
  });
});
