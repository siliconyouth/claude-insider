/**
 * Email Test API Endpoint
 *
 * Tests the email service configuration without sending actual emails.
 * Validates:
 * - Resend API key is configured
 * - FROM_EMAIL is set
 * - Email templates are valid
 * - Optionally sends a test email to a specified address
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasMinRole, type UserRole } from "@/lib/roles";

export async function GET(_request: NextRequest) {
  try {
    // Check auth - require admin role
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "admin")) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    // Check email configuration
    const checks = {
      resendApiKey: {
        configured: !!process.env.RESEND_API_KEY,
        prefix: process.env.RESEND_API_KEY?.substring(0, 8) || null,
      },
      fromEmail: {
        configured: !!process.env.EMAIL_FROM,
        value: process.env.EMAIL_FROM || "Claude Insider <noreply@claudeinsider.com>",
      },
      appUrl: {
        configured: !!process.env.NEXT_PUBLIC_APP_URL,
        value: process.env.NEXT_PUBLIC_APP_URL || "https://claudeinsider.com",
      },
    };

    const allConfigured =
      checks.resendApiKey.configured &&
      checks.fromEmail.configured &&
      checks.appUrl.configured;

    return NextResponse.json({
      success: true,
      configured: allConfigured,
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Email Test] Error:", error);
    return NextResponse.json(
      { error: "Failed to check email configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check auth - require admin role
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!hasMinRole(session.user.role as UserRole, "admin")) {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { type, email } = body as { type?: string; email?: string };

    // Use the logged-in user's email if not specified
    const targetEmail = email || session.user.email;

    if (!targetEmail) {
      return NextResponse.json({ error: "No email address provided" }, { status: 400 });
    }

    // Import email functions dynamically
    const { sendDonationReceiptEmail, sendWelcomeEmail } = await import("@/lib/email");

    let result;
    const testType = type || "donation";

    if (testType === "donation") {
      result = await sendDonationReceiptEmail({
        email: targetEmail,
        donorName: session.user.name || "Test Donor",
        amount: 25.0,
        currency: "USD",
        paymentMethod: "test_payment",
        donationId: `TEST-${Date.now()}`,
        badgeTier: "bronze",
        isFirstDonation: true,
        transactionDate: new Date(),
      });
    } else if (testType === "welcome") {
      result = await sendWelcomeEmail(targetEmail, session.user.name || undefined);
    } else {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    return NextResponse.json({
      success: result.success,
      error: result.error,
      type: testType,
      recipient: targetEmail,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Email Test] Send error:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
