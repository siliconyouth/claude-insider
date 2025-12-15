"use client";

/**
 * Email Verification Page
 *
 * Handles both link-based and code-based email verification.
 * Shows success state with option to close tab after verification.
 */

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/design-system";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token");

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [inputEmail, setInputEmail] = useState(email);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle token-based verification (from link)
  useEffect(() => {
    if (token) {
      // Better Auth handles this automatically via the callback URL
      // The token verification happens server-side
      verifyWithToken();
    }
  }, [token]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const verifyWithToken = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      // Call Better Auth's verify endpoint
      const response = await fetch(`/api/auth/verify-email?token=${token}`, {
        method: "GET",
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        setError("Invalid or expired verification link. Please request a new one.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData.charAt(i);
    }
    setCode(newCode);

    // Focus last filled or first empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // Auto-submit if complete
    if (pastedData.length === 6) {
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || code.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (!inputEmail) {
      setError("Please enter your email address");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verification-code", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inputEmail,
          code: fullCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Invalid verification code");
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        // Clear code on error
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0 || !inputEmail) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail }),
      });

      if (response.ok) {
        setCooldown(60);
        setRemainingAttempts(null);
        setCode(["", "", "", "", "", ""]);
      } else {
        setError("Failed to resend code. Please try again.");
      }
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const closeTab = () => {
    window.close();
    // If window.close() doesn't work (cross-origin), redirect to home
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-[#0a0a0a] dark:to-[#111111] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#262626] p-8 shadow-xl">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Your email has been successfully verified. You can now access all features.
              </p>

              <div className="space-y-3">
                <button
                  onClick={closeTab}
                  className={cn(
                    "w-full py-3 px-4 rounded-lg font-semibold text-white",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "shadow-lg shadow-blue-500/25",
                    "hover:-translate-y-0.5 transition-all duration-200"
                  )}
                >
                  Close This Tab
                </button>

                <Link
                  href="/"
                  className={cn(
                    "block w-full py-3 px-4 rounded-lg font-medium",
                    "text-gray-700 dark:text-gray-300",
                    "border border-gray-200 dark:border-[#262626]",
                    "hover:border-blue-500/50 transition-all duration-200"
                  )}
                >
                  Return to Website
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-[#0a0a0a] dark:to-[#111111] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#262626] p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Email Input (if not provided) */}
          {!email && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="Enter your email"
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-gray-900 dark:text-white",
                  "bg-gray-50 dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "placeholder:text-gray-400"
                )}
              />
            </div>
          )}

          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
              Verification Code
            </label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isVerifying}
                  className={cn(
                    "w-12 h-14 text-center text-2xl font-bold rounded-lg",
                    "bg-gray-50 dark:bg-[#1a1a1a]",
                    "border-2 border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white",
                    "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                    "transition-all duration-200",
                    "disabled:opacity-50"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <p className="text-xs text-red-500 dark:text-red-500 text-center mt-1">
                  {remainingAttempts} attempts remaining
                </p>
              )}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => verifyCode()}
            disabled={isVerifying || code.join("").length !== 6}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-semibold text-white",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "shadow-lg shadow-blue-500/25",
              "hover:-translate-y-0.5 transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            )}
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Verifying...
              </span>
            ) : (
              "Verify Email"
            )}
          </button>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Didn&apos;t receive the code?
            </p>
            <button
              onClick={resendCode}
              disabled={isResending || cooldown > 0 || !inputEmail}
              className={cn(
                "text-sm font-medium text-blue-600 dark:text-cyan-400",
                "hover:underline transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
              )}
            >
              {isResending ? (
                "Sending..."
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                "Resend Code"
              )}
            </button>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-500">
          Check your spam folder if you don&apos;t see the email.
          <br />
          The code expires in 1 hour.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-[#0a0a0a] dark:to-[#111111]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
