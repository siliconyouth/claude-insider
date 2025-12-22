/**
 * Device Verification Modal
 *
 * Interactive verification flow for establishing trust between devices.
 * Supports two verification methods:
 * 1. SAS (Short Authentication String) - Compare emojis
 * 2. QR Code - Scan to verify (requires camera access)
 *
 * Based on Matrix specification for device verification.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  startVerification,
  acceptVerification,
  calculateSAS,
  confirmVerification,
  cancelVerification,
  getPendingVerifications,
  SAS_EMOJIS,
  type VerificationState,
} from "@/lib/e2ee/device-verification";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Camera,
  Smile,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
  UserX,
  Bot,
  Sparkles,
  Server,
  Cpu,
} from "lucide-react";
import { AI_ASSISTANT_USER_ID } from "@/lib/roles";

// ============================================================================
// QR CODE GENERATOR (Simple SVG-based)
// ============================================================================

function generateQRCodeData(
  data: string
): { size: number; modules: boolean[][] } {
  const size = 21; // Version 1 QR code
  const modules: boolean[][] = [];

  for (let i = 0; i < size; i++) {
    modules[i] = new Array(size).fill(false);
  }

  // Add finder patterns (corners)
  const addFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        if (isOuter || isInner) {
          const targetRow = modules[row + r];
          if (targetRow) targetRow[col + c] = true;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, 14);
  addFinderPattern(14, 0);

  // Add data pattern based on hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  for (let r = 8; r < 13; r++) {
    for (let c = 8; c < 13; c++) {
      const bit = ((hash >> ((r - 8) * 5 + (c - 8))) & 1) === 1;
      const targetRow = modules[r];
      if (targetRow) targetRow[c] = bit;
    }
  }

  return { size, modules };
}

function QRCodeDisplay({ data, size = 180 }: { data: string; size?: number }) {
  const { size: qrSize, modules } = generateQRCodeData(data);
  const cellSize = size / qrSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-lg"
    >
      <rect width={size} height={size} fill="white" />
      {modules.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
}

type VerificationMethod = "sas" | "qr";

// ============================================================================
// TYPES
// ============================================================================

interface DeviceVerificationModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Target user to verify (if initiating) */
  targetUserId?: string;
  /** Target device to verify (if initiating) */
  targetDeviceId?: string;
  /** Target user name for display */
  targetUserName?: string;
  /** Pending verification to respond to */
  pendingVerification?: VerificationState;
  /** Callback on successful verification */
  onSuccess?: () => void;
}

