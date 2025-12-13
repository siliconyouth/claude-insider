"use client";

/**
 * Wizard Context
 *
 * Provides shared state and navigation for the multi-step onboarding wizard.
 * Manages form data, step transitions, and validation state.
 */

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { WizardData, WizardStep } from "@/types/onboarding";
import { useAuth } from "@/components/providers/auth-provider";

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

  // Initialize wizard data with user defaults
  const [data, setData] = useState<WizardData>({
    displayName: user?.displayName || user?.name || "",
    bio: user?.bio || "",
    avatarFile: null,
    avatarPreview: user?.image || user?.avatarUrl || null,
    socialLinks: user?.socialLinks || {},
    password: "",
    confirmPassword: "",
    betaMotivation: "",
    betaExperienceLevel: "",
    betaUseCase: "",
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onComplete,
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
      onComplete,
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
