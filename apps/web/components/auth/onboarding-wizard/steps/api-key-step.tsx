"use client";

/**
 * API Key Step
 *
 * Onboarding step for connecting user's own Anthropic API key.
 * Provides two methods:
 * 1. "Connect with Anthropic" - Opens popup with guided flow
 * 2. Manual API key entry
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { StepWrapper } from "../shared/step-wrapper";
import { WizardNavigation } from "../wizard-navigation";
import { ANTHROPIC_URLS } from "@/lib/api-keys";

type ConnectionMethod = "popup" | "manual" | null;

export function ApiKeyStep() {
  const { setError, isLastStep } = useWizard();

  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [popupStep, setPopupStep] = useState(0);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    models?: string[];
    error?: string;
  } | null>(null);

  // Check if user already has an API key connected
  useEffect(() => {
    const checkExistingKey = async () => {
      try {
        const response = await fetch("/api/user/api-keys");
        if (response.ok) {
          const data = await response.json();
          if (data.apiKeys?.[0]?.isValid) {
            setHasExistingKey(true);
            setValidationResult({
              valid: true,
              models: data.apiKeys[0].availableModels?.map((m: { name: string }) => m.name) || [],
            });
          }
        }
      } catch (err) {
        console.error("[Onboarding] Failed to check API key:", err);
      }
    };
    checkExistingKey();
  }, []);

  // Handle popup window and clipboard monitoring
  const handleConnectWithAnthropic = useCallback(() => {
    setConnectionMethod("popup");
    setPopupStep(1);

    // Open Anthropic Console in a popup
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      ANTHROPIC_URLS.apiKeys,
      "anthropic-connect",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    setPopupWindow(popup);

    // Check if popup was blocked
    if (!popup) {
      setError("Popup was blocked. Please allow popups for this site and try again.");
      setConnectionMethod(null);
      return;
    }

    // Monitor popup closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setPopupStep(2); // Move to paste step
      }
    }, 500);

    return () => clearInterval(checkClosed);
  }, [setError]);

  const handleValidateAndSave = async (keyToValidate?: string) => {
    const key = keyToValidate || apiKey;

    if (!key.trim()) {
      setError("Please enter an API key");
      return;
    }

    if (!key.startsWith("sk-ant-")) {
      setError("Invalid API key format. Anthropic API keys start with 'sk-ant-'");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key, provider: "anthropic" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save API key");
      }

      setValidationResult({
        valid: data.isValid,
        models: data.availableModels?.map((m: { name: string }) => m.name) || [],
        error: data.validationError,
      });

      if (data.isValid) {
        setHasExistingKey(true);
        setApiKey("");
        setConnectionMethod(null);
        setPopupStep(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate API key");
    } finally {
      setIsValidating(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith("sk-ant-")) {
        setApiKey(text);
        await handleValidateAndSave(text);
      } else {
        setError("Clipboard doesn't contain a valid Anthropic API key (should start with sk-ant-)");
      }
    } catch {
      setError("Unable to read clipboard. Please paste your API key manually.");
      setConnectionMethod("manual");
    }
  };

  const handleContinue = async (): Promise<boolean> => {
    return true;
  };

  // Close popup if component unmounts
  useEffect(() => {
    return () => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
    };
  }, [popupWindow]);

  return (
    <StepWrapper
      title="Connect Your API Key"
      description="Use your own Anthropic API key for AI features"
    >
      <div className="space-y-4">
        {/* Explanation Card */}
        <div
          className={cn(
            "p-4 rounded-xl",
            "bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10",
            "border border-violet-500/20"
          )}
        >
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Why connect your API key?
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Use your own Claude subscription for AI assistant &amp; playground</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Access all models available on your account (Opus, Sonnet, Haiku)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Track your usage per feature with detailed statistics</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>Your key is encrypted and never shared</span>
            </li>
          </ul>
        </div>

        {/* Existing Key Status */}
        {hasExistingKey && validationResult?.valid && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-800/50">
                <CheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  API Key Connected
                </p>
                {validationResult.models && validationResult.models.length > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                    Available: {validationResult.models.slice(0, 3).join(", ")}
                    {validationResult.models.length > 3 && ` +${validationResult.models.length - 3} more`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Connection Methods */}
        {!hasExistingKey && connectionMethod === null && (
          <div className="space-y-3">
            {/* Connect with Anthropic Button */}
            <button
              type="button"
              onClick={handleConnectWithAnthropic}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl",
                "bg-gradient-to-r from-[#cc785c] to-[#d4a574]",
                "text-white font-semibold text-base",
                "shadow-lg shadow-[#cc785c]/25",
                "hover:opacity-90 hover:-translate-y-0.5",
                "transition-all duration-200"
              )}
            >
              <AnthropicLogo className="w-5 h-5" />
              Connect with Anthropic
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-500 dark:text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Manual Entry Option */}
            <button
              type="button"
              onClick={() => setConnectionMethod("manual")}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                "bg-gray-100 dark:bg-[#1a1a1a]",
                "border border-gray-200 dark:border-[#333]",
                "text-sm font-medium text-gray-700 dark:text-gray-300",
                "hover:bg-gray-200 dark:hover:bg-[#222]",
                "transition-colors"
              )}
            >
              <KeyIcon className="w-4 h-4" />
              Enter API Key Manually
            </button>
          </div>
        )}

        {/* Popup Flow Steps */}
        {connectionMethod === "popup" && popupStep > 0 && (
          <div className="space-y-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      popupStep >= step
                        ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    )}
                  >
                    {popupStep > step ? (
                      <CheckIcon className="w-4 h-4" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div
                      className={cn(
                        "w-8 h-0.5",
                        popupStep > step ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#262626]">
              {popupStep === 1 && (
                <div className="text-center">
                  <div className="animate-pulse mb-3">
                    <ExternalLinkIcon className="w-8 h-8 mx-auto text-blue-500" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Opening Anthropic Console...
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Sign in and create a new API key, then copy it.
                  </p>
                  <button
                    onClick={() => setPopupStep(2)}
                    className="text-xs text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    I&apos;ve copied my API key →
                  </button>
                </div>
              )}

              {popupStep === 2 && (
                <div className="text-center">
                  <div className="mb-3">
                    <ClipboardIcon className="w-8 h-8 mx-auto text-violet-500" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Paste Your API Key
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Click below to paste your API key from clipboard
                  </p>

                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    disabled={isValidating}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl mb-3",
                      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                      "text-white font-medium",
                      "shadow-lg shadow-blue-500/25",
                      "hover:opacity-90 transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isValidating ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner />
                        Validating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <ClipboardIcon className="w-4 h-4" />
                        Paste from Clipboard
                      </span>
                    )}
                  </button>

                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Or paste here manually: sk-ant-..."
                      className={cn(
                        "w-full px-4 py-2.5 pr-16 rounded-lg",
                        "bg-white dark:bg-[#0a0a0a]",
                        "border border-gray-200 dark:border-[#333]",
                        "text-gray-900 dark:text-white",
                        "placeholder-gray-400 dark:placeholder-gray-500",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        "font-mono text-sm"
                      )}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                      {apiKey && (
                        <button
                          type="button"
                          onClick={() => handleValidateAndSave()}
                          className="p-1 text-blue-500 hover:text-blue-600"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setConnectionMethod(null);
                      setPopupStep(0);
                    }}
                    className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ← Back to options
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual API Key Input */}
        {connectionMethod === "manual" && !hasExistingKey && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <a
                href={ANTHROPIC_URLS.apiKeys}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                  "bg-gray-100 dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#333]",
                  "text-sm font-medium text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-200 dark:hover:bg-[#222]",
                  "transition-colors"
                )}
              >
                <ExternalLinkIcon className="w-4 h-4" />
                Get API Key
              </a>
              <a
                href={ANTHROPIC_URLS.console}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                  "bg-gray-100 dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#333]",
                  "text-sm font-medium text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-200 dark:hover:bg-[#222]",
                  "transition-colors"
                )}
              >
                <ExternalLinkIcon className="w-4 h-4" />
                Anthropic Console
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className={cn(
                  "w-full px-4 py-3 pr-20 rounded-xl",
                  "bg-gray-50 dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-400 dark:placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "font-mono text-sm"
                )}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2",
                  "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                  "transition-colors"
                )}
              >
                {showKey ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleValidateAndSave()}
              disabled={!apiKey.trim() || isValidating}
              className={cn(
                "w-full px-4 py-3 rounded-xl",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white font-medium",
                "shadow-lg shadow-blue-500/25",
                "hover:opacity-90 transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Validating...
                </span>
              ) : (
                "Connect API Key"
              )}
            </button>

            <button
              onClick={() => setConnectionMethod(null)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ← Back to options
            </button>

            {/* Validation Error */}
            {validationResult?.error && (
              <p className="text-sm text-red-500 dark:text-red-400">
                {validationResult.error}
              </p>
            )}
          </div>
        )}

        {/* Skip Notice */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {hasExistingKey
            ? "You can manage your API key anytime in Settings → AI Integration"
            : "This is optional. You can always add your API key later in Settings."}
        </p>
      </div>

      <WizardNavigation
        onNext={handleContinue}
        nextLabel={isLastStep ? "Complete Setup" : hasExistingKey ? "Continue" : "Skip for Now"}
      />
    </StepWrapper>
  );
}

// Icons
function AnthropicLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.304 3.541h-3.672l6.696 16.918h3.672L17.304 3.541zM6.696 3.541 0 20.459h3.672l1.344-3.541h6.804l1.344 3.541h3.672L10.14 3.541H6.696zm.876 10.836 2.16-5.676 2.16 5.676H7.572z"/>
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
