"use client";

/**
 * Feedback Form
 *
 * Form for submitting feedback with type selection, title, description,
 * and severity (for bugs). Includes console log capture for bug reports.
 */

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/design-system";
import { FEEDBACK_TYPES, FEEDBACK_SEVERITIES } from "@/types/feedback";
import type { FeedbackType, FeedbackSeverity } from "@/types/feedback";

interface ConsoleLog {
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: string;
}

interface FeedbackFormProps {
  onSuccess: () => void;
}

// Maximum number of console logs to capture
const MAX_CONSOLE_LOGS = 50;

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<FeedbackSeverity>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [includeConsoleLogs, setIncludeConsoleLogs] = useState(true);
  const consoleLogsRef = useRef<ConsoleLog[]>([]);

  // Capture console logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    const captureLog = (type: ConsoleLog["type"]) => (...args: unknown[]) => {
      // Call original console method
      originalConsole[type](...args);

      // Capture the log
      const message = args
        .map((arg) => {
          if (typeof arg === "string") return arg;
          if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" ");

      consoleLogsRef.current = [
        ...consoleLogsRef.current.slice(-(MAX_CONSOLE_LOGS - 1)),
        {
          type,
          message: message.substring(0, 500), // Limit message length
          timestamp: new Date().toISOString(),
        },
      ];
    };

    // Override console methods
    console.log = captureLog("log");
    console.warn = captureLog("warn");
    console.error = captureLog("error");
    console.info = captureLog("info");

    // Restore original console on cleanup
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError("Please provide a title");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a description");
      return;
    }

    if (description.trim().length < 20) {
      setError("Description should be at least 20 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackType,
          title: title.trim(),
          description: description.trim(),
          severity: feedbackType === "bug" ? severity : undefined,
          pageUrl: window.location.href,
          // Include console logs for bug reports if user opted in
          consoleLogs: feedbackType === "bug" && includeConsoleLogs
            ? consoleLogsRef.current
            : undefined,
          // Include browser info for bug reports
          browserInfo: feedbackType === "bug"
            ? {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Thank you!
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your feedback has been submitted successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Feedback type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What kind of feedback?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FEEDBACK_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFeedbackType(type.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                feedbackType === type.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <span className="text-2xl">
                {type.value === "bug" && "🐛"}
                {type.value === "feature" && "💡"}
                {type.value === "general" && "💬"}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  feedbackType === type.value
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="feedback-title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="feedback-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg",
            "bg-white dark:bg-gray-900",
            "border border-gray-200 dark:border-gray-700",
            "text-gray-900 dark:text-white",
            "placeholder-gray-400 dark:placeholder-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "transition-colors duration-200"
          )}
          placeholder={
            feedbackType === "bug"
              ? "Briefly describe the issue..."
              : feedbackType === "feature"
              ? "What would you like to see?"
              : "What's on your mind?"
          }
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="feedback-description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="feedback-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={2000}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg resize-none",
            "bg-white dark:bg-gray-900",
            "border border-gray-200 dark:border-gray-700",
            "text-gray-900 dark:text-white",
            "placeholder-gray-400 dark:placeholder-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "transition-colors duration-200"
          )}
          placeholder={
            feedbackType === "bug"
              ? "Steps to reproduce, expected vs actual behavior..."
              : feedbackType === "feature"
              ? "Describe the feature and how it would help you..."
              : "Share your thoughts, suggestions, or questions..."
          }
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {description.length}/2000
        </p>
      </div>

      {/* Severity (for bugs only) */}
      {feedbackType === "bug" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Severity
          </label>
          <div className="flex gap-2">
            {FEEDBACK_SEVERITIES.map((sev) => (
              <button
                key={sev.value}
                type="button"
                onClick={() => setSeverity(sev.value)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                  severity === sev.value
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Console logs notice (for bugs only) */}
      {feedbackType === "bug" && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-blue-500 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                To help us diagnose the issue, we&apos;ll include:
              </p>
              <ul className="mt-1 text-xs text-blue-600 dark:text-blue-400 list-disc list-inside space-y-0.5">
                <li>Browser console logs (last {MAX_CONSOLE_LOGS} entries)</li>
                <li>Browser & device information</li>
                <li>Current page URL</li>
              </ul>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeConsoleLogs}
                  onChange={(e) => setIncludeConsoleLogs(e.target.checked)}
                  className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  Include console logs
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full py-3 rounded-lg font-semibold",
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "text-white shadow-lg shadow-blue-500/25",
          "hover:opacity-90 hover:-translate-y-0.5",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        )}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
            Submitting...
          </span>
        ) : (
          "Submit Feedback"
        )}
      </button>
    </form>
  );
}
