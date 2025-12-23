"use client";

import { cn } from "@/lib/design-system";

interface MonochromeLogoProps {
  className?: string;
  size?: number;
}

/**
 * Monochrome "Ci" logo that adapts to theme
 * - Light mode: black background, white text
 * - Dark mode: white background, black text
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
      {/* Background - inverts based on theme */}
      <rect
        width="512"
        height="512"
        rx="80"
        className="fill-gray-900 dark:fill-white"
      />
      {/* Text - inverts based on theme */}
      <text
        x="256"
        y="355"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="300"
        fontWeight="800"
        textAnchor="middle"
        className="fill-white dark:fill-gray-900"
      >
        Ci
      </text>
    </svg>
  );
}
