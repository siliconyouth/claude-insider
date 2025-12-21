"use client";

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { EDIT_COMMANDS, type EditCommand } from "./types";

interface AIToolbarProps {
  onCommand: (command: EditCommand, customPrompt?: string) => void;
  isStreaming: boolean;
  hasSelection: boolean;
  selectionText?: string;
}

export function AIToolbar({
  onCommand,
  isStreaming,
  hasSelection,
  selectionText,
}: AIToolbarProps) {
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleCommand = (command: EditCommand) => {
    if (command === "custom") {
      setShowCustomPrompt(true);
    } else {
      onCommand(command);
    }
  };

  const handleCustomSubmit = () => {
    if (customPrompt.trim()) {
      onCommand("custom", customPrompt.trim());
      setCustomPrompt("");
      setShowCustomPrompt(false);
    }
  };

  return (
    <div className="px-6 py-3 border-b border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Selection indicator */}
      {hasSelection && (
        <div className="mb-3 text-sm text-blue-600 dark:text-blue-400">
          <span className="font-medium">Editing selection:</span>{" "}
          <span className="text-gray-600 dark:text-gray-400">
            &ldquo;{selectionText?.slice(0, 50)}
            {(selectionText?.length || 0) > 50 ? "..." : ""}&rdquo;
          </span>
        </div>
      )}

      {/* Command buttons */}
      <div className="flex flex-wrap gap-2">
        {EDIT_COMMANDS.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => handleCommand(cmd.id)}
            disabled={isStreaming}
            className={cn(
              "group relative px-3 py-1.5 rounded-lg text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "bg-white dark:bg-[#111111]",
              "text-gray-700 dark:text-gray-300",
              "hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
            title={cmd.description}
          >
            <span className="mr-1.5">{cmd.icon}</span>
            {cmd.label}
            {cmd.shortcut && (
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                {cmd.shortcut}
              </span>
            )}

            {/* Tooltip */}
            <span
              className={cn(
                "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1",
                "text-xs text-white bg-gray-900 dark:bg-gray-700 rounded",
                "opacity-0 group-hover:opacity-100 pointer-events-none",
                "transition-opacity duration-200 whitespace-nowrap z-10"
              )}
            >
              {cmd.description}
            </span>
          </button>
        ))}
      </div>

      {/* Custom prompt input */}
      {showCustomPrompt && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustomSubmit();
              if (e.key === "Escape") setShowCustomPrompt(false);
            }}
            placeholder="Enter custom instructions... (e.g., 'Make it sound more professional')"
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm",
              "border border-gray-200 dark:border-[#262626]",
              "bg-white dark:bg-[#111111]",
              "text-gray-900 dark:text-gray-100",
              "placeholder:text-gray-400 dark:placeholder:text-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
            autoFocus
            maxLength={1000}
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customPrompt.trim() || isStreaming}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium text-white",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-opacity"
            )}
          >
            Apply
          </button>
          <button
            onClick={() => setShowCustomPrompt(false)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-600 dark:text-gray-400",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors"
            )}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Help text */}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {hasSelection
          ? "Commands will apply to your selection only"
          : "Select text to edit a specific section, or apply to entire content"}
      </p>
    </div>
  );
}