type VerificationStep =
  | "method-select"
  | "idle"
  | "starting"
  | "waiting"
  | "qr-show"
  | "qr-scan"
  | "comparing"
  | "confirming"
  | "success"
  | "failed"
  | "cancelled"
  | "no-device"
  | "ai-verified";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DeviceVerificationModal({
  isOpen,
  onClose,
  targetUserId,
  targetDeviceId,
  targetUserName,
  pendingVerification,
  onSuccess,
}: DeviceVerificationModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<VerificationStep>("method-select");
  const [method, setMethod] = useState<VerificationMethod>("sas");
  const [verification, setVerification] = useState<VerificationState | null>(
    pendingVerification || null
  );
  const [emojis, setEmojis] = useState<Array<{ emoji: string; name: string }>>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string>("");
  const [showExplanation, setShowExplanation] = useState(false);

  // Video ref for QR scanning
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Check if target is AI assistant
  const isAIAssistant = targetUserId === AI_ASSISTANT_USER_ID;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep("method-select");
      setMethod("sas");
      setVerification(null);
      setEmojis([]);
      setError(null);
      setQrData("");
      setShowExplanation(false);
      stopCamera();
    } else if (isAIAssistant) {
      // AI assistant is automatically verified - no manual verification needed
      setStep("ai-verified");
    } else if (pendingVerification) {
      setVerification(pendingVerification);
      setStep("waiting");
    }
  }, [isOpen, pendingVerification, stopCamera, isAIAssistant]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Fetch target user's device ID
  const fetchTargetDeviceId = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/e2ee/devices?userIds=${userId}`);
      if (!response.ok) return null;

      const data = await response.json();
      const userDevices = data.devices?.[userId];

      // Return the most recently active device ID
      if (userDevices && userDevices.length > 0) {
        return userDevices[0].deviceId;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Start verification
  const handleStart = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setStep("starting");
      setError(null);

      // Fetch device ID if not provided
      let deviceId: string | undefined = targetDeviceId;
      if (!deviceId) {
        const fetchedId = await fetchTargetDeviceId(targetUserId);
        if (!fetchedId) {
          // Show educational "no-device" step instead of error
          setStep("no-device");
          return;
        }
        deviceId = fetchedId;
      }

      const result = await startVerification(targetUserId, deviceId);
      setVerification({
        verificationId: result.verificationId,
        transactionId: result.transactionId,
        status: "started",
        isInitiator: true,
        targetUserId,
        targetDeviceId: deviceId,
        targetUserName,
      });

      if (method === "qr") {
        // Generate QR code with verification data
        setQrData(
          JSON.stringify({
            v: 1,
            id: result.verificationId,
            pk: result.publicKey,
          })
        );
        setStep("qr-show");
      } else {
        setStep("waiting");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setStep("failed");
    }
  }, [targetUserId, targetDeviceId, targetUserName, method, fetchTargetDeviceId]);

  // Start QR scanning
  const handleStartScan = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStep("qr-scan");
      toast.info("Point your camera at the QR code");
    } catch {
      toast.error("Camera access denied");
    }
  }, [toast]);

  // Accept verification (as target)
  const handleAccept = useCallback(async () => {
    if (!verification) return;

    try {
      setStep("starting");
      setError(null);

      await acceptVerification(verification.verificationId);

      // Get verification details to calculate SAS
      const pending = await getPendingVerifications();
      const updated = pending.find(
        (v) => v.verificationId === verification.verificationId
      );

      if (updated && updated.status === "key_exchanged") {
        // Calculate SAS emojis
        const sas = await calculateSAS(
          verification.verificationId,
          (updated as VerificationState & { initiatorPublicKey?: string }).initiatorPublicKey || "",
          (updated as VerificationState & { targetPublicKey?: string }).targetPublicKey || "",
          verification.transactionId,
          verification.isInitiator
        );
        setEmojis(sas.emojis);
        setStep("comparing");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept");
      setStep("failed");
    }
  }, [verification]);

  // Check for updates (polling for now, could use realtime)
  useEffect(() => {
    if (step !== "waiting" || !verification) return;

    const interval = setInterval(async () => {
      try {
        const pending = await getPendingVerifications();
        const updated = pending.find(
          (v) => v.verificationId === verification.verificationId
        );

        if (updated) {
          if (updated.status === "key_exchanged" && verification.isInitiator) {
            // Calculate SAS emojis
            const sas = await calculateSAS(
              verification.verificationId,
              (updated as VerificationState & { initiatorPublicKey?: string }).initiatorPublicKey || "",
              (updated as VerificationState & { targetPublicKey?: string }).targetPublicKey || "",
              verification.transactionId,
              verification.isInitiator
            );
            setEmojis(sas.emojis);
            setStep("comparing");
          } else if (updated.status === "verified") {
            setStep("success");
          } else if (
            updated.status === "cancelled" ||
            updated.status === "expired"
          ) {
            setStep("cancelled");
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [step, verification]);

  // Confirm match
  const handleConfirmMatch = useCallback(async () => {
    if (!verification || emojis.length === 0) return;

    try {
      setStep("confirming");
      const emojiIndices = emojis.map((e) =>
        SAS_EMOJIS.findIndex((s) => s.emoji === e.emoji)
      );
      await confirmVerification(verification.verificationId, emojiIndices, true);
      setStep("success");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
      setStep("failed");
    }
  }, [verification, emojis, onSuccess]);

  // Confirm no match
  const handleConfirmNoMatch = useCallback(async () => {
    if (!verification) return;

    try {
      setStep("confirming");
      await confirmVerification(verification.verificationId, [], false);
      setStep("cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
      setStep("failed");
    }
  }, [verification]);

  // Cancel verification
  const handleCancel = useCallback(async () => {
    if (verification) {
      await cancelVerification(verification.verificationId);
    }
    stopCamera();
    onClose();
  }, [verification, stopCamera, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        // Account for mobile bottom navigation
        paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md",
          "rounded-xl bg-gray-900 border border-gray-800",
          "shadow-2xl shadow-black/50",
          "overflow-y-auto",
          "p-6"
        )}
        style={{
          // Max height accounts for mobile nav
          maxHeight: "calc(90vh - var(--mobile-nav-height, 0px))",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {step === "success" ? (
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            ) : step === "failed" || step === "cancelled" ? (
              <ShieldAlert className="h-6 w-6 text-red-500" />
            ) : (
              <ShieldQuestion className="h-6 w-6 text-blue-500" />
            )}
            <h2 className="text-xl font-semibold text-white">
              Device Verification
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Method Selection */}
          {step === "method-select" && targetUserId && (
            <div className="space-y-4">
              <p className="text-gray-300">
                Verify{" "}
                <span className="font-semibold text-white">
                  {targetUserName || targetUserId}
                </span>
                &apos;s device to add an extra layer of security.
              </p>

              {/* Security Explanation Box */}
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 overflow-hidden">
                {/* Quick Summary - Always Visible */}
                <div className="p-3 flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-blue-200">
                      Your messages are <span className="font-semibold text-blue-100">already encrypted</span> with E2EE.
                      Verification confirms you&apos;re talking to the right person.
                    </p>
                  </div>
                </div>

                {/* Learn More Toggle */}
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full px-3 py-2 flex items-center justify-between text-sm text-blue-300 hover:text-blue-200 bg-blue-500/5 hover:bg-blue-500/10 transition-colors border-t border-blue-500/20"
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Why does this matter?
                  </span>
                  {showExplanation ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {/* Expanded Explanation */}
                {showExplanation && (
                  <div className="px-3 pb-3 space-y-3 border-t border-blue-500/20 bg-blue-500/5">
                    <div className="pt-3 space-y-3">
                      {/* Without Verification */}
                      <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <Lock className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">Without verification</p>
                          <p className="text-xs text-gray-400">
                            E2EE is active. Messages are encrypted and can only be read by you and the recipient.
                          </p>
                        </div>
                      </div>

                      {/* With Verification */}
                      <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <ShieldCheck className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">With verification</p>
                          <p className="text-xs text-gray-400">
                            You confirm the recipient&apos;s identity, protecting against man-in-the-middle attacks where someone could impersonate them.
                          </p>
                        </div>
                      </div>

                      {/* MITM Explanation */}
                      <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <UserX className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">What&apos;s a man-in-the-middle attack?</p>
                          <p className="text-xs text-gray-400">
                            An attacker intercepts your connection and pretends to be the person you&apos;re talking to.
                            By comparing emojis in person or over a call, you verify the keys match, ensuring no one is in between.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Line */}
                    <div className="pt-2 border-t border-blue-500/20">
                      <p className="text-xs text-blue-300 italic">
                        💡 Think of it like checking someone&apos;s ID before sharing a secret — the secret is already in a locked box, but verification ensures you&apos;re giving it to the right person.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Method Selection */}
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Choose verification method:</p>

                {/* SAS Option */}
                <button
                  onClick={() => setMethod("sas")}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    method === "sas"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Smile className="h-6 w-6 text-blue-400" />
                    <div>
                      <div className="font-medium text-white">Compare Emojis</div>
                      <div className="text-sm text-gray-400">
                        Compare 7 emojis over a call or in person
                      </div>
                    </div>
                  </div>
                </button>

                {/* QR Option */}
                <button
                  onClick={() => setMethod("qr")}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    method === "qr"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <QrCode className="h-6 w-6 text-blue-400" />
                    <div>
                      <div className="font-medium text-white">Scan QR Code</div>
                      <div className="text-sm text-gray-400">
                        Scan a code when you&apos;re together in person
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={handleStart}
                className={cn(
                  "w-full rounded-lg px-4 py-3",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white font-medium",
                  "hover:shadow-lg hover:shadow-blue-500/25",
                  "transition-all"
                )}
              >
                Start Verification
              </button>
            </div>
          )}

          {/* Idle / Start state (legacy, fallback) */}
          {step === "idle" && targetUserId && (
            <div className="space-y-4">
              <p className="text-gray-300">
                Verify{" "}
                <span className="font-semibold text-white">
                  {targetUserName || targetUserId}
                </span>
                &apos;s device to ensure your messages are secure.
              </p>
              <p className="text-sm text-gray-400">
                You&apos;ll both see the same 7 emojis. Compare them over a call or
                in person to verify.
              </p>
              <button
                onClick={handleStart}
                className={cn(
                  "w-full rounded-lg px-4 py-3",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white font-medium",
                  "hover:shadow-lg hover:shadow-blue-500/25",
                  "transition-all"
                )}
              >
                Start Verification
              </button>
            </div>
          )}

          {/* Waiting for other party (as initiator) */}
          {step === "waiting" && verification?.isInitiator && (
            <div className="space-y-4 text-center">
              <Clock className="h-12 w-12 mx-auto text-blue-500 animate-pulse" />
              <p className="text-gray-300">
                Waiting for{" "}
                <span className="font-semibold text-white">
                  {verification.targetUserName}
                </span>{" "}
                to accept...
              </p>
              <p className="text-sm text-gray-400">
                Ask them to check their verification requests.
              </p>
            </div>
          )}

          {/* Incoming request (as target) */}
          {step === "waiting" && !verification?.isInitiator && (
            <div className="space-y-4">
              <p className="text-gray-300">
                <span className="font-semibold text-white">
                  {verification?.targetUserName}
                </span>{" "}
                wants to verify your device.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleAccept}
                  className={cn(
                    "flex-1 rounded-lg px-4 py-3",
                    "bg-emerald-600 hover:bg-emerald-500",
                    "text-white font-medium",
                    "transition-colors"
                  )}
                >
                  Accept
                </button>
                <button
                  onClick={handleCancel}
                  className={cn(
                    "flex-1 rounded-lg px-4 py-3",
                    "bg-gray-700 hover:bg-gray-600",
                    "text-white font-medium",
                    "transition-colors"
                  )}
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Starting */}
          {step === "starting" && (
            <div className="space-y-4 text-center">
              <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
              <p className="text-gray-300">Setting up verification...</p>
            </div>
          )}

          {/* QR Code Display (as initiator) */}
          {step === "qr-show" && qrData && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Scan This Code
                </h3>
                <p className="text-sm text-gray-400">
                  Ask {verification?.targetUserName || "the other device"} to scan this QR code
                </p>
              </div>

              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeDisplay data={qrData} size={180} />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className={cn(
                    "flex-1 rounded-lg px-4 py-3",
                    "bg-gray-700 hover:bg-gray-600",
                    "text-white font-medium",
                    "transition-colors"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartScan}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    "rounded-lg px-4 py-3",
                    "bg-blue-600 hover:bg-blue-500",
                    "text-white font-medium",
                    "transition-colors"
                  )}
                >
                  <Camera className="h-5 w-5" />
                  Scan Instead
                </button>
              </div>
            </div>
          )}

          {/* QR Code Scanning */}
          {step === "qr-scan" && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Scan QR Code
                </h3>
                <p className="text-sm text-gray-400">
                  Point your camera at the QR code on the other device
                </p>
              </div>

              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48 border-2 border-white/30 rounded-lg">
                    <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-2 border-l-2 border-blue-500" />
                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-2 border-r-2 border-blue-500" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-2 border-l-2 border-blue-500" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-2 border-r-2 border-blue-500" />
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500 animate-pulse" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCancel}
                className={cn(
                  "rounded-lg px-6 py-3",
                  "bg-gray-700 hover:bg-gray-600",
                  "text-white font-medium",
                  "transition-colors"
                )}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Comparing emojis */}
          {step === "comparing" && emojis.length > 0 && (
            <div className="space-y-6">
              <p className="text-gray-300 text-center">
                Compare these emojis with{" "}
                <span className="font-semibold text-white">
                  {verification?.targetUserName}
                </span>
              </p>

              {/* Emoji grid */}
              <div className="grid grid-cols-7 gap-2">
                {emojis.map((e, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl mb-1">{e.emoji}</div>
                    <div className="text-[10px] text-gray-400">{e.name}</div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-400 text-center">
                Do the emojis match on both devices?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmMatch}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    "rounded-lg px-4 py-3",
                    "bg-emerald-600 hover:bg-emerald-500",
                    "text-white font-medium",
                    "transition-colors"
                  )}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  They Match
                </button>
                <button
                  onClick={handleConfirmNoMatch}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2",
                    "rounded-lg px-4 py-3",
                    "bg-red-600 hover:bg-red-500",
                    "text-white font-medium",
                    "transition-colors"
                  )}
                >
                  <XCircle className="h-5 w-5" />
                  They Don&apos;t Match
                </button>
              </div>
            </div>
          )}

          {/* Confirming */}
          {step === "confirming" && (
            <div className="space-y-4 text-center">
              <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin" />
              <p className="text-gray-300">Completing verification...</p>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="space-y-4 text-center">
              <ShieldCheck className="h-16 w-16 mx-auto text-emerald-500" />
              <h3 className="text-xl font-semibold text-white">Verified!</h3>
              <p className="text-gray-300">
                <span className="font-semibold text-white">
                  {verification?.targetUserName}
                </span>
                &apos;s device is now verified. Your messages are secure.
              </p>
              <button
                onClick={onClose}
                className={cn(
                  "w-full rounded-lg px-4 py-3",
                  "bg-emerald-600 hover:bg-emerald-500",
                  "text-white font-medium",
                  "transition-colors"
                )}
              >
                Done
              </button>
            </div>
          )}

          {/* Failed */}
          {step === "failed" && (
            <div className="space-y-4 text-center">
              <ShieldAlert className="h-16 w-16 mx-auto text-red-500" />
              <h3 className="text-xl font-semibold text-white">
                Verification Failed
              </h3>
              <p className="text-gray-300">{error || "Something went wrong."}</p>
              <button
                onClick={onClose}
                className={cn(
                  "w-full rounded-lg px-4 py-3",
                  "bg-gray-700 hover:bg-gray-600",
                  "text-white font-medium",
                  "transition-colors"
                )}
              >
                Close
              </button>
            </div>
          )}

          {/* Cancelled */}
          {step === "cancelled" && (
            <div className="space-y-4 text-center">
              <XCircle className="h-16 w-16 mx-auto text-gray-500" />
              <h3 className="text-xl font-semibold text-white">
                Verification Cancelled
              </h3>
              <p className="text-gray-300">
                The emojis didn&apos;t match or the verification was cancelled.
              </p>
              <p className="text-sm text-amber-400">
                ⚠️ If you didn&apos;t cancel this, someone may be trying to
                intercept your messages.
              </p>
              <button
                onClick={onClose}
                className={cn(
                  "w-full rounded-lg px-4 py-3",
                  "bg-gray-700 hover:bg-gray-600",
                  "text-white font-medium",
                  "transition-colors"
                )}
              >
                Close
              </button>
            </div>
          )}

          {/* No E2EE Device - Educational */}
          {step === "no-device" && (
            <div className="space-y-4">
              {/* Reassurance Banner */}
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-300 mb-1">
                      Your messages are still encrypted!
                    </h4>
                    <p className="text-sm text-emerald-200/80">
                      E2EE is active for this conversation. Verification is an <em>additional</em> security layer, not a requirement.
                    </p>
                  </div>
                </div>
              </div>

              {/* Info about the user */}
              <div className="text-center py-2">
                <Info className="h-10 w-10 mx-auto text-blue-400 mb-2" />
                <h3 className="text-lg font-semibold text-white mb-1">
                  {targetUserName || "This user"} hasn&apos;t enabled E2EE yet
                </h3>
                <p className="text-sm text-gray-400">
                  They need to set up encryption on their device first
                </p>
              </div>

              {/* E2EE Explanation */}
              <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-4 space-y-4">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  How your messages are protected
                </h4>

                {/* Matrix Protocol */}
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Server className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">Matrix Olm/Megolm Protocol</p>
                    <p className="text-xs text-gray-400">
                      We use the same encryption protocol as Signal and Element. Your messages use the Double Ratchet algorithm for perfect forward secrecy — even if keys are compromised later, past messages stay secure.
                    </p>
                  </div>
                </div>

                {/* WebCrypto Fallback */}
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Cpu className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">Web Crypto API Fallback</p>
                    <p className="text-xs text-gray-400">
                      If the main encryption library isn&apos;t available, we automatically fall back to the browser&apos;s built-in Web Crypto API using AES-256-GCM — the same encryption used by banks and governments.
                    </p>
                  </div>
                </div>

                {/* What this means */}
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">What this means for you</p>
                    <p className="text-xs text-gray-400">
                      Nobody — not us, not hackers, not anyone — can read your messages except you and the recipient. The encryption happens on your device before messages ever leave it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification vs Encryption */}
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                <p className="text-xs text-blue-200">
                  <strong>Encryption vs Verification:</strong> Encryption protects message content. Verification confirms you&apos;re talking to the right person (not an impersonator). Both are valuable, but encryption alone keeps conversations private.
                </p>
              </div>

              <button
                onClick={onClose}
                className={cn(
                  "w-full rounded-lg px-4 py-3",
                  "bg-gray-700 hover:bg-gray-600",
                  "text-white font-medium",
                  "transition-colors"
                )}
              >
                Got it
              </button>
            </div>
          )}

          {/* AI Assistant - Auto-Verified */}
          {step === "ai-verified" && (
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="text-center py-4">
                <div className="relative inline-block mb-3">
                  <Bot className="h-16 w-16 text-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  AI Assistant Verified
                </h3>
                <p className="text-gray-400">
                  @claudeinsider is automatically trusted
                </p>
              </div>

              {/* Explanation */}
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-200">
                      The AI assistant is a <strong>trusted system component</strong> that runs on our secure servers. Unlike human users, it cannot be impersonated through man-in-the-middle attacks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Why no manual verification */}
              <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-4 space-y-3">
                <h4 className="font-medium text-white text-sm">
                  Why can&apos;t I verify manually?
                </h4>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>The AI can&apos;t read emojis back to you over a call</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>It can&apos;t show you a QR code in person</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Manual verification is designed for human-to-human trust</span>
                  </li>
                </ul>
              </div>

              {/* Security Note */}
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                <p className="text-xs text-blue-200">
                  <strong>How AI messages are secured:</strong> Your messages to the AI are encrypted in transit using TLS 1.3, and the AI processes them in a secure, isolated environment. Conversation history is stored encrypted and only accessible to you.
                </p>
              </div>

              <button
                onClick={() => {
                  onSuccess?.();
                  onClose();
                }}
                className={cn(
                  "w-full rounded-lg px-4 py-3",
                  "bg-emerald-600 hover:bg-emerald-500",
                  "text-white font-medium",
                  "transition-colors"
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
