"use client";

/**
 * Bot Challenge Modal
 *
 * User-facing verification modal that appears when suspicious
 * activity is detected (low trust score, high request rate, etc.).
 *
 * Features:
 * - Multiple challenge types (slider, math)
 * - Adaptive difficulty based on trust score
 * - Bypass for authenticated users
 * - Visual feedback and animations
 * - Accessibility compliant
 */

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import {
  SliderPuzzle,
  type SliderMetadata,
} from "@/components/security/slider-puzzle";
import {
  ShieldCheckIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  XIcon,
  UserCheckIcon,
} from "lucide-react";

// Challenge types
export type ChallengeType = "slider" | "math";

// Challenge difficulty
export type ChallengeDifficulty = "easy" | "medium" | "hard";

interface BotChallengeProps {
  /** Whether the challenge is visible */
  isOpen: boolean;
  /** Callback when challenge is completed successfully */
  onSuccess: (token: string, metadata: Record<string, unknown>) => void;
  /** Callback when challenge is dismissed or bypassed */
  onDismiss: () => void;
  /** Callback when challenge is failed (suspicious activity) */
  onFailure?: (reason: string) => void;
  /** Challenge type to display */
  challengeType?: ChallengeType;
  /** Difficulty level */
  difficulty?: ChallengeDifficulty;
  /** Whether user is signed in (can bypass) */
  isSignedIn?: boolean;
  /** User's current trust score (0-100) */
  trustScore?: number;
  /** Reason for showing challenge */
  reason?: string;
}

// Math challenge question
interface MathQuestion {
  question: string;
  answer: number;
  difficulty: ChallengeDifficulty;
}

// Generate math question
function generateMathQuestion(difficulty: ChallengeDifficulty): MathQuestion {
  let a: number, b: number, answer: number, question: string;

  switch (difficulty) {
    case "easy":
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a + b;
      question = `${a} + ${b} = ?`;
      break;

    case "medium":
      a = Math.floor(Math.random() * 20) + 5;
      b = Math.floor(Math.random() * 10) + 1;
      if (Math.random() > 0.5) {
        answer = a + b;
        question = `${a} + ${b} = ?`;
      } else {
        answer = a - b;
        question = `${a} - ${b} = ?`;
      }
      break;

    case "hard":
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
      question = `${a} × ${b} = ?`;
      break;
  }

  return { question, answer, difficulty };
}

