"use client";

/**
 * Variable Input Modal
 *
 * Modal dialog for filling in prompt variables before using with AI Assistant.
 *
 * Features:
 * - Auto-focus first input
 * - Default values pre-filled
 * - Required/optional indicators
 * - Keyboard navigation (Tab, Enter to submit)
 * - Escape to close
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/design-system";
import { XIcon, SparklesIcon, AlertCircleIcon } from "lucide-react";

interface PromptVariable {
  name: string;
  description?: string;
  default_value?: string;
  required?: boolean;
}

interface VariableInputModalProps {
  promptTitle: string;
  variables: PromptVariable[];
  onSubmit: (values: Record<string, string>) => void;
  onClose: () => void;
}

export function VariableInputModal({
  promptTitle,
  variables,
  onSubmit,
  onClose,
}: VariableInputModalProps) {
  // Initialize values with defaults
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const v of variables) {
      initial[v.name] = v.default_value || "";
    }
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus first input on mount
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Validate and submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validate required fields
      const newErrors: Record<string, string> = {};
      for (const v of variables) {
        if (v.required && !values[v.name]?.trim()) {
          newErrors[v.name] = "This field is required";
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      onSubmit(values);
    },
    [variables, values, onSubmit]
  );

  // Handle input change
  const handleChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  // Format variable name for display
  const formatVariableName = (name: string): string => {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-lg",
          "bg-white dark:bg-[#111111]",
          "rounded-2xl shadow-2xl shadow-black/20",
          "border border-gray-200 dark:border-[#262626]",
          "overflow-hidden"
        )}
        style={{
          paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fill in Variables
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {variables.map((variable, index) => {
              const error = errors[variable.name];
              const value = values[variable.name] || "";

              return (
                <div key={variable.name}>
                  <label
                    htmlFor={`var-${variable.name}`}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    {formatVariableName(variable.name)}
                    {variable.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {!variable.required && (
                      <span className="text-gray-400 dark:text-gray-500 ml-1 font-normal">
                        (optional)
                      </span>
                    )}
                  </label>
                  {variable.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                      {variable.description}
                    </p>
                  )}
                  <input
                    ref={index === 0 ? firstInputRef : undefined}
                    id={`var-${variable.name}`}
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(variable.name, e.target.value)}
                    placeholder={variable.default_value || `Enter ${formatVariableName(variable.name).toLowerCase()}`}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg",
                      "bg-gray-50 dark:bg-[#0a0a0a]",
                      "border transition-colors",
                      error
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 dark:border-[#262626] focus:border-blue-500 focus:ring-blue-500",
                      "text-gray-900 dark:text-white",
                      "placeholder-gray-400 dark:placeholder-gray-500",
                      "focus:outline-none focus:ring-2 focus:ring-offset-0"
                    )}
                  />
                  {error && (
                    <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                      <AlertCircleIcon className="w-3 h-3" />
                      {error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium",
                "text-gray-600 dark:text-gray-400",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "transition-colors"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                "text-white shadow-lg shadow-blue-500/25",
                "transition-all duration-200"
              )}
            >
              <SparklesIcon className="w-4 h-4" />
              Use with AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VariableInputModal;
