"use client";

/**
 * Beta Application Step
 *
 * Step 5: Apply for beta tester program.
 * Collects motivation, experience level, and use case.
 * This is a skippable step.
 */

import { useEffect } from "react";
import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { WizardNavigation } from "../wizard-navigation";
import { StepWrapper, StepInfoBox } from "../shared/step-wrapper";
import { useAuth } from "@/components/providers/auth-provider";
import { EXPERIENCE_LEVELS } from "@/types/beta";
import type { ExperienceLevel } from "@/types/onboarding";

export function BetaApplyStep() {
  const { user } = useAuth();
  const { data, updateData, nextStep, setError } = useWizard();

  // Skip if user is already a beta tester
  useEffect(() => {
    if (user?.isBetaTester) {
      nextStep();
    }
  }, [user?.isBetaTester, nextStep]);

  const handleNext = async (): Promise<boolean> => {
    // If no motivation entered, skip application
    if (!data.betaMotivation.trim()) {
      return true;
    }

    // Validate if user is filling out the form
    if (data.betaMotivation.trim().length < 20) {
      setError("Please provide more detail about why you want to join the beta program");
      return false;
    }

    if (!data.betaExperienceLevel) {
      setError("Please select your experience level");
      return false;
    }

    // Submit beta application
    try {
      const response = await fetch("/api/beta/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          motivation: data.betaMotivation.trim(),
          experienceLevel: data.betaExperienceLevel,
          useCase: data.betaUseCase.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit application");
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
      return false;
    }
  };

  // If already a beta tester, show success state
  if (user?.isBetaTester) {
    return (
      <StepWrapper>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <span className="text-3xl">🎉</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            You&apos;re a Beta Tester!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You already have access to beta features.
          </p>
        </div>
        <WizardNavigation nextLabel="Finish Setup" />
      </StepWrapper>
    );
  }

  return (
    <StepWrapper>
      <div className="space-y-3">
        <StepInfoBox>
          <div className="flex items-start gap-2">
            <span className="text-base">🚀</span>
            <p className="text-xs">
              <span className="font-medium">Join the Beta Program</span> - Get early access to new features and help shape Claude Insider.
            </p>
          </div>
        </StepInfoBox>

        {/* Motivation */}
        <div>
          <label
            htmlFor="betaMotivation"
            className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5"
          >
            Why join the beta? <span className="text-red-500">*</span>
          </label>
          <textarea
            id="betaMotivation"
            value={data.betaMotivation}
            onChange={(e) => updateData({ betaMotivation: e.target.value })}
            rows={2}
            maxLength={500}
            className={cn(
              "w-full px-3 py-2 rounded-lg resize-none text-sm",
              "bg-white dark:bg-gray-900",
              "border border-gray-200 dark:border-gray-700",
              "text-gray-900 dark:text-white",
              "placeholder-gray-400 dark:placeholder-gray-500",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-colors duration-200"
            )}
            placeholder="What excites you about testing new features?"
          />
          <p className="text-xs text-gray-400 text-right">
            {data.betaMotivation.length}/500
          </p>
        </div>

        {/* Experience level and Use case in 2-column layout on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Experience level */}
          <div>
            <label
              htmlFor="betaExperienceLevel"
              className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5"
            >
              Experience level <span className="text-red-500">*</span>
            </label>
            <select
              id="betaExperienceLevel"
              value={data.betaExperienceLevel}
              onChange={(e) =>
                updateData({
                  betaExperienceLevel: e.target.value as ExperienceLevel | "",
                })
              }
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-white dark:bg-gray-900",
                "border border-gray-200 dark:border-gray-700",
                "text-gray-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors duration-200"
              )}
            >
              <option value="">Select level</option>
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Use case */}
          <div>
            <label
              htmlFor="betaUseCase"
              className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5"
            >
              How do you use Claude? <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="betaUseCase"
              type="text"
              value={data.betaUseCase}
              onChange={(e) => updateData({ betaUseCase: e.target.value })}
              maxLength={300}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-white dark:bg-gray-900",
                "border border-gray-200 dark:border-gray-700",
                "text-gray-900 dark:text-white",
                "placeholder-gray-400 dark:placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors duration-200"
              )}
              placeholder="Coding, writing, research..."
            />
          </div>
        </div>
      </div>

      <WizardNavigation
        onNext={handleNext}
        showSkip
        skipLabel="Skip, finish setup"
        nextLabel={data.betaMotivation.trim() ? "Submit Application" : "Finish Setup"}
      />
    </StepWrapper>
  );
}
