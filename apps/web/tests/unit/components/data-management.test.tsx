/**
 * DataManagement Component Tests
 *
 * Tests for the data management component:
 * - Export data functionality
 * - Delete account confirmation
 * - Pending deletion state
 * - Cancel deletion
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DataManagement } from "@/components/settings/data-management";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock toast hook
const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}));

// Mock server actions
const mockExportUserData = vi.fn();
const mockRequestAccountDeletion = vi.fn();
const mockCancelAccountDeletion = vi.fn();
const mockGetPendingDeletionRequest = vi.fn();
vi.mock("@/app/actions/account", () => ({
  exportUserData: () => mockExportUserData(),
  requestAccountDeletion: () => mockRequestAccountDeletion(),
  cancelAccountDeletion: () => mockCancelAccountDeletion(),
  getPendingDeletionRequest: () => mockGetPendingDeletionRequest(),
}));

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();
Object.assign(URL, {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

describe("DataManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportUserData.mockResolvedValue({ data: { user: { name: "Test" } } });
    mockRequestAccountDeletion.mockResolvedValue({ success: true });
    mockCancelAccountDeletion.mockResolvedValue({ success: true });
    mockGetPendingDeletionRequest.mockResolvedValue({ pending: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Default State", () => {
    it("should render Export Data section", () => {
      render(<DataManagement />);
      expect(screen.getByText("Export Data")).toBeInTheDocument();
    });

    it("should show export description", () => {
      render(<DataManagement />);
      expect(screen.getByText(/Download all your data as JSON/)).toBeInTheDocument();
    });

    it("should show GDPR-compliant mention", () => {
      render(<DataManagement />);
      expect(screen.getByText(/GDPR-compliant/)).toBeInTheDocument();
    });

    it("should render Delete Account section", () => {
      render(<DataManagement />);
      // "Delete Account" appears in both heading and button
      const deleteTexts = screen.getAllByText("Delete Account");
      expect(deleteTexts.length).toBeGreaterThan(0);
    });

    it("should show delete description", () => {
      render(<DataManagement />);
      expect(screen.getByText(/Permanently delete your account and all data/)).toBeInTheDocument();
    });

    it("should show Export button", () => {
      render(<DataManagement />);
      expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    });

    it("should show Delete Account button", () => {
      render(<DataManagement />);
      expect(screen.getByRole("button", { name: "Delete Account" })).toBeInTheDocument();
    });
  });

  describe("Export Data", () => {
    it("should call exportUserData when Export clicked", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Export" }));

      await waitFor(() => {
        expect(mockExportUserData).toHaveBeenCalled();
      });
    });

    it("should show success toast on export", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Export" }));

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("Data exported successfully");
      });
    });

    it("should create blob and download", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Export" }));

      await waitFor(() => {
        expect(mockCreateObjectURL).toHaveBeenCalled();
      });
    });

    it("should show error toast on export failure", async () => {
      mockExportUserData.mockResolvedValue({ error: "Export failed" });
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Export" }));

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Export failed");
      });
    });

    it("should show Exporting... while loading", async () => {
      mockExportUserData.mockImplementation(() => new Promise(() => {}));
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Export" }));

      expect(screen.getByText("Exporting...")).toBeInTheDocument();
    });
  });

  describe("Delete Account Confirmation", () => {
    it("should show confirmation dialog when Delete Account clicked", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByText("Delete Your Account")).toBeInTheDocument();
      });
    });

    it("should show warning about permanent deletion", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByText(/permanent and irreversible/)).toBeInTheDocument();
      });
    });

    it("should list data to be deleted", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByText(/Profile and account information/)).toBeInTheDocument();
        expect(screen.getByText(/Comments, suggestions, and favorites/)).toBeInTheDocument();
        expect(screen.getByText(/Collections and their items/)).toBeInTheDocument();
      });
    });

    it("should show DELETE confirmation input", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("DELETE")).toBeInTheDocument();
      });
    });

    it("should show Cancel button in confirmation", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      });
    });

    it("should show Request Deletion button", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Request Deletion" })).toBeInTheDocument();
      });
    });

    it("should disable Request Deletion until DELETE typed", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        const requestButton = screen.getByRole("button", { name: "Request Deletion" });
        expect(requestButton).toBeDisabled();
      });
    });

    it("should enable Request Deletion when DELETE typed", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("DELETE"), {
          target: { value: "DELETE" },
        });
      });

      const requestButton = screen.getByRole("button", { name: "Request Deletion" });
      expect(requestButton).not.toBeDisabled();
    });

    it("should close confirmation when Cancel clicked", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      });

      expect(screen.queryByText("Delete Your Account")).not.toBeInTheDocument();
    });
  });

  describe("Request Deletion", () => {
    it("should show error if DELETE not typed correctly", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText("DELETE")).toBeInTheDocument();
      });

      // Type lowercase "delete" (wrong)
      fireEvent.change(screen.getByPlaceholderText("DELETE"), {
        target: { value: "delete" },
      });

      // Button should still be disabled because it's case-sensitive
      const requestButton = screen.getByRole("button", { name: "Request Deletion" });
      expect(requestButton).toBeDisabled();
    });

    it("should call requestAccountDeletion when confirmed", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("DELETE"), {
          target: { value: "DELETE" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Request Deletion" }));
      });

      await waitFor(() => {
        expect(mockRequestAccountDeletion).toHaveBeenCalled();
      });
    });

    it("should show success toast on deletion request", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("DELETE"), {
          target: { value: "DELETE" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Request Deletion" }));
      });

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("Deletion request sent. Check your email.");
      });
    });

    it("should show error toast on deletion request failure", async () => {
      mockRequestAccountDeletion.mockResolvedValue({ error: "Request failed" });
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("DELETE"), {
          target: { value: "DELETE" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Request Deletion" }));
      });

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Request failed");
      });
    });
  });

  describe("Pending Deletion State", () => {
    beforeEach(() => {
      mockGetPendingDeletionRequest.mockResolvedValue({
        pending: true,
        expiresAt: "2024-12-31T00:00:00Z",
      });
    });

    it("should show pending deletion message when deletion pending", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByText("Account Deletion Pending")).toBeInTheDocument();
      });
    });

    it("should show Cancel Deletion Request button", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cancel Deletion Request" })).toBeInTheDocument();
      });
    });

    it("should still show Export button in pending state", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Deletion", () => {
    beforeEach(() => {
      mockGetPendingDeletionRequest.mockResolvedValue({
        pending: true,
        expiresAt: "2024-12-31T00:00:00Z",
      });
    });

    it("should call cancelAccountDeletion when Cancel clicked", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: "Cancel Deletion Request" }));
      });

      await waitFor(() => {
        expect(mockCancelAccountDeletion).toHaveBeenCalled();
      });
    });

    it("should show success toast on cancel", async () => {
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: "Cancel Deletion Request" }));
      });

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("Deletion request cancelled");
      });
    });

    it("should show error toast on cancel failure", async () => {
      mockCancelAccountDeletion.mockResolvedValue({ error: "Cancel failed" });
      render(<DataManagement />);

      fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: "Cancel Deletion Request" }));
      });

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Cancel failed");
      });
    });
  });

  describe("Styling", () => {
    it("should have rounded corners on sections", () => {
      const { container } = render(<DataManagement />);
      const sections = container.querySelectorAll(".rounded-xl");
      expect(sections.length).toBeGreaterThan(0);
    });

    it("should have gradient button for Export", () => {
      const { container } = render(<DataManagement />);
      const exportButton = container.querySelector('button[class*="from-violet-600"]');
      expect(exportButton).toBeInTheDocument();
    });

    it("should have red styling for Delete Account button", () => {
      const { container } = render(<DataManagement />);
      const deleteButton = container.querySelector('button[class*="text-red-600"]');
      expect(deleteButton).toBeInTheDocument();
    });
  });
});
