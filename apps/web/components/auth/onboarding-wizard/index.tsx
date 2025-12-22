"use client";

/**
 * Onboarding Wizard
 *
 * Main orchestrator for the multi-step onboarding flow.
 * Renders the appropriate step based on current progress and user state.
 *
 * Features:
 * - Dynamic step rendering based on user state
 * - Skip/logout options for user control
 * - Responsive layout with no scrolling on desktop
 * - Progress persistence via localStorage
 */

import { useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { WizardProvider } from "./wizard-context";
import { WizardProgress } from "./wizard-progress";
import { useWizard } from "./wizard-context";
import { useAuth } from "@/components/providers/auth-provider";
import { authClient } from "@/lib/auth-client";

// Step components
import { ProfileBasicsStep } from "./steps/profile-basics-step";
import { LocationTimezoneStep } from "./steps/location-timezone-step";
import { SocialLinksStep } from "./steps/social-links-step";
import { EmailVerifyStep } from "./steps/email-verify-step";
import { AddPasswordStep } from "./steps/add-password-step";
import { SecurityStep } from "./steps/security-step";
import { BetaApplyStep } from "./steps/beta-apply-step";
import { NotificationsStep } from "./steps/notifications-step";
import { ApiKeyStep } from "./steps/api-key-step";
import { SupportStep } from "./steps/support-step";
import { E2EESetupStep } from "./steps/e2ee-setup-step";

import type { WizardStep, WizardStepId } from "@/types/onboarding";

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkipForNow?: () => void;
}

// Step component mapping
const StepComponents: Record<WizardStepId, React.ComponentType> = {
  "profile-basics": ProfileBasicsStep,
  "location-timezone": LocationTimezoneStep,
  "social-links": SocialLinksStep,
  "email-verify": EmailVerifyStep,
  "add-password": AddPasswordStep,
  "security": SecurityStep,
  "notifications": NotificationsStep,
  "api-key": ApiKeyStep,
  "e2ee-setup": E2EESetupStep,
  "support": SupportStep,
  "beta-apply": BetaApplyStep,
};

function WizardContent() {
  const { currentStep, steps } = useWizard();
  const currentStepConfig = steps[currentStep];

  if (!currentStepConfig) {
    return null;
  }

  const StepComponent = StepComponents[currentStepConfig.id];

  return (
    <div className={cn(
      "flex-1 px-6 py-3",
      // Only allow scrolling on mobile, desktop should fit content
      "overflow-y-auto sm:overflow-y-visible"
    )}>
      <StepComponent />
    </div>
  );
}

