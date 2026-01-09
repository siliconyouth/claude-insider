"use client";

/**
 * Claude Hints Badges
 *
 * Displays Claude optimization metadata as visual badges.
 *
 * Features:
 * - Feature badges (XML tags, thinking section, examples, etc.)
 * - Optimization score gauge
 * - Recommended model badge
 * - Token estimate
 */

import { cn } from "@/lib/design-system";
import {
  TagsIcon,
  BrainIcon,
  ListIcon,
  LinkIcon,
  FileTextIcon,
  TargetIcon,
  SparklesIcon,
  ZapIcon,
  CloudIcon,
} from "lucide-react";

interface ClaudeHints {
  uses_xml_tags?: boolean;
  uses_thinking_section?: boolean;
  uses_examples?: boolean;
  uses_chain_of_thought?: boolean;
  uses_system_context?: boolean;
  uses_output_format?: boolean;
  structure_score?: number;
  clarity_score?: number;
  specificity_score?: number;
  overall_optimization_score?: number;
  recommended_model?: "opus" | "sonnet" | "haiku" | string;
  estimated_tokens?: number;
  complexity_level?: "simple" | "moderate" | "complex" | string;
  improvement_suggestions?: Array<{
    type: string;
    description: string;
    priority: "high" | "medium" | "low" | string;
  }>;
}

interface ClaudeHintsBadgesProps {
  hints: ClaudeHints | null;
  variant?: "compact" | "detailed" | "inline";
  showScore?: boolean;
  showFeatures?: boolean;
  showModel?: boolean;
  showTokens?: boolean;
  className?: string;
}

const FEATURE_BADGES = [
  { key: "uses_xml_tags", label: "XML Tags", icon: TagsIcon, color: "violet" },
  { key: "uses_thinking_section", label: "Thinking", icon: BrainIcon, color: "blue" },
  { key: "uses_examples", label: "Examples", icon: ListIcon, color: "cyan" },
  { key: "uses_chain_of_thought", label: "Chain of Thought", icon: LinkIcon, color: "emerald" },
  { key: "uses_system_context", label: "Context", icon: FileTextIcon, color: "amber" },
  { key: "uses_output_format", label: "Output Format", icon: TargetIcon, color: "pink" },
] as const;

const MODEL_COLORS: Record<string, string> = {
  opus: "from-violet-500 to-purple-500",
  sonnet: "from-blue-500 to-cyan-500",
  haiku: "from-emerald-500 to-teal-500",
};

const MODEL_LABELS: Record<string, string> = {
  opus: "Opus",
  sonnet: "Sonnet",
  haiku: "Haiku",
};

