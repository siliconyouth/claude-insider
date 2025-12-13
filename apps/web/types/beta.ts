/**
 * Beta Program Types
 *
 * Types for the beta tester application and review system.
 */

export type BetaApplicationStatus = "pending" | "approved" | "rejected";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface BetaApplication {
  id: string;
  userId: string;
  motivation: string;
  experienceLevel: ExperienceLevel | null;
  useCase: string | null;
  status: BetaApplicationStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BetaApplicationSubmission {
  motivation: string;
  experienceLevel: ExperienceLevel;
  useCase?: string;
}

export interface BetaApplicationReview {
  applicationId: string;
  status: "approved" | "rejected";
  reviewNotes?: string;
}

export interface BetaApplicationWithUser extends BetaApplication {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    createdAt: Date;
  };
}

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; description: string }[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "New to Claude and AI assistants",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Some experience with Claude or similar tools",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Regular user with deep understanding",
  },
  {
    value: "expert",
    label: "Expert",
    description: "Developer or power user building with Claude",
  },
];
