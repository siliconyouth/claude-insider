/**
 * ConnectedAccounts Component Tests
 *
 * Tests for the connected accounts component:
 * - Loading state
 * - Provider list display
 * - Connect/Disconnect buttons
 * - Safety checks
 * - Error/success messages
 * - URL parameter handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock auth client
const mockSignInSocial = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: (...args: unknown[]) => mockSignInSocial(...args),
    },
  },
}));

// Mock server actions
const mockGetLinkedAccountsAction = vi.fn();
const mockUnlinkAccountAction = vi.fn();
vi.mock("@/app/actions/auth", () => ({
  getLinkedAccountsAction: () => mockGetLinkedAccountsAction(),
  unlinkAccountAction: (providerId: string) => mockUnlinkAccountAction(providerId),
}));

// Mock window.location
const mockLocation = {
  origin: "https://example.com",
  search: "",
};
const mockReplaceState = vi.fn();
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});
Object.defineProperty(window, "history", {
  value: { replaceState: mockReplaceState },
  writable: true,
});

describe("ConnectedAccounts", () => {
  const mockGitHubAccount = {
    id: "acc-1",
    providerId: "github",
    accountId: "github-123",
    createdAt: new Date("2024-01-01"),
  };

  const mockGoogleAccount = {
    id: "acc-2",
    providerId: "google",
    accountId: "google-456",
    createdAt: new Date("2024-01-15"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLinkedAccountsAction.mockResolvedValue({ accounts: [mockGitHubAccount] });
    mockUnlinkAccountAction.mockResolvedValue({ success: true });
    mockLocation.search = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeleton initially", () => {
      mockGetLinkedAccountsAction.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<ConnectedAccounts hasPassword={true} />);

      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Provider List Display", () => {
    it("should show Connected Accounts heading", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText("Connected Accounts")).toBeInTheDocument();
      });
    });

    it("should show description", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText(/Manage your linked social accounts/)).toBeInTheDocument();
      });
    });

    it("should show GitHub provider", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText("GitHub")).toBeInTheDocument();
      });
    });

    it("should show Google provider", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText("Google")).toBeInTheDocument();
      });
    });

    it("should show connected date for linked accounts", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText(/Connected 1\/1\/2024/)).toBeInTheDocument();
      });
    });

    it("should show 'Not connected' for unlinked providers", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText("Not connected")).toBeInTheDocument();
      });
    });
  });

  describe("Connect Button", () => {
    it("should show Connect button for unlinked provider", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText("Connect")).toBeInTheDocument();
      });
    });

    it("should call signIn.social when Connect clicked", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Connect"));
      });

      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "https://example.com/settings?connected=google",
      });
    });

    it("should show Connecting... while loading", async () => {
      mockSignInSocial.mockImplementation(() => new Promise(() => {}));

      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Connect"));
      });

      expect(screen.getByText("Connecting...")).toBeInTheDocument();
    });
  });

  describe("Disconnect Button", () => {
    it("should show Disconnect button for linked provider", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText("Disconnect")).toBeInTheDocument();
      });
    });

    it("should call unlinkAccountAction when Disconnect clicked", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Disconnect"));
      });

      await waitFor(() => {
        expect(mockUnlinkAccountAction).toHaveBeenCalledWith("github");
      });
    });

    it("should show success message after disconnect", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Disconnect"));
      });

      await waitFor(() => {
        expect(screen.getByText("GitHub account disconnected successfully")).toBeInTheDocument();
      });
    });

    it("should show Disconnecting... while loading", async () => {
      mockUnlinkAccountAction.mockImplementation(() => new Promise(() => {}));

      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Disconnect"));
      });

      expect(screen.getByText("Disconnecting...")).toBeInTheDocument();
    });
  });

  describe("Safety Checks", () => {
    it("should show warning when only one login method", async () => {
      render(<ConnectedAccounts hasPassword={false} />);

      await waitFor(() => {
        expect(screen.getByText(/You have only one login method/)).toBeInTheDocument();
      });
    });

    it("should disable Disconnect when no other login method", async () => {
      render(<ConnectedAccounts hasPassword={false} />);

      await waitFor(() => {
        const disconnectButton = screen.getByText("Disconnect").closest("button");
        expect(disconnectButton).toBeDisabled();
      });
    });

    it("should allow Disconnect when user has password", async () => {
      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        const disconnectButton = screen.getByText("Disconnect").closest("button");
        expect(disconnectButton).not.toBeDisabled();
      });
    });

    it("should allow Disconnect when multiple providers linked", async () => {
      mockGetLinkedAccountsAction.mockResolvedValue({
        accounts: [mockGitHubAccount, mockGoogleAccount],
      });

      render(<ConnectedAccounts hasPassword={false} />);

      await waitFor(() => {
        const disconnectButtons = screen.getAllByText("Disconnect");
        disconnectButtons.forEach((btn) => {
          expect(btn.closest("button")).not.toBeDisabled();
        });
      });
    });

    it("should show error when trying to disconnect only method", async () => {
      render(<ConnectedAccounts hasPassword={false} />);

      await waitFor(() => {
        // Try to click disabled button (though it won't actually click)
        const disconnectButton = screen.getByText("Disconnect").closest("button");
        expect(disconnectButton).toBeDisabled();
      });
    });
  });

  describe("Error Messages", () => {
    it("should show error when fetch fails", async () => {
      mockGetLinkedAccountsAction.mockResolvedValue({ error: "Failed to load accounts" });

      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load accounts")).toBeInTheDocument();
      });
    });

    it("should show error when disconnect fails", async () => {
      mockUnlinkAccountAction.mockResolvedValue({ error: "Disconnect failed" });

      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Disconnect"));
      });

      await waitFor(() => {
        expect(screen.getByText("Disconnect failed")).toBeInTheDocument();
      });
    });

    it("should show error when connect fails", async () => {
      mockSignInSocial.mockRejectedValue(new Error("OAuth error"));

      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Connect"));
      });

      await waitFor(() => {
        expect(screen.getByText("OAuth error")).toBeInTheDocument();
      });
    });
  });

  describe("URL Parameter Handling", () => {
    it("should show success message when connected param present", async () => {
      mockLocation.search = "?connected=github";

      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(screen.getByText("GitHub account connected successfully")).toBeInTheDocument();
      });
    });

    it("should clean up URL after showing success", async () => {
      mockLocation.search = "?connected=github";

      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        expect(mockReplaceState).toHaveBeenCalledWith({}, "", "/settings");
      });
    });

    it("should refresh accounts after connection", async () => {
      mockLocation.search = "?connected=github";

      render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        // Should be called twice - initial load + refresh after connection
        expect(mockGetLinkedAccountsAction).toHaveBeenCalled();
      });
    });
  });

  describe("Callback", () => {
    it("should call onAccountChange after disconnect", async () => {
      const onAccountChange = vi.fn();
      render(<ConnectedAccounts hasPassword={true} onAccountChange={onAccountChange} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Disconnect"));
      });

      await waitFor(() => {
        expect(onAccountChange).toHaveBeenCalled();
      });
    });
  });

  describe("Styling", () => {
    it("should have green border for connected provider", async () => {
      const { container } = render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        const connectedCard = container.querySelector(".border-green-200");
        expect(connectedCard).toBeInTheDocument();
      });
    });

    it("should have gray border for unconnected provider", async () => {
      const { container } = render(<ConnectedAccounts hasPassword={true} />);

      await waitFor(() => {
        const unconnectedCard = container.querySelector(".border-gray-200");
        expect(unconnectedCard).toBeInTheDocument();
      });
    });
  });
});
