"use client";

/**
 * E2EE Setup Step
 *
 * Onboarding step for end-to-end encryption setup.
 * Users can:
 * - Generate new encryption keys
 * - Restore from existing backup
 * - Create a password-protected cloud backup
 *
 * This step is SKIPPABLE - users can enable E2EE later in settings.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { StepWrapper, StepInfoBox } from "../shared/step-wrapper";
import { useE2EEContext } from "@/components/providers/e2ee-provider";
import {
  checkPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/lib/e2ee/key-backup";

type SetupState = "choose" | "generating" | "backup-password" | "restoring" | "complete";

export function E2EESetupStep() {
  const { setError, nextStep } = useWizard();
  const e2ee = useE2EEContext();

  // State
  const [setupState, setSetupState] = useState<SetupState>("choose");
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasExistingBackup, setHasExistingBackup] = useState(false);
  const [restorePassword, setRestorePassword] = useState("");

  // Check for existing backup on mount
  useEffect(() => {
    const checkBackup = async () => {
      const exists = await e2ee.checkBackupExists();
      setHasExistingBackup(exists);
    };
    checkBackup();
  }, [e2ee]);

  // Password strength
  const passwordStrength = checkPasswordStrength(backupPassword);
  const passwordsMatch = backupPassword === confirmPassword;

  const handleGenerateKeys = async () => {
    setSetupState("generating");
    setIsProcessing(true);
    setError(null);

    try {
      await e2ee.generateKeys();
      setSetupState("backup-password");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate keys");
      setSetupState("choose");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!passwordStrength.isStrong) {
      setError("Please choose a stronger password");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await e2ee.createBackup(backupPassword);
      setSetupState("complete");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create backup");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipBackup = () => {
    // Keys are generated but not backed up - user can do this later
    setSetupState("complete");
  };

  const handleRestore = async () => {
    if (!restorePassword) {
      setError("Please enter your backup password");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await e2ee.restoreFromBackup(restorePassword);
      setSetupState("complete");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message === "No backup found"
            ? "No backup found for this account"
            : "Incorrect password"
          : "Failed to restore backup"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    nextStep();
  };

  const handleSkip = () => {
    nextStep();
  };

  // Choose between new setup or restore
  if (setupState === "choose") {
    return (
      <StepWrapper
        title="Secure Messaging"
        description="Enable end-to-end encryption for private conversations"
      >
        <div className="space-y-4">
          <StepInfoBox variant="info">
            <p className="text-sm">
              <strong>End-to-end encryption (E2EE)</strong> ensures only you and your
              recipients can read your messages. Not even we can access them.
            </p>
          </StepInfoBox>

          {/* New Setup Option */}
          <button
            onClick={handleGenerateKeys}
            disabled={isProcessing}
            className={cn(
              "w-full p-4 rounded-xl text-left transition-all duration-200",
              "border-2 border-gray-200 dark:border-[#262626]",
              "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Set Up New Encryption
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Generate new encryption keys for this device
                </p>
              </div>
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>

          {/* Restore Option (if backup exists) */}
          {hasExistingBackup && (
            <button
              onClick={() => setSetupState("restoring")}
              disabled={isProcessing}
              className={cn(
                "w-full p-4 rounded-xl text-left transition-all duration-200",
                "border-2 border-gray-200 dark:border-[#262626]",
                "hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
                  )}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Restore from Backup
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                      Backup Found
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Restore your encryption keys from cloud backup
                  </p>
                </div>
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          )}

          {/* Skip Option */}
          <div className="pt-2">
            <button
              onClick={handleSkip}
              className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Skip for now - I&apos;ll set this up later
            </button>
          </div>
        </div>
      </StepWrapper>
    );
  }

  // Generating keys state
  if (setupState === "generating") {
    return (
      <StepWrapper title="Generating Encryption Keys">
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white animate-spin"
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
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Generating secure encryption keys...
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This may take a few seconds
          </p>
        </div>
      </StepWrapper>
    );
  }

  // Backup password setup
  if (setupState === "backup-password") {
    return (
      <StepWrapper
        title="Create Cloud Backup"
        description="Protect your keys with a password for recovery on other devices"
      >
        <div className="space-y-4">
          <StepInfoBox variant="warning">
            <p className="text-sm">
              <strong>Important:</strong> If you lose this password, you won&apos;t be able
              to recover your encryption keys on new devices.
            </p>
          </StepInfoBox>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Backup Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                placeholder="Create a strong password"
                className={cn(
                  "w-full px-4 py-3 pr-12 rounded-lg",
                  "bg-gray-50 dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {backupPassword && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i <= passwordStrength.score
                          ? getPasswordStrengthColor(passwordStrength.score)
                          : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Strength: {getPasswordStrengthLabel(passwordStrength.score)}
                </p>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                    {passwordStrength.feedback.map((tip, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="text-amber-500">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-gray-50 dark:bg-[#0a0a0a]",
                "border",
                confirmPassword && !passwordsMatch
                  ? "border-red-500"
                  : "border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSkipBackup}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              Skip Backup
            </button>
            <button
              onClick={handleCreateBackup}
              disabled={!passwordStrength.isStrong || !passwordsMatch || isProcessing}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "hover:opacity-90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isProcessing ? "Creating..." : "Create Backup"}
            </button>
          </div>
        </div>
      </StepWrapper>
    );
  }

  // Restore from backup
  if (setupState === "restoring") {
    return (
      <StepWrapper
        title="Restore from Backup"
        description="Enter your backup password to restore your encryption keys"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Backup Password
            </label>
            <input
              type="password"
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
              placeholder="Enter your backup password"
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-gray-50 dark:bg-[#0a0a0a]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setSetupState("choose")}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              Back
            </button>
            <button
              onClick={handleRestore}
              disabled={!restorePassword || isProcessing}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-emerald-500 to-teal-500",
                "text-white",
                "hover:opacity-90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isProcessing ? "Restoring..." : "Restore"}
            </button>
          </div>
        </div>
      </StepWrapper>
    );
  }

  // Complete state
  if (setupState === "complete") {
    return (
      <StepWrapper title="Encryption Enabled">
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Your messages are now encrypted!
          </h3>

          <div className="space-y-2 text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Encryption keys generated
            </div>
            {e2ee.hasBackup && (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Cloud backup created
              </div>
            )}
          </div>

          {e2ee.deviceId && (
            <div className="w-full mb-4 p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626]">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Device ID</p>
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                {e2ee.deviceId}
              </p>
            </div>
          )}

          <StepInfoBox variant="info">
            <p>
              You can manage your encryption keys and backup settings anytime from your
              account settings.
            </p>
          </StepInfoBox>

          <button
            onClick={handleComplete}
            className={cn(
              "mt-6 w-full px-4 py-2.5 rounded-lg text-sm font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white",
              "hover:opacity-90 transition-opacity"
            )}
          >
            Continue
          </button>
        </div>
      </StepWrapper>
    );
  }

  return null;
}
