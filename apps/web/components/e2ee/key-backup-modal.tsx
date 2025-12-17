"use client";

/**
 * E2EE Key Backup Modal
 *
 * A reusable modal for creating and restoring E2EE key backups.
 * Features password strength indicator and confirmation flow.
 */

import { useState, useTransition, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { useE2EE } from "@/hooks/use-e2ee";
import {
  checkPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/lib/e2ee/key-backup";

// ============================================================================
// TYPES
// ============================================================================

type ModalMode = "create" | "restore";

interface KeyBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: ModalMode;
  onSuccess?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function KeyBackupModal({
  isOpen,
  onClose,
  mode = "create",
  onSuccess,
}: KeyBackupModalProps) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const e2ee = useE2EE();

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Password validation
  const passwordStrength = checkPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const isValidForCreate =
    password.length >= 8 &&
    passwordStrength.score >= 2 &&
    passwordsMatch;
  const isValidForRestore = password.length > 0;

  // Handle create backup
  const handleCreateBackup = useCallback(() => {
    if (!isValidForCreate) return;

    startTransition(async () => {
      try {
        await e2ee.createBackup(password);
        toast.success("Backup created successfully!");
        onSuccess?.();
        onClose();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create backup"
        );
      }
    });
  }, [password, isValidForCreate, e2ee, toast, onSuccess, onClose]);

  // Handle restore backup
  const handleRestoreBackup = useCallback(() => {
    if (!isValidForRestore) return;

    startTransition(async () => {
      try {
        await e2ee.restoreFromBackup(password);
        toast.success("Keys restored from backup!");
        onSuccess?.();
        onClose();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to restore backup"
        );
      }
    });
  }, [password, isValidForRestore, e2ee, toast, onSuccess, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl p-6",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-2xl shadow-black/20",
          "max-h-[90vh] overflow-y-auto",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                mode === "create"
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-emerald-100 dark:bg-emerald-900/30"
              )}
            >
              <span className="text-xl">
                {mode === "create" ? "🔐" : "🔓"}
              </span>
            </div>
            <h2
              id="backup-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {mode === "create" ? "Create Key Backup" : "Restore from Backup"}
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mode === "create"
              ? "Your keys will be encrypted with your password and stored securely in the cloud."
              : "Enter your backup password to restore your encryption keys on this device."}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {mode === "create" ? "Backup Password" : "Backup Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "create"
                    ? "Enter a strong password"
                    : "Enter your backup password"
                }
                autoFocus
                className={cn(
                  "w-full px-3 py-2 pr-10 rounded-lg",
                  "border border-gray-200 dark:border-[#262626]",
                  "bg-white dark:bg-[#0a0a0a]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {/* Password Strength (create mode only) */}
            {mode === "create" && password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-[#262626] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      getPasswordStrengthColor(passwordStrength.score)
                    )}
                    style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[70px] text-right">
                  {getPasswordStrengthLabel(passwordStrength.score)}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password (create mode only) */}
          {mode === "create" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={cn(
                  "w-full px-3 py-2 rounded-lg",
                  "border border-gray-200 dark:border-[#262626]",
                  "bg-white dark:bg-[#0a0a0a]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  confirmPassword && !passwordsMatch && "border-red-500"
                )}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-500">
                  Passwords do not match
                </p>
              )}
            </div>
          )}

          {/* Warning (create mode) */}
          {mode === "create" && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-400">
              <strong>Important:</strong> If you forget this password, you will
              not be able to recover your keys. Store it somewhere safe!
            </div>
          )}

          {/* Info (restore mode) */}
          {mode === "restore" && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-400">
              This will restore your encryption keys from your cloud backup.
              Any existing keys on this device will be replaced.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Cancel
          </button>

          <button
            onClick={mode === "create" ? handleCreateBackup : handleRestoreBackup}
            disabled={
              isPending ||
              (mode === "create" && !isValidForCreate) ||
              (mode === "restore" && !isValidForRestore)
            }
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "hover:shadow-lg transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isPending
              ? mode === "create"
                ? "Creating..."
                : "Restoring..."
              : mode === "create"
                ? "Create Backup"
                : "Restore Keys"}
          </button>
        </div>
      </div>
    </div>
  );

  // Render in portal
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}

// ============================================================================
// HOOK FOR EASY MODAL MANAGEMENT
// ============================================================================

export function useKeyBackupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");

  const openCreate = useCallback(() => {
    setMode("create");
    setIsOpen(true);
  }, []);

  const openRestore = useCallback(() => {
    setMode("restore");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    mode,
    openCreate,
    openRestore,
    close,
  };
}
