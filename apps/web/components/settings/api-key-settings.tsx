"use client";

/**
 * API Key Settings Component
 *
 * Allows users to connect their Anthropic/Claude AI accounts
 * by adding their API keys. Supports model selection and usage tracking.
 * Shows detailed validation results including subscription tier and rate limits.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { ANTHROPIC_URLS, type ClaudeModel, type AnthropicAccountInfo, getBestAvailableModel } from "@/lib/api-keys";
import { triggerCreditsRefresh } from "@/hooks/use-api-credits";

interface ApiKeyInfo {
  id: string;
  provider: string;
  keyHint: string;
  isValid: boolean | null;
  lastValidatedAt: string | null;
  validationError: string | null;
  availableModels: ClaudeModel[];
  preferredModel: string | null;
  usageThisMonth: {
    inputTokens: number;
    outputTokens: number;
    requests: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface AiPreferences {
  useOwnApiKey: boolean;
  preferredProvider: string;
  preferredModel: string | null;
  autoSelectBestModel: boolean;
}

interface ValidationError {
  error: string;
  errorCode?: string;
  errorDetails?: string;
  keyHint?: string;
}

interface ValidationSuccess {
  success: true;
  keyHint: string;
  isValid: boolean;
  availableModels: ClaudeModel[];
  preferredModel: string;
  accountInfo: AnthropicAccountInfo;
  validatedAt: string;
}

export function ApiKeySettings() {
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [_aiPreferences, setAiPreferences] = useState<AiPreferences | null>(null);
  const [allModels, setAllModels] = useState<ClaudeModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Modal-specific state for validation feedback
  const [modalError, setModalError] = useState<ValidationError | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationSuccess | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/user/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
        setAiPreferences(data.aiPreferences);
        setAllModels(data.allModels || []);
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setModalError({
        error: "Please enter an API key",
        errorDetails: "Paste your Anthropic API key in the field above. You can get one from the Anthropic Console.",
      });
      return;
    }

    setIsSaving(true);
    setModalError(null);
    setValidationResult(null);

    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeyInput.trim(),
          provider: "anthropic",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error in modal
        setModalError({
          error: data.error || "Failed to save API key",
          errorCode: data.errorCode,
          errorDetails: data.errorDetails,
          keyHint: data.keyHint,
        });
        return;
      }

      // Show success with account info in modal
      setValidationResult(data as ValidationSuccess);
      setApiKeyInput("");

      // Auto-close after showing results for 3 seconds, then refresh
      setTimeout(() => {
        setShowApiKeyInput(false);
        setValidationResult(null);
        fetchApiKeys();
        triggerCreditsRefresh(); // Update header indicator
        setSuccess("API key connected successfully!");
        setTimeout(() => setSuccess(null), 5000);
      }, 3000);
    } catch {
      setModalError({
        error: "Connection failed",
        errorCode: "NETWORK_ERROR",
        errorDetails: "Could not connect to the server. Please check your internet connection and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidateKey = async () => {
    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/user/api-keys/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "anthropic" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Validation failed");
        return;
      }

      setSuccess("API key validated successfully!");
      fetchApiKeys();
      triggerCreditsRefresh(); // Update header indicator
    } catch {
      setError("Failed to validate API key");
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteKey = async () => {
    try {
      const response = await fetch("/api/user/api-keys?provider=anthropic", {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("API key removed");
        setShowDeleteConfirm(false);
        fetchApiKeys();
        triggerCreditsRefresh(); // Update header indicator
      }
    } catch {
      setError("Failed to delete API key");
    }
  };

  const handleModelChange = async (modelId: string) => {
    setError(null);
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredModel: modelId,
          provider: "anthropic",
        }),
      });

      if (response.ok) {
        setSuccess("Model preference updated");
        fetchApiKeys();
        triggerCreditsRefresh(); // Update header indicator
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update model preference");
      }
    } catch (err) {
      console.error("Failed to update model preference:", err);
      setError("Failed to update model preference");
    }
  };

  const anthropicKey = apiKeys.find((k) => k.provider === "anthropic");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Claude AI Integration
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Connect your Anthropic account to use AI features with your own API key
          </p>
        </div>
        <a
          href={ANTHROPIC_URLS.console}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
            "text-gray-600 dark:text-gray-400",
            "hover:text-blue-600 dark:hover:text-cyan-400",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition-colors"
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Anthropic Console
        </a>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {/* API Key Card */}
      {anthropicKey ? (
        <div className={cn(
          "rounded-xl border p-6",
          anthropicKey.isValid
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
            : "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10"
        )}>
          {/* Key Status */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                anthropicKey.isValid
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-yellow-100 dark:bg-yellow-900/30"
              )}>
                <svg
                  className={cn(
                    "w-6 h-6",
                    anthropicKey.isValid
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Anthropic API Key
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    anthropicKey.isValid
                      ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                      : "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300"
                  )}>
                    {anthropicKey.isValid ? "Connected" : "Needs Validation"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {anthropicKey.keyHint}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleValidateKey}
                disabled={isValidating}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium",
                  "text-gray-600 dark:text-gray-400",
                  "border border-gray-200 dark:border-gray-700",
                  "hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-cyan-400",
                  "transition-colors",
                  "disabled:opacity-50"
                )}
              >
                {isValidating ? "Validating..." : "Revalidate"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={cn(
                  "p-1.5 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30",
                  "transition-colors"
                )}
                title="Remove API key"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Available Models */}
          {anthropicKey.availableModels.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preferred Model
                </label>
                {getBestAvailableModel(anthropicKey.availableModels) && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Recommended: <span className="font-medium text-violet-600 dark:text-violet-400">
                      {getBestAvailableModel(anthropicKey.availableModels)?.name}
                    </span>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {anthropicKey.availableModels.map((model) => {
                  const isSelected = anthropicKey.preferredModel === model.id;
                  const bestModel = getBestAvailableModel(anthropicKey.availableModels);
                  const isRecommended = bestModel?.id === model.id;

                  return (
                    <button
                      key={model.id}
                      onClick={() => handleModelChange(model.id)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg text-left",
                        "border transition-all",
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                        isRecommended && !isSelected && "border-violet-200 dark:border-violet-800/50"
                      )}
                    >
                      <div className={cn(
                        "w-3 h-3 rounded-full mt-1 flex-shrink-0",
                        model.tier === "opus" ? "bg-violet-500" :
                        model.tier === "sonnet" ? "bg-blue-500" :
                        "bg-emerald-500"
                      )} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {model.name}
                          </span>
                          {isRecommended && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                              RECOMMENDED
                            </span>
                          )}
                          {isSelected && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {model.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          ${model.inputPrice}/M input • ${model.outputPrice}/M output
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Usage Stats */}
          {anthropicKey.usageThisMonth && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                This Month&apos;s Usage
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {anthropicKey.usageThisMonth.requests.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Requests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatTokenCount(anthropicKey.usageThisMonth.inputTokens)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Input Tokens</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatTokenCount(anthropicKey.usageThisMonth.outputTokens)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Output Tokens</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatEstimatedCost(
                      anthropicKey.usageThisMonth.inputTokens,
                      anthropicKey.usageThisMonth.outputTokens,
                      anthropicKey.preferredModel,
                      allModels
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Est. Cost</p>
                </div>
              </div>
            </div>
          )}

          {/* Update Key */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Update API key
            </button>
          </div>
        </div>
      ) : (
        /* No API Key - Setup Card */
        <div className={cn(
          "rounded-xl border border-gray-200 dark:border-[#262626]",
          "bg-gradient-to-br from-gray-50 dark:from-[#111111] to-white dark:to-[#0a0a0a]",
          "p-6"
        )}>
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connect Your Anthropic Account
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Add your API key to use the AI Assistant, Code Playground, and other AI features with your own account.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-white dark:bg-[#1a1a1a]">
              <div className="text-2xl mb-1">&#x1F916;</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">AI Assistant</p>
              <p className="text-xs text-gray-500">Voice & text chat</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white dark:bg-[#1a1a1a]">
              <div className="text-2xl mb-1">&#x1F4BB;</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Playground</p>
              <p className="text-xs text-gray-500">Run & explain code</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white dark:bg-[#1a1a1a]">
              <div className="text-2xl mb-1">&#x2728;</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Latest Models</p>
              <p className="text-xs text-gray-500">Opus 4.5 & Sonnet 4</p>
            </div>
          </div>

          {/* Get API Key Links */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <a
              href={ANTHROPIC_URLS.apiKeys}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 to-blue-600",
                "text-white shadow-lg shadow-blue-500/25",
                "hover:-translate-y-0.5 transition-all"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Get API Key
            </a>
            <a
              href={ANTHROPIC_URLS.plans}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-gray-700",
                "text-gray-700 dark:text-gray-300",
                "hover:border-blue-500/50 transition-all"
              )}
            >
              View Plans
            </a>
          </div>

          <button
            onClick={() => setShowApiKeyInput(true)}
            className={cn(
              "w-full py-3 rounded-lg text-sm font-medium",
              "border-2 border-dashed border-gray-300 dark:border-gray-600",
              "text-gray-600 dark:text-gray-400",
              "hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-400",
              "transition-colors"
            )}
          >
            I have an API key - Add it now
          </button>
        </div>
      )}

      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => {
              if (!isSaving && !validationResult) {
                setShowApiKeyInput(false);
                setApiKeyInput("");
                setModalError(null);
              }
            }}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className={cn(
              "w-full max-w-md bg-white dark:bg-[#111111] rounded-2xl",
              "border border-gray-200 dark:border-[#262626]",
              "shadow-2xl pointer-events-auto p-6",
              "max-h-[90vh] overflow-y-auto"
            )}>
              {/* Success State - Show validation results */}
              {validationResult ? (
                <div className="space-y-4">
                  {/* Success Header */}
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      API Key Connected!
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
                      {validationResult.keyHint}
                    </p>
                  </div>

                  {/* Account Info */}
                  {validationResult.accountInfo && (
                    <div className="space-y-3 pt-2">
                      {/* Subscription Tier */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Subscription</span>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-semibold",
                          validationResult.accountInfo.tier === "scale" && "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
                          validationResult.accountInfo.tier === "build" && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                          validationResult.accountInfo.tier === "free" && "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                          validationResult.accountInfo.tier === "unknown" && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        )}>
                          {validationResult.accountInfo.tier === "unknown" ? "Standard" : validationResult.accountInfo.tier.charAt(0).toUpperCase() + validationResult.accountInfo.tier.slice(1)} Tier
                        </span>
                      </div>

                      {/* Model Access */}
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Model Access</span>
                        <div className="flex flex-wrap gap-2">
                          {validationResult.accountInfo.hasOpus && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                              Opus 4.5
                            </span>
                          )}
                          {validationResult.accountInfo.hasSonnet && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              Sonnet 4
                            </span>
                          )}
                          {validationResult.accountInfo.hasHaiku && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                              Haiku 3.5
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rate Limits (Credits) */}
                      {validationResult.accountInfo.rateLimits && (
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1a1a1a]">
                          <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Rate Limits</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatNumber(validationResult.accountInfo.rateLimits.tokensRemaining)}
                              </p>
                              <p className="text-xs text-gray-500">tokens remaining</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatNumber(validationResult.accountInfo.rateLimits.requestsRemaining)}
                              </p>
                              <p className="text-xs text-gray-500">requests remaining</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Limits reset: {formatResetTime(validationResult.accountInfo.rateLimits.tokensReset)}
                          </p>
                        </div>
                      )}

                      {/* Selected Model */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-sm text-emerald-700 dark:text-emerald-300">Selected Model</span>
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                          {validationResult.availableModels.find(m => m.id === validationResult.preferredModel)?.name || validationResult.preferredModel}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Auto-close indicator */}
                  <p className="text-center text-xs text-gray-400 mt-4">
                    Closing automatically...
                  </p>
                </div>
              ) : (
                /* Input State - Show form */
                <>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Add Anthropic API Key
                  </h3>

                  {/* Validation Error (inside modal) */}
                  {modalError && (
                    <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                            {modalError.error}
                          </p>
                          {modalError.errorDetails && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              {modalError.errorDetails}
                            </p>
                          )}
                          {modalError.errorCode && (
                            <p className="text-xs text-red-500 dark:text-red-500 mt-2 font-mono">
                              Error code: {modalError.errorCode}
                            </p>
                          )}
                          {modalError.keyHint && (
                            <p className="text-xs text-red-500 dark:text-red-500 mt-1 font-mono">
                              Key: {modalError.keyHint}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setModalError(null); // Clear error on input
                      }}
                      placeholder="sk-ant-api03-..."
                      className={cn(
                        "w-full px-4 py-3 rounded-lg font-mono text-sm",
                        "bg-gray-50 dark:bg-[#1a1a1a]",
                        "border",
                        modalError
                          ? "border-red-300 dark:border-red-700 focus:ring-red-500"
                          : "border-gray-200 dark:border-[#262626] focus:ring-blue-500",
                        "text-gray-900 dark:text-white",
                        "placeholder:text-gray-400",
                        "focus:outline-none focus:ring-2"
                      )}
                      disabled={isSaving}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Your API key is encrypted and stored securely. We never see your full key.
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Don&apos;t have an API key?
                      </span>
                    </div>
                    <a
                      href={ANTHROPIC_URLS.apiKeys}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 dark:text-cyan-400 hover:underline"
                    >
                      Get one here →
                    </a>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowApiKeyInput(false);
                        setApiKeyInput("");
                        setModalError(null);
                      }}
                      disabled={isSaving}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-medium",
                        "border border-gray-200 dark:border-gray-700",
                        "text-gray-700 dark:text-gray-300",
                        "hover:bg-gray-50 dark:hover:bg-gray-800",
                        "transition-colors",
                        "disabled:opacity-50"
                      )}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveApiKey}
                      disabled={isSaving || !apiKeyInput.trim()}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-semibold text-white",
                        "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                        "shadow-lg shadow-blue-500/25",
                        "hover:-translate-y-0.5 transition-all",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      )}
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Validating...
                        </span>
                      ) : "Validate & Save"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className={cn(
              "w-full max-w-sm bg-white dark:bg-[#111111] rounded-2xl",
              "border border-gray-200 dark:border-[#262626]",
              "shadow-2xl pointer-events-auto p-6"
            )}>
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Remove API Key?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI features will use the site&apos;s shared API credits instead.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium",
                    "border border-gray-200 dark:border-gray-700",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-50 dark:hover:bg-gray-800",
                    "transition-colors"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteKey}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-sm font-semibold text-white",
                    "bg-red-600 hover:bg-red-500",
                    "transition-colors"
                  )}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Help Links */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-[#262626]">
        <a
          href={ANTHROPIC_URLS.docs}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Anthropic Docs
        </a>
        <a
          href={ANTHROPIC_URLS.usage}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View Usage
        </a>
        <a
          href={ANTHROPIC_URLS.plans}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Billing & Plans
        </a>
      </div>
    </div>
  );
}

/**
 * Format token count for display
 */
function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Calculate and format estimated cost based on model pricing
 */
function formatEstimatedCost(
  inputTokens: number,
  outputTokens: number,
  modelId: string | null,
  allModels: ClaudeModel[]
): string {
  const model = allModels.find((m) => m.id === modelId);
  if (!model) return "$0.00";

  const inputCost = (inputTokens / 1_000_000) * model.inputPrice;
  const outputCost = (outputTokens / 1_000_000) * model.outputPrice;
  const total = inputCost + outputCost;

  if (total < 0.01) return "<$0.01";
  return `$${total.toFixed(2)}`;
}

/**
 * Format large numbers with K/M suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

/**
 * Format rate limit reset time for display
 */
function formatResetTime(isoTime: string): string {
  if (!isoTime) return "Unknown";

  try {
    const resetDate = new Date(isoTime);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Now";

    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s`;

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  } catch {
    return "Unknown";
  }
}