export function ClaudeHintsBadges({
  hints,
  variant = "compact",
  showScore = true,
  showFeatures = true,
  showModel = true,
  showTokens = false,
  className,
}: ClaudeHintsBadgesProps) {
  if (!hints) return null;

  const score = hints.overall_optimization_score || 0;
  const model = hints.recommended_model?.toLowerCase() || "sonnet";
  const tokens = hints.estimated_tokens || 0;
  const complexity = hints.complexity_level || "moderate";

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  // Get score background
  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "bg-blue-500/10 border-blue-500/30";
    if (score >= 40) return "bg-amber-500/10 border-amber-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  // Active features
  const activeFeatures = FEATURE_BADGES.filter(
    (f) => hints[f.key as keyof ClaudeHints]
  );

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {showScore && score > 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
              getScoreBg(score),
              getScoreColor(score)
            )}
          >
            <SparklesIcon className="w-3 h-3" />
            {score}%
          </span>
        )}
        {showModel && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              "bg-gradient-to-r text-white",
              MODEL_COLORS[model] || MODEL_COLORS.sonnet
            )}
          >
            <CloudIcon className="w-3 h-3" />
            {MODEL_LABELS[model] || "Sonnet"}
          </span>
        )}
        {showFeatures && activeFeatures.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {activeFeatures.length} optimizations
          </span>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 flex-wrap", className)}>
        {showScore && score > 0 && (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
              getScoreBg(score)
            )}
          >
            <SparklesIcon className={cn("w-3.5 h-3.5", getScoreColor(score))} />
            <span className={getScoreColor(score)}>{score}</span>
            <span className="text-gray-400">/100</span>
          </div>
        )}
        {showModel && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
              "bg-gradient-to-r text-white shadow-sm",
              MODEL_COLORS[model] || MODEL_COLORS.sonnet
            )}
          >
            {MODEL_LABELS[model] || "Sonnet"}
          </span>
        )}
        {showFeatures && activeFeatures.slice(0, 3).map((feature) => (
          <span
            key={feature.key}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs",
              "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}
            title={feature.label}
          >
            <feature.icon className="w-3 h-3" />
            <span className="hidden sm:inline">{feature.label}</span>
          </span>
        ))}
        {showFeatures && activeFeatures.length > 3 && (
          <span className="text-xs text-gray-400">
            +{activeFeatures.length - 3}
          </span>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={cn("space-y-4", className)}>
      {/* Score Section */}
      {showScore && (
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border",
              getScoreBg(score)
            )}
          >
            <SparklesIcon className={cn("w-5 h-5", getScoreColor(score))} />
            <div>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-bold", getScoreColor(score))}>
                  {score}
                </span>
                <span className="text-sm text-gray-400">/100</span>
              </div>
              <div className="text-xs text-gray-500">Optimization Score</div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="flex-1 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {hints.structure_score || 0}
              </div>
              <div className="text-xs text-gray-500">Structure</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {hints.clarity_score || 0}
              </div>
              <div className="text-xs text-gray-500">Clarity</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {hints.specificity_score || 0}
              </div>
              <div className="text-xs text-gray-500">Specificity</div>
            </div>
          </div>
        </div>
      )}

      {/* Model and Tokens */}
      <div className="flex items-center gap-3">
        {showModel && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Recommended:</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                "bg-gradient-to-r text-white shadow-sm",
                MODEL_COLORS[model] || MODEL_COLORS.sonnet
              )}
            >
              <CloudIcon className="w-4 h-4" />
              Claude {MODEL_LABELS[model] || "Sonnet"}
            </span>
          </div>
        )}
        {showTokens && tokens > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ZapIcon className="w-4 h-4" />
            ~{tokens.toLocaleString()} tokens
          </div>
        )}
        <div className="text-sm text-gray-500">
          Complexity: <span className="font-medium capitalize">{complexity}</span>
        </div>
      </div>

      {/* Features */}
      {showFeatures && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Claude Best Practices
          </div>
          <div className="flex flex-wrap gap-2">
            {FEATURE_BADGES.map((feature) => {
              const isActive = hints[feature.key as keyof ClaudeHints];
              const Icon = feature.icon;

              return (
                <span
                  key={feature.key}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors",
                    isActive
                      ? `bg-${feature.color}-500/10 text-${feature.color}-500 border-${feature.color}-500/30`
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {feature.label}
                  {isActive && <CheckCircle className="w-3 h-3 ml-1" />}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Improvement Suggestions */}
      {hints.improvement_suggestions && hints.improvement_suggestions.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Suggestions for Improvement
          </div>
          <div className="space-y-2">
            {hints.improvement_suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3 rounded-lg border",
                  suggestion.priority === "high"
                    ? "bg-red-500/5 border-red-500/20"
                    : suggestion.priority === "medium"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-blue-500/5 border-blue-500/20"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      suggestion.priority === "high"
                        ? "bg-red-500/10 text-red-500"
                        : suggestion.priority === "medium"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-blue-500/10 text-blue-500"
                    )}
                  >
                    {suggestion.priority}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {suggestion.type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {suggestion.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// CheckCircle icon (inline to avoid import)
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export default ClaudeHintsBadges;
