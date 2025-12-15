/**
 * Trust Score Badge
 *
 * Visual display of visitor trust score and level.
 */

"use client";

import { cn } from "@/lib/design-system";
import { getTrustLevelBadgeClasses, type TrustLevel } from "@/lib/trust-score";

interface TrustScoreBadgeProps {
  score: number;
  level: TrustLevel;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TrustScoreBadge({
  score,
  level,
  showScore = true,
  size = "md",
}: TrustScoreBadgeProps) {
  const levelLabels: Record<TrustLevel, string> = {
    trusted: "Trusted",
    neutral: "Neutral",
    suspicious: "Suspicious",
    untrusted: "Untrusted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        getTrustLevelBadgeClasses(level),
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        size === "lg" && "px-3 py-1.5 text-base"
      )}
    >
      {showScore && (
        <span className="mr-1.5 font-bold">{Math.round(score)}</span>
      )}
      <span>{levelLabels[level]}</span>
    </span>
  );
}

interface TrustScoreBarProps {
  score: number;
  className?: string;
}

export function TrustScoreBar({ score, className }: TrustScoreBarProps) {
  const getBarColor = (score: number): string => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-blue-500";
    if (score >= 20) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-gray-500">Trust Score</span>
        <span className="font-medium">{Math.round(score)}/100</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={cn("h-full rounded-full transition-all duration-300", getBarColor(score))}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
