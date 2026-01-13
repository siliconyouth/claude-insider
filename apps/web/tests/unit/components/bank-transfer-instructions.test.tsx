/**
 * BankTransferInstructions Component Tests
 *
 * Tests for the bank transfer donation component:
 * - Currency selection step
 * - Bank details display step
 * - Confirmation form step
 * - Copy to clipboard functionality
 * - Navigation between steps
 * - Form validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BankTransferInstructions } from "@/components/donations/bank-transfer-instructions";
import type { DonationBankInfo } from "@/lib/donations/types";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

// Mock toast
const mockSuccess = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    success: mockSuccess,
    error: vi.fn(),
  }),
}));

describe("BankTransferInstructions", () => {
  const mockBankAccounts: DonationBankInfo[] = [
    {
      id: "bank-1",
      currency: "EUR",
      bank_name: "European Bank",
      account_holder: "Claude Insider",
      iban: "DE89370400440532013000",
      swift_bic: "COBADEFFXXX",
      account_number: null,
      routing_number: null,
      instructions: "Include your email in the reference",
      is_primary: true,
      is_enabled: true,
    },
    {
      id: "bank-2",
      currency: "USD",
      bank_name: "American Bank",
      account_holder: "Claude Insider Inc",
      iban: null,
      swift_bic: "CHASUS33",
      account_number: "123456789",
      routing_number: "021000021",
      instructions: "Wire transfer instructions",
      is_primary: false,
      is_enabled: true,
    },
  ];

  const mockOnBack = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Step 1: Currency Selection", () => {
    it("should render currency selection heading", () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      expect(screen.getByText("Select Your Currency")).toBeInTheDocument();
    });

    it("should show step indicator", () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      expect(screen.getByText("Choose Currency")).toBeInTheDocument();
    });

    it("should display available currencies", () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      expect(screen.getByText("EUR")).toBeInTheDocument();
      expect(screen.getByText("USD")).toBeInTheDocument();
    });

    it("should show currency flags", () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      expect(screen.getAllByText("🇪🇺").length).toBeGreaterThan(0);
      expect(screen.getAllByText("🇺🇸").length).toBeGreaterThan(0);
    });

    it("should show formatted amount", () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      expect(screen.getByText("€100")).toBeInTheDocument();
    });

    it("should highlight selected currency", () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      // EUR is selected by default (first currency)
      const eurButton = screen.getByText("EUR").closest("button");
      expect(eurButton?.className).toContain("border-blue-500");
    });

    it("should call onBack when Back button clicked", () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      expect(mockOnBack).toHaveBeenCalled();
    });

    it("should go to step 2 when Continue clicked", async () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));

      await waitFor(() => {
        expect(screen.getByText("Bank Transfer Details")).toBeInTheDocument();
      });
    });
  });

  describe("Step 2: Bank Details", () => {
    const goToStep2 = () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    };

    it("should display bank name", async () => {
      goToStep2();
      await waitFor(() => {
        expect(screen.getByText("European Bank")).toBeInTheDocument();
      });
    });

    it("should display account holder", async () => {
      goToStep2();
      await waitFor(() => {
        expect(screen.getByText("Claude Insider")).toBeInTheDocument();
      });
    });

    it("should display IBAN for EUR", async () => {
      goToStep2();
      await waitFor(() => {
        expect(screen.getByText("IBAN")).toBeInTheDocument();
        expect(screen.getByText("DE89370400440532013000")).toBeInTheDocument();
      });
    });

    it("should display SWIFT/BIC", async () => {
      goToStep2();
      await waitFor(() => {
        expect(screen.getByText("SWIFT/BIC")).toBeInTheDocument();
        expect(screen.getByText("COBADEFFXXX")).toBeInTheDocument();
      });
    });

    it("should copy to clipboard when copy button clicked", async () => {
      goToStep2();
      await waitFor(() => {
        const copyButtons = screen.getAllByTitle(/Copy/);
        fireEvent.click(copyButtons[0]);
      });

      expect(mockClipboard.writeText).toHaveBeenCalled();
    });

    it("should show success toast after copying", async () => {
      goToStep2();
      await waitFor(() => {
        const copyButtons = screen.getAllByTitle(/Copy/);
        fireEvent.click(copyButtons[0]);
      });

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining("copied"));
      });
    });

    it("should show transfer amount reminder", async () => {
      goToStep2();
      await waitFor(() => {
        expect(screen.getByText("Transfer Amount:")).toBeInTheDocument();
        expect(screen.getByText("€100")).toBeInTheDocument();
      });
    });

    it("should show important instructions", async () => {
      goToStep2();
      await waitFor(() => {
        expect(screen.getByText("Important Instructions")).toBeInTheDocument();
      });
    });

    it("should go back to step 1 when Back clicked", async () => {
      goToStep2();
      await waitFor(() => {
        fireEvent.click(screen.getByRole("button", { name: "Back" }));
      });

      expect(screen.getByText("Select Your Currency")).toBeInTheDocument();
    });
  });

  describe("Step 3: Confirmation", () => {
    const goToStep3 = async () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      // Step 1 -> 2
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      await waitFor(() => {
        expect(screen.getByText("Bank Transfer Details")).toBeInTheDocument();
      });
      // Step 2 -> 3
      fireEvent.click(screen.getByText(/I've Made the Transfer/i));
    };

    it("should show confirmation heading", async () => {
      await goToStep3();
      await waitFor(() => {
        expect(screen.getByText("Confirm Your Transfer")).toBeInTheDocument();
      });
    });

    it("should show name input", async () => {
      await goToStep3();
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Enter your full name")).toBeInTheDocument();
      });
    });

    it("should show email input", async () => {
      await goToStep3();
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Enter your email address")).toBeInTheDocument();
      });
    });

    it("should show transfer reference input", async () => {
      await goToStep3();
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Enter the reference from your bank")).toBeInTheDocument();
      });
    });

    it("should disable submit when name is empty", async () => {
      await goToStep3();
      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: "Submit Notification" });
        expect(submitButton).toBeDisabled();
      });
    });

    it("should enable submit when form is filled", async () => {
      await goToStep3();
      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("Enter your full name"), {
          target: { value: "John Doe" },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter your email address"), {
          target: { value: "john@example.com" },
        });
      });

      const submitButton = screen.getByRole("button", { name: "Submit Notification" });
      expect(submitButton).not.toBeDisabled();
    });

    it("should call onSubmit with form data", async () => {
      await goToStep3();
      await waitFor(() => {
        fireEvent.change(screen.getByPlaceholderText("Enter your full name"), {
          target: { value: "John Doe" },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter your email address"), {
          target: { value: "john@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText("Enter the reference from your bank"), {
          target: { value: "REF123" },
        });
      });

      fireEvent.click(screen.getByRole("button", { name: "Submit Notification" }));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        donorName: "John Doe",
        donorEmail: "john@example.com",
        referenceNumber: "REF123",
      });
    });
  });

  describe("USD Currency Flow", () => {
    it("should show routing number for USD", async () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );

      // Select USD
      fireEvent.click(screen.getByText("USD").closest("button")!);
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));

      await waitFor(() => {
        expect(screen.getByText("Routing Number")).toBeInTheDocument();
        expect(screen.getByText("021000021")).toBeInTheDocument();
      });
    });

    it("should show account number for USD", async () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );

      fireEvent.click(screen.getByText("USD").closest("button")!);
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));

      await waitFor(() => {
        expect(screen.getByText("Account Number")).toBeInTheDocument();
        expect(screen.getByText("123456789")).toBeInTheDocument();
      });
    });
  });

  describe("Styling", () => {
    it("should have gradient continue button", () => {
      const { container } = render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      const gradientButton = container.querySelector("[class*='from-violet-600']");
      expect(gradientButton).toBeInTheDocument();
    });

    it("should show step progress indicators", () => {
      const { container } = render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
        />
      );
      // Should have 3 step indicators
      const stepIndicators = container.querySelectorAll("[class*='w-8 h-8 rounded-full']");
      expect(stepIndicators.length).toBe(3);
    });
  });

  describe("Processing State", () => {
    it("should show submitting state", async () => {
      render(
        <BankTransferInstructions
          bankAccounts={mockBankAccounts}
          amount={100}
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          isProcessing={true}
        />
      );

      // Go to step 3
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      await waitFor(() => {
        fireEvent.click(screen.getByText(/I've Made the Transfer/i));
      });

      await waitFor(() => {
        expect(screen.getByText("Submitting...")).toBeInTheDocument();
      });
    });
  });
});
