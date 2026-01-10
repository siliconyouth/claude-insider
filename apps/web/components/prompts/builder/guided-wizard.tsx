"use client";

/**
 * Guided Wizard Mode
 *
 * Step-by-step wizard that walks users through filling each variable.
 * Features:
 * - One variable per step
 * - Progress indicator
 * - Back/Next navigation
 * - Summary step before completion
 * - Smart skip for optional fields
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/design-system";
import {
  XIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
  SkipForwardIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";
import {
  type GuidedWizardProps,
  type BuilderValues,
  type VariableConfig,
  variableToConfig,
  formatVariableName,
  substituteVariables,
  validateVariable,
  shouldShowVariable,
} from "./types";

// Lazy load Monaco for code input
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] bg-[#1e1e1e] rounded-lg animate-pulse flex items-center justify-center">
      <Loader2Icon className="w-5 h-5 text-gray-500 animate-spin" />
    </div>
  ),
});

export function GuidedWizard({
  promptId: _promptId,
  promptTitle,
  promptContent,
  variables,
  variableConfigs: externalConfigs,
  onComplete,
  onClose,
  initialValues = {},
}: GuidedWizardProps) {
  // ============================================================================
  // State
  // ============================================================================

  const variableConfigs = useMemo(() => {
    if (externalConfigs && externalConfigs.length > 0) {
      return externalConfigs;
    }
    return variables.map((v, i) => variableToConfig(v, i));
  }, [variables, externalConfigs]);

  const [values, setValues] = useState<BuilderValues>(() => {
    const initial: BuilderValues = {};
    for (const v of variables) {
      initial[v.name] = initialValues[v.name] || v.default_value || "";
    }
    return initial;
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const visibleConfigs = useMemo(
    () =>
      variableConfigs
        .filter((c) => shouldShowVariable(c, values))
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [variableConfigs, values]
  );

  const totalSteps = visibleConfigs.length + 1; // +1 for summary
  const currentConfig = visibleConfigs[currentStep];
  const isLastVariableStep = currentStep === visibleConfigs.length - 1;
  const isSummaryStep = currentStep === visibleConfigs.length;

  const finalContent = useMemo(
    () => substituteVariables(promptContent, values),
    [promptContent, values]
  );

  const completedSteps = useMemo(() => {
    return visibleConfigs.filter((c) => values[c.variableName]?.trim()).length;
  }, [visibleConfigs, values]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Focus input on step change
  useEffect(() => {
    if (!isSummaryStep) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isSummaryStep]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey && currentConfig?.inputType !== "textarea" && currentConfig?.inputType !== "code") {
        e.preventDefault();
        handleNext();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, values, onClose]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (isAnimating) return;

    // Validate current step
    if (currentConfig) {
      const error = validateVariable(values[currentConfig.variableName] || "", currentConfig);
      if (error) {
        setErrors((prev) => ({ ...prev, [currentConfig.variableName]: error }));
        return;
      }
    }

    if (isSummaryStep) {
      onComplete(values, finalContent);
      return;
    }

    setDirection("forward");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
      setIsAnimating(false);
    }, 200);
  }, [currentConfig, values, isSummaryStep, totalSteps, finalContent, onComplete, isAnimating]);

  const handleBack = useCallback(() => {
    if (isAnimating || currentStep === 0) return;

    setDirection("backward");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
      setIsAnimating(false);
    }, 200);
  }, [currentStep, isAnimating]);

  const handleSkip = useCallback(() => {
    if (isAnimating) return;
    if (currentConfig && !currentConfig.isRequired) {
      setDirection("forward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
        setIsAnimating(false);
      }, 200);
    }
  }, [currentConfig, totalSteps, isAnimating]);

  const goToStep = useCallback(
    (step: number) => {
      if (isAnimating || step === currentStep) return;
      setDirection(step > currentStep ? "forward" : "backward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(step);
        setIsAnimating(false);
      }, 200);
    },
    [currentStep, isAnimating]
  );

  // ============================================================================
  // Render Input
  // ============================================================================

  const renderInput = (config: VariableConfig) => {
    const value = values[config.variableName] || "";
    const error = errors[config.variableName];
    const label = config.label || formatVariableName(config.variableName);

    const commonClasses = cn(
      "w-full rounded-xl transition-all duration-200",
      "bg-gray-50 dark:bg-[#0a0a0a]",
      "border-2",
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
        : "border-gray-200 dark:border-[#262626] focus:border-blue-500 focus:ring-blue-500/20",
      "text-gray-900 dark:text-white",
      "placeholder-gray-400 dark:placeholder-gray-500",
      "focus:outline-none focus:ring-4"
    );

    if (config.inputType === "select" && config.suggestions.length > 0) {
      return (
        <div className="space-y-2">
          {config.suggestions.map((suggestion, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleChange(config.variableName, suggestion)}
              className={cn(
                "w-full p-4 rounded-xl text-left transition-all duration-200",
                "border-2",
                value === suggestion
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                  : "border-gray-200 dark:border-[#262626] hover:border-gray-300 dark:hover:border-[#333]",
                "hover:shadow-md"
              )}
            >
              <span
                className={cn(
                  "text-base",
                  value === suggestion
                    ? "text-blue-600 dark:text-cyan-400 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                )}
              >
                {suggestion}
              </span>
              {value === suggestion && (
                <CheckIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
              )}
            </button>
          ))}
          <div className="pt-2">
            <input
              ref={inputRef as React.Ref<HTMLInputElement>}
              type="text"
              value={config.suggestions.includes(value) ? "" : value}
              onChange={(e) => handleChange(config.variableName, e.target.value)}
              placeholder="Or type your own..."
              className={cn(commonClasses, "px-5 py-3 text-base")}
            />
          </div>
        </div>
      );
    }

    if (config.inputType === "textarea") {
      return (
        <textarea
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => handleChange(config.variableName, e.target.value)}
          placeholder={config.placeholder || `Enter ${label.toLowerCase()}`}
          rows={6}
          className={cn(commonClasses, "px-5 py-4 text-base resize-none")}
        />
      );
    }

    if (config.inputType === "code") {
      return (
        <MonacoEditor
          height="250px"
          language={config.codeLanguage || "plaintext"}
          theme="vs-dark"
          value={value}
          onChange={(newValue) => handleChange(config.variableName, newValue || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 12, bottom: 12 },
          }}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
        type={config.inputType}
        value={value}
        onChange={(e) => handleChange(config.variableName, e.target.value)}
        placeholder={config.placeholder || `Enter ${label.toLowerCase()}`}
        className={cn(commonClasses, "px-5 py-4 text-lg")}
      />
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          "relative w-full max-w-2xl",
          "bg-white dark:bg-[#111111]",
          "rounded-2xl shadow-2xl shadow-black/20",
          "border border-gray-200 dark:border-[#262626]",
          "overflow-hidden"
        )}
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon className="w-5 h-5 text-violet-500 flex-shrink-0" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                Guided Mode
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {promptTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-colors"
            )}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-500">
              {completedSteps}/{visibleConfigs.length} completed
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={cn(
                  "h-1.5 rounded-full flex-1 transition-all duration-300",
                  i === currentStep
                    ? "bg-gradient-to-r from-violet-500 to-blue-500"
                    : i < currentStep
                    ? "bg-blue-500"
                    : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className={cn(
            "px-6 py-8 min-h-[300px] overflow-y-auto transition-all duration-200",
            isAnimating && direction === "forward" && "translate-x-4 opacity-0",
            isAnimating && direction === "backward" && "-translate-x-4 opacity-0"
          )}
          style={{ maxHeight: "calc(90vh - 280px)" }}
        >
          {isSummaryStep ? (
            // Summary Step
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 mb-4">
                  <CheckIcon className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to go!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Review your prompt below, then click &quot;Use with AI&quot; to start
                </p>
              </div>

              {/* Values summary */}
              <div className="space-y-3">
                {visibleConfigs.map((config, i) => (
                  <button
                    key={config.variableName}
                    onClick={() => goToStep(i)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left",
                      "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                      "transition-colors group"
                    )}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {config.label || formatVariableName(config.variableName)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {values[config.variableName] || (
                          <span className="text-gray-400 italic">Not filled</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to edit
                    </span>
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626]">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Final Prompt Preview
                </div>
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-40 overflow-y-auto">
                  {finalContent.slice(0, 500)}
                  {finalContent.length > 500 && "..."}
                </pre>
              </div>
            </div>
          ) : currentConfig ? (
            // Variable Step
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Variable {currentStep + 1} of {visibleConfigs.length}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  {currentConfig.label || formatVariableName(currentConfig.variableName)}
                  {currentConfig.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </h3>
                {currentConfig.helpText && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentConfig.helpText}
                  </p>
                )}
              </div>

              <div>{renderInput(currentConfig)}</div>

              {errors[currentConfig.variableName] && (
                <div className="flex items-center justify-center gap-2 text-red-500">
                  <AlertCircleIcon className="w-4 h-4" />
                  <span className="text-sm">{errors[currentConfig.variableName]}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "text-gray-600 dark:text-gray-400",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {!isSummaryStep && currentConfig && !currentConfig.isRequired && (
              <button
                onClick={handleSkip}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "text-gray-500 dark:text-gray-400",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors"
                )}
              >
                <SkipForwardIcon className="w-4 h-4" />
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                "text-white shadow-lg shadow-blue-500/25",
                "transition-all duration-200"
              )}
            >
              {isSummaryStep ? (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  Use with AI
                </>
              ) : (
                <>
                  {isLastVariableStep ? "Review" : "Next"}
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuidedWizard;
