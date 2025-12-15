"use client";

/**
 * useApiCredits Hook
 *
 * Provides real-time API usage/credits info for users with their own API key.
 * Polls for updates and can be manually refreshed.
 * Uses localStorage to cache model preference for instant display on page load.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";

const CACHE_KEY = "claude-model-pref";

export interface ApiUsageStats {
  inputTokens: number;
  outputTokens: number;
  requests: number;
  estimatedCost: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  tier: "opus" | "sonnet" | "haiku";
  description: string;
  inputPrice: number;
  outputPrice: number;
  isRecommended?: boolean;
}

export interface ApiCreditsData {
  hasOwnKey: boolean;
  isValid: boolean;
  keyHint: string | null;
  preferredModel: string | null;
  modelName: string | null;
  modelTier: "opus" | "sonnet" | "haiku" | null;
  availableModels: ModelInfo[];
  recommendedModel: ModelInfo | null;
  usage: ApiUsageStats | null;
  lastUpdated: Date | null;
}

/**
 * Cache model preference for instant display on page load
 */
interface CachedModelPref {
  hasOwnKey: boolean;
  isValid: boolean;
  preferredModel: string | null;
  modelName: string | null;
  modelTier: "opus" | "sonnet" | "haiku" | null;
}

function getCachedPref(): CachedModelPref | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    // Ignore parse errors
  }
  return null;
}

function setCachedPref(data: CachedModelPref) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

function clearCachedPref() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore storage errors
  }
}

// Pricing per 1M tokens (approximate as of Dec 2024)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-5-20251101": { input: 15, output: 75 },
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
  "claude-3-opus-20240229": { input: 15, output: 75 },
  "claude-3-sonnet-20240229": { input: 3, output: 15 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
};

function calculateEstimatedCost(
  inputTokens: number,
  outputTokens: number,
  model: string | null
): number {
  const pricing = model ? MODEL_PRICING[model] : MODEL_PRICING["claude-sonnet-4-20250514"];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return Math.round((inputCost + outputCost) * 100) / 100;
}

export function useApiCredits(pollInterval: number = 30000) {
  const { isAuthenticated } = useAuth();

  // Initialize with cached data for instant display
  const [data, setData] = useState<ApiCreditsData>(() => {
    const cached = getCachedPref();
    return {
      hasOwnKey: cached?.hasOwnKey ?? false,
      isValid: cached?.isValid ?? false,
      keyHint: null,
      preferredModel: cached?.preferredModel ?? null,
      modelName: cached?.modelName ?? null,
      modelTier: cached?.modelTier ?? null,
      availableModels: [],
      recommendedModel: null,
      usage: null,
      lastUpdated: null,
    };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!isAuthenticated) {
      // Clear cache on logout
      clearCachedPref();
      setData({
        hasOwnKey: false,
        isValid: false,
        keyHint: null,
        preferredModel: null,
        modelName: null,
        modelTier: null,
        availableModels: [],
        recommendedModel: null,
        usage: null,
        lastUpdated: null,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/api-keys");
      if (!response.ok) {
        throw new Error("Failed to fetch API credits");
      }

      const result = await response.json();
      const apiKey = result.apiKeys?.[0];

      // Show model selector if user has a valid API key
      // Don't require aiPreferences.useOwnApiKey - if they have a key, show it
      if (apiKey && apiKey.isValid) {
        const usage = apiKey.usageThisMonth;
        const model = apiKey.preferredModel;
        const modelInfo = result.allModels?.find((m: { id: string }) => m.id === model);

        // Build available models list with recommended flag
        const availableModels: ModelInfo[] = (apiKey.availableModels || result.allModels || []).map(
          (m: { id: string; name: string; tier: "opus" | "sonnet" | "haiku"; description: string; inputPrice: number; outputPrice: number }) => ({
            id: m.id,
            name: m.name,
            tier: m.tier,
            description: m.description,
            inputPrice: m.inputPrice,
            outputPrice: m.outputPrice,
            isRecommended: m.id === "claude-opus-4-5-20251101" ||
              (!availableModels?.some((am: ModelInfo) => am.id === "claude-opus-4-5-20251101") && m.id === "claude-sonnet-4-20250514"),
          })
        );

        // Find recommended model (best available)
        const recommendedModel = availableModels.find((m: ModelInfo) => m.id === "claude-opus-4-5-20251101") ||
          availableModels.find((m: ModelInfo) => m.id === "claude-sonnet-4-20250514") ||
          availableModels[0] || null;

        const newModelName = modelInfo?.name || model?.split("-").slice(0, 2).join(" ") || null;
        const newModelTier = modelInfo?.tier || null;
        const newIsValid = apiKey.isValid === true;

        setData({
          hasOwnKey: true,
          isValid: newIsValid,
          keyHint: apiKey.keyHint,
          preferredModel: model,
          modelName: newModelName,
          modelTier: newModelTier,
          availableModels,
          recommendedModel,
          usage: usage
            ? {
                inputTokens: usage.inputTokens || 0,
                outputTokens: usage.outputTokens || 0,
                requests: usage.requests || 0,
                estimatedCost: calculateEstimatedCost(
                  usage.inputTokens || 0,
                  usage.outputTokens || 0,
                  model
                ),
              }
            : { inputTokens: 0, outputTokens: 0, requests: 0, estimatedCost: 0 },
          lastUpdated: new Date(),
        });

        // Cache for instant display on next page load
        setCachedPref({
          hasOwnKey: true,
          isValid: newIsValid,
          preferredModel: model,
          modelName: newModelName,
          modelTier: newModelTier,
        });
      } else {
        setData({
          hasOwnKey: !!apiKey,
          isValid: apiKey?.isValid === true,
          keyHint: apiKey?.keyHint || null,
          preferredModel: null,
          modelName: null,
          modelTier: null,
          availableModels: [],
          recommendedModel: null,
          usage: null,
          lastUpdated: new Date(),
        });

        // Clear cache when user doesn't have their own key active
        clearCachedPref();
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch credits");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Poll for updates
  useEffect(() => {
    if (!isAuthenticated || pollInterval <= 0) return;

    const interval = setInterval(fetchCredits, pollInterval);
    return () => clearInterval(interval);
  }, [isAuthenticated, pollInterval, fetchCredits]);

  // Listen for usage updates via custom events
  useEffect(() => {
    const handleUsageUpdate = () => {
      fetchCredits();
    };

    window.addEventListener("api-usage-update", handleUsageUpdate);
    return () => window.removeEventListener("api-usage-update", handleUsageUpdate);
  }, [fetchCredits]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    return fetchCredits();
  }, [fetchCredits]);

  const changeModel = useCallback(async (modelId: string) => {
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
        fetchCredits();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [fetchCredits]);

  return {
    ...data,
    isLoading,
    error,
    refresh,
    changeModel,
  };
}

/**
 * Dispatch an event to trigger credit refresh (call after AI operations)
 */
export function triggerCreditsRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("api-usage-update"));
  }
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return "<$0.01";
  if (cost < 1) return `$${cost.toFixed(2)}`;
  return `$${cost.toFixed(2)}`;
}
