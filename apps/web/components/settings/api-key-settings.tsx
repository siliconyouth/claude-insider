"use client";

/**
 * API Key Settings Component
 *
 * Allows users to connect their Anthropic/Claude AI accounts
 * by adding their API keys. Supports model selection and usage tracking.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { ANTHROPIC_URLS, type ClaudeModel } from "@/lib/api-keys";

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

export function ApiKeySettings() {
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
  const [aiPreferences, setAiPreferences] = useState<AiPreferences | null>(null);
  const [allModels, setAllModels] = useState<ClaudeModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      setError("Please enter an API key");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

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
        setError(data.error || "Failed to save API key");
        return;
      }

      setSuccess("API key saved successfully!");
      setApiKeyInput("");
      setShowApiKeyInput(false);
      fetchApiKeys();
    } catch (err) {
      setError("Failed to save API key");
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
    } catch (err) {
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
      }
    } catch (err) {
      setError("Failed to delete API key");
    }
  };

  const handleModelChange = async (modelId: string) => {
    try {
      const response = await fetch("/api/user/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: "", // Will be ignored if already set
          preferredModel: modelId,
          provider: "anthropic",
        }),
      });

      if (response.ok) {
        fetchApiKeys();
      }
    } catch (err) {
      console.error("Failed to update model preference:", err);
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Preferred Model
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {anthropicKey.availableModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg text-left",
                      "border transition-all",
                      anthropicKey.preferredModel === model.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full mt-1 flex-shrink-0",
                      model.tier === "opus" ? "bg-violet-500" :
                      model.tier === "sonnet" ? "bg-blue-500" :
                      "bg-emerald-500"
                    )} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {model.name}
                        </span>
                        {model.tier === "opus" && (
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                            Best
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {model.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        ${model.inputPrice}/M input • ${model.outputPrice}/M output
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Usage Stats */}
          {anthropicKey.usageThisMonth && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                This Month&apos;s Usage
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {anthropicKey.usageThisMonth.requests.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Requests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(anthropicKey.usageThisMonth.inputTokens / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Input Tokens</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(anthropicKey.usageThisMonth.outputTokens / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Output Tokens</p>
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
            onClick={() => setShowApiKeyInput(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className={cn(
              "w-full max-w-md bg-white dark:bg-[#111111] rounded-2xl",
              "border border-gray-200 dark:border-[#262626]",
              "shadow-2xl pointer-events-auto p-6"
            )}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Anthropic API Key
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className={cn(
                    "w-full px-4 py-3 rounded-lg font-mono text-sm",
                    "bg-gray-50 dark:bg-[#1a1a1a]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white",
                    "placeholder:text-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500"
                  )}
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
                  }}
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
                  {isSaving ? "Validating..." : "Save API Key"}
                </button>
              </div>
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
