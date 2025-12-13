"use client";

/**
 * Two-Factor Authentication Settings Component
 *
 * Handles 2FA setup, verification, and management.
 */

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  getTwoFactorStatus,
  generateTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  regenerateBackupCodes,
} from "@/app/actions/two-factor";

type SetupStep = "initial" | "scan" | "verify" | "backup" | "complete";

export function TwoFactorSettings() {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // Status state
  const [isEnabled, setIsEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Setup state
  const [setupStep, setSetupStep] = useState<SetupStep>("initial");
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState("");

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    const result = await getTwoFactorStatus();
    if (!result.error) {
      setIsEnabled(result.enabled || false);
      setBackupCodesRemaining(result.backupCodesRemaining || 0);
      setVerifiedAt(result.verifiedAt || null);
    }
    setIsLoading(false);
  };

  const handleStartSetup = () => {
    startTransition(async () => {
      const result = await generateTwoFactorSecret();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSecret(result.secret || "");
      setQrCodeUrl(result.qrCodeUrl || "");
      setSetupStep("scan");
    });
  };

  const handleVerify = () => {
    if (verifyCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    startTransition(async () => {
      const result = await enableTwoFactor(verifyCode);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBackupCodes(result.backupCodes || []);
      setSetupStep("backup");
    });
  };

  const handleComplete = () => {
    setSetupStep("complete");
    setIsEnabled(true);
    setBackupCodesRemaining(10);
    setVerifiedAt(new Date().toISOString());
    toast.success("Two-factor authentication enabled!");
    // Reset setup state
    setSecret("");
    setQrCodeUrl("");
    setVerifyCode("");
    setBackupCodes([]);
    setTimeout(() => setSetupStep("initial"), 500);
  };

  const handleDisable = () => {
    if (disableCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    startTransition(async () => {
      const result = await disableTwoFactor(disableCode);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setIsEnabled(false);
      setShowDisableModal(false);
      setDisableCode("");
      toast.success("Two-factor authentication disabled");
    });
  };

  const handleRegenerate = () => {
    if (regenerateCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    startTransition(async () => {
      const result = await regenerateBackupCodes(regenerateCode);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBackupCodes(result.backupCodes || []);
      setBackupCodesRemaining(result.backupCodes?.length || 0);
      setShowRegenerateModal(false);
      setRegenerateCode("");
      setSetupStep("backup");
    });
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  const downloadBackupCodes = () => {
    const content = `Claude Insider - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

Keep these codes in a safe place. Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "claude-insider-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 dark:bg-[#1a1a1a] rounded-xl" />
      </div>
    );
  }

  // Disable Modal
  if (showDisableModal) {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Disable Two-Factor Authentication
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Enter a verification code from your authenticator app to disable 2FA.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className={cn(
              "w-full px-4 py-3 rounded-lg text-center text-2xl font-mono tracking-widest",
              "bg-white dark:bg-[#0a0a0a]",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-900 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          />

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDisableModal(false);
                setDisableCode("");
              }}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleDisable}
              disabled={isPending || disableCode.length !== 6}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-red-600 text-white",
                "hover:bg-red-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "..." : "Disable 2FA"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regenerate Backup Codes Modal
  if (showRegenerateModal) {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Regenerate Backup Codes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This will invalidate your existing backup codes. Enter a verification code to continue.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={regenerateCode}
            onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className={cn(
              "w-full px-4 py-3 rounded-lg text-center text-2xl font-mono tracking-widest",
              "bg-white dark:bg-[#0a0a0a]",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-900 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          />

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowRegenerateModal(false);
                setRegenerateCode("");
              }}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isPending || regenerateCode.length !== 6}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "..." : "Regenerate"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup: Scan QR Code
  if (setupStep === "scan") {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Set Up Two-Factor Authentication
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>

        <div className="flex flex-col items-center mb-6">
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="2FA QR Code"
              className="w-48 h-48 rounded-lg bg-white p-2"
            />
          )}
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
            Or enter this code manually:
          </p>
          <code
            className={cn(
              "block w-full px-4 py-2 rounded-lg text-center text-sm font-mono",
              "bg-white dark:bg-[#0a0a0a]",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-900 dark:text-white",
              "select-all"
            )}
          >
            {secret}
          </code>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setSetupStep("initial");
              setSecret("");
              setQrCodeUrl("");
            }}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
            )}
          >
            Cancel
          </button>
          <button
            onClick={() => setSetupStep("verify")}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white"
            )}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Setup: Verify Code
  if (setupStep === "verify") {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Verify Your Authenticator
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter the 6-digit code from your authenticator app to verify setup.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            autoFocus
            className={cn(
              "w-full px-4 py-3 rounded-lg text-center text-2xl font-mono tracking-widest",
              "bg-white dark:bg-[#0a0a0a]",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-900 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setSetupStep("scan")}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              Back
            </button>
            <button
              onClick={handleVerify}
              disabled={isPending || verifyCode.length !== 6}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "Verifying..." : "Verify & Enable"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup: Backup Codes
  if (setupStep === "backup") {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Save Your Backup Codes
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Keep these codes safe. You can use them to access your account if you lose your authenticator.
        </p>

        <div
          className={cn(
            "grid grid-cols-2 gap-2 p-4 rounded-lg mb-6",
            "bg-white dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          {backupCodes.map((code, index) => (
            <code
              key={index}
              className="text-sm font-mono text-gray-900 dark:text-white text-center py-1"
            >
              {code}
            </code>
          ))}
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={copyBackupCodes}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "flex items-center justify-center gap-2"
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </button>
          <button
            onClick={downloadBackupCodes}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "flex items-center justify-center gap-2"
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </button>
        </div>

        <div
          className={cn(
            "p-3 rounded-lg mb-4",
            "bg-amber-50 dark:bg-amber-900/20",
            "border border-amber-200 dark:border-amber-800"
          )}
        >
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Important:</strong> Each code can only be used once. Store them securely.
          </p>
        </div>

        <button
          onClick={handleComplete}
          className={cn(
            "w-full px-4 py-2 rounded-lg text-sm font-medium",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white"
          )}
        >
          I&apos;ve Saved My Codes
        </button>
      </div>
    );
  }

  // Enabled State
  if (isEnabled) {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-green-100 dark:bg-green-900/30"
              )}
            >
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Two-Factor Authentication
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Enabled
                {verifiedAt && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {" "}
                    · since {new Date(verifiedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDisableModal(true)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:border-red-500 hover:text-red-600 dark:hover:text-red-400",
              "transition-colors"
            )}
          >
            Disable
          </button>
        </div>

        {/* Backup Codes Status */}
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Backup Codes</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {backupCodesRemaining} codes remaining
            </p>
          </div>
          <button
            onClick={() => setShowRegenerateModal(true)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors"
            )}
          >
            Regenerate
          </button>
        </div>
      </div>
    );
  }

  // Initial State (Not Enabled)
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl",
        "bg-gray-50 dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-gray-100 dark:bg-[#1a1a1a]"
          )}
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            Two-Factor Authentication
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add an extra layer of security to your account
          </p>
        </div>
      </div>
      <button
        onClick={handleStartSetup}
        disabled={isPending}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg",
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "text-white shadow-sm shadow-blue-500/25",
          "hover:shadow-md hover:-translate-y-0.5",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
          "transition-all duration-200"
        )}
      >
        {isPending ? "..." : "Enable"}
      </button>
    </div>
  );
}
