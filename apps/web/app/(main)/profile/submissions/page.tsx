"use client";

/**
 * User Submissions Page
 *
 * View and track status of user's resource submissions.
 * Shows submission history with status badges and links to approved resources.
 */

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  getUserSubmissions,
  type ResourceSubmission,
  type SubmissionStatus,
} from "@/app/actions/resource-submissions";

// ============================================================================
// Icons
// ============================================================================

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const QueueIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// ============================================================================
// Status Config
// ============================================================================

const statusConfig: Record<SubmissionStatus, {
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: "Pending",
    icon: ClockIcon,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  analyzing: {
    label: "Analyzing",
    icon: SparklesIcon,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  queued: {
    label: "Under Review",
    icon: QueueIcon,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
  approved: {
    label: "Approved",
    icon: CheckCircleIcon,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  rejected: {
    label: "Not Accepted",
    icon: XCircleIcon,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

// ============================================================================
// Component
// ============================================================================

export default function SubmissionsPage() {
  const { isAuthenticated, isLoading: authLoading, showSignIn } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [submissions, setSubmissions] = useState<ResourceSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<SubmissionStatus | "all">("all");

  // Load submissions
  useEffect(() => {
    if (!isAuthenticated) return;

    startTransition(async () => {
      setIsLoading(true);
      const result = await getUserSubmissions();
      if (result.data) {
        setSubmissions(result.data);
      }
      setIsLoading(false);
    });
  }, [isAuthenticated]);

  // Filter submissions
  const filteredSubmissions = filter === "all"
    ? submissions
    : submissions.filter((s) => s.status === filter);

  // Stats
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => ["pending", "analyzing"].includes(s.status)).length,
    queued: submissions.filter((s) => s.status === "queued").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <Header />
        <main className="pt-8 pb-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <QueueIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Sign in to view submissions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Track the status of your resource submissions
              </p>
              <button
                onClick={showSignIn}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-semibold",
                  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                  "text-white shadow-lg shadow-blue-500/25",
                  "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500"
                )}
              >
                Sign In
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header />
      <main className="pt-8 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                My Submissions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track the status of your resource submissions
              </p>
            </div>
            <Link
              href="/resources/submit"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "text-white shadow-lg shadow-blue-500/25",
                "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                "transition-all duration-200"
              )}
            >
              <PlusIcon className="w-4 h-4" />
              Submit Resource
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800/30 p-4">
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">Processing</p>
            </div>
            <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-200 dark:border-violet-800/30 p-4">
              <p className="text-2xl font-bold text-violet-700 dark:text-violet-400">{stats.queued}</p>
              <p className="text-sm text-violet-600 dark:text-violet-500">In Review</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800/30 p-4">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.approved}</p>
              <p className="text-sm text-green-600 dark:text-green-500">Approved</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {(["all", "pending", "analyzing", "queued", "approved", "rejected"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap",
                  "transition-colors",
                  filter === status
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {status === "all" ? "All" : statusConfig[status].label}
                {status === "all" && ` (${submissions.length})`}
              </button>
            ))}
          </div>

          {/* Submissions List */}
          {isLoading || isPending ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#262626] p-5 animate-pulse">
                  <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                  <div className="h-4 w-96 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <QueueIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {filter === "all" ? "No submissions yet" : `No ${statusConfig[filter as SubmissionStatus]?.label.toLowerCase() || filter} submissions`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {filter === "all"
                  ? "Submit a resource to help grow the community"
                  : "Try selecting a different filter"}
              </p>
              {filter === "all" && (
                <Link
                  href="/resources/submit"
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white shadow-lg shadow-blue-500/25",
                    "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500"
                  )}
                >
                  <PlusIcon className="w-4 h-4" />
                  Submit Your First Resource
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => {
                const config = statusConfig[submission.status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={submission.id}
                    className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#262626] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* URL */}
                        <a
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-2 truncate"
                        >
                          {submission.title || submission.url}
                          <ExternalLinkIcon className="w-4 h-4 flex-shrink-0 opacity-50" />
                        </a>

                        {/* Description */}
                        {submission.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {submission.description}
                          </p>
                        )}

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                          <span>
                            Submitted {formatDate(submission.created_at)}
                          </span>
                          {submission.status === "approved" && submission.created_resource_id && (
                            <Link
                              href={`/resources/${submission.created_resource_id}`}
                              className="text-blue-600 dark:text-cyan-400 hover:underline"
                            >
                              View Resource
                            </Link>
                          )}
                          {submission.status === "rejected" && submission.rejection_reason && (
                            <span className="text-red-500">
                              Reason: {formatRejectionReason(submission.rejection_reason)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                        config.bgColor,
                        config.color
                      )}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </div>
                    </div>

                    {/* AI Analysis Preview (for analyzed submissions) */}
                    {submission.ai_analysis && (submission.status === "queued" || submission.status === "approved") && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">AI Analysis</p>
                        <div className="flex gap-4 text-sm">
                          {submission.ai_confidence !== null && (
                            <div>
                              <span className="text-gray-500">Confidence: </span>
                              <span className={cn(
                                "font-medium",
                                submission.ai_confidence >= 0.7 ? "text-green-600 dark:text-green-400" :
                                submission.ai_confidence >= 0.4 ? "text-yellow-600 dark:text-yellow-400" :
                                "text-red-600 dark:text-red-400"
                              )}>
                                {Math.round(submission.ai_confidence * 100)}%
                              </span>
                            </div>
                          )}
                          {submission.ai_relevance !== null && (
                            <div>
                              <span className="text-gray-500">Relevance: </span>
                              <span className={cn(
                                "font-medium",
                                submission.ai_relevance >= 0.7 ? "text-green-600 dark:text-green-400" :
                                submission.ai_relevance >= 0.4 ? "text-yellow-600 dark:text-yellow-400" :
                                "text-red-600 dark:text-red-400"
                              )}>
                                {Math.round(submission.ai_relevance * 100)}%
                              </span>
                            </div>
                          )}
                          {submission.ai_quality !== null && (
                            <div>
                              <span className="text-gray-500">Quality: </span>
                              <span className={cn(
                                "font-medium",
                                submission.ai_quality >= 0.7 ? "text-green-600 dark:text-green-400" :
                                submission.ai_quality >= 0.4 ? "text-yellow-600 dark:text-yellow-400" :
                                "text-red-600 dark:text-red-400"
                              )}>
                                {Math.round(submission.ai_quality * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRejectionReason(reason: string): string {
  const reasons: Record<string, string> = {
    spam: "Identified as spam",
    duplicate: "Already exists",
    "off-topic": "Not related to Claude AI",
    "low-quality": "Quality standards not met",
    "not-relevant": "Not relevant to our audience",
    inappropriate: "Inappropriate content",
  };
  return reasons[reason] || reason;
}
