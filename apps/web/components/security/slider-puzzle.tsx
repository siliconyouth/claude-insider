"use client";

/**
 * Slider Puzzle Component
 *
 * A simple, accessible verification challenge where users
 * drag a slider to complete verification.
 *
 * Features:
 * - Touch and mouse support
 * - Keyboard accessible
 * - Visual feedback on completion
 * - Timing analysis (bots often complete too fast or too perfectly)
 * - Random target position for unpredictability
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { LockIcon, UnlockIcon, CheckIcon } from "lucide-react";

interface SliderPuzzleProps {
  /** Callback when verification succeeds */
  onSuccess: (metadata: SliderMetadata) => void;
  /** Callback when verification fails (too fast, too precise) */
  onSuspicious?: (reason: string) => void;
  /** Difficulty level affects target size and tolerance */
  difficulty?: "easy" | "medium" | "hard";
  /** Custom instruction text */
  instruction?: string;
  /** className */
  className?: string;
}

export interface SliderMetadata {
  /** Time taken to complete in ms */
  completionTime: number;
  /** Number of position changes (should be > 0) */
  moveCount: number;
  /** Average movement speed (pixels/ms) */
  averageSpeed: number;
  /** Whether mouse was used */
  usedMouse: boolean;
  /** Whether touch was used */
  usedTouch: boolean;
  /** Target position that was reached */
  targetPosition: number;
}

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: { targetWidth: 48, tolerance: 10, minTime: 300 },
  medium: { targetWidth: 36, tolerance: 6, minTime: 500 },
  hard: { targetWidth: 24, tolerance: 4, minTime: 800 },
};

