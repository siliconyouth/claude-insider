"use client";

/**
 * Donor Badge Modal
 *
 * A special celebratory modal for donor achievements.
 * Features:
 * - Heart particle effects
 * - Tier-specific colors and animations
 * - Personal thank you message from Vladimir
 * - Animated badge reveal
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useSoundEffects } from "@/hooks/use-sound-effects";

// ============================================
// TYPES
// ============================================

export type DonorTier = "bronze" | "silver" | "gold" | "platinum";

export interface DonorBadgeInfo {
  tier: DonorTier;
  amount: number;
  isFirstDonation?: boolean;
}

interface DonorBadgeContextType {
  showDonorBadge: (info: DonorBadgeInfo) => void;
  hideDonorBadge: () => void;
}

// ============================================
// TIER CONFIGURATION
// ============================================

const TIER_CONFIG: Record<
  DonorTier,
  {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    gradientFrom: string;
    gradientTo: string;
    particleColors: string[];
  }
> = {
  bronze: {
    name: "Bronze Supporter",
    icon: "🥉",
    color: "text-amber-700 dark:text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    borderColor: "border-amber-500 dark:border-amber-600",
    glowColor: "shadow-amber-500/30",
    gradientFrom: "from-amber-600",
    gradientTo: "to-amber-800",
    particleColors: ["bg-amber-400", "bg-amber-500", "bg-orange-400", "bg-yellow-600"],
  },
  silver: {
    name: "Silver Supporter",
    icon: "🥈",
    color: "text-gray-600 dark:text-gray-300",
    bgColor: "bg-gray-50 dark:bg-gray-900/50",
    borderColor: "border-gray-400 dark:border-gray-500",
    glowColor: "shadow-gray-400/40",
    gradientFrom: "from-gray-400",
    gradientTo: "to-gray-600",
    particleColors: ["bg-gray-300", "bg-gray-400", "bg-slate-400", "bg-zinc-400"],
  },
  gold: {
    name: "Gold Supporter",
    icon: "🥇",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
    borderColor: "border-yellow-500 dark:border-yellow-500",
    glowColor: "shadow-yellow-500/50",
    gradientFrom: "from-yellow-400",
    gradientTo: "to-yellow-600",
    particleColors: ["bg-yellow-300", "bg-yellow-400", "bg-amber-400", "bg-orange-400"],
  },
  platinum: {
    name: "Platinum Supporter",
    icon: "💎",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-950/50 dark:via-blue-950/50 dark:to-cyan-950/50",
    borderColor: "border-violet-500 dark:border-violet-400",
    glowColor: "shadow-violet-500/50",
    gradientFrom: "from-violet-500",
    gradientTo: "to-cyan-500",
    particleColors: ["bg-violet-400", "bg-blue-400", "bg-cyan-400", "bg-pink-400", "bg-purple-400"],
  },
};

// ============================================
// CONTEXT
// ============================================

const DonorBadgeContext = createContext<DonorBadgeContextType | null>(null);

// ============================================
// HEART PARTICLES
// ============================================

function HeartParticles({ tier }: { tier: DonorTier }) {
  const config = TIER_CONFIG[tier];
  const particleCount = tier === "platinum" ? 60 : tier === "gold" ? 45 : tier === "silver" ? 35 : 25;

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.5 + Math.random() * 2,
        color: config.particleColors[Math.floor(Math.random() * config.particleColors.length)],
        size: 8 + Math.random() * 12,
        rotation: Math.random() * 360,
      })),
    [particleCount, config.particleColors]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn("absolute", particle.color, "animate-confetti")}
          style={{
            left: `${particle.x}%`,
            top: "-20px",
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            transform: `rotate(${particle.rotation}deg)`,
            clipPath: "path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z')",
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// GLOW RINGS FOR PLATINUM
// ============================================

function PlatinumGlowRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="absolute w-96 h-96 rounded-full bg-violet-500/20 animate-ping" />
      <div
        className="absolute w-80 h-80 rounded-full bg-blue-500/20 animate-ping"
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className="absolute w-64 h-64 rounded-full bg-cyan-500/20 animate-ping"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}

// ============================================
// DONOR BADGE MODAL
// ============================================

interface DonorBadgeModalProps {
  info: DonorBadgeInfo;
  onClose: () => void;
}

function DonorBadgeModal({ info, onClose }: DonorBadgeModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const sounds = useSoundEffects();
  const config = TIER_CONFIG[info.tier];

  // Animate in
  useEffect(() => {
    // Play celebration sound
    if (info.tier === "platinum") {
      sounds.playLevelUp();
    } else if (info.tier === "gold") {
      sounds.playAchievement();
    } else {
      sounds.playComplete();
    }

    setShowParticles(true);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [sounds, info.tier]);

  // Close handler
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Auto-dismiss
  useEffect(() => {
    const dismissTime = info.tier === "platinum" ? 10000 : info.tier === "gold" ? 8000 : 6000;
    const timer = setTimeout(handleClose, dismissTime);
    return () => clearTimeout(timer);
  }, [info.tier, handleClose]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donor-badge-title"
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Glow rings for platinum */}
      {info.tier === "platinum" && isVisible && <PlatinumGlowRings />}

      {/* Heart particles */}
      {showParticles && isVisible && <HeartParticles tier={info.tier} />}

      {/* Modal */}
      <div
        className={cn(
          "relative max-w-md w-full mx-4 rounded-2xl p-6 sm:p-8 border-2",
          "transform transition-all duration-500 ease-out",
          config.bgColor,
          config.borderColor,
          `shadow-2xl ${config.glowColor}`,
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-90 opacity-0 -translate-y-8"
        )}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Badge header */}
          <div
            className={cn(
              "inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4",
              "text-white shadow-lg bg-gradient-to-r",
              config.gradientFrom,
              config.gradientTo
            )}
          >
            {info.isFirstDonation ? "First Donation!" : "Thank You!"}
          </div>

          {/* Tier icon with animation */}
          <div
            className={cn(
              "w-28 h-28 mx-auto mb-5 rounded-2xl flex items-center justify-center",
              "shadow-xl bg-white dark:bg-gray-800",
              "animate-bounce-gentle"
            )}
          >
            <span className="text-6xl">{config.icon}</span>
          </div>

          {/* Title */}
          <h2
            id="donor-badge-title"
            className={cn(
              "text-2xl sm:text-3xl font-bold mb-2",
              "text-gray-900 dark:text-white"
            )}
          >
            {config.name}
          </h2>

          {/* Amount */}
          <p className={cn("text-lg font-semibold mb-4", config.color)}>
            ${info.amount.toFixed(2)} contribution
          </p>

          {/* Personal thank you */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
              &ldquo;Thank you so much for supporting Claude Insider! Your generosity helps keep this project free for everyone. You&apos;re now part of our amazing community of supporters.&rdquo;
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">
              — Vladimir Dukelic
            </p>
          </div>

          {/* Benefits */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium mb-1">Your badge is now visible on your profile!</p>
            <p>You&apos;ve earned <span className={cn("font-bold", config.color)}>
              {info.tier === "platinum" ? "+1500" : info.tier === "gold" ? "+500" : info.tier === "silver" ? "+250" : "+100"} XP
            </span></p>
          </div>
        </div>

        {/* Shimmer effect for platinum */}
        {info.tier === "platinum" && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        )}
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(content, document.body);
}

// ============================================
// PROVIDER
// ============================================

export function DonorBadgeProvider({ children }: { children: ReactNode }) {
  const [currentBadge, setCurrentBadge] = useState<DonorBadgeInfo | null>(null);

  const showDonorBadge = useCallback((info: DonorBadgeInfo) => {
    setCurrentBadge(info);
  }, []);

  const hideDonorBadge = useCallback(() => {
    setCurrentBadge(null);
  }, []);

  return (
    <DonorBadgeContext.Provider value={{ showDonorBadge, hideDonorBadge }}>
      {children}
      {currentBadge && (
        <DonorBadgeModal info={currentBadge} onClose={hideDonorBadge} />
      )}
    </DonorBadgeContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useDonorBadge() {
  const context = useContext(DonorBadgeContext);
  if (!context) {
    return {
      showDonorBadge: () => {},
      hideDonorBadge: () => {},
    };
  }
  return context;
}

// ============================================
// UTILITY: Determine tier from amount
// ============================================

export function getDonorTierFromAmount(amount: number): DonorTier {
  if (amount >= 500) return "platinum";
  if (amount >= 100) return "gold";
  if (amount >= 50) return "silver";
  return "bronze";
}

export default DonorBadgeProvider;
