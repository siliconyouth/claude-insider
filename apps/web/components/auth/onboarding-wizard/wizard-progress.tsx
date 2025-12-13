"use client";

/**
 * Wizard Progress Indicator
 *
 * Displays step progress with icons, labels, and connecting lines.
 * Shows current, completed, and upcoming steps visually.
 */

import { cn } from "@/lib/design-system";
import { useWizard } from "./wizard-context";

export function WizardProgress() {
  const { currentStep, totalSteps, steps } = useWizard();

  return (
    <div className="px-6 py-4">
      {/* Progress bar */}
      <div className="relative">
        {/* Background track */}
        <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full">
          {/* Filled progress */}
          <div
            className="h-1 bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentStep + 1) / totalSteps) * 100}%`,
            }}
          />
        </div>

        {/* Step dots */}
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                index < currentStep && "bg-blue-600 scale-100",
                index === currentStep &&
                  "bg-gradient-to-r from-violet-600 to-cyan-600 scale-125 ring-4 ring-blue-500/20",
                index > currentStep && "bg-gray-300 dark:bg-gray-700 scale-100"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step info */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{steps[currentStep]?.icon}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {steps[currentStep]?.title}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact progress for mobile/narrow views
 */
export function WizardProgressCompact() {
  const { currentStep, totalSteps, steps } = useWizard();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-lg">{steps[currentStep]?.icon}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
          {steps[currentStep]?.title}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index <= currentStep
                ? "bg-blue-600"
                : "bg-gray-300 dark:bg-gray-700"
            )}
          />
        ))}
      </div>
    </div>
  );
}
