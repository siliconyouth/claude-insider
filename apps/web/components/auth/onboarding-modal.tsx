"use client";

/**
 * Onboarding Modal
 *
 * Shows after first OAuth sign-up to let users review and edit their profile
 * data pulled from the social provider before completing registration.
 */

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        // Update user profile via API
        // Better Auth client doesn't infer additional fields, so we use the API directly
        const response = await fetch("/api/user/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: displayName || user.name,
            displayName: displayName || undefined,
            bio: bio || undefined,
            hasCompletedOnboarding: true,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update profile");
        }

        onComplete();
      } catch (err) {
        console.error("[Onboarding] Update failed:", err);
        setError(err instanceof Error ? err.message : "Failed to update profile");
      }
    });
  };

  const handleSkip = async () => {
    startTransition(async () => {
      try {
        // Just mark onboarding as complete via API
        const response = await fetch("/api/user/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hasCompletedOnboarding: true,
          }),
        });

        if (!response.ok) {
          console.error("[Onboarding] Skip API failed");
        }
        onComplete();
      } catch (err) {
        console.error("[Onboarding] Skip failed:", err);
        // Still complete even if update fails
        onComplete();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md mx-4 p-6",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "rounded-2xl shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Header */}
        <div className="text-center mb-6">
          {/* User Avatar */}
          <div className="relative mx-auto mb-4">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || "Profile"}
                className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-white dark:border-[#262626] shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-[#262626] shadow-lg">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
            {/* Success check badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 id="onboarding-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to Claude Insider!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Let&apos;s personalize your profile. You can update this later.
          </p>
        </div>

        {/* Account Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={cn(
                "w-full px-4 py-2.5 rounded-lg",
                "bg-white dark:bg-gray-900",
                "border border-gray-200 dark:border-gray-700",
                "text-gray-900 dark:text-white",
                "placeholder-gray-400 dark:placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors duration-200"
              )}
              placeholder="How should we call you?"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              className={cn(
                "w-full px-4 py-2.5 rounded-lg resize-none",
                "bg-white dark:bg-gray-900",
                "border border-gray-200 dark:border-gray-700",
                "text-gray-900 dark:text-white",
                "placeholder-gray-400 dark:placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-colors duration-200"
              )}
              placeholder="Tell us a bit about yourself..."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {bio.length}/160
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isPending}
              className={cn(
                "flex-1 py-3 rounded-lg font-medium",
                "border border-gray-200 dark:border-gray-700",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-50 dark:hover:bg-gray-800",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "flex-1 py-3 rounded-lg font-semibold",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white",
                "hover:opacity-90",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Complete Setup"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