export function SliderPuzzle({
  onSuccess,
  onSuspicious,
  difficulty = "easy",
  instruction = "Slide to verify",
  className,
}: SliderPuzzleProps) {
  // State
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [targetPosition, setTargetPosition] = useState(0);

  // Refs for tracking
  const trackRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const moveCountRef = useRef<number>(0);
  const totalDistanceRef = useRef<number>(0);
  const lastPositionRef = useRef<number>(0);
  const inputMethodRef = useRef<{ mouse: boolean; touch: boolean }>({
    mouse: false,
    touch: false,
  });

  // Settings based on difficulty
  const settings = DIFFICULTY_SETTINGS[difficulty];

  // Initialize target position
  useEffect(() => {
    // Random target between 70% and 95% of track width
    const randomTarget = 70 + Math.random() * 25;
    setTargetPosition(randomTarget);
  }, []);

  // Calculate position from event
  const getPositionFromEvent = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return 0;

      const rect = trackRef.current.getBoundingClientRect();
      const trackWidth = rect.width - settings.targetWidth;
      const relativeX = clientX - rect.left - settings.targetWidth / 2;
      const percentage = (relativeX / trackWidth) * 100;

      return Math.max(0, Math.min(100, percentage));
    },
    [settings.targetWidth]
  );

  // Check if position is within target
  const isWithinTarget = useCallback(
    (pos: number): boolean => {
      return Math.abs(pos - targetPosition) <= settings.tolerance;
    },
    [targetPosition, settings.tolerance]
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (clientX: number, isMouse: boolean) => {
      if (isComplete) return;

      setIsDragging(true);
      startTimeRef.current = Date.now();
      moveCountRef.current = 0;
      totalDistanceRef.current = 0;
      lastPositionRef.current = position;

      if (isMouse) {
        inputMethodRef.current.mouse = true;
      } else {
        inputMethodRef.current.touch = true;
      }

      const newPosition = getPositionFromEvent(clientX);
      setPosition(newPosition);
    },
    [isComplete, position, getPositionFromEvent]
  );

  // Handle drag move
  const handleDragMove = useCallback(
    (clientX: number) => {
      if (!isDragging || isComplete) return;

      const newPosition = getPositionFromEvent(clientX);
      const distance = Math.abs(newPosition - lastPositionRef.current);

      moveCountRef.current += 1;
      totalDistanceRef.current += distance;
      lastPositionRef.current = newPosition;

      setPosition(newPosition);

      // Check if reached target
      if (isWithinTarget(newPosition)) {
        const completionTime = Date.now() - startTimeRef.current;

        // Check for suspicious behavior
        if (completionTime < settings.minTime) {
          onSuspicious?.("Completed too quickly");
          return;
        }

        if (moveCountRef.current < 3) {
          onSuspicious?.("Too few movements");
          return;
        }

        // Calculate average speed
        const averageSpeed = totalDistanceRef.current / completionTime;

        // Perfectly consistent speed is suspicious
        // (Would need more sophisticated analysis in production)

        setIsComplete(true);
        setIsDragging(false);

        const metadata: SliderMetadata = {
          completionTime,
          moveCount: moveCountRef.current,
          averageSpeed,
          usedMouse: inputMethodRef.current.mouse,
          usedTouch: inputMethodRef.current.touch,
          targetPosition,
        };

        onSuccess(metadata);
      }
    },
    [
      isDragging,
      isComplete,
      getPositionFromEvent,
      isWithinTarget,
      settings.minTime,
      onSuspicious,
      onSuccess,
      targetPosition,
    ]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isComplete) {
      setPosition(0);
    }
    setIsDragging(false);
  }, [isComplete]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleDragStart(touch.clientX, false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      handleDragMove(touch.clientX);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComplete) return;

    const step = 2;
    let newPosition = position;

    switch (e.key) {
      case "ArrowRight":
        newPosition = Math.min(100, position + step);
        break;
      case "ArrowLeft":
        newPosition = Math.max(0, position - step);
        break;
      case " ":
      case "Enter":
        if (isWithinTarget(position)) {
          setIsComplete(true);
          onSuccess({
            completionTime: Date.now() - startTimeRef.current,
            moveCount: moveCountRef.current,
            averageSpeed: 0,
            usedMouse: false,
            usedTouch: false,
            targetPosition,
          });
        }
        return;
      default:
        return;
    }

    e.preventDefault();
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    moveCountRef.current += 1;
    setPosition(newPosition);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Instruction */}
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        {isComplete ? "Verified!" : instruction}
      </p>

      {/* Track */}
      <div
        ref={trackRef}
        className={cn(
          "relative h-12 rounded-full overflow-hidden",
          "bg-gray-200 dark:bg-gray-800",
          "border-2 transition-colors",
          isComplete
            ? "border-green-500"
            : isDragging
            ? "border-blue-500"
            : "border-gray-300 dark:border-gray-700"
        )}
      >
        {/* Target zone indicator */}
        <div
          className={cn(
            "absolute top-0 bottom-0 transition-colors",
            isComplete
              ? "bg-green-500/30"
              : isWithinTarget(position)
              ? "bg-blue-500/30"
              : "bg-gray-300/30 dark:bg-gray-700/30"
          )}
          style={{
            left: `${targetPosition - settings.tolerance}%`,
            width: `${settings.tolerance * 2}%`,
          }}
        />

        {/* Progress fill */}
        <div
          className={cn(
            "absolute top-0 left-0 bottom-0 transition-colors",
            isComplete ? "bg-green-500/20" : "bg-blue-500/20"
          )}
          style={{ width: `${position}%` }}
        />

        {/* Slider handle */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Verification slider"
          aria-valuenow={Math.round(position)}
          aria-valuemin={0}
          aria-valuemax={100}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          className={cn(
            "absolute top-1 bottom-1 rounded-full",
            "flex items-center justify-center",
            "cursor-grab active:cursor-grabbing",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
            isComplete
              ? "bg-green-500"
              : isDragging
              ? "bg-blue-600"
              : "bg-blue-500 hover:bg-blue-600"
          )}
          style={{
            left: `calc(${position}% - ${settings.targetWidth / 2}px)`,
            width: `${settings.targetWidth}px`,
          }}
        >
          {isComplete ? (
            <CheckIcon className="w-5 h-5 text-white" />
          ) : isDragging ? (
            <UnlockIcon className="w-4 h-4 text-white" />
          ) : (
            <LockIcon className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Target icon */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full",
            "flex items-center justify-center",
            "transition-colors pointer-events-none",
            isComplete
              ? "bg-green-500/50 text-green-100"
              : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
          )}
          style={{ left: `calc(${targetPosition}% - 12px)` }}
        >
          <UnlockIcon className="w-3 h-3" />
        </div>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2 text-xs">
        {isComplete ? (
          <span className="flex items-center gap-1 text-green-500">
            <CheckIcon className="w-3 h-3" />
            Verification complete
          </span>
        ) : (
          <span className="text-gray-500">
            Drag the slider to the unlock position
          </span>
        )}
      </div>
    </div>
  );
}
