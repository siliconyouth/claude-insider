"use client";

/**
 * Achievement Notification Modal
 *
 * A celebratory modal that appears when users unlock achievements.
 * Features:
 * - Animated entrance with scale and opacity
 * - Confetti particle effects
 * - Sound effect on appearance
 * - Lucide icons for visual consistency
 * - Auto-dismiss after delay
 * - Keyboard accessible (Escape to close)
 */

import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { RARITY_CONFIG, getAchievement, type AchievementRarity } from "@/lib/achievements";
import { getPendingAchievements, clearAchievement } from "@/lib/achievement-queue";
import type { LucideIcon } from "lucide-react";

// ============================================
// TYPES
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: LucideIcon | string;
  rarity?: AchievementRarity;
  points?: number;
  category?: string;
}

interface AchievementNotificationContextType {
  showAchievement: (achievement: Achievement | string) => void;
  hideAchievement: () => void;
}

// ============================================
// CONTEXT
// ============================================

const AchievementNotificationContext = createContext<AchievementNotificationContextType | null>(null);

// ============================================
// CONFETTI PARTICLES
// ============================================

function ConfettiParticles({ rarity }: { rarity: AchievementRarity }) {
  // More particles for higher rarity
  const particleCount = rarity === "legendary" ? 80 : rarity === "epic" ? 60 : 40;

  // Rarity-specific colors
  const colorPalettes: Record<AchievementRarity, string[]> = {
    common: ["bg-gray-400", "bg-gray-500", "bg-slate-400", "bg-zinc-400"],
    rare: ["bg-blue-400", "bg-blue-500", "bg-cyan-400", "bg-sky-500", "bg-indigo-400"],
    epic: ["bg-violet-400", "bg-purple-500", "bg-fuchsia-400", "bg-pink-400", "bg-indigo-500"],
    legendary: [
      "bg-amber-400",
      "bg-yellow-400",
      "bg-orange-400",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-orange-500",
    ],
  };

  const colors = colorPalettes[rarity];

  // Memoize particles to avoid regenerating on every render
  // This fixes the React purity warning about Math.random during render
  const particles = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      size: 4 + Math.random() * 8,
      shape: Math.random() > 0.5 ? "rounded-full" : "rounded-sm",
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- colors derived from rarity, only regenerate on rarity change
    [rarity, particleCount]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn("absolute", particle.color, particle.shape, "animate-confetti")}
          style={{
            left: `${particle.x}%`,
            top: "-10px",
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            transform: `rotate(${particle.rotation}deg)`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// GLOW RINGS FOR LEGENDARY
// ============================================

function GlowRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="absolute w-96 h-96 rounded-full bg-amber-500/20 animate-ping" />
      <div
        className="absolute w-80 h-80 rounded-full bg-yellow-500/20 animate-ping"
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className="absolute w-64 h-64 rounded-full bg-orange-500/20 animate-ping"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}

// ============================================
// ACHIEVEMENT MODAL
// ============================================

interface AchievementModalProps {
  achievement: Achievement;
  onClose: () => void;
}

function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const sounds = useSoundEffects();
  const rarity = achievement.rarity || "common";
  const styles = RARITY_CONFIG[rarity];

  // Get icon component
  const IconComponent = achievement.icon;
  const isLucideIcon = typeof IconComponent === "function";

  // Animate in
  useEffect(() => {
    // Play sound based on rarity
    if (rarity === "legendary") {
      sounds.playLevelUp();
    } else if (rarity === "epic") {
      sounds.playAchievement();
    } else {
      sounds.playComplete();
    }

    // Show confetti for all achievements
    setShowConfetti(true);

    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);

    return () => clearTimeout(timer);
  }, [sounds, rarity]);

  // Close handler with exit animation - defined before effects that use it
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Auto-dismiss (longer for legendary)
  useEffect(() => {
    const dismissTime = rarity === "legendary" ? 7000 : rarity === "epic" ? 6000 : 5000;
    const timer = setTimeout(() => {
      handleClose();
    }, dismissTime);

    return () => clearTimeout(timer);
  }, [rarity, handleClose]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Render into portal
  const content = (
    <div
      className={cn("fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-20")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-title"
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Glow rings for legendary */}
      {rarity === "legendary" && isVisible && <GlowRings />}

      {/* Confetti */}
      {showConfetti && isVisible && <ConfettiParticles rarity={rarity} />}

      {/* Modal */}
      <div
        className={cn(
          "relative max-w-md w-full mx-4 rounded-2xl p-6 sm:p-8 border-2",
          "transform transition-all duration-500 ease-out",
          styles.bgColor,
          styles.borderColor,
          rarity !== "common" && `shadow-2xl ${styles.glowColor}`,
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

        {/* Header */}
        <div className="text-center">
          {/* Badge */}
          <div
            className={cn(
              "inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4",
              "text-white shadow-lg",
              rarity === "legendary"
                ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500"
                : rarity === "epic"
                ? "bg-gradient-to-r from-violet-500 to-purple-500"
                : rarity === "rare"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                : "bg-gray-500"
            )}
          >
            Achievement Unlocked!
          </div>

          {/* Icon */}
          <div
            className={cn(
              "w-24 h-24 mx-auto mb-5 rounded-2xl flex items-center justify-center",
              "shadow-xl",
              styles.iconBg,
              "animate-bounce-gentle"
            )}
          >
            {isLucideIcon ? (
              <IconComponent
                className={cn(
                  "w-12 h-12",
                  rarity === "legendary"
                    ? "text-amber-600 dark:text-amber-400"
                    : rarity === "epic"
                    ? "text-violet-600 dark:text-violet-400"
                    : rarity === "rare"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                )}
                strokeWidth={1.5}
              />
            ) : (
              <span className="text-5xl">{IconComponent || "🏆"}</span>
            )}
          </div>

          {/* Title */}
          <h2
            id="achievement-title"
            className={cn(
              "text-2xl sm:text-3xl font-bold mb-3",
              "text-gray-900 dark:text-white"
            )}
          >
            {achievement.name}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 mb-4 text-base">
            {achievement.description}
          </p>

          {/* Points & Rarity */}
          <div className="flex items-center justify-center gap-4 text-sm">
            {achievement.points && (
              <span
                className={cn(
                  "font-bold text-lg px-3 py-1 rounded-full",
                  rarity === "legendary"
                    ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                    : rarity === "epic"
                    ? "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400"
                    : rarity === "rare"
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                )}
              >
                +{achievement.points} XP
              </span>
            )}
            <span
              className={cn(
                "capitalize font-semibold px-3 py-1 rounded-full",
                styles.bgColor,
                styles.color
              )}
            >
              {rarity}
            </span>
          </div>
        </div>

        {/* Shimmer effect for legendary */}
        {rarity === "legendary" && (
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

export function AchievementNotificationProvider({ children }: { children: ReactNode }) {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [, setQueue] = useState<Achievement[]>([]); // Queue state - getter not needed, setter used internally
  const hasProcessedQueue = useRef(false);

  // Convert achievement ID to Achievement object
  const resolveAchievement = useCallback((achievementOrId: Achievement | string): Achievement | null => {
    if (typeof achievementOrId === "string") {
      const def = getAchievement(achievementOrId);
      if (!def) {
        console.warn(`Achievement not found: ${achievementOrId}`);
        return null;
      }
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        rarity: def.rarity,
        points: def.points,
        category: def.category,
      };
    }
    return achievementOrId;
  }, []);

  // Process localStorage queue on mount
  useEffect(() => {
    if (hasProcessedQueue.current) return;
    hasProcessedQueue.current = true;

    // Small delay to ensure the UI is ready
    const timer = setTimeout(() => {
      const pending = getPendingAchievements();
      if (pending.length === 0) return;

      // Convert queued IDs to Achievement objects
      const achievements: Achievement[] = [];
      for (const queued of pending) {
        const achievement = resolveAchievement(queued.id);
        if (achievement) {
          achievements.push(achievement);
          // Clear from localStorage as we're processing it
          clearAchievement(queued.id);
        }
      }

      if (achievements.length > 0) {
        // Show the first one, queue the rest
        const first = achievements[0]!;
        const rest = achievements.slice(1);
        setCurrentAchievement(first);
        if (rest.length > 0) {
          setQueue(rest);
        }
      }
    }, 500); // Delay to let the page settle after load

    return () => clearTimeout(timer);
  }, [resolveAchievement]);

  // Show achievement (queue if one is already showing)
  const showAchievement = useCallback(
    (achievementOrId: Achievement | string) => {
      const achievement = resolveAchievement(achievementOrId);
      if (!achievement) return;

      if (currentAchievement) {
        setQueue((prev) => [...prev, achievement]);
      } else {
        setCurrentAchievement(achievement);
      }
    },
    [currentAchievement, resolveAchievement]
  );

  // Hide current achievement
  const hideAchievement = useCallback(() => {
    setCurrentAchievement(null);
    // Show next in queue
    setTimeout(() => {
      setQueue((prev) => {
        const [next, ...rest] = prev;
        if (next) {
          setCurrentAchievement(next);
        }
        return rest;
      });
    }, 300);
  }, []);

  return (
    <AchievementNotificationContext.Provider value={{ showAchievement, hideAchievement }}>
      {children}
      {currentAchievement && (
        <AchievementModal achievement={currentAchievement} onClose={hideAchievement} />
      )}
    </AchievementNotificationContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAchievementNotification() {
  const context = useContext(AchievementNotificationContext);
  if (!context) {
    return {
      showAchievement: () => {},
      hideAchievement: () => {},
    };
  }
  return context;
}

export default AchievementNotificationProvider;
