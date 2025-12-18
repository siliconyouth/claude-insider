"use client";

/**
 * Shortcut Hint Component
 *
 * Shows keyboard shortcut hints inline with UI elements.
 */

import { cn } from "@/lib/design-system";
import { shortcuts, formatShortcutKey } from "@/lib/keyboard-shortcuts";

interface ShortcutHintProps {
  shortcutId: string;
  className?: string;
  showOnHover?: boolean;
}

export function ShortcutHint({ shortcutId, className, showOnHover = false }: ShortcutHintProps) {
  const shortcut = shortcuts.find((s) => s.id === shortcutId);
  if (!shortcut) return null;

  const formatted = formatShortcutKey(shortcut);
  const parts = formatted.split(" + ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5",
        showOnHover && "opacity-0 group-hover:opacity-100 transition-opacity",
        className
      )}
    >
      {parts.map((part, index) => (
        <span key={index} className="flex items-center gap-0.5">
          {index > 0 && (
            <span className="text-gray-400 dark:text-gray-600 text-[10px]">+</span>
          )}
          <kbd
            className={cn(
              "inline-flex items-center justify-center",
              "min-w-[18px] h-[18px] px-1",
              "text-[10px] font-mono font-medium",
              "bg-gray-100/80 dark:bg-gray-800/80",
              "border border-gray-300/50 dark:border-gray-700/50",
              "rounded",
              "text-gray-600 dark:text-gray-300"
            )}
          >
            {part}
          </kbd>
        </span>
      ))}
    </span>
  );
}

interface ShortcutButtonProps {
  onClick: () => void;
  shortcutId?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
}

export function ShortcutButton({
  onClick,
  shortcutId,
  children,
  className,
  variant = "secondary",
}: ShortcutButtonProps) {
  const baseStyles = cn(
    "group inline-flex items-center gap-2 px-3 py-2 rounded-lg",
    "text-sm font-medium transition-all duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
  );

  const variantStyles = {
    primary: cn(
      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
      "text-white shadow-lg shadow-blue-500/25",
      "hover:-translate-y-0.5"
    ),
    secondary: cn(
      "bg-gray-100 dark:bg-gray-800",
      "text-gray-700 dark:text-gray-300",
      "border border-gray-200 dark:border-[#262626]",
      "hover:border-blue-500/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
    ),
    ghost: cn(
      "text-gray-600 dark:text-gray-400",
      "hover:bg-gray-100 dark:hover:bg-gray-800",
      "hover:text-gray-900 dark:hover:text-gray-200"
    ),
  };

  return (
    <button
      onClick={onClick}
      className={cn(baseStyles, variantStyles[variant], className)}
    >
      {children}
      {shortcutId && <ShortcutHint shortcutId={shortcutId} showOnHover />}
    </button>
  );
}
