"use client";

/**
 * Step Wrapper
 *
 * Provides consistent layout and styling for each wizard step.
 * Includes title, description, content area, and error display.
 */

import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";

interface StepWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function StepWrapper({
  children,
  title,
  description,
  className,
}: StepWrapperProps) {
  const { currentStep, steps, error } = useWizard();
  const currentStepConfig = steps[currentStep];

  const effectiveTitle = title || currentStepConfig?.title;
  const effectiveDescription = description || currentStepConfig?.description;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Step header */}
      {(effectiveTitle || effectiveDescription) && (
        <div className="mb-6">
          {effectiveTitle && (
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {effectiveTitle}
            </h2>
          )}
          {effectiveDescription && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {effectiveDescription}
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}

/**
 * Section divider for organizing step content
 */
export function StepSection({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/**
 * Info box for tips or additional context
 */
export function StepInfoBox({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "warning" | "success";
}) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg text-sm",
        variant === "info" &&
          "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        variant === "warning" &&
          "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        variant === "success" &&
          "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
      )}
    >
      {children}
    </div>
  );
}
