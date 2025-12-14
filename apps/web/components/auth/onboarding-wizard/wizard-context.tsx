"use client";

/**
 * Wizard Context
 *
 * Provides shared state and navigation for the multi-step onboarding wizard.
 * Manages form data, step transitions, and validation state.
 *
 * Features:
 * - Form data persistence via localStorage
 * - Step progress tracking
 * - Back/forward navigation with state preservation
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { WizardData, WizardStep } from "@/types/onboarding";
import { useAuth } from "@/components/providers/auth-provider";

const STORAGE_KEY = "claude-insider-onboarding-progress";

interface WizardContextValue {
  // Data
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;

  // Navigation
  currentStep: number;
  totalSteps: number;
  steps: readonly WizardStep[];
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;

  // State
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Completion
  onComplete: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

interface WizardProviderProps {
  children: React.ReactNode;
  onComplete: () => void;
  steps: readonly WizardStep[];
}

export function WizardProvider({ children, onComplete, steps }: WizardProviderProps) {
  const { user } = useAuth();

  // Load saved progress from localStorage
  const loadSavedProgress = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Don't restore passwords for security
        return {
          ...parsed,
          password: "",
          confirmPassword: "",
          avatarFile: null, // Can't serialize File objects
        };
      }
    } catch (e) {
      console.error("[Onboarding] Failed to load saved progress:", e);
    }
    return null;
  }, []);

  // Initialize wizard data with saved progress or user defaults
  const [data, setData] = useState<WizardData>(() => {
    const saved = loadSavedProgress();
    return {
      displayName: saved?.displayName || user?.displayName || user?.name || "",
      bio: saved?.bio || user?.bio || "",
      avatarFile: null,
      avatarPreview: saved?.avatarPreview || user?.image || user?.avatarUrl || null,
      socialLinks: saved?.socialLinks || user?.socialLinks || {},
      password: "",
      confirmPassword: "",
      betaMotivation: saved?.betaMotivation || "",
      betaExperienceLevel: saved?.betaExperienceLevel || "",
      betaUseCase: saved?.betaUseCase || "",
    };
  });

  // Initialize current step from saved progress
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = loadSavedProgress();
    return saved?.currentStep || 0;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save progress to localStorage whenever data or step changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const toSave = {
        displayName: data.displayName,
        bio: data.bio,
        avatarPreview: data.avatarPreview,
        socialLinks: data.socialLinks,
        betaMotivation: data.betaMotivation,
        betaExperienceLevel: data.betaExperienceLevel,
        betaUseCase: data.betaUseCase,
        currentStep,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("[Onboarding] Failed to save progress:", e);
    }
  }, [data, currentStep]);

  // Clear saved progress on completion
  const clearSavedProgress = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("[Onboarding] Failed to clear saved progress:", e);
    }
  }, []);

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const totalSteps = steps.length;

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
        setError(null);
      }
    },
    [totalSteps]
  );

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setError(null);
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setError(null);
    }
  }, [currentStep]);

  // Wrap onComplete to clear saved progress first
  const handleComplete = useCallback(() => {
    clearSavedProgress();
    onComplete();
  }, [clearSavedProgress, onComplete]);

  const value = useMemo<WizardContextValue>(
    () => ({
      data,
      updateData,
      currentStep,
      totalSteps,
      steps,
      goToStep,
      nextStep,
      prevStep,
      canGoNext: currentStep < totalSteps - 1,
      canGoPrev: currentStep > 0,
      isFirstStep: currentStep === 0,
      isLastStep: currentStep === totalSteps - 1,
      isSubmitting,
      setIsSubmitting,
      error,
      setError,
      onComplete: handleComplete,
    }),
    [
      data,
      updateData,
      currentStep,
      totalSteps,
      steps,
      goToStep,
      nextStep,
      prevStep,
      isSubmitting,
      error,
      handleComplete,
    ]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

/**
 * Hook to access wizard context
 */
export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
