"use client";

/**
 * E2EE Setup Modal
 *
 * A modal that appears when users click on "Not encrypted" badge.
 * Allows users to:
 * - Generate new encryption keys
 * - Restore from existing backup
 * - Create a password-protected cloud backup
 *
 * Similar to the onboarding E2EE step but works as a standalone modal
 * that can be triggered from anywhere in the app.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { useE2EEContext } from "@/components/providers/e2ee-provider";
import {
  checkPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/lib/e2ee/key-backup";
import { Lock, Upload, Key, Shield, ShieldCheck, X, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

type SetupState = "choose" | "generating" | "backup-password" | "restoring" | "complete";

interface E2EESetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function E2EESetupModal({ isOpen, onClose, onSuccess }: E2EESetupModalProps) {
  const e2ee = useE2EEContext();

  // State
  const [setupState, setSetupState] = useState<SetupState>("choose");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupPassword, setBackupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasExistingBackup, setHasExistingBackup] = useState(false);
  const [restorePassword, setRestorePassword] = useState("");

  // Check for existing backup on mount
  useEffect(() => {
    if (isOpen) {
      const checkBackup = async () => {
        const exists = await e2ee.checkBackupExists();
        setHasExistingBackup(exists);
      };
      checkBackup();
      // Reset state when modal opens
      setSetupState("choose");
      setError(null);
      setBackupPassword("");
      setConfirmPassword("");
      setRestorePassword("");
    }
  }, [isOpen, e2ee]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate keys");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create backup");
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message === "No backup found"
            ? "No backup found for this account"
            : "Incorrect password"
          : "Failed to restore backup"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md mx-4",
          "bg-white dark:bg-[#111111]",
          "rounded-2xl shadow-2xl",
          "border border-gray-200 dark:border-[#262626]",
          "overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {setupState === "complete" ? "Encryption Enabled" : "Secure Messaging"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                End-to-end encryption setup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Choose state */}
          {setupState === "choose" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>End-to-end encryption (E2EE)</strong> ensures only you and your
                  recipients can read your messages. Not even we can access them.
                </p>
              </div>

              {/* New Setup Option */}
              <button
                onClick={handleGenerateKeys}
                disabled={isProcessing}
                className={cn(
                  "w-full p-4 rounded-xl text-left transition-all duration-200",
                  "border-2 border-gray-200 dark:border-[#262626]",
                  "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
                    )}
                  >
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Set Up New Encryption
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Generate new encryption keys for this device
                    </p>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 shrink-0" />
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
                    "hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
                      )}
                    >
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
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
                    <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 shrink-0" />
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Generating keys state */}
          {setupState === "generating" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-gray-900 dark:text-white font-medium text-center">
                Generating Encryption Keys
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                This may take a few seconds...
              </p>
            </div>
          )}

          {/* Backup password setup */}
          {setupState === "backup-password" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Important:</strong> Create a backup password to recover your
                  keys on other devices. If you lose this password, you won&apos;t be able
                  to recover your encryption keys.
                </p>
              </div>

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
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
          )}

          {/* Restore from backup */}
          {setupState === "restoring" && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSetupState("choose");
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to options
              </button>

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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && restorePassword && !isProcessing) {
                      handleRestore();
                    }
                  }}
                />
              </div>

              <button
                onClick={handleRestore}
                disabled={!restorePassword || isProcessing}
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg text-sm font-medium",
                  "bg-gradient-to-r from-emerald-500 to-teal-500",
                  "text-white",
                  "hover:opacity-90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Restoring...
                  </span>
                ) : (
                  "Restore Keys"
                )}
              </button>
            </div>
          )}

          {/* Complete state */}
          {setupState === "complete" && (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
                Your messages are now encrypted!
              </h3>

              <div className="space-y-2 text-center mb-4">
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-4 h-4" />
                  Encryption keys active
                </div>
                {e2ee.hasBackup && (
                  <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <Upload className="w-4 h-4" />
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

              <button
                onClick={handleComplete}
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg text-sm font-medium",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white",
                  "hover:opacity-90 transition-opacity"
                )}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
