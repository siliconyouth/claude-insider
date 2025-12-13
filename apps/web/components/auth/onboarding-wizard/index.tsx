"use client";

/**
 * Onboarding Wizard
 *
 * Main orchestrator for the multi-step onboarding flow.
 * Renders the appropriate step based on current progress and user state.
 */

import { useMemo } from "react";
import { cn } from "@/lib/design-system";
import { WizardProvider } from "./wizard-context";
import { WizardProgress } from "./wizard-progress";
import { useWizard } from "./wizard-context";
import { useAuth } from "@/components/providers/auth-provider";

// Step components
import { ProfileBasicsStep } from "./steps/profile-basics-step";
import { SocialLinksStep } from "./steps/social-links-step";
import { EmailVerifyStep } from "./steps/email-verify-step";
import { AddPasswordStep } from "./steps/add-password-step";
import { BetaApplyStep } from "./steps/beta-apply-step";

import type { WizardStep, WizardStepId } from "@/types/onboarding";

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

// Step component mapping
const StepComponents: Record<WizardStepId, React.ComponentType> = {
  "profile-basics": ProfileBasicsStep,
  "social-links": SocialLinksStep,
  "email-verify": EmailVerifyStep,
  "add-password": AddPasswordStep,
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
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <StepComponent />
    </div>
  );
}

export function OnboardingWizard({ isOpen, onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();

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

    // Only show beta application if not already a beta tester
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
    // Mark onboarding as complete
    try {
      await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasCompletedOnboarding: true }),
      });
    } catch (err) {
      console.error("[Onboarding] Failed to mark complete:", err);
    }

    onComplete();
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
          "relative w-full max-w-lg mx-4",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "rounded-2xl shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
          "flex flex-col max-h-[90vh]"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
      >
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
                  className="w-16 h-16 rounded-full object-cover mx-auto border-4 border-white dark:border-[#262626] shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-[#262626] shadow-lg">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            <h2
              id="wizard-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Welcome to Claude Insider!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