export function OnboardingWizard({ isOpen, onComplete, onSkipForNow }: OnboardingWizardProps) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("[Onboarding] Logout failed:", err);
      setIsLoggingOut(false);
    }
  }, []);

  const handleSkipForNow = useCallback(() => {
    setShowMenu(false);
    if (onSkipForNow) {
      onSkipForNow();
    } else {
      // Default behavior: close modal and reload to show site
      window.location.reload();
    }
  }, [onSkipForNow]);

  // Build dynamic steps based on user state
  const activeSteps = useMemo<WizardStep[]>(() => {
    const steps: WizardStep[] = [
      {
        id: "profile-basics",
        title: "Profile Basics",
        description: "Set up your display name and profile picture",
        icon: "👤",
        skippable: false,
      },
      {
        id: "location-timezone",
        title: "Location & Time",
        description: "Help others know your local time",
        icon: "🌍",
        skippable: false,
      },
      {
        id: "social-links",
        title: "Social Links",
        description: "Connect your social media profiles",
        icon: "🔗",
        skippable: true,
      },
    ];

    // Only show email verification if not verified
    if (!user?.emailVerified) {
      steps.push({
        id: "email-verify",
        title: "Verify Email",
        description: "Confirm your email address",
        icon: "✉️",
        skippable: false,
      });
    }

    // Only show add password if OAuth user without password
    if (!user?.hasPassword) {
      steps.push({
        id: "add-password",
        title: "Add Password",
        description: "Enable email/password login",
        icon: "🔐",
        skippable: true,
      });
    }

    // Always show security setup (optional passkeys and 2FA)
    steps.push({
      id: "security",
      title: "Security",
      description: "Set up passkeys or two-factor authentication",
      icon: "🛡️",
      skippable: true,
    });

    // E2EE setup right after security - groups security-related steps together
    steps.push({
      id: "e2ee-setup",
      title: "Secure Messaging",
      description: "Enable end-to-end encrypted messages",
      icon: "🔐",
      skippable: true,
    });

    // Always show notifications and PWA setup step
    steps.push({
      id: "notifications",
      title: "Notifications & App",
      description: "Enable notifications and install the app",
      icon: "🔔",
      skippable: true,
    });

    // Always show API key setup step (skippable)
    steps.push({
      id: "api-key",
      title: "API Key",
      description: "Connect your own Anthropic API key",
      icon: "🔑",
      skippable: true,
    });

    // Support step before beta - ask for support after showing value
    steps.push({
      id: "support",
      title: "Support Us",
      description: "Help keep Claude Insider free and growing",
      icon: "💜",
      skippable: true,
    });

    // Beta application as final step if not already a beta tester
    if (!user?.isBetaTester) {
      steps.push({
        id: "beta-apply",
        title: "Join Beta",
        description: "Apply for early access to new features",
        icon: "🚀",
        skippable: true,
      });
    }

    return steps;
  }, [user?.emailVerified, user?.hasPassword, user?.isBetaTester]);

  if (!isOpen || !user) return null;

  const handleComplete = async () => {
    // Mark onboarding as complete - wait for the API to confirm
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasCompletedOnboarding: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Onboarding] Failed to mark complete:", errorData);
        // Still proceed to complete - user can re-trigger later
      }

      // Wait a bit to ensure database write is complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.error("[Onboarding] Failed to mark complete:", err);
    }

    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        // Account for mobile bottom navigation
        paddingBottom: "var(--mobile-nav-height, 0px)",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-lg mx-4",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "rounded-2xl shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          "flex flex-col",
          // Responsive height: auto on desktop, scrollable on mobile
          "sm:max-h-none sm:h-auto"
        )}
        style={{
          // Max height accounts for mobile nav
          maxHeight: "calc(95vh - var(--mobile-nav-height, 0px))",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
      >
        {/* Menu Button (top-right) */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "p-2 rounded-lg",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              "transition-colors duration-200"
            )}
            aria-label="Options menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className={cn(
                "absolute top-full right-0 mt-1 w-48",
                "bg-white dark:bg-[#1a1a1a]",
                "border border-gray-200 dark:border-[#333]",
                "rounded-lg shadow-lg",
                "py-1 z-20"
              )}
            >
              <button
                type="button"
                onClick={handleSkipForNow}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm",
                  "text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors duration-150"
                )}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Complete later
                </span>
              </button>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm",
                  "text-red-600 dark:text-red-400",
                  "hover:bg-red-50 dark:hover:bg-red-900/20",
                  "transition-colors duration-150",
                  "disabled:opacity-50"
                )}
              >
                <span className="flex items-center gap-2">
                  {isLoggingOut ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  )}
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Click outside to close menu - positioned within modal only */}
        {showMenu && (
          <div
            className="absolute inset-0 z-[5]"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />
        )}

        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-2">
          <div className="text-center">
            {/* User Avatar */}
            <div className="relative mx-auto mb-3">
              {user.image || user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl || user.image || ""}
                  alt={user.name || "Profile"}
                  className="w-14 h-14 rounded-full object-cover mx-auto border-3 border-white dark:border-[#262626] shadow-lg"
                />
              ) : (
                <div className="w-14 h-14 rounded-full mx-auto bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white text-xl font-bold border-3 border-white dark:border-[#262626] shadow-lg">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            <h2
              id="wizard-title"
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              Welcome to Claude Insider!
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Let&apos;s set up your profile
            </p>
          </div>
        </div>

        {/* Progress */}
        <WizardProvider steps={activeSteps} onComplete={handleComplete}>
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
            <WizardProgress />
          </div>

          {/* Content */}
          <WizardContent />
        </WizardProvider>
      </div>
    </div>
  );
}

// Re-export components for flexibility
export { WizardProvider } from "./wizard-context";
export { WizardProgress } from "./wizard-progress";
export { WizardNavigation } from "./wizard-navigation";
