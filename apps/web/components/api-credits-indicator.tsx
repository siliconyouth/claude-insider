"use client";

/**
 * API Credits Indicator
 *
 * Compact display for the header showing user's API usage and model selection.
 * Shows current model, tokens used, and estimated cost with a dropdown for model switching.
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useApiCredits, formatTokens, formatCost, type ModelInfo } from "@/hooks/use-api-credits";

export function ApiCreditsIndicator() {
  const {
    hasOwnKey,
    isValid,
    usage,
    modelName,
    modelTier,
    availableModels,
    recommendedModel,
    preferredModel,
    isLoading,
    refresh,
    changeModel,
  } = useApiCredits();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't show if user doesn't have their own key active
  if (!hasOwnKey || !isValid || isLoading) {
    return null;
  }

  const totalTokens = (usage?.inputTokens || 0) + (usage?.outputTokens || 0);

  const handleModelChange = async (model: ModelInfo) => {
    if (model.id === preferredModel) {
      setShowDropdown(false);
      return;
    }

    setIsChanging(true);
    const success = await changeModel(model.id);
    setIsChanging(false);
    if (success) {
      setShowDropdown(false);
    }
  };

  const tierColors = {
    opus: "text-violet-500 dark:text-violet-400",
    sonnet: "text-blue-500 dark:text-blue-400",
    haiku: "text-emerald-500 dark:text-emerald-400",
  };

  const tierBgColors = {
    opus: "bg-violet-500",
    sonnet: "bg-blue-500",
    haiku: "bg-emerald-500",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        onMouseEnter={() => !showDropdown && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
          "text-xs font-medium",
          "bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10",
          "border border-violet-500/20",
          "text-gray-700 dark:text-gray-300",
          "hover:border-violet-500/40 hover:bg-violet-500/5",
          "transition-all duration-200"
        )}
      >
        {/* Model Tier Indicator */}
        {modelTier && (
          <div className={cn("w-2 h-2 rounded-full", tierBgColors[modelTier])} />
        )}

        {/* Model Name (truncated) */}
        <span className={cn("hidden sm:inline max-w-[80px] truncate", modelTier && tierColors[modelTier])}>
          {modelName?.replace("Claude ", "") || "Select Model"}
        </span>

        {/* Cost */}
        <span className="text-gray-500 dark:text-gray-400">
          {formatCost(usage?.estimatedCost || 0)}
        </span>

        {/* Dropdown Arrow */}
        <svg
          className={cn("w-3 h-3 text-gray-400 transition-transform", showDropdown && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Simple Tooltip (when not showing dropdown) */}
      {showTooltip && !showDropdown && (
        <div
          className={cn(
            "absolute top-full right-0 mt-2 px-3 py-2 rounded-lg z-50",
            "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900",
            "text-xs whitespace-nowrap",
            "animate-fade-in"
          )}
        >
          {modelName} • {formatTokens(totalTokens)} tokens
        </div>
      )}

      {/* Model Selection Dropdown */}
      {showDropdown && (
        <div
          className={cn(
            "absolute top-full right-0 mt-2 w-80 rounded-xl z-50",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "shadow-lg",
            "animate-fade-in"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Select Model
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Refresh"
            >
              <RefreshIcon className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>

          {/* Model List */}
          <div className="p-2 max-h-64 overflow-y-auto">
            {availableModels.map((model) => {
              const isSelected = model.id === preferredModel;
              const isRecommended = model.id === recommendedModel?.id;

              return (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model)}
                  disabled={isChanging}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left",
                    "transition-all duration-150",
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent",
                    isChanging && "opacity-50 cursor-wait"
                  )}
                >
                  {/* Tier Dot */}
                  <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", tierBgColors[model.tier])} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {model.name}
                      </span>
                      {isRecommended && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                          BEST
                        </span>
                      )}
                      {isSelected && (
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {model.description}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      ${model.inputPrice}/M input • ${model.outputPrice}/M output
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Usage Stats */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">This month</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 dark:text-gray-300">
                  {formatTokens(totalTokens)} tokens
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCost(usage?.estimatedCost || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Link */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-[#262626]">
            <Link
              href="/settings#ai"
              onClick={() => setShowDropdown(false)}
              className="text-xs text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Manage API Key &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
