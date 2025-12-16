/**
 * StatusBadge Component
 *
 * Generic status badge with configurable colors.
 * Uses centralized status configurations from lib/dashboard/status-config.ts
 */

import { cn } from "@/lib/design-system";
import type { StatusStyle } from "@/lib/dashboard/types";

interface StatusBadgeProps {
  /** Status style configuration (bg, text, label, border) */
  style: StatusStyle;
  /** Optional custom label (overrides style.label) */
  label?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional className */
  className?: string;
}

export function StatusBadge({
  style,
  label,
  size = "sm",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        style.bg,
        style.text,
        style.border && `border ${style.border}`,
        className
      )}
    >
      {label || style.label}
    </span>
  );
}

/**
 * Convenience component for status badges with dot indicator
 */
interface StatusDotProps {
  /** Status style configuration */
  style: StatusStyle;
  /** Optional label text */
  label?: string;
  /** Additional className */
  className?: string;
}

export function StatusDot({ style, label, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className={cn("h-2 w-2 rounded-full", style.bg)} />
      <span className={cn("text-sm", style.text)}>{label || style.label}</span>
    </span>
  );
}
