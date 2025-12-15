"use client";

/**
 * API Key Step
 *
 * Onboarding step for connecting user's own Anthropic API key.
 * Provides explanation of benefits and quick setup.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { StepWrapper } from "../shared/step-wrapper";
import { WizardNavigation } from "../wizard-navigation";
import { ANTHROPIC_URLS } from "@/lib/api-keys";

export function ApiKeyStep() {
  const { setError, isLastStep } = useWizard();

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
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
          if (data.apiKey) {
            setHasExistingKey(true);
            setValidationResult({
              valid: data.isValid,
              models: data.availableModels?.map((m: { name: string }) => m.name) || [],
            });
          }
        }
      } catch (err) {
        console.error("[Onboarding] Failed to check API key:", err);
      }
    };
    checkExistingKey();
  }, []);

  const handleValidateAndSave = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    if (!apiKey.startsWith("sk-ant-")) {
      setError("Invalid API key format. Anthropic API keys start with 'sk-ant-'");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, provider: "anthropic" }),
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate API key");
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = async (): Promise<boolean> => {
    // No validation needed - API key is optional
    // WizardNavigation handles the step transition
    return true;
  };

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
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckIcon className="w-5 h-5" />
              <span className="text-sm font-medium">API key connected</span>
            </div>
            {validationResult.models && validationResult.models.length > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                Available: {validationResult.models.slice(0, 3).join(", ")}
                {validationResult.models.length > 3 && ` +${validationResult.models.length - 3} more`}
              </p>
            )}
          </div>
        )}

        {/* API Key Input */}
        {!hasExistingKey && (
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
              onClick={handleValidateAndSave}
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
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Validating...
                </span>
              ) : (
                "Connect API Key"
              )}
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
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
