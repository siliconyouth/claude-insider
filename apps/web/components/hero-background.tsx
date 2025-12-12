"use client";

/**
 * HeroBackground - Stripe-inspired gradient background
 *
 * Key features from Stripe's homepage:
 * - Diagonal skewed gradient at the bottom (creates contrast for text)
 * - Subtle, blurred color orbs (not sharp lens flares)
 * - Clean separation between text area and gradient area
 * - GPU-accelerated with CSS transforms
 * - Respects prefers-reduced-motion
 */

import { useEffect, useState } from "react";

interface LensFlareOrb {
  id: number;
  color: "violet" | "blue" | "cyan" | "pink" | "gold";
  size: number;
  top: string;
  left: string;
  delay: number;
}

// Stripe-style: Fewer, softer, more subtle orbs positioned in the gradient area
// These sit within/below the diagonal - NOT over the text
const orbs: LensFlareOrb[] = [
  // Large soft violet - bottom left of diagonal
  { id: 1, color: "violet", size: 500, top: "55%", left: "5%", delay: 0 },
  // Medium pink/red - center of diagonal
  { id: 2, color: "pink", size: 400, top: "50%", left: "35%", delay: 1 },
  // Large cyan - right side of diagonal
  { id: 3, color: "cyan", size: 450, top: "45%", left: "65%", delay: 2 },
  // Blue accent - bottom right
  { id: 4, color: "blue", size: 350, top: "60%", left: "80%", delay: 1.5 },
  // Gold accent - adds warmth
  { id: 5, color: "gold", size: 300, top: "70%", left: "25%", delay: 3 },
];

interface HeroBackgroundProps {
  /** Additional CSS classes */
  className?: string;
  /** Intensity of the glow (0-1) */
  intensity?: number;
}

export function HeroBackground({
  className = "",
  intensity = 1,
}: HeroBackgroundProps) {
  // Use lazy initializer for SSR-safe initial value
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    // Subscribe to changes in reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div
      className={`hero-background absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Base gradient layer */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-white dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#111111]"
        style={{ opacity: intensity }}
      />

      {/* Stripe-style diagonal gradient band */}
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] origin-bottom-left"
        style={{
          transform: "skewY(-6deg)",
          transformOrigin: "bottom left",
        }}
      >
        {/* Dark base for the diagonal section */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0f0f23] via-[#13132b] to-transparent dark:from-[#0a0a15] dark:via-[#0f0f20]"
          style={{ opacity: intensity }}
        />

        {/* Lens flare orbs - positioned within the diagonal gradient area */}
        {orbs.map((orb) => (
          <div
            key={orb.id}
            className={`lens-flare-orb lens-flare-orb-${orb.color}`}
            style={{
              width: orb.size,
              height: orb.size,
              top: orb.top,
              left: orb.left,
              animationDelay: prefersReducedMotion ? "0s" : `${orb.delay}s`,
              opacity: intensity * 0.7,
            }}
          />
        ))}
      </div>

      {/* Light rays layer - disabled for cleaner Stripe-style look */}
      {/* Stripe doesn't use light rays - they keep the gradient clean */}

      {/* Noise/grain overlay for texture (very subtle) */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle top gradient for text area contrast - Stripe-style clean text area */}
      <div
        className="absolute inset-x-0 top-0 h-[55%] dark:hidden"
        style={{
          background: `linear-gradient(to bottom,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 255, 255, 0.9) 60%,
            transparent 100%)`,
          opacity: intensity,
        }}
      />
      {/* Dark mode version */}
      <div
        className="absolute inset-x-0 top-0 h-[55%] hidden dark:block"
        style={{
          background: `linear-gradient(to bottom,
            rgba(10, 10, 10, 1) 0%,
            rgba(10, 10, 10, 0.9) 60%,
            transparent 100%)`,
          opacity: intensity,
        }}
      />
    </div>
  );
}

/**
 * Compact hero background for smaller sections
 */
export function HeroBackgroundCompact({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-blue-500/5 to-cyan-500/5" />
      <div
        className="lens-flare-orb lens-flare-orb-violet absolute"
        style={{ width: 300, height: 300, top: "10%", left: "20%", opacity: 0.3 }}
      />
      <div
        className="lens-flare-orb lens-flare-orb-blue absolute"
        style={{ width: 250, height: 250, top: "40%", left: "60%", opacity: 0.25 }}
      />
    </div>
  );
}

export default HeroBackground;
