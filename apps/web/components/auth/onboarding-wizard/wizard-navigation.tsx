"use client";

/**
 * Wizard Navigation
 *
 * Back, Next, Skip, and Complete buttons for wizard navigation.
 * Handles different states: loading, disabled, skippable steps.
 */

import { cn } from "@/lib/design-system";
import { useWizard } from "./wizard-context";

interface WizardNavigationProps {
  onNext?: () => Promise<boolean> | boolean;
  onSkip?: () => void;
  showSkip?: boolean;
  nextLabel?: string;
  skipLabel?: string;
}

export function WizardNavigation({
  onNext,
  onSkip,
  showSkip = false,
  nextLabel,
  skipLabel = "Skip for now",
}: WizardNavigationProps) {
  const {
    currentStep,
    steps,
    prevStep,
    nextStep,
    canGoPrev,
    isLastStep,
    isSubmitting,
    setIsSubmitting,
    setError,
    onComplete,
  } = useWizard();

  const currentStepConfig = steps[currentStep];
  const effectiveShowSkip = showSkip || currentStepConfig?.skippable;
  const effectiveNextLabel =
    nextLabel || (isLastStep ? "Complete Setup" : "Continue");

  const handleNext = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Run custom validation/save logic if provided
      if (onNext) {
        const canProceed = await onNext();
        if (!canProceed) {
          setIsSubmitting(false);
          return;
        }
      }

      if (isLastStep) {
        onComplete();
      } else {
        nextStep();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    if (isLastStep) {
      onComplete();
    } else {
      nextStep();
    }
  };

  return (
    <div className="flex items-center gap-3 pt-4">
      {/* Back button */}
      {canGoPrev && (
        <button
          type="button"
          onClick={prevStep}
          disabled={isSubmitting}
          className={cn(
            "px-4 py-2.5 rounded-lg text-sm font-medium",
            "text-gray-600 dark:text-gray-400",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition-colors duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </span>
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Skip button */}
      {effectiveShowSkip && (
        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className={cn(
            "px-4 py-2.5 rounded-lg text-sm font-medium",
            "text-gray-500 dark:text-gray-400",
            "hover:text-gray-700 dark:hover:text-gray-300",
            "transition-colors duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {skipLabel}
        </button>
      )}

      {/* Next/Complete button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={isSubmitting}
        className={cn(
          "px-6 py-2.5 rounded-lg text-sm font-semibold",
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "text-white shadow-lg shadow-blue-500/25",
          "hover:opacity-90 hover:-translate-y-0.5",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {isLastStep ? "Completing..." : "Saving..."}
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            {effectiveNextLabel}
            {!isLastStep && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </span>
        )}
      </button>
    </div>
  );
}
