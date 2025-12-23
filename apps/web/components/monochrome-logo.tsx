"use client";

import { cn } from "@/lib/design-system";

interface MonochromeLogoProps {
  className?: string;
  size?: number;
}

/**
 * Monochrome "Ci" logo that adapts to theme
 * Uses footer text gray colors for consistency:
 * - Light mode: black background, gray text (matches footer text-gray-500)
 * - Dark mode: gray background (matches footer text-gray-500), black text
 */
export function MonochromeLogo({ className, size = 14 }: MonochromeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={cn("flex-shrink-0", className)}
      aria-hidden="true"
    >
      {/* Background - black in light, gray in dark (matching footer text) */}
      <rect
        width="512"
        height="512"
        rx="80"
        className="fill-gray-900 dark:fill-gray-500"
      />
      {/* Text - gray in light (matching footer text), black in dark */}
      <text
        x="256"
        y="355"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="300"
        fontWeight="800"
        textAnchor="middle"
        className="fill-gray-500 dark:fill-gray-900"
      >
        Ci
      </text>
    </svg>
  );
}
