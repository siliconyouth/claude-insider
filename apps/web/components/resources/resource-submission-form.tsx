"use client";

/**
 * ResourceSubmissionForm Component
 *
 * Form for users to submit resources for addition to Claude Insider.
 * Supports both logged-in and anonymous submissions with:
 * - URL input with validation
 * - Optional title/description
 * - Notes explaining why the resource is valuable
 * - Real-time duplicate detection feedback
 */

import { useState, useCallback, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { toast } from "@/components/toast";
import { submitResource, type SubmitResourceResult } from "@/app/actions/resource-submissions";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

interface ResourceSubmissionFormProps {
  /** Callback when submission is successful */
  onSuccess?: (result: SubmitResourceResult) => void;
  /** Callback to close/cancel the form */
  onCancel?: () => void;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Icons
// ============================================================================

const LinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================================================
// Component
// ============================================================================

export function ResourceSubmissionForm({
  onSuccess,
  onCancel,
  className,
}: ResourceSubmissionFormProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Validate URL format
  const validateUrl = useCallback((value: string): string | null => {
    if (!value.trim()) {
      return "URL is required";
    }
    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return "URL must start with http:// or https://";
      }
      return null;
    } catch {
      return "Please enter a valid URL";
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    const urlError = validateUrl(url);
    if (urlError) {
      newErrors.url = urlError;
    }

    // For anonymous submissions, email is optional but validate if provided
    if (!isLoggedIn && email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await submitResource({
        url: url.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        email: !isLoggedIn && email ? email.trim() : undefined,
        name: !isLoggedIn && name ? name.trim() : undefined,
      });

      if (result.success) {
        setShowSuccess(true);
        setSubmissionId(result.submissionId || null);
        toast.success(
          "Resource Submitted!",
          "Thanks! We'll review your submission and let you know when it's processed."
        );
        onSuccess?.(result);
      } else if (result.isDuplicate) {
        toast.info(
          "Duplicate Resource",
          result.error || "This resource already exists in our database."
        );
        setErrors({ url: result.error || "This resource already exists" });
      } else {
        toast.error(
          "Submission Failed",
          result.error || "Please try again later."
        );
        setErrors({ form: result.error || "Submission failed" });
      }
    });
  }, [url, title, description, notes, email, name, isLoggedIn, validateUrl, onSuccess]);

  // Success state
  if (showSuccess) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Submission Received!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Thanks for your contribution! Our AI will analyze the resource and our team will review it shortly.
        </p>
        {isLoggedIn && submissionId && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            You can track your submission status in{" "}
            <Link
              href="/profile/submissions"
              className="text-blue-600 dark:text-cyan-400 hover:underline"
            >
              your submissions dashboard
            </Link>
            .
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setShowSuccess(false);
              setSubmissionId(null);
              setUrl("");
              setTitle("");
              setDescription("");
              setNotes("");
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg",
              "bg-gray-100 dark:bg-gray-800",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-200 dark:hover:bg-gray-700",
              "transition-colors"
            )}
          >
            Submit Another
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white shadow-lg shadow-blue-500/25",
                "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                "transition-all"
              )}
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      {/* URL Input - Required */}
      <div>
        <label
          htmlFor="submission-url"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Resource URL <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LinkIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="submission-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (errors.url) setErrors((prev) => ({ ...prev, url: "" }));
            }}
            placeholder="https://github.com/username/repository"
            className={cn(
              "block w-full pl-10 pr-4 py-2.5 rounded-lg text-sm",
              "bg-gray-50 dark:bg-[#1a1a1a]",
              "border",
              errors.url
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-[#333] focus:ring-blue-500",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500",
              "focus:outline-none focus:ring-2",
              "transition-colors"
            )}
            required
            disabled={isPending}
          />
        </div>
        {errors.url && (
          <p className="mt-1.5 text-sm text-red-500">{errors.url}</p>
        )}
      </div>

      {/* Title Input - Optional */}
      <div>
        <label
          htmlFor="submission-title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Title <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="submission-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resource name"
          className={cn(
            "block w-full px-4 py-2.5 rounded-lg text-sm",
            "bg-gray-50 dark:bg-[#1a1a1a]",
            "border border-gray-300 dark:border-[#333]",
            "text-gray-900 dark:text-white",
            "placeholder-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors"
          )}
          maxLength={200}
          disabled={isPending}
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave blank to auto-generate from URL
        </p>
      </div>

      {/* Description Input - Optional */}
      <div>
        <label
          htmlFor="submission-description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="submission-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the resource..."
          rows={2}
          className={cn(
            "block w-full px-4 py-2.5 rounded-lg text-sm resize-none",
            "bg-gray-50 dark:bg-[#1a1a1a]",
            "border border-gray-300 dark:border-[#333]",
            "text-gray-900 dark:text-white",
            "placeholder-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors"
          )}
          maxLength={500}
          disabled={isPending}
        />
      </div>

      {/* Notes Input - Optional but helpful */}
      <div>
        <label
          htmlFor="submission-notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Why is this valuable? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="submission-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tell us why this resource should be added to Claude Insider..."
          rows={3}
          className={cn(
            "block w-full px-4 py-2.5 rounded-lg text-sm resize-none",
            "bg-gray-50 dark:bg-[#1a1a1a]",
            "border border-gray-300 dark:border-[#333]",
            "text-gray-900 dark:text-white",
            "placeholder-gray-500",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "transition-colors"
          )}
          maxLength={1000}
          disabled={isPending}
        />
      </div>

      {/* Anonymous submission fields */}
      {!isLoggedIn && (
        <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
          <div className="flex items-start gap-2">
            <InfoIcon className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <Link href="/sign-in" className="text-blue-600 dark:text-cyan-400 hover:underline">
                Sign in
              </Link>{" "}
              to track your submission and get higher submission limits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="submission-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Your Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="submission-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={cn(
                  "block w-full px-3 py-2 rounded-lg text-sm",
                  "bg-white dark:bg-[#1a1a1a]",
                  "border border-gray-300 dark:border-[#333]",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                maxLength={100}
                disabled={isPending}
              />
            </div>

            <div>
              <label
                htmlFor="submission-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Email <span className="text-gray-400 font-normal">(for updates)</span>
              </label>
              <input
                id="submission-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                placeholder="you@example.com"
                className={cn(
                  "block w-full px-3 py-2 rounded-lg text-sm",
                  "bg-white dark:bg-[#1a1a1a]",
                  "border",
                  errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-[#333] focus:ring-blue-500",
                  "text-gray-900 dark:text-white",
                  "placeholder-gray-500",
                  "focus:outline-none focus:ring-2"
                )}
                disabled={isPending}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form-level error */}
      {errors.form && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{errors.form}</p>
        </div>
      )}

      {/* AI Analysis Notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/30">
        <SparklesIcon className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
        <p className="text-sm text-violet-700 dark:text-violet-300">
          <strong>AI-Powered Analysis:</strong> Your submission will be automatically analyzed by
          Claude Opus 4.5 for categorization, relevance, and quality before review.
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={cn(
              "px-4 py-2.5 text-sm font-medium rounded-lg",
              "border border-gray-300 dark:border-[#333]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
              "transition-colors",
              "disabled:opacity-50"
            )}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || !url.trim()}
          className={cn(
            "flex-1 flex items-center justify-center gap-2",
            "px-4 py-2.5 text-sm font-semibold rounded-lg",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white shadow-lg shadow-blue-500/25",
            "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
            "hover:shadow-xl hover:shadow-blue-500/30",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "dark:focus:ring-offset-[#0a0a0a]",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <SendIcon className="w-4 h-4" />
              Submit Resource
            </>
          )}
        </button>
      </div>
    </form>
  );
}
