"use client";

/**
 * Reaction Display Component
 *
 * Shows reactions on a message as a row of emoji pills.
 * Clicking a reaction toggles it (add if not reacted, remove if already reacted).
 */

import { cn } from "@/lib/design-system";
import type { Reaction } from "@/app/actions/messaging";

interface ReactionDisplayProps {
  reactions: Reaction[];
  onReact: (emoji: string) => void;
  className?: string;
}

export function ReactionDisplay({
  reactions,
  onReact,
  className,
}: ReactionDisplayProps) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1 mt-1", className)}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onReact(reaction.emoji)}
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs",
            "transition-colors cursor-pointer",
            reaction.hasReacted
              ? "bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700"
              : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          )}
          title={formatReactors(reaction)}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span
            className={cn(
              "font-medium",
              reaction.hasReacted
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {reaction.count}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Format the list of users who reacted for tooltip
 */
function formatReactors(reaction: Reaction): string {
  const names = reaction.users
    .slice(0, 10) // Limit to first 10
    .map((u) => u.name || u.username || "Someone");

  if (names.length === 0) return "";
  if (names.length === 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0] ?? ""} and ${names[1] ?? ""}`;

  const more = reaction.count - names.length;
  const lastName = names[names.length - 1] ?? "";
  if (more > 0) {
    return `${names.slice(0, -1).join(", ")}, ${lastName}, and ${more} more`;
  }

  return `${names.slice(0, -1).join(", ")} and ${lastName}`;
}
