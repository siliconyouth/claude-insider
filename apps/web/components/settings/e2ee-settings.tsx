"use client";

/**
 * E2EE Settings Component
 *
 * Manages end-to-end encryption settings including:
 * - Device registration and management
 * - Key backup creation and restoration
 * - Encryption status overview
 * - Key verification status
 */

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { useE2EE } from "@/hooks/use-e2ee";
import { useSession } from "@/lib/auth-client";
import { getE2EEStorageStats } from "@/lib/e2ee/key-storage";
import {
  checkPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/lib/e2ee/key-backup";
import { getVerifiedDevices } from "@/lib/e2ee/device-verification";

interface DeviceInfo {
  id: string;
  device_id: string;
  device_name: string | null;
  device_type: string | null;
  identity_key: string;
  created_at: string;
  last_seen_at: string;
  is_current?: boolean;
}

interface StorageStats {
  hasAccount: boolean;
  sessionCount: number;
  megolmSessionCount: number;
  estimatedSizeBytes: number;
}

type ViewState = "overview" | "backup-create" | "backup-restore" | "devices";

export function E2EESettings() {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const e2ee = useE2EE();
  const { data: session } = useSession();

  // State
  const [viewState, setViewState] = useState<ViewState>("overview");
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [verifiedDeviceIds, setVerifiedDeviceIds] = useState<Set<string>>(new Set());
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Backup form
  const [backupPassword, setBackupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [restorePassword, setRestorePassword] = useState("");

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Load devices
  const loadDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const response = await fetch("/api/e2ee/devices");
      if (response.ok) {
        const data = await response.json();
        // Mark current device
        const devicesWithCurrent = (data.devices || []).map((d: DeviceInfo) => ({
          ...d,
          is_current: d.device_id === e2ee.deviceId,
        }));
        setDevices(devicesWithCurrent);
      }
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
    setIsLoadingDevices(false);
  };

  // Load storage stats
  const loadStorageStats = async () => {
    try {
      const stats = await getE2EEStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("Failed to load storage stats:", error);
    }
  };

  // Load verified devices
  const loadVerifiedDevices = async () => {
    if (!session?.user?.id) return;
    try {
      const verified = await getVerifiedDevices(session.user.id);
      setVerifiedDeviceIds(new Set(verified.map((d) => d.deviceId)));
    } catch (error) {
      console.error("Failed to load verified devices:", error);
    }
  };

  useEffect(() => {
    if (e2ee.isInitialized && session?.user?.id) {
      loadDevices();
      loadStorageStats();
      loadVerifiedDevices();
    }
  }, [e2ee.isInitialized, e2ee.deviceId, session?.user?.id]);

  // Handle key generation
  const handleGenerateKeys = async () => {
    startTransition(async () => {
      try {
        await e2ee.generateKeys();
        toast.success("E2EE keys generated successfully!");
        await loadDevices();
        await loadStorageStats();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to generate keys");
      }
    });
  };

  // Handle backup creation
  const handleCreateBackup = async () => {
    if (backupPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const strength = checkPasswordStrength(backupPassword);
    if (strength.score < 2) {
      toast.error("Please use a stronger password");
      return;
    }

    startTransition(async () => {
      try {
        await e2ee.createBackup(backupPassword);
        toast.success("Backup created successfully!");
        setBackupPassword("");
        setConfirmPassword("");
        setViewState("overview");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create backup");
      }
    });
  };

  // Handle backup restoration
  const handleRestoreBackup = async () => {
    if (!restorePassword) {
      toast.error("Please enter your backup password");
      return;
    }

    startTransition(async () => {
      try {
        await e2ee.restoreFromBackup(restorePassword);
        toast.success("Keys restored from backup!");
        setRestorePassword("");
        setViewState("overview");
        await loadDevices();
        await loadStorageStats();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to restore backup");
      }
    });
  };

  // Handle destroy all keys
  const handleDestroyKeys = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    startTransition(async () => {
      try {
        await e2ee.destroy();
        toast.success("All E2EE data has been deleted");
        setShowDeleteConfirm(false);
        setDeleteConfirmText("");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete keys");
      }
    });
  };

  // Handle remove device
  const handleRemoveDevice = async (deviceId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/e2ee/devices", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        });

        if (!response.ok) {
          throw new Error("Failed to remove device");
        }

        toast.success("Device removed");
        await loadDevices();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to remove device");
      }
    });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get device icon
  const getDeviceIcon = (type: string | null) => {
    switch (type) {
      case "mobile":
        return "📱";
      case "desktop":
        return "🖥️";
      default:
        return "🌐";
    }
  };

  // Password strength indicator
  const passwordStrength = checkPasswordStrength(backupPassword);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            End-to-End Encryption
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your encryption keys and devices
          </p>
        </div>

        {/* Status badge */}
        <div
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium",
            e2ee.isInitialized
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : e2ee.status === "needs-setup"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
          )}
        >
          {e2ee.isInitialized ? "🔒 Enabled" : e2ee.status === "needs-setup" ? "⚠️ Not Set Up" : "⏳ Loading..."}
        </div>
      </div>

      {/* Overview View */}
      {viewState === "overview" && (
        <div className="space-y-4">
          {/* Setup prompt */}
          {e2ee.status === "needs-setup" && (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                Set Up End-to-End Encryption
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                Generate encryption keys to enable secure messaging. Your private keys will be stored
                locally on this device and never leave your browser.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateKeys}
                  disabled={isPending || e2ee.isLoading}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium text-white",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isPending || e2ee.isLoading ? "Generating..." : "Generate Keys"}
                </button>

                {e2ee.hasBackup && (
                  <button
                    onClick={() => setViewState("backup-restore")}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    Restore from Backup
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Key Info */}
          {e2ee.isInitialized && (
            <>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  Device Identity
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Device ID:</span>
                    <code className="font-mono text-gray-700 dark:text-gray-300">
                      {e2ee.deviceId?.substring(0, 8)}...
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Identity Key:</span>
                    <code className="font-mono text-gray-700 dark:text-gray-300">
                      {e2ee.identityKey?.substring(0, 12)}...
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Signing Key:</span>
                    <code className="font-mono text-gray-700 dark:text-gray-300">
                      {e2ee.signingKey?.substring(0, 12)}...
                    </code>
                  </div>
                </div>
              </div>

              {/* Storage Stats */}
              {storageStats && (
                <div className="p-4 rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    Encryption Storage
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-cyan-400">
                        {storageStats.sessionCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Olm Sessions
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                        {storageStats.megolmSessionCount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Group Sessions
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {e2ee.availablePrekeys}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Available Prekeys
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setViewState("devices")}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-[#262626] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                >
                  Manage Devices ({devices.length})
                </button>

                <button
                  onClick={() => setViewState("backup-create")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    e2ee.hasBackup
                      ? "border border-gray-200 dark:border-[#262626] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {e2ee.hasBackup ? "Update Backup" : "Create Backup"}
                </button>

                {e2ee.availablePrekeys < 10 && (
                  <button
                    onClick={() => e2ee.replenishPrekeys(50)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    Replenish Prekeys
                  </button>
                )}
              </div>

              {/* Backup Status */}
              <div
                className={cn(
                  "p-3 rounded-lg text-sm",
                  e2ee.hasBackup
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                )}
              >
                {e2ee.hasBackup ? (
                  <>✓ Your keys are backed up. You can restore them on a new device.</>
                ) : (
                  <>⚠️ No backup found. Create a backup to avoid losing access to your encrypted messages.</>
                )}
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-gray-200 dark:border-[#262626]">
                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                  Danger Zone
                </h3>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete All Encryption Data
                  </button>
                ) : (
                  <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                      This will permanently delete all your encryption keys and sessions.
                      You will lose access to all encrypted messages unless you have a backup.
                    </p>
                    <input
                      type="text"
                      placeholder="Type DELETE to confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full mb-3 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDestroyKeys}
                        disabled={isPending || deleteConfirmText !== "DELETE"}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Delete Everything
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText("");
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-[#262626] text-gray-700 dark:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Create Backup View */}
      {viewState === "backup-create" && (
        <div className="space-y-4">
          <button
            onClick={() => setViewState("overview")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Back to Overview
          </button>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Create Key Backup
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Your keys will be encrypted with your password and stored securely.
              You&apos;ll need this password to restore your keys on another device.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Backup Password
                </label>
                <input
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                />
                {backupPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          getPasswordStrengthColor(passwordStrength.score)
                        )}
                        style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getPasswordStrengthLabel(passwordStrength.score)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                />
                {confirmPassword && backupPassword !== confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
                )}
              </div>

              <button
                onClick={handleCreateBackup}
                disabled={
                  isPending ||
                  !backupPassword ||
                  backupPassword !== confirmPassword ||
                  passwordStrength.score < 2
                }
                className={cn(
                  "w-full px-4 py-2 rounded-lg text-sm font-medium text-white",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "hover:shadow-lg transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isPending ? "Creating Backup..." : "Create Backup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup View */}
      {viewState === "backup-restore" && (
        <div className="space-y-4">
          <button
            onClick={() => setViewState("overview")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Back to Overview
          </button>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Restore from Backup
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Enter your backup password to restore your encryption keys.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Backup Password
                </label>
                <input
                  type="password"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  placeholder="Enter your backup password"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleRestoreBackup}
                disabled={isPending || !restorePassword}
                className={cn(
                  "w-full px-4 py-2 rounded-lg text-sm font-medium text-white",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "hover:shadow-lg transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isPending ? "Restoring..." : "Restore Keys"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Devices View */}
      {viewState === "devices" && (
        <div className="space-y-4">
          <button
            onClick={() => setViewState("overview")}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ← Back to Overview
          </button>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Registered Devices
            </h3>

            {isLoadingDevices ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading devices...
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No devices registered
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      device.is_current
                        ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getDeviceIcon(device.device_type)}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {device.device_name || "Unknown Device"}
                            {device.is_current && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                This Device
                              </span>
                            )}
                            {verifiedDeviceIds.has(device.device_id) && (
                              <span className="text-emerald-500" title="Verified">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {device.device_id.substring(0, 8)}...
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Last seen: {formatDate(device.last_seen_at)}
                          </div>
                        </div>
                      </div>

                      {!device.is_current && (
                        <button
                          onClick={() => handleRemoveDevice(device.device_id)}
                          disabled={isPending}
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
