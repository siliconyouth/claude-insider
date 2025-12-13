/**
 * Onboarding Wizard Types
 *
 * Types for the multi-step onboarding wizard flow.
 */

export interface SocialLinks {
  github?: string;
  twitter?: string;
  linkedin?: string;
  bluesky?: string;
  mastodon?: string;
  discord?: string;
  website?: string;
}

export interface WizardData {
  // Step 1: Profile Basics
  displayName: string;
  bio: string;
  avatarFile: File | null;
  avatarPreview: string | null;

  // Step 2: Social Links
  socialLinks: SocialLinks;

  // Step 3: Email Verification (read from user)
  // No editable data

  // Step 4: Add Password
  password: string;
  confirmPassword: string;

  // Step 5: Beta Application
  betaMotivation: string;
  betaExperienceLevel: ExperienceLevel | "";
  betaUseCase: string;
}

export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface WizardStep {
  id: WizardStepId;
  title: string;
  description: string;
  icon: string;
  skippable: boolean;
}

export type WizardStepId =
  | "profile-basics"
  | "social-links"
  | "email-verify"
  | "add-password"
  | "beta-apply";

export interface WizardContextValue {
  // Form data
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  resetData: () => void;

  // Navigation
  currentStepIndex: number;
  currentStep: WizardStep;
  visibleSteps: WizardStep[];
  totalSteps: number;
  goToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;

  // Submission
  isSubmitting: boolean;
  submitCurrentStep: () => Promise<boolean>;
  skipCurrentStep: () => void;
  completeWizard: () => void;

  // Progress
  progress: number; // 0-100
}

export const INITIAL_WIZARD_DATA: WizardData = {
  displayName: "",
  bio: "",
  avatarFile: null,
  avatarPreview: null,
  socialLinks: {},
  password: "",
  confirmPassword: "",
  betaMotivation: "",
  betaExperienceLevel: "",
  betaUseCase: "",
};

export const SOCIAL_PLATFORMS = [
  {
    id: "github" as const,
    label: "GitHub",
    placeholder: "username",
    prefix: "github.com/",
    icon: "github",
  },
  {
    id: "twitter" as const,
    label: "Twitter / X",
    placeholder: "@username",
    prefix: "x.com/",
    icon: "twitter",
  },
  {
    id: "linkedin" as const,
    label: "LinkedIn",
    placeholder: "in/username",
    prefix: "linkedin.com/",
    icon: "linkedin",
  },
  {
    id: "bluesky" as const,
    label: "Bluesky",
    placeholder: "handle.bsky.social",
    prefix: "",
    icon: "bluesky",
  },
  {
    id: "mastodon" as const,
    label: "Mastodon",
    placeholder: "@user@instance.social",
    prefix: "",
    icon: "mastodon",
  },
  {
    id: "discord" as const,
    label: "Discord",
    placeholder: "username",
    prefix: "",
    icon: "discord",
  },
  {
    id: "website" as const,
    label: "Website",
    placeholder: "https://example.com",
    prefix: "",
    icon: "globe",
  },
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORMS)[number]["id"];

/**
 * Wizard step configurations
 */
export const WIZARD_STEPS: readonly WizardStep[] = [
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
  {
    id: "email-verify",
    title: "Verify Email",
    description: "Confirm your email address",
    icon: "✉️",
    skippable: false,
  },
  {
    id: "add-password",
    title: "Add Password",
    description: "Enable email/password login",
    icon: "🔐",
    skippable: true,
  },
  {
    id: "beta-apply",
    title: "Join Beta",
    description: "Apply for early access to new features",
    icon: "🚀",
    skippable: true,
  },
] as const;
