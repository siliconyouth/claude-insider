"use client";

/**
 * Onboarding Modal Wrapper
 *
 * Handles showing the onboarding wizard for new users who haven't
 * completed their profile setup yet.
 *
 * Now uses the multi-step OnboardingWizard for enhanced onboarding flow.
 * Triggers the "Welcome Aboard" achievement on completion.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { OnboardingWizard } from "./onboarding-wizard";
import { queueAchievement } from "@/lib/achievement-queue";

export function OnboardingModalWrapper() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once we've confirmed the user is authenticated and loaded
    if (isLoading || hasChecked) return;

    if (isAuthenticated && user) {
      // Show onboarding for users who haven't completed it yet
      const needsOnboarding = !user.hasCompletedOnboarding;

      if (needsOnboarding) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowOnboarding(true);
      }
      setHasChecked(true);
    }
  }, [isAuthenticated, isLoading, user, hasChecked]);

  const handleComplete = () => {
    setShowOnboarding(false);
    // Queue the "Welcome Aboard" achievement to show after page reload
    queueAchievement("welcome_aboard");
    // Refresh the page to update user data
    window.location.reload();
  };

  return (
    <OnboardingWizard
      isOpen={showOnboarding}
      onComplete={handleComplete}
    />
  );
}
