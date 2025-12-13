"use client";

/**
 * Points Popup Component
 *
 * Animated popup showing points earned for an action.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/design-system";

interface PointsPopupProps {
  points: number;
  action: string;
  bonus?: number;
  onComplete?: () => void;
}

export function PointsPopup({ points, action, bonus, onComplete }: PointsPopupProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start animation
    requestAnimationFrame(() => setIsAnimating(true));

    // Hide after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 right-4 z-50",
        "pointer-events-none",
        "transition-all duration-500",
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div
        className={cn(
          "px-4 py-3 rounded-xl",
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "shadow-lg shadow-blue-500/25",
          "text-white"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl animate-bounce">⭐</div>
          <div>
            <div className="text-lg font-bold">
              +{points} points
              {bonus && bonus > 0 && (
                <span className="ml-1 text-sm font-normal text-cyan-200">
                  (+{bonus}% streak bonus)
                </span>
              )}
            </div>
            <div className="text-sm text-blue-100">{action}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing points popups
interface PointsNotification {
  id: string;
  points: number;
  action: string;
  bonus?: number;
}

export function usePointsNotifications() {
  const [notifications, setNotifications] = useState<PointsNotification[]>([]);

  const showPoints = (points: number, action: string, bonus?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, points, action, bonus }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    showPoints,
    removeNotification,
  };
}

// Container component for rendering multiple popups
export function PointsPopupContainer({
  notifications,
  onRemove,
}: {
  notifications: PointsNotification[];
  onRemove: (id: string) => void;
}) {
  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ bottom: `${96 + index * 80}px` }}
          className="fixed right-4 z-50"
        >
          <PointsPopup
            points={notification.points}
            action={notification.action}
            bonus={notification.bonus}
            onComplete={() => onRemove(notification.id)}
          />
        </div>
      ))}
    </>
  );
}
