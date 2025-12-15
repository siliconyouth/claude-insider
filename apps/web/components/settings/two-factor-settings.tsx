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
  get2FADevices,
  initAdd2FADevice,
  verifyAndAdd2FADevice,
  rename2FADevice,
  remove2FADevice,
  setPrimary2FADevice,
  type TwoFactorDevice,
} from "@/app/actions/two-factor";
import {
  getEmail2FAStatus,
  enableEmail2FA,
  sendEmail2FACode,
  verifyEmail2FACode,
} from "@/app/actions/email-2fa";
import { formatLastUsed } from "@/lib/webauthn";

type SetupStep = "initial" | "scan" | "verify" | "backup" | "complete";

// Device management steps - includes email 2FA enablement flow for last device removal
type DeviceStep = "list" | "add-scan" | "add-verify" | "add-backup" | "rename" | "remove" | "enable-email-2fa" | "verify-email-code";

export function TwoFactorSettings() {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // Status state
  const [isEnabled, setIsEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Setup state (for initial 2FA setup)
  const [setupStep, setSetupStep] = useState<SetupStep>("initial");
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState("");

  // Multi-device state
  const [devices, setDevices] = useState<TwoFactorDevice[]>([]);
  const [deviceStep, setDeviceStep] = useState<DeviceStep>("list");
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceSecret, setNewDeviceSecret] = useState("");
  const [newDeviceQr, setNewDeviceQr] = useState("");
  const [newDeviceCode, setNewDeviceCode] = useState("");
  const [editingDevice, setEditingDevice] = useState<TwoFactorDevice | null>(null);
  const [newName, setNewName] = useState("");
  const [removeCode, setRemoveCode] = useState("");

  // Email 2FA state (for mandatory MFA enforcement)
  const [email2FAEnabled, setEmail2FAEnabled] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);

  const loadStatus = async () => {
    setIsLoading(true);
    const result = await getTwoFactorStatus();
    if (!result.error) {
      setIsEnabled(result.enabled || false);
      setBackupCodesRemaining(result.backupCodesRemaining || 0);
      setVerifiedAt(result.verifiedAt || null);

      // If 2FA is enabled, also load devices
      if (result.enabled) {
        const devicesResult = await get2FADevices();
        if (!devicesResult.error && devicesResult.devices) {
          setDevices(devicesResult.devices);
        }
      }
    }

    // Also load email 2FA status (for mandatory MFA enforcement)
    const emailStatus = await getEmail2FAStatus();
    if (!emailStatus.error) {
      setEmail2FAEnabled(emailStatus.enabled || false);
    }

    setIsLoading(false);
  };

  const loadDevices = async () => {
    const result = await get2FADevices();
    if (!result.error && result.devices) {
      setDevices(result.devices);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStatus();
  }, []);



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

      // Clear devices but keep 2FA enabled if email 2FA is active
      setDevices([]);
      setShowDisableModal(false);
      setDisableCode("");

      if (email2FAEnabled) {
        toast.success("Authenticator apps disabled. Your account is still protected with Email 2FA.");
        // Keep isEnabled true since email 2FA is active
      } else {
        // Shouldn't happen with mandatory MFA, but handle it
        setIsEnabled(false);
        toast.success("Two-factor authentication disabled");
      }
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

  // Multi-device handlers
  const handleStartAddDevice = () => {
    setNewDeviceName(`Authenticator ${devices.length + 1}`);
    startTransition(async () => {
      const result = await initAdd2FADevice(`Authenticator ${devices.length + 1}`);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNewDeviceId(result.deviceId || "");
      setNewDeviceSecret(result.secret || "");
      setNewDeviceQr(result.qrCodeUrl || "");
      setDeviceStep("add-scan");
    });
  };

  const handleVerifyNewDevice = () => {
    if (newDeviceCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    startTransition(async () => {
      const result = await verifyAndAdd2FADevice(newDeviceId, newDeviceCode);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.backupCodes) {
        setBackupCodes(result.backupCodes);
        setDeviceStep("add-backup");
      } else {
        toast.success("Authenticator added successfully!");
        await loadDevices();
        resetNewDeviceState();
      }
    });
  };

  const handleRenameDevice = () => {
    if (!editingDevice || !newName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    startTransition(async () => {
      const result = await rename2FADevice(editingDevice.id, newName.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Device renamed");
      await loadDevices();
      setEditingDevice(null);
      setNewName("");
      setDeviceStep("list");
    });
  };

  const handleRemoveDevice = () => {
    if (!editingDevice || removeCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    startTransition(async () => {
      const result = await remove2FADevice(editingDevice.id, removeCode);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Check if this was the last device
      const wasLastDevice = devices.length === 1;

      if (wasLastDevice) {
        // Last device removed - but email 2FA should be enabled
        if (email2FAEnabled) {
          toast.success("Authenticator removed. Your account is still protected with Email 2FA.");
          setDevices([]);
          // Keep isEnabled true since email 2FA is active
        } else if (result.twoFactorDisabled) {
          // Fallback: 2FA was disabled (shouldn't happen with mandatory MFA, but handle it)
          toast.success("Last device removed. Two-factor authentication disabled.");
          setIsEnabled(false);
          setDevices([]);
        }
      } else {
        toast.success("Device removed");
        await loadDevices();
      }
      setEditingDevice(null);
      setRemoveCode("");
      setDeviceStep("list");
    });
  };

  const handleSetPrimary = (deviceId: string) => {
    startTransition(async () => {
      const result = await setPrimary2FADevice(deviceId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Primary device updated");
      await loadDevices();
    });
  };

  const resetNewDeviceState = () => {
    setDeviceStep("list");
    setNewDeviceId("");
    setNewDeviceName("");
    setNewDeviceSecret("");
    setNewDeviceQr("");
    setNewDeviceCode("");
  };

  // Email 2FA handlers for mandatory MFA enforcement
  const handleStartEnableEmail2FA = () => {
    setEmailVerificationCode("");
    setEmailCodeSent(false);
    setDeviceStep("enable-email-2fa");
  };

  const handleSendEmailCode = async () => {
    startTransition(async () => {
      const result = await sendEmail2FACode({ type: "verify_device" });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setEmailCodeSent(true);
      toast.success("Verification code sent to your email");
      setDeviceStep("verify-email-code");
    });
  };

  const handleVerifyAndEnableEmail2FA = async () => {
    if (emailVerificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    startTransition(async () => {
      // First verify the code
      const verifyResult = await verifyEmail2FACode(emailVerificationCode, "verify_device");
      if (!verifyResult.success) {
        toast.error(verifyResult.error || "Invalid code");
        return;
      }

      // Then enable email 2FA
      const enableResult = await enableEmail2FA();
      if (enableResult.error) {
        toast.error(enableResult.error);
        return;
      }

      setEmail2FAEnabled(true);
      toast.success("Email 2FA enabled! You can now remove the authenticator.");
      setEmailVerificationCode("");
      setEmailCodeSent(false);
      // Go back to remove step with email 2FA now enabled
      setDeviceStep("remove");
    });
  };

  const resetEmailSetupState = () => {
    setEmailVerificationCode("");
    setEmailCodeSent(false);
    setDeviceStep("list");
    setEditingDevice(null);
  };

  const handleNewDeviceComplete = () => {
    toast.success("Authenticator added successfully!");
    loadDevices();
    setBackupCodesRemaining((prev) => prev + 0); // Refresh from backup codes
    resetNewDeviceState();
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
    // If email 2FA is not enabled, show prompt to enable it first
    if (!email2FAEnabled) {
      return (
        <div
          className={cn(
            "p-6 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Enable Email 2FA First
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You must have at least one MFA method enabled. Before disabling your authenticator apps,
            please enable Email 2FA as a fallback.
          </p>

          <div
            className={cn(
              "p-4 rounded-lg mb-6",
              "bg-blue-50 dark:bg-blue-900/20",
              "border border-blue-200 dark:border-blue-800"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                  Email Two-Factor Authentication
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  Receive verification codes via email when signing in. This ensures you can still access your account securely.
                </p>
              </div>
            </div>
          </div>

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
              onClick={() => {
                // Go to settings page email 2FA section (handled by parent)
                setShowDisableModal(false);
                toast.info("Please enable Email 2FA in your security settings first.");
              }}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white"
              )}
            >
              Set Up Email 2FA
            </button>
          </div>
        </div>
      );
    }

    // Email 2FA is enabled, show normal disable flow
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Disable Authenticator App
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Remove all authenticator apps from your account.
        </p>
        <div
          className={cn(
            "p-3 rounded-lg mb-4",
            "bg-green-50 dark:bg-green-900/20",
            "border border-green-200 dark:border-green-800"
          )}
        >
          <p className="text-sm text-green-700 dark:text-green-300">
            ✓ Email 2FA is enabled. You can still sign in using email verification codes.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Enter a verification code to confirm:
            </label>
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
          </div>

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
              {isPending ? "..." : "Disable Authenticator"}
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

  // Add Device: Scan QR Code
  if (deviceStep === "add-scan") {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Add Authenticator App
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>

        <div className="flex flex-col items-center mb-6">
          {newDeviceQr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={newDeviceQr}
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
            {newDeviceSecret}
          </code>
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetNewDeviceState}
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
            onClick={() => setDeviceStep("add-verify")}
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

  // Add Device: Verify Code
  if (deviceStep === "add-verify") {
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
            value={newDeviceCode}
            onChange={(e) => setNewDeviceCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
              onClick={() => setDeviceStep("add-scan")}
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
              onClick={handleVerifyNewDevice}
              disabled={isPending || newDeviceCode.length !== 6}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "Verifying..." : "Verify & Add"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add Device: Backup Codes (shown if first device)
  if (deviceStep === "add-backup") {
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
          onClick={handleNewDeviceComplete}
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

  // Rename Device Modal
  if (deviceStep === "rename" && editingDevice) {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Rename Authenticator
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Give this authenticator a recognizable name.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new name"
            autoFocus
            className={cn(
              "w-full px-4 py-3 rounded-lg text-sm",
              "bg-white dark:bg-[#0a0a0a]",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-900 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          />

          <div className="flex gap-3">
            <button
              onClick={() => {
                setDeviceStep("list");
                setEditingDevice(null);
                setNewName("");
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
              onClick={handleRenameDevice}
              disabled={isPending || !newName.trim()}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Remove Device Modal
  if (deviceStep === "remove" && editingDevice) {
    const isLastDevice = devices.length === 1;
    const needsEmailFallback = isLastDevice && !email2FAEnabled;

    // If this is the last device and email 2FA is not enabled, show email 2FA requirement
    if (needsEmailFallback) {
      return (
        <div
          className={cn(
            "p-6 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Enable Email 2FA First
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You must have at least one MFA method enabled. Before removing your last authenticator app,
            please enable Email 2FA as a fallback.
          </p>

          <div
            className={cn(
              "p-4 rounded-lg mb-6",
              "bg-blue-50 dark:bg-blue-900/20",
              "border border-blue-200 dark:border-blue-800"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                  Email Two-Factor Authentication
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  Receive verification codes via email when signing in. This provides a backup if you lose access to your authenticator app.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setDeviceStep("list");
                setEditingDevice(null);
                setRemoveCode("");
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
              onClick={handleStartEnableEmail2FA}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white"
              )}
            >
              Enable Email 2FA
            </button>
          </div>
        </div>
      );
    }

    // Normal remove flow (either not last device, or email 2FA is already enabled)
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Remove Authenticator
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Remove &quot;{editingDevice.name}&quot; from your account.
        </p>
        {isLastDevice && email2FAEnabled && (
          <div
            className={cn(
              "p-3 rounded-lg mb-4",
              "bg-green-50 dark:bg-green-900/20",
              "border border-green-200 dark:border-green-800"
            )}
          >
            <p className="text-sm text-green-700 dark:text-green-300">
              ✓ Email 2FA is enabled. You can safely remove this authenticator and still sign in using email verification codes.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Enter a verification code to confirm:
            </label>
            <input
              type="text"
              value={removeCode}
              onChange={(e) => setRemoveCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className={cn(
                "w-full px-4 py-3 rounded-lg text-center text-2xl font-mono tracking-widest",
                "bg-white dark:bg-[#0a0a0a]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setDeviceStep("list");
                setEditingDevice(null);
                setRemoveCode("");
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
              onClick={handleRemoveDevice}
              disabled={isPending || removeCode.length !== 6}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-red-600 text-white",
                "hover:bg-red-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "..." : "Remove"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Enable Email 2FA Step (for removing last authenticator)
  if (deviceStep === "enable-email-2fa" && editingDevice) {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Set Up Email 2FA
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          We&apos;ll send a verification code to your email address. This enables Email 2FA as your backup authentication method.
        </p>

        <div
          className={cn(
            "p-4 rounded-lg mb-6",
            "bg-gray-100 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                Email Verification Codes
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                Receive 6-digit codes via email when signing in
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetEmailSetupState}
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
            onClick={handleSendEmailCode}
            disabled={isPending}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isPending ? "Sending..." : "Send Verification Code"}
          </button>
        </div>
      </div>
    );
  }

  // Verify Email Code Step
  if (deviceStep === "verify-email-code" && editingDevice) {
    return (
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Enter Verification Code
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter the 6-digit code we sent to your email address.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={emailVerificationCode}
            onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
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

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Didn&apos;t receive the code?{" "}
            <button
              onClick={handleSendEmailCode}
              disabled={isPending}
              className="text-blue-600 dark:text-cyan-400 hover:underline disabled:opacity-50"
            >
              Resend
            </button>
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setDeviceStep("enable-email-2fa")}
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
              onClick={handleVerifyAndEnableEmail2FA}
              disabled={isPending || emailVerificationCode.length !== 6}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "Verifying..." : "Enable Email 2FA"}
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
            // eslint-disable-next-line @next/next/no-img-element
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
        {/* Status Header */}
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

        {/* Authenticator Devices List */}
        <div
          className={cn(
            "p-4 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Authenticator Apps
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {devices.length} device{devices.length !== 1 ? "s" : ""} registered
              </p>
            </div>
            <button
              onClick={handleStartAddDevice}
              disabled={isPending}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "hover:shadow-md hover:-translate-y-0.5",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
                "transition-all duration-200"
              )}
            >
              {isPending ? "..." : "+ Add"}
            </button>
          </div>

          {devices.length > 0 ? (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    "bg-white dark:bg-[#0a0a0a]",
                    "border",
                    device.isPrimary
                      ? "border-blue-500/50"
                      : "border-gray-200 dark:border-[#262626]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                        device.isPrimary
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "bg-gray-100 dark:bg-[#1a1a1a]"
                      )}
                    >
                      <svg
                        className={cn(
                          "w-4 h-4",
                          device.isPrimary
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500"
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {device.name}
                        </p>
                        {device.isPrimary && (
                          <span
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-semibold rounded-full",
                              "bg-blue-100 dark:bg-blue-900/40",
                              "text-blue-700 dark:text-blue-300"
                            )}
                          >
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {device.lastUsedAt
                          ? formatLastUsed(device.lastUsedAt)
                          : "Never used"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!device.isPrimary && devices.length > 1 && (
                      <button
                        onClick={() => handleSetPrimary(device.id)}
                        disabled={isPending}
                        className={cn(
                          "p-2 rounded-lg text-xs",
                          "text-gray-500 dark:text-gray-400",
                          "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                          "transition-colors",
                          "disabled:opacity-50"
                        )}
                        title="Set as primary"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingDevice(device);
                        setNewName(device.name);
                        setDeviceStep("rename");
                      }}
                      className={cn(
                        "p-2 rounded-lg text-xs",
                        "text-gray-500 dark:text-gray-400",
                        "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                        "transition-colors"
                      )}
                      title="Rename"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setEditingDevice(device);
                        setDeviceStep("remove");
                      }}
                      className={cn(
                        "p-2 rounded-lg text-xs",
                        "text-gray-500 dark:text-gray-400",
                        "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400",
                        "transition-colors"
                      )}
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No authenticator apps registered yet
            </p>
          )}
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
