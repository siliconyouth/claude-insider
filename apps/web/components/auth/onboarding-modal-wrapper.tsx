"use client";

/**
 * Onboarding Modal Wrapper
 *
 * Handles showing the onboarding modal for new OAuth users who haven't
 * completed their profile setup yet.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { OnboardingModal } from "./onboarding-modal";

export function OnboardingModalWrapper() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once we've confirmed the user is authenticated and loaded
    if (isLoading || hasChecked) return;

    if (isAuthenticated && user) {
      // Show onboarding for users who haven't completed it yet
      // Only trigger for OAuth users (they have an image from provider)
      const isOAuthUser = !!user.image;
      const needsOnboarding = !user.hasCompletedOnboarding;

      if (isOAuthUser && needsOnboarding) {
        setShowOnboarding(true);
      }
      setHasChecked(true);
    }
  }, [isAuthenticated, isLoading, user, hasChecked]);

  const handleComplete = () => {
    setShowOnboarding(false);
    // Refresh the page to update user data
    window.location.reload();
  };

  return (
    <OnboardingModal
      isOpen={showOnboarding}
      onComplete={handleComplete}
    />
  );
}
