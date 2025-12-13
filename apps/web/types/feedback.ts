/**
 * Feedback System Types
 *
 * Types for the beta tester feedback submission system.
 */

export type FeedbackType = "bug" | "feature" | "general";
export type FeedbackSeverity = "low" | "medium" | "high" | "critical";
export type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed" | "wont_fix";

export interface Feedback {
  id: string;
  userId: string;
  feedbackType: FeedbackType;
  title: string;
  description: string;
  severity: FeedbackSeverity | null;
  pageUrl: string | null;
  userAgent: string | null;
  screenshotUrl: string | null;
  status: FeedbackStatus;
  assignedTo: string | null;
  resolvedAt: Date | null;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackSubmission {
  feedbackType: FeedbackType;
  title: string;
  description: string;
  severity?: FeedbackSeverity;
  pageUrl?: string;
  screenshot?: File;
}

export interface FeedbackUpdate {
  status?: FeedbackStatus;
  assignedTo?: string;
  resolutionNotes?: string;
}

export const FEEDBACK_TYPES: { value: FeedbackType; label: string; description: string; icon: string }[] = [
  {
    value: "bug",
    label: "Bug Report",
    description: "Something isn't working correctly",
    icon: "bug",
  },
  {
    value: "feature",
    label: "Feature Request",
    description: "Suggest a new feature or improvement",
    icon: "lightbulb",
  },
  {
    value: "general",
    label: "General Feedback",
    description: "Share your thoughts or suggestions",
    icon: "message",
  },
];

export const FEEDBACK_SEVERITIES: { value: FeedbackSeverity; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-gray-500" },
  { value: "medium", label: "Medium", color: "text-yellow-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "critical", label: "Critical", color: "text-red-500" },
];

export const FEEDBACK_STATUSES: { value: FeedbackStatus; label: string; color: string }[] = [
  { value: "open", label: "Open", color: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800" },
  { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
  { value: "wont_fix", label: "Won't Fix", color: "bg-red-100 text-red-800" },
];
