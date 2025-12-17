"use client";

/**
 * Onboarding Modal Wrapper
 *
 * Handles showing the onboarding wizard for new users who haven't
 * completed their profile setup yet.
 *
 * Requirements:
 * - Show onboarding if hasCompletedOnboarding is false
 * - Show onboarding if username is missing (mandatory field)
 * - Show onboarding if displayName is missing (mandatory field)
 *
 * Now uses the multi-step OnboardingWizard for enhanced onboarding flow.
 * Triggers the "Welcome Aboard" achievement on completion.
 *
 * IMPORTANT: We query the database directly for onboarding status instead of
 * relying on the session cache. This prevents the race condition where the
 * session cache hasn't updated yet after onboarding completion.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { OnboardingWizard } from "./onboarding-wizard";
import { queueAchievement, isAchievementPending } from "@/lib/achievement-queue";

export function OnboardingModalWrapper() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once we've confirmed the user is authenticated and loaded
    if (isLoading || hasChecked) return;

    if (isAuthenticated) {
      // IMPORTANT: Check if the "welcome_aboard" achievement is queued.
      // This indicates onboarding JUST completed and we're in a reload.
      if (isAchievementPending("welcome_aboard")) {
        console.log("[Onboarding] Skipping - welcome_aboard achievement pending (just completed)");
        setHasChecked(true);
        return;
      }

      // Query the database directly for fresh onboarding status
      // This bypasses the session cache which may be stale
      const checkOnboardingStatus = async () => {
        try {
          const response = await fetch("/api/user/onboarding-status");
          if (!response.ok) {
            console.error("[Onboarding] Failed to fetch status:", response.status);
            setHasChecked(true);
            return;
          }

          const data = await response.json();
          console.log("[Onboarding] Database status:", data);

          if (data.needsOnboarding) {
            console.log("[Onboarding] User needs onboarding (from DB)");
            setShowOnboarding(true);
          }
        } catch (error) {
          console.error("[Onboarding] Error checking status:", error);
        } finally {
          setHasChecked(true);
        }
      };

      checkOnboardingStatus();
    }
  }, [isAuthenticated, isLoading, hasChecked]);

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
