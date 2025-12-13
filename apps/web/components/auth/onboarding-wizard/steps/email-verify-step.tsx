"use client";

/**
 * Email Verification Step
 *
 * Step 3: Verify email address.
 * Shows verification status and resend option.
 * Auto-advances when verified or skips if already verified.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";
import { StepWrapper, StepInfoBox } from "../shared/step-wrapper";
import { useAuth } from "@/components/providers/auth-provider";

export function EmailVerifyStep() {
  const { user } = useAuth();
  const { nextStep, setError } = useWizard();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Check if already verified - auto advance
  useEffect(() => {
    if (user?.emailVerified) {
      nextStep();
    }
  }, [user?.emailVerified, nextStep]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (isResending || resendCooldown > 0) return;

    setIsResending(true);
    setResendSuccess(false);
    setError(null);

    try {
      // Better Auth resend verification email endpoint
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send verification email");
      }

      setResendSuccess(true);
      setResendCooldown(60); // 60 second cooldown
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification email"
      );
    } finally {
      setIsResending(false);
    }
  }, [isResending, resendCooldown, user?.email, setError]);

  // If already verified, show success state
  if (user?.emailVerified) {
    return (
      <StepWrapper>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Email Verified!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your email address has been confirmed.
          </p>
        </div>
        <WizardNavigation nextLabel="Continue" />
      </StepWrapper>
    );
  }

  return (
    <StepWrapper>
      <div className="space-y-6">
        {/* Current email */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Verification email sent to
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <StepInfoBox variant="info">
          <div className="space-y-2">
            <p className="font-medium">Check your inbox!</p>
            <p className="text-sm opacity-90">
              We&apos;ve sent a verification link to your email. Click the link
              to verify your account. If you don&apos;t see it, check your spam
              folder.
            </p>
          </div>
        </StepInfoBox>

        {/* Success message */}
        {resendSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Verification email sent! Please check your inbox.
            </p>
          </div>
        )}

        {/* Resend button */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
            className={cn(
              "text-sm font-medium",
              "text-blue-600 dark:text-blue-400",
              "hover:text-blue-700 dark:hover:text-blue-300",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          >
            {isResending ? (
              <span className="flex items-center gap-2 justify-center">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </span>
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              "Didn't receive it? Resend verification email"
            )}
          </button>
        </div>
      </div>

      <WizardNavigation
        nextLabel="I'll verify later"
        showSkip={false}
      />
    </StepWrapper>
  );
}
