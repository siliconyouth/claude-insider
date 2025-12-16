/**
 * Donation Tests
 *
 * Tests for donation functionality and payment processing.
 */

import type { TestSuite } from "../diagnostics.types";
import { createTest } from "./test-utils";

export const donationTests: TestSuite[] = [
  createTest("Donation Bank Info", "donations", async () => {
    const response = await fetch("/api/donations/bank-info");
    const data = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message: data.error || "Failed to fetch bank info",
      };
    }

    const count = data.accounts?.length || 0;
    return {
      status: count > 0 ? "success" : "warning",
      message:
        count > 0
          ? `${count} bank account(s) configured`
          : "No bank accounts configured",
      details: {
        accountCount: count,
        currencies:
          data.accounts?.map((a: { currency: string }) => a.currency) || [],
      },
    };
  }),

  createTest("Donation Page Route", "donations", async () => {
    const response = await fetch("/donate", { method: "HEAD" });
    return {
      status: response.ok ? "success" : "error",
      message: response.ok ? "Donate page is accessible" : `HTTP ${response.status}`,
      details: { statusCode: response.status },
    };
  }),
];
