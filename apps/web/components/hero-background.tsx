"use client";

/**
 * HeroBackground - Animated lens flare and light rays background
 *
 * Stripe/Vercel/Linear-inspired animated background with:
 * - Multiple overlapping glowing orbs (purple, blue, cyan)
 * - Animated light rays radiating outward
 * - Subtle pulsing and drifting animations
 * - GPU-accelerated with CSS transforms
 * - Respects prefers-reduced-motion
 */

import { useEffect, useState } from "react";

interface LensFlareOrb {
  id: number;
  color: "violet" | "blue" | "cyan";
  size: number;
  top: string;
  left: string;
  delay: number;
}

// Predefined orb positions for consistent rendering
const orbs: LensFlareOrb[] = [
  // Large violet orb - top left area
  { id: 1, color: "violet", size: 600, top: "5%", left: "15%", delay: 0 },
  // Medium blue orb - center right
  { id: 2, color: "blue", size: 500, top: "30%", left: "60%", delay: 2 },
  // Large cyan orb - bottom center
  { id: 3, color: "cyan", size: 550, top: "50%", left: "35%", delay: 4 },
  // Small violet accent - top right
  { id: 4, color: "violet", size: 300, top: "10%", left: "75%", delay: 1 },
  // Small blue accent - bottom left
  { id: 5, color: "blue", size: 350, top: "60%", left: "10%", delay: 3 },
  // Medium cyan - top center
  { id: 6, color: "cyan", size: 400, top: "15%", left: "45%", delay: 5 },
];

interface HeroBackgroundProps {
  /** Additional CSS classes */
  className?: string;
  /** Show light rays effect */
  showRays?: boolean;
  /** Intensity of the glow (0-1) */
  intensity?: number;
}

export function HeroBackground({
  className = "",
  showRays = true,
  intensity = 1,
}: HeroBackgroundProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

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

      {/* Lens flare orbs */}
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
            opacity: intensity * (orb.color === "violet" ? 0.6 : orb.color === "blue" ? 0.5 : 0.4),
          }}
        />
      ))}

      {/* Light rays layer */}
      {showRays && !prefersReducedMotion && (
        <div className="light-rays">
          {/* Central light ray - very subtle */}
          <div
            className="absolute top-1/4 left-1/2 w-[200%] h-[1px] -translate-x-1/2"
            style={{
              background: `linear-gradient(90deg, transparent, rgb(var(--ds-glow-blue) / ${0.08 * intensity}), transparent)`,
              animation: "ray-sweep 45s linear infinite",
            }}
          />
          {/* Diagonal ray */}
          <div
            className="absolute top-1/3 left-1/3 w-[150%] h-[1px] rotate-45"
            style={{
              background: `linear-gradient(90deg, transparent, rgb(var(--ds-glow-violet) / ${0.06 * intensity}), transparent)`,
              animation: "ray-sweep 50s linear infinite 5s",
            }}
          />
          {/* Counter-diagonal ray */}
          <div
            className="absolute top-1/2 left-1/2 w-[150%] h-[1px] -rotate-30"
            style={{
              background: `linear-gradient(90deg, transparent, rgb(var(--ds-glow-cyan) / ${0.05 * intensity}), transparent)`,
              animation: "ray-sweep 55s linear infinite 10s",
            }}
          />
        </div>
      )}

      {/* Noise/grain overlay for texture (very subtle) */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial gradient overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, rgb(var(--ds-glow-violet) / ${0.08 * intensity}) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 60%, rgb(var(--ds-glow-blue) / ${0.06 * intensity}) 0%, transparent 40%),
                       radial-gradient(ellipse at 50% 80%, rgb(var(--ds-glow-cyan) / ${0.05 * intensity}) 0%, transparent 45%)`,
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
