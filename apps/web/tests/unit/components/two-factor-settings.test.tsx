/**
 * TwoFactorSettings Component Tests
 *
 * Tests for the 2FA settings component (core states only):
 * - Loading state
 * - Initial state (not enabled)
 * - Enabled state
 * - Basic interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TwoFactorSettings } from "@/components/settings/two-factor-settings";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock toast hook
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockInfo = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
    info: mockInfo,
  }),
}));

// Mock server actions
const mockGetTwoFactorStatus = vi.fn();
const mockGenerateTwoFactorSecret = vi.fn();
const mockEnableTwoFactor = vi.fn();
const mockDisableTwoFactor = vi.fn();
const mockRegenerateBackupCodes = vi.fn();
const mockGet2FADevices = vi.fn();
vi.mock("@/app/actions/two-factor", () => ({
  getTwoFactorStatus: () => mockGetTwoFactorStatus(),
  generateTwoFactorSecret: () => mockGenerateTwoFactorSecret(),
  enableTwoFactor: (code: string) => mockEnableTwoFactor(code),
  disableTwoFactor: (code: string) => mockDisableTwoFactor(code),
  regenerateBackupCodes: (code: string) => mockRegenerateBackupCodes(code),
  get2FADevices: () => mockGet2FADevices(),
  initAdd2FADevice: vi.fn(),
  verifyAndAdd2FADevice: vi.fn(),
  rename2FADevice: vi.fn(),
  remove2FADevice: vi.fn(),
  setPrimary2FADevice: vi.fn(),
}));

// Mock email 2FA actions
const mockGetEmail2FAStatus = vi.fn();
vi.mock("@/app/actions/email-2fa", () => ({
  getEmail2FAStatus: () => mockGetEmail2FAStatus(),
  enableEmail2FA: vi.fn(),
  sendEmail2FACode: vi.fn(),
  verifyEmail2FACode: vi.fn(),
}));

// Mock webauthn client
vi.mock("@/lib/webauthn-client", () => ({
  formatLastUsed: (date: string) => `Used ${date}`,
}));

describe("TwoFactorSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTwoFactorStatus.mockResolvedValue({
      enabled: false,
      backupCodesRemaining: 0,
      verifiedAt: null,
    });
    mockGetEmail2FAStatus.mockResolvedValue({ enabled: false });
    mockGet2FADevices.mockResolvedValue({ devices: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading skeleton initially", () => {
      mockGetTwoFactorStatus.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<TwoFactorSettings />);

      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe("Initial State (Not Enabled)", () => {
    it("should show Two-Factor Authentication heading", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText("Two-Factor Authentication")).toBeInTheDocument();
      });
    });

    it("should show security description", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText("Add an extra layer of security to your account")).toBeInTheDocument();
      });
    });

    it("should show Enable button", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument();
      });
    });

    it("should show lock icon", async () => {
      const { container } = render(<TwoFactorSettings />);

      await waitFor(() => {
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe("Enabled State", () => {
    beforeEach(() => {
      mockGetTwoFactorStatus.mockResolvedValue({
        enabled: true,
        backupCodesRemaining: 8,
        verifiedAt: "2024-01-15T00:00:00Z",
      });
      mockGet2FADevices.mockResolvedValue({
        devices: [
          { id: "dev-1", name: "Authenticator 1", isPrimary: true, lastUsedAt: "2024-01-20T00:00:00Z" },
        ],
      });
    });

    it("should show Enabled status", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText("Enabled")).toBeInTheDocument();
      });
    });

    it("should show verification date", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText(/since 1\/15\/2024/)).toBeInTheDocument();
      });
    });

    it("should show Disable button", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument();
      });
    });

    it("should show Authenticator Apps section", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText("Authenticator Apps")).toBeInTheDocument();
      });
    });

    it("should show device count", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText("1 device registered")).toBeInTheDocument();
      });
    });

    it("should show Add button for devices", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "+ Add" })).toBeInTheDocument();
      });
    });

    it("should show device name", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText("Authenticator 1")).toBeInTheDocument();
      });
    });

    it("should show PRIMARY badge for primary device", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText("PRIMARY")).toBeInTheDocument();
      });
    });

    it("should show Backup Codes section", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText("Backup Codes")).toBeInTheDocument();
      });
    });

    it("should show backup codes remaining", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByText("8 codes remaining")).toBeInTheDocument();
      });
    });

    it("should show Regenerate button", async () => {
      render(<TwoFactorSettings />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Regenerate" })).toBeInTheDocument();
      });
    });
  });

  describe("Enable Setup Flow", () => {
    it("should start setup when Enable clicked", async () => {
      mockGenerateTwoFactorSecret.mockResolvedValue({
        secret: "TESTSECRET123",
        qrCodeUrl: "data:image/png;base64,test",
      });

      render(<TwoFactorSettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: "Enable" }));
      });

      await waitFor(() => {
        expect(mockGenerateTwoFactorSecret).toHaveBeenCalled();
      });
    });

    it("should show QR code step after generating secret", async () => {
      mockGenerateTwoFactorSecret.mockResolvedValue({
        secret: "TESTSECRET123",
        qrCodeUrl: "data:image/png;base64,test",
      });

      render(<TwoFactorSettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: "Enable" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Set Up Two-Factor Authentication")).toBeInTheDocument();
      });
    });

    it("should show manual code entry option", async () => {
      mockGenerateTwoFactorSecret.mockResolvedValue({
        secret: "TESTSECRET123",
        qrCodeUrl: "data:image/png;base64,test",
      });

      render(<TwoFactorSettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: "Enable" }));
      });

      await waitFor(() => {
        expect(screen.getByText("Or enter this code manually:")).toBeInTheDocument();
        expect(screen.getByText("TESTSECRET123")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error toast on generate secret failure", async () => {
      mockGenerateTwoFactorSecret.mockResolvedValue({ error: "Failed to generate secret" });

      render(<TwoFactorSettings />);

      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: "Enable" }));
      });

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith("Failed to generate secret");
      });
    });
  });

  describe("Styling", () => {
    it("should have rounded corners on main container", async () => {
      const { container } = render(<TwoFactorSettings />);

      await waitFor(() => {
        const roundedElements = container.querySelectorAll(".rounded-xl");
        expect(roundedElements.length).toBeGreaterThan(0);
      });
    });

    it("should have gradient enable button when not enabled", async () => {
      const { container } = render(<TwoFactorSettings />);

      await waitFor(() => {
        const gradientButton = container.querySelector('button[class*="from-violet-600"]');
        expect(gradientButton).toBeInTheDocument();
      });
    });

    it("should have green indicator when enabled", async () => {
      mockGetTwoFactorStatus.mockResolvedValue({
        enabled: true,
        backupCodesRemaining: 10,
        verifiedAt: "2024-01-15T00:00:00Z",
      });
      mockGet2FADevices.mockResolvedValue({ devices: [] });

      const { container } = render(<TwoFactorSettings />);

      await waitFor(() => {
        const greenElement = container.querySelector('.bg-green-100, .text-green-600');
        expect(greenElement).toBeInTheDocument();
      });
    });
  });
});
