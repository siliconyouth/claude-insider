/**
 * PasswordSettings Component Tests
 *
 * Tests for the password settings component:
 * - Change password mode (hasPassword = true)
 * - Set password mode (hasPassword = false)
 * - Password validation rules
 * - Password match validation
 * - Show/hide password toggle
 * - Form submission
 * - Error/success messages
 * - Reset form
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PasswordSettings } from "@/components/settings/password-settings";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock auth client
const mockChangePassword = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    changePassword: (...args: unknown[]) => mockChangePassword(...args),
  },
}));

// Mock server action
const mockSetPasswordAction = vi.fn();
vi.mock("@/app/actions/auth", () => ({
  setPasswordAction: (password: string) => mockSetPasswordAction(password),
}));

describe("PasswordSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChangePassword.mockResolvedValue({});
    mockSetPasswordAction.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Change Password Mode", () => {
    it("should show Change Password heading when hasPassword is true", () => {
      render(<PasswordSettings hasPassword={true} />);
      expect(screen.getByRole("heading", { name: /Change Password/i })).toBeInTheDocument();
    });

    it("should show current password field when hasPassword is true", () => {
      render(<PasswordSettings hasPassword={true} />);
      expect(screen.getByLabelText("Current Password")).toBeInTheDocument();
    });

    it("should show New Password label", () => {
      render(<PasswordSettings hasPassword={true} />);
      expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    });

    it("should show Change Password button", () => {
      render(<PasswordSettings hasPassword={true} />);
      expect(screen.getByRole("button", { name: "Change Password" })).toBeInTheDocument();
    });

    it("should show update description", () => {
      render(<PasswordSettings hasPassword={true} />);
      expect(screen.getByText(/Update your password to keep your account secure/)).toBeInTheDocument();
    });
  });

  describe("Set Password Mode", () => {
    it("should show Set Password heading when hasPassword is false", () => {
      render(<PasswordSettings hasPassword={false} />);
      expect(screen.getByRole("heading", { name: /Set Password/i })).toBeInTheDocument();
    });

    it("should not show current password field when hasPassword is false", () => {
      render(<PasswordSettings hasPassword={false} />);
      expect(screen.queryByLabelText("Current Password")).not.toBeInTheDocument();
    });

    it("should show Password label (not New Password)", () => {
      render(<PasswordSettings hasPassword={false} />);
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("should show Set Password button", () => {
      render(<PasswordSettings hasPassword={false} />);
      expect(screen.getByRole("button", { name: "Set Password" })).toBeInTheDocument();
    });

    it("should show OAuth description", () => {
      render(<PasswordSettings hasPassword={false} />);
      expect(screen.getByText(/Add a password to sign in with email/)).toBeInTheDocument();
    });
  });

  describe("Password Validation", () => {
    it("should show error for password less than 8 characters", async () => {
      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Short1" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "Short1" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
    });

    it("should show error for password without uppercase", async () => {
      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "lowercase1" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "lowercase1" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(screen.getByText("Password must contain at least one uppercase letter")).toBeInTheDocument();
      });
    });

    it("should show error for password without lowercase", async () => {
      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "UPPERCASE1" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "UPPERCASE1" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(screen.getByText("Password must contain at least one lowercase letter")).toBeInTheDocument();
      });
    });

    it("should show error for password without number", async () => {
      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "NoNumberHere" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "NoNumberHere" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(screen.getByText("Password must contain at least one number")).toBeInTheDocument();
      });
    });

    it("should show password requirements hint", () => {
      render(<PasswordSettings hasPassword={false} />);
      expect(screen.getByText(/Minimum 8 characters with uppercase, lowercase, and numbers/)).toBeInTheDocument();
    });
  });

  describe("Password Match Validation", () => {
    it("should show error when passwords do not match", async () => {
      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "ValidPass1" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "DifferentPass1" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      });
    });
  });

  describe("Show/Hide Password Toggle", () => {
    it("should show password toggle checkbox", () => {
      render(<PasswordSettings hasPassword={false} />);
      expect(screen.getByLabelText("Show passwords")).toBeInTheDocument();
    });

    it("should toggle password visibility", () => {
      render(<PasswordSettings hasPassword={false} />);

      const passwordInput = screen.getByLabelText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");

      fireEvent.click(screen.getByLabelText("Show passwords"));
      expect(passwordInput).toHaveAttribute("type", "text");
    });

    it("should toggle back to hidden", () => {
      render(<PasswordSettings hasPassword={false} />);

      const passwordInput = screen.getByLabelText("Password");
      fireEvent.click(screen.getByLabelText("Show passwords"));
      fireEvent.click(screen.getByLabelText("Show passwords"));

      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Form Submission - Set Password", () => {
    it("should call setPasswordAction with password", async () => {
      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "ValidPass123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "ValidPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(mockSetPasswordAction).toHaveBeenCalledWith("ValidPass123");
      });
    });

    it("should show success message after set password", async () => {
      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "ValidPass123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "ValidPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(screen.getByText("Password set successfully!")).toBeInTheDocument();
      });
    });

    it("should clear form after successful set", async () => {
      render(<PasswordSettings hasPassword={false} />);

      const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
      const confirmInput = screen.getByLabelText("Confirm Password") as HTMLInputElement;

      fireEvent.change(passwordInput, { target: { value: "ValidPass123" } });
      fireEvent.change(confirmInput, { target: { value: "ValidPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(passwordInput.value).toBe("");
        expect(confirmInput.value).toBe("");
      });
    });
  });

  describe("Form Submission - Change Password", () => {
    it("should call changePassword with current and new password", async () => {
      render(<PasswordSettings hasPassword={true} />);

      fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "OldPass123" } });
      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "NewPass123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "NewPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Change Password" }));

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          currentPassword: "OldPass123",
          newPassword: "NewPass123",
          revokeOtherSessions: false,
        });
      });
    });

    it("should show success message after change password", async () => {
      render(<PasswordSettings hasPassword={true} />);

      fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "OldPass123" } });
      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "NewPass123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "NewPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Change Password" }));

      await waitFor(() => {
        expect(screen.getByText("Password changed successfully!")).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error when changePassword fails", async () => {
      mockChangePassword.mockResolvedValue({ error: { message: "Invalid current password" } });

      render(<PasswordSettings hasPassword={true} />);

      fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "WrongPass" } });
      fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "NewPass123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "NewPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Change Password" }));

      await waitFor(() => {
        expect(screen.getByText("Invalid current password")).toBeInTheDocument();
      });
    });

    it("should show error when setPasswordAction fails", async () => {
      mockSetPasswordAction.mockResolvedValue({ error: "Server error" });

      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "ValidPass123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "ValidPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(screen.getByText("Server error")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show Saving... while submitting", async () => {
      mockSetPasswordAction.mockImplementation(() => new Promise(() => {}));

      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "ValidPass123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "ValidPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should disable button while saving", async () => {
      mockSetPasswordAction.mockImplementation(() => new Promise(() => {}));

      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "ValidPass123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "ValidPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      const button = screen.getByText("Saving...").closest("button");
      expect(button).toBeDisabled();
    });
  });

  describe("Cancel Button", () => {
    it("should show Cancel when form has input", () => {
      render(<PasswordSettings hasPassword={false} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "something" } });

      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should not show Cancel when form is empty", () => {
      render(<PasswordSettings hasPassword={false} />);
      expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    });

    it("should reset form when Cancel clicked", () => {
      render(<PasswordSettings hasPassword={false} />);

      const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: "something" } });
      fireEvent.click(screen.getByText("Cancel"));

      expect(passwordInput.value).toBe("");
    });
  });

  describe("Callback", () => {
    it("should call onSuccess after successful submission", async () => {
      const onSuccess = vi.fn();
      render(<PasswordSettings hasPassword={false} onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "ValidPass123" } });
      fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "ValidPass123" } });
      fireEvent.click(screen.getByRole("button", { name: "Set Password" }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });
});
