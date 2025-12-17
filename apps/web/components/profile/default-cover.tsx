"use client";

/**
 * Default Cover Photo Component
 *
 * Animated gradient background for profiles without custom cover photos.
 * Uses the same lens flare animation pattern as the homepage hero section.
 * Respects prefers-reduced-motion for accessibility.
 */

import { cn } from "@/lib/design-system";

interface DefaultCoverProps {
  className?: string;
}

// Lens flare orb configuration - simplified version of hero
const orbs = [
  { id: 1, color: "violet", size: 300, top: "30%", left: "10%" },
  { id: 2, color: "blue", size: 250, top: "40%", left: "50%" },
  { id: 3, color: "cyan", size: 280, top: "35%", left: "80%" },
];

export function DefaultCover({ className }: DefaultCoverProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        // Base gradient background
        "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
        className
      )}
    >
      {/* Animated lens flare orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className={cn(
            "absolute rounded-full pointer-events-none",
            `lens-flare-orb-${orb.color}`
          )}
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            // Offset animation start for visual interest
            animationDelay: `${orb.id * 0.5}s`,
          }}
        />
      ))}

      {/* Subtle dot pattern overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-[0.08]",
          "bg-[radial-gradient(circle,_rgba(255,255,255,0.8)_1px,_transparent_1px)]",
          "bg-[length:16px_16px]"
        )}
      />

      {/* Top-to-bottom gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
    </div>
  );
}
