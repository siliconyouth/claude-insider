"use client";

import { cn } from "@/lib/design-system";

interface GradientLogoProps {
  className?: string;
  /**
   * Size in pixels. The logo scales proportionally.
   * Default: 32 (matches header usage)
   */
  size?: number;
  /**
   * Whether to include the glow shadow effect.
   * Default: false
   */
  withGlow?: boolean;
}

/**
 * Gradient "Ci" logo that matches the source SVG exactly.
 *
 * Uses SVG with viewBox to ensure proper text proportions at any size.
 * Font size 300 on 512x512 viewBox = ~58.6% height, matching icon-source.svg
 *
 * @see public/icons/icon-source.svg for the authoritative source
 */
export function GradientLogo({
  className,
  size = 32,
  withGlow = false,
}: GradientLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={cn(
        "shrink-0 aspect-square",
        withGlow && "drop-shadow-[0_4px_12px_rgba(59,130,246,0.25)]",
        className
      )}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* Background with gradient - matches icon-source.svg */}
      <rect width="512" height="512" rx="80" fill="url(#logoGradient)" />
      {/* Text - exact same as icon-source.svg */}
      <text
        x="256"
        y="355"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fontSize="300"
        fontWeight="800"
        fill="#ffffff"
        textAnchor="middle"
      >
        Ci
      </text>
    </svg>
  );
}