export function BotChallenge({
  isOpen,
  onSuccess,
  onDismiss,
  onFailure,
  challengeType = "slider",
  difficulty = "easy",
  isSignedIn = false,
  trustScore = 50,
  reason,
}: BotChallengeProps) {
  const [currentChallenge, setCurrentChallenge] =
    useState<ChallengeType>(challengeType);
  const [mathQuestion, setMathQuestion] = useState<MathQuestion | null>(null);
  const [mathAnswer, setMathAnswer] = useState("");
  const [mathError, setMathError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Focus trap for modal
  const { containerRef } = useFocusTrap({
    enabled: isOpen,
    onEscape: isSignedIn ? onDismiss : undefined,
    closeOnEscape: isSignedIn,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize math question
  useEffect(() => {
    if (currentChallenge === "math" && isOpen) {
      setMathQuestion(generateMathQuestion(difficulty));
      setMathAnswer("");
      setMathError(null);
    }
  }, [currentChallenge, difficulty, isOpen]);

  // Generate challenge token
  const generateToken = useCallback(() => {
    // In production, this would be cryptographically signed
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return btoa(`${timestamp}:${random}:verified`);
  }, []);

  // Handle slider success
  const handleSliderSuccess = useCallback(
    (metadata: SliderMetadata) => {
      const token = generateToken();
      onSuccess(token, {
        type: "slider",
        ...metadata,
      });
    },
    [generateToken, onSuccess]
  );

  // Handle slider suspicious
  const handleSliderSuspicious = useCallback(
    (reason: string) => {
      setAttemptCount((prev) => prev + 1);
      if (attemptCount >= 2) {
        // Switch to math challenge after failed attempts
        setCurrentChallenge("math");
        setMathQuestion(generateMathQuestion(difficulty));
      }
      onFailure?.(reason);
    },
    [attemptCount, difficulty, onFailure]
  );

  // Handle math submit
  const handleMathSubmit = useCallback(() => {
    if (!mathQuestion || !mathAnswer) return;

    const userAnswer = parseInt(mathAnswer, 10);
    if (isNaN(userAnswer)) {
      setMathError("Please enter a valid number");
      return;
    }

    if (userAnswer === mathQuestion.answer) {
      const token = generateToken();
      onSuccess(token, {
        type: "math",
        attempts: attemptCount + 1,
      });
    } else {
      setMathError("Incorrect answer, try again");
      setAttemptCount((prev) => prev + 1);
      setMathAnswer("");

      if (attemptCount >= 3) {
        // Generate new question after too many failures
        setMathQuestion(generateMathQuestion(difficulty));
        setMathError("Too many attempts. Here's a new question.");
      }
    }
  }, [mathQuestion, mathAnswer, attemptCount, difficulty, generateToken, onSuccess]);

  // Handle bypass for signed-in users
  const handleBypass = useCallback(async () => {
    if (!isSignedIn) return;

    setIsVerifying(true);
    try {
      // Verify with server that user is actually signed in
      const response = await fetch("/api/challenge/verify-session", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.token, {
          type: "session_bypass",
          trustScore,
        });
      } else {
        // Session invalid, require challenge
        setIsVerifying(false);
      }
    } catch {
      setIsVerifying(false);
    }
  }, [isSignedIn, trustScore, onSuccess]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-title"
    >
      <div
        ref={containerRef}
        className={cn(
          "relative w-full max-w-md mx-4 p-6 rounded-2xl",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-2xl"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-amber-500/10">
            <ShieldCheckIcon className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2
              id="challenge-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Security Check
            </h2>
            <p className="text-sm text-gray-500">
              {reason || "Please verify you're human"}
            </p>
          </div>
          {isSignedIn && (
            <button
              onClick={onDismiss}
              className="ml-auto p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Challenge Content */}
        <div className="mb-6">
          {currentChallenge === "slider" && (
            <SliderPuzzle
              onSuccess={handleSliderSuccess}
              onSuspicious={handleSliderSuspicious}
              difficulty={difficulty}
              instruction="Slide to unlock"
            />
          )}

          {currentChallenge === "math" && mathQuestion && (
            <div className="space-y-4">
              <p className="text-center text-gray-600 dark:text-gray-400">
                Solve this simple math problem:
              </p>

              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {mathQuestion.question}
                </p>

                <input
                  type="number"
                  value={mathAnswer}
                  onChange={(e) => {
                    setMathAnswer(e.target.value);
                    setMathError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleMathSubmit()}
                  placeholder="Your answer"
                  className={cn(
                    "w-32 px-4 py-3 text-center text-xl font-semibold rounded-lg",
                    "bg-gray-100 dark:bg-gray-800",
                    "border-2 transition-colors",
                    mathError
                      ? "border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-blue-500",
                    "text-gray-900 dark:text-white",
                    "focus:outline-none"
                  )}
                  autoFocus
                />

                {mathError && (
                  <p className="mt-2 text-sm text-red-500">{mathError}</p>
                )}

                <button
                  onClick={handleMathSubmit}
                  disabled={!mathAnswer}
                  className={cn(
                    "mt-4 px-6 py-2 font-medium rounded-lg transition-colors",
                    "bg-blue-500 text-white hover:bg-blue-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Verify
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bypass for signed-in users */}
        {isSignedIn && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={handleBypass}
              disabled={isVerifying}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg",
                "text-sm font-medium transition-colors",
                "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                "hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {isVerifying ? (
                <>
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <UserCheckIcon className="w-4 h-4" />
                  Skip - I&apos;m signed in
                </>
              )}
            </button>
          </div>
        )}

        {/* Attempt counter */}
        {attemptCount > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-500">
            <AlertTriangleIcon className="w-3 h-3" />
            <span>Attempts: {attemptCount}/3</span>
          </div>
        )}

        {/* Switch challenge type */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setCurrentChallenge(
                currentChallenge === "slider" ? "math" : "slider"
              );
              setAttemptCount(0);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Try a different challenge
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Hook for showing bot challenge when needed
 */
export function useBotChallenge() {
  const [isOpen, setIsOpen] = useState(false);
  const [challengeConfig, setChallengeConfig] = useState<{
    type: ChallengeType;
    difficulty: ChallengeDifficulty;
    reason?: string;
  }>({
    type: "slider",
    difficulty: "easy",
  });
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const showChallenge = useCallback(
    (
      config?: Partial<typeof challengeConfig>,
      onSuccess?: () => void
    ) => {
      setChallengeConfig((prev) => ({ ...prev, ...config }));
      if (onSuccess) {
        setPendingAction(() => onSuccess);
      }
      setIsOpen(true);
    },
    []
  );

  const handleSuccess = useCallback(
    (token: string, _metadata: Record<string, unknown>) => {
      setIsOpen(false);
      // Store token for subsequent requests
      if (typeof window !== "undefined") {
        sessionStorage.setItem("challenge_token", token);
        sessionStorage.setItem(
          "challenge_expires",
          (Date.now() + 30 * 60 * 1000).toString()
        ); // 30 min expiry
      }
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    },
    [pendingAction]
  );

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  const isVerified = useCallback(() => {
    if (typeof window === "undefined") return false;
    const token = sessionStorage.getItem("challenge_token");
    const expires = sessionStorage.getItem("challenge_expires");
    if (!token || !expires) return false;
    return Date.now() < parseInt(expires, 10);
  }, []);

  return {
    isOpen,
    showChallenge,
    handleSuccess,
    handleDismiss,
    isVerified,
    challengeConfig,
  };
}
