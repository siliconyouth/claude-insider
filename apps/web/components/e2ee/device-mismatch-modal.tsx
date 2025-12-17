"use client";

/**
 * Device Mismatch Modal
 *
 * Shows when the device ID stored in the app's IndexedDB doesn't match
 * the device ID in OlmMachine's internal storage.
 *
 * This can happen when:
 * - Browser data was partially cleared
 * - IndexedDB storage was corrupted
 * - Multiple browser profiles share storage (rare)
 *
 * Offers three recovery options:
 * 1. Restore from backup (if available) - restores existing keys
 * 2. Regenerate device - creates completely new keys
 * 3. Dismiss - continue with fallback crypto (less secure)
 */

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useE2EEContext } from "@/components/providers/e2ee-provider";
import { AlertTriangle, RefreshCw, Download, Shield, Key, CheckCircle, Users, Smile, QrCode } from "lucide-react";

export function DeviceMismatchModal() {
  const e2ee = useE2EEContext();
  const [isPending, startTransition] = useTransition();
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show when there's a device mismatch OR showing success screen
  const isOpen = (e2ee.status === "device-mismatch" && e2ee.deviceMismatch !== null) || showSuccess;

  const handleRegenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        await e2ee.regenerateDevice();
        // Show success screen with verification guidance
        setShowSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to regenerate device");
      }
    });
  };

  const handleClose = () => {
    setShowSuccess(false);
  };

  const handleRestoreFromBackup = () => {
    if (!backupPassword) {
      setError("Please enter your backup password");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await e2ee.restoreFromBackup(backupPassword);
        setBackupPassword("");
        setShowBackupRestore(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to restore from backup");
      }
    });
  };

  const handleDismiss = () => {
    e2ee.dismissDeviceMismatch();
  };

  if (!isOpen || !mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-mismatch-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          "relative max-w-lg w-full rounded-2xl p-6",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-2xl"
        )}
      >
        {/* Header - Mismatch state */}
        {!showSuccess && (
          <>
            <div className="flex items-start gap-4 mb-6">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-amber-100 dark:bg-amber-900/30"
                )}
              >
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h2
                  id="device-mismatch-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  Encryption Device Mismatch
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Your encryption keys are out of sync with this browser&apos;s storage.
                </p>
              </div>
            </div>

            {/* Explanation */}
            <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626]">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                This usually happens when browser data was partially cleared or storage was corrupted.
                Your messages are still safe, but you need to resolve this mismatch.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 font-mono">
                <div>App Device ID: {e2ee.deviceMismatch?.storedDeviceId?.substring(0, 8)}...</div>
                <div>Storage Device ID: {e2ee.deviceMismatch?.olmDeviceId?.substring(0, 8)}...</div>
              </div>
            </div>
          </>
        )}

        {/* Error display */}
        {error && !showSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Backup restore section */}
        {!showSuccess && showBackupRestore ? (
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Restore from Backup
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                Enter your backup password to restore your existing encryption keys.
              </p>
              <input
                type="password"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                placeholder="Backup password"
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm",
                  "bg-white dark:bg-[#0a0a0a]",
                  "border border-blue-300 dark:border-blue-700",
                  "text-gray-900 dark:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                disabled={isPending}
                onKeyDown={(e) => e.key === "Enter" && handleRestoreFromBackup()}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleRestoreFromBackup}
                  disabled={isPending || !backupPassword}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-blue-600 text-white",
                    "hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors"
                  )}
                >
                  {isPending ? "Restoring..." : "Restore Keys"}
                </button>
                <button
                  onClick={() => {
                    setShowBackupRestore(false);
                    setBackupPassword("");
                    setError(null);
                  }}
                  disabled={isPending}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                    "disabled:opacity-50 transition-colors"
                  )}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : !showSuccess ? (
          /* Actions */
          <div className="space-y-3">
            {/* Restore from backup (if available) */}
            {e2ee.hasBackup && (
              <button
                onClick={() => setShowBackupRestore(true)}
                disabled={isPending}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl text-left",
                  "border-2 border-blue-200 dark:border-blue-800",
                  "bg-blue-50 dark:bg-blue-900/20",
                  "hover:border-blue-400 dark:hover:border-blue-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-800 dark:text-blue-300">
                    Restore from Backup
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Use your backed up encryption keys (recommended if available)
                  </div>
                </div>
              </button>
            )}

            {/* Regenerate device */}
            <button
              onClick={handleRegenerate}
              disabled={isPending}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl text-left",
                "border-2 border-violet-200 dark:border-violet-800",
                "bg-violet-50 dark:bg-violet-900/20",
                "hover:border-violet-400 dark:hover:border-violet-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                <RefreshCw className={cn("w-5 h-5 text-violet-600 dark:text-violet-400", isPending && "animate-spin")} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-violet-800 dark:text-violet-300">
                  {isPending ? "Regenerating..." : "Regenerate Device"}
                </div>
                <div className="text-sm text-violet-600 dark:text-violet-400">
                  Create new encryption keys (old encrypted messages won&apos;t be readable)
                </div>
              </div>
            </button>

            {/* Dismiss (fallback) */}
            <button
              onClick={handleDismiss}
              disabled={isPending}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl text-left",
                "border border-gray-200 dark:border-[#262626]",
                "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  Continue Anyway
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Use basic encryption (some features may be limited)
                </div>
              </div>
            </button>
          </div>
        ) : null}

        {/* Warning (only show during mismatch state) */}
        {!showSuccess && (
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            If you frequently see this message, check your browser&apos;s storage settings.
          </p>
        )}

        {/* Success Screen - Post Regeneration */}
        {showSuccess && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                New Device Keys Generated!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your encryption has been reset. Now you need to re-verify with your contacts.
              </p>
            </div>

            {/* Verification Instructions */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Re-verify Your Contacts
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                Your contacts will see a red lock icon on your messages until you verify.
                Here&apos;s how to re-establish trust:
              </p>

              <div className="space-y-3">
                {/* Method 1: Emoji */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-[#0a0a0a]/50">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                    <Smile className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                      Compare Emojis (Recommended)
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Both of you will see 7 emojis. Compare them over a call or in person.
                    </div>
                  </div>
                </div>

                {/* Method 2: QR */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-[#0a0a0a]/50">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                      Scan QR Code
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Meet in person and scan each other&apos;s verification QR code.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How to start */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626]">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2 text-sm">
                How to start verification:
              </h4>
              <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Open a conversation with your contact</li>
                <li>Click the lock icon in the conversation header</li>
                <li>Select &quot;Verify Device&quot; to start the process</li>
                <li>Compare emojis or scan QR codes to confirm</li>
              </ol>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white shadow-lg shadow-blue-500/25",
                "hover:opacity-90 transition-opacity"
              )}
            >
              Got It
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
