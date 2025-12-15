"use client";

/**
 * Security Step
 *
 * Optional security setup during onboarding.
 * Allows users to set up passkeys and/or 2FA for enhanced account security.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";
import { StepWrapper, StepInfoBox } from "../shared/step-wrapper";
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable } from "@/lib/webauthn";
import { startRegistration } from "@simplewebauthn/browser";
import {
  initPasskeyRegistration,
  completePasskeyRegistration,
} from "@/app/actions/passkeys";
import { generateTwoFactorSecret, enableTwoFactor } from "@/app/actions/two-factor";

type SecurityOption = "none" | "passkey" | "2fa" | "both";
type SetupState = "choose" | "passkey-setup" | "2fa-setup" | "complete";

export function SecurityStep() {
  const { setError, nextStep } = useWizard();

  // State
  const [setupState, setSetupState] = useState<SetupState>("choose");
  const [selectedOption, setSelectedOption] = useState<SecurityOption>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const [passkeyAdded, setPasskeyAdded] = useState(false);
  const [twoFactorAdded, setTwoFactorAdded] = useState(false);

  // WebAuthn support
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);

  // 2FA state
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    const checkSupport = async () => {
      const supported = isWebAuthnSupported();
      setWebAuthnSupported(supported);
      if (supported) {
        const platform = await isPlatformAuthenticatorAvailable();
        setHasPlatformAuth(platform);
      }
    };
    checkSupport();
  }, []);

  const handleOptionSelect = (option: SecurityOption) => {
    setSelectedOption(option);
  };

  const handleContinue = async () => {
    if (selectedOption === "none") {
      nextStep();
      return;
    }

    if (selectedOption === "passkey" || selectedOption === "both") {
      setSetupState("passkey-setup");
      await setupPasskey();
    } else if (selectedOption === "2fa") {
      setSetupState("2fa-setup");
      await setup2FA();
    }
  };

  const setupPasskey = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get registration options
      const initResult = await initPasskeyRegistration();
      if (initResult.error || !initResult.options) {
        setError(initResult.error || "Failed to start passkey setup");
        setSetupState("choose");
        setIsProcessing(false);
        return;
      }

      // Trigger browser's WebAuthn prompt
      const credential = await startRegistration({
        optionsJSON: initResult.options,
      });

      // Complete registration
      const completeResult = await completePasskeyRegistration(credential, "Onboarding Passkey");
      if (completeResult.error) {
        setError(completeResult.error);
        setSetupState("choose");
        setIsProcessing(false);
        return;
      }

      setPasskeyAdded(true);

      // If also setting up 2FA, continue to that
      if (selectedOption === "both") {
        setSetupState("2fa-setup");
        await setup2FA();
      } else {
        setSetupState("complete");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "NotAllowedError") {
        // User cancelled - go back to choose
        setSetupState("choose");
      } else {
        setError(error instanceof Error ? error.message : "Passkey setup failed");
        setSetupState("choose");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const setup2FA = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await generateTwoFactorSecret();
      if (result.error) {
        setError(result.error);
        setSetupState("choose");
        setIsProcessing(false);
        return;
      }

      setQrCodeUrl(result.qrCodeUrl || null);
      setSecret(result.secret || null);
      setSetupState("2fa-setup");
    } catch (error) {
      setError(error instanceof Error ? error.message : "2FA setup failed");
      setSetupState("choose");
    } finally {
      setIsProcessing(false);
    }
  };

  const verify2FA = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await enableTwoFactor(verificationCode);
      if (result.error) {
        setError(result.error);
        setIsProcessing(false);
        return;
      }

      setTwoFactorAdded(true);
      setSetupState("complete");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    nextStep();
  };

  const handleComplete = () => {
    nextStep();
  };

  // Choose security options
  if (setupState === "choose") {
    return (
      <StepWrapper
        title="Secure Your Account"
        description="Add extra protection to keep your account safe (optional)"
      >
        <div className="space-y-4">
          {/* Passkey Option */}
          {webAuthnSupported && (
            <button
              onClick={() => handleOptionSelect("passkey")}
              className={cn(
                "w-full p-4 rounded-xl text-left transition-all duration-200",
                "border-2",
                selectedOption === "passkey" || selectedOption === "both"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-[#262626] hover:border-blue-300 dark:hover:border-blue-700"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  "bg-gradient-to-br from-violet-500 to-blue-500 text-white"
                )}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {hasPlatformAuth ? "Set up Face ID / Touch ID" : "Set up Passkey"}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Sign in instantly with biometrics - no password needed
                  </p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selectedOption === "passkey" || selectedOption === "both"
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300 dark:border-gray-600"
                )}>
                  {(selectedOption === "passkey" || selectedOption === "both") && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          )}

          {/* 2FA Option */}
          <button
            onClick={() => handleOptionSelect("2fa")}
            className={cn(
              "w-full p-4 rounded-xl text-left transition-all duration-200",
              "border-2",
              selectedOption === "2fa" || selectedOption === "both"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-[#262626] hover:border-blue-300 dark:hover:border-blue-700"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
              )}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">
                  Set up Authenticator App
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Use Google Authenticator, Authy, or similar apps
                </p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                selectedOption === "2fa" || selectedOption === "both"
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300 dark:border-gray-600"
              )}>
                {(selectedOption === "2fa" || selectedOption === "both") && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </button>

          {/* Both option hint */}
          {webAuthnSupported && selectedOption !== "none" && (
            <button
              onClick={() => handleOptionSelect(selectedOption === "both" ? "passkey" : "both")}
              className={cn(
                "w-full py-2 text-sm text-center rounded-lg",
                selectedOption === "both"
                  ? "text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              {selectedOption === "both" ? "Set up both (selected)" : "Or set up both for maximum security"}
            </button>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSkip}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                "transition-colors"
              )}
            >
              Skip for now
            </button>
            <button
              onClick={handleContinue}
              disabled={selectedOption === "none" || isProcessing}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "hover:opacity-90 transition-opacity",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isProcessing ? "Setting up..." : "Continue"}
            </button>
          </div>
        </div>
      </StepWrapper>
    );
  }

  // Passkey setup state
  if (setupState === "passkey-setup") {
    return (
      <StepWrapper title="Setting up Passkey">
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Follow the prompts from your device to create a passkey
          </p>
          <button
            onClick={() => setSetupState("choose")}
            className="mt-4 text-sm text-blue-600 dark:text-cyan-400 hover:underline"
          >
            Cancel
          </button>
        </div>
      </StepWrapper>
    );
  }

  // 2FA setup state
  if (setupState === "2fa-setup") {
    return (
      <StepWrapper title="Set up Authenticator App">
        <div className="space-y-4">
          {qrCodeUrl && (
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="2FA QR Code"
                className="w-40 h-40 rounded-lg bg-white p-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Scan with your authenticator app
              </p>
            </div>
          )}

          {secret && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Or enter this code manually:
              </p>
              <code className="text-sm font-mono bg-gray-100 dark:bg-[#1a1a1a] px-3 py-1 rounded select-all">
                {secret}
              </code>
            </div>
          )}

          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit code"
            className={cn(
              "w-full px-4 py-3 rounded-lg text-center text-xl font-mono tracking-widest",
              "bg-gray-50 dark:bg-[#0a0a0a]",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-900 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          />

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSetupState("choose");
                setQrCodeUrl(null);
                setSecret(null);
                setVerificationCode("");
              }}
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
              onClick={verify2FA}
              disabled={verificationCode.length !== 6 || isProcessing}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "hover:opacity-90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isProcessing ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>
      </StepWrapper>
    );
  }

  // Complete state
  if (setupState === "complete") {
    return (
      <StepWrapper title="Security Setup Complete">
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Your account is now more secure!
          </h3>

          <div className="space-y-2 mb-6">
            {passkeyAdded && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Passkey added
              </div>
            )}
            {twoFactorAdded && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Two-factor authentication enabled
              </div>
            )}
          </div>

          <StepInfoBox variant="info">
            <p>You can manage your security settings anytime from your account settings.</p>
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
