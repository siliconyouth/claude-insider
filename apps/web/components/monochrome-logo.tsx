"use client";

import { cn } from "@/lib/design-system";

interface MonochromeLogoProps {
  className?: string;
  size?: number;
  /**
   * - "muted": Gray tones for subtle integration (original behavior)
   * - "contrast": High contrast - black/white for better visibility
   */
  variant?: "muted" | "contrast";
}

/**
 * Monochrome "Ci" logo that adapts to theme
 *
 * Muted variant (default):
 * - Light mode: black background, gray text
 * - Dark mode: gray background, black text
 *
 * Contrast variant:
 * - Light mode: black background, white text
 * - Dark mode: white background, black text
 */
export function MonochromeLogo({
  className,
  size = 14,
  variant = "muted",
}: MonochromeLogoProps) {
  const bgClass =
    variant === "contrast"
      ? "fill-gray-900 dark:fill-white"
      : "fill-gray-900 dark:fill-gray-500";

  const textClass =
    variant === "contrast"
      ? "fill-white dark:fill-gray-900"
      : "fill-gray-500 dark:fill-gray-900";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={cn("flex-shrink-0", className)}
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="512" height="512" rx="80" className={bgClass} />
      {/* Text */}
      <text
        x="256"
        y="355"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="300"
        fontWeight="800"
        textAnchor="middle"
        className={textClass}
      >
        Ci
      </text>
    </svg>
  );
}
