"use client";

/**
 * Prompt Submissions Moderation Dashboard
 *
 * Admin page for reviewing and moderating community-submitted prompts.
 *
 * Features:
 * - Filter by status (pending, reviewing, approved, rejected)
 * - View submission details with AI analysis
 * - Approve/reject with feedback
 * - Bulk actions
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import {
  InboxIcon,
  FilterIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  Loader2Icon,
  ClockIcon,
  UserIcon,
  SparklesIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
} from "lucide-react";

interface Submission {
  id: string;
  title: string;
  description: string | null;
  content: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  variables: Array<{ name: string }>;
  sourceUrl: string | null;
  submitter: {
    id: string;
    name: string | null;
    image: string | null;
  };
  status: "pending" | "reviewing" | "approved" | "rejected" | "needs_adaptation";
  aiAnalysis: {
    quality_score: number;
    has_variables: boolean;
    uses_xml_tags: boolean;
    suggestions: string[];
  } | null;
  moderatorNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionsResponse {
  submissions: Submission[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    icon: ClockIcon,
  },
  reviewing: {
    label: "Reviewing",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    icon: EyeIcon,
  },
  approved: {
    label: "Approved",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    icon: CheckIcon,
  },
  rejected: {
    label: "Rejected",
    color: "text-red-500 bg-red-500/10 border-red-500/30",
    icon: XIcon,
  },
  needs_adaptation: {
    label: "Needs Work",
    color: "text-violet-500 bg-violet-500/10 border-violet-500/30",
    icon: AlertTriangleIcon,
  },
};

export default function SubmissionsDashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Check admin access
  useEffect(() => {
    async function checkAccess() {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      const role = data.session?.user?.role;
      const isAdminUser = role === "admin" || role === "superadmin" || role === "moderator";
      setIsAdmin(isAdminUser);
      if (!isAdminUser) {
        router.push("/dashboard");
      }
    }
    checkAccess();
  }, [router]);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: "20",
      });

      const res = await fetch(`/api/admin/prompts/submissions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data: SubmissionsResponse = await res.json();
      setSubmissions(data.submissions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin, fetchSubmissions]);

  // Handle status update
  const handleStatusUpdate = async (
    submissionId: string,
    newStatus: string,
    notes?: string
  ) => {
    setActionInProgress(submissionId);
    try {
      const res = await fetch(`/api/admin/prompts/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, moderatorNotes: notes }),
      });

      if (!res.ok) throw new Error("Failed to update");

      // Refresh list
      fetchSubmissions();
      setSelectedSubmission(null);
      setRejectReason("");
    } catch (error) {
      console.error("Error updating submission:", error);
    } finally {
      setActionInProgress(null);
    }
  };

  // Loading state
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2Icon className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Prompt Submissions
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Review and moderate community-submitted prompts
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
            "hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          )}
        >
          <RefreshCwIcon className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <FilterIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Status:</span>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
              statusFilter === status
                ? config.color
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <config.icon className="w-3.5 h-3.5" />
            {config.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        Showing {submissions.length} of {total} submissions
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12">
          <InboxIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">
            No {statusFilter} submissions found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const statusConfig = STATUS_CONFIG[submission.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={submission.id}
                className={cn(
                  "rounded-xl border p-4",
                  "bg-white dark:bg-[#111111]",
                  "border-gray-200 dark:border-[#262626]",
                  "hover:border-blue-500/30 transition-colors"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {submission.title}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
                          statusConfig.color
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>

                    {submission.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                        {submission.description}
                      </p>
                    )}

                    <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        {submission.submitter.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={submission.submitter.image}
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <UserIcon className="w-3 h-3" />
                        )}
                        {submission.submitter.name || "Anonymous"}
                      </span>
                      <span>{submission.category.name}</span>
                      <span>
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </span>
                      {submission.aiAnalysis && (
                        <span className="inline-flex items-center gap-1 text-blue-500">
                          <SparklesIcon className="w-3 h-3" />
                          Score: {submission.aiAnalysis.quality_score}
                        </span>
                      )}
                      {submission.sourceUrl && (
                        <a
                          href={submission.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                        >
                          <ExternalLinkIcon className="w-3 h-3" />
                          Source
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        "text-gray-400 hover:text-blue-500 hover:bg-blue-500/10"
                      )}
                      title="View details"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    {submission.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusUpdate(submission.id, "approved")
                          }
                          disabled={actionInProgress === submission.id}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            "text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10",
                            "disabled:opacity-50"
                          )}
                          title="Approve"
                        >
                          {actionInProgress === submission.id ? (
                            <Loader2Icon className="w-5 h-5 animate-spin" />
                          ) : (
                            <CheckIcon className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            "text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                          )}
                          title="Reject"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Preview content */}
                <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] text-sm font-mono text-gray-600 dark:text-gray-400 line-clamp-3">
                  {submission.content}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={cn(
              "relative w-full max-w-3xl max-h-[90vh] overflow-y-auto",
              "bg-white dark:bg-[#111111]",
              "rounded-2xl shadow-2xl shadow-black/20",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review Submission
              </h2>
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setRejectReason("");
                }}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Title & Meta */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedSubmission.title}
                </h3>
                {selectedSubmission.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {selectedSubmission.description}
                  </p>
                )}
                <div className="flex items-center flex-wrap gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border",
                      STATUS_CONFIG[selectedSubmission.status].color
                    )}
                  >
                    {STATUS_CONFIG[selectedSubmission.status].label}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {selectedSubmission.category.name}
                  </span>
                  {selectedSubmission.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt Content
                </h4>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626]">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">
                    {selectedSubmission.content}
                  </pre>
                </div>
              </div>

              {/* AI Analysis */}
              {selectedSubmission.aiAnalysis && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-blue-500" />
                    AI Analysis
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a]">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedSubmission.aiAnalysis.quality_score}
                      </div>
                      <div className="text-xs text-gray-500">Quality Score</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a]">
                      <div className="flex items-center gap-2">
                        {selectedSubmission.aiAnalysis.uses_xml_tags && (
                          <span className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-500">
                            XML Tags
                          </span>
                        )}
                        {selectedSubmission.aiAnalysis.has_variables && (
                          <span className="px-2 py-1 rounded text-xs bg-violet-500/10 text-violet-500">
                            Variables
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Features</div>
                    </div>
                  </div>
                  {selectedSubmission.aiAnalysis.suggestions.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <div className="text-sm font-medium text-amber-500 mb-1">
                        Suggestions
                      </div>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {selectedSubmission.aiAnalysis.suggestions.map(
                          (suggestion, i) => (
                            <li key={i}>• {suggestion}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Submitter Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#0a0a0a]">
                {selectedSubmission.submitter.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selectedSubmission.submitter.image}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedSubmission.submitter.name || "Anonymous"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Submitted{" "}
                    {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Reject Reason (for pending submissions) */}
              {selectedSubmission.status === "pending" && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason (optional)
                  </h4>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide feedback to the submitter..."
                    rows={3}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg",
                      "bg-gray-50 dark:bg-[#0a0a0a]",
                      "border border-gray-200 dark:border-[#262626]",
                      "text-gray-900 dark:text-white",
                      "placeholder-gray-400 dark:placeholder-gray-500",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    )}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedSubmission.status === "pending" && (
              <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
                <button
                  onClick={() =>
                    handleStatusUpdate(
                      selectedSubmission.id,
                      "rejected",
                      rejectReason
                    )
                  }
                  disabled={actionInProgress === selectedSubmission.id}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                    "bg-red-500/10 text-red-500 border border-red-500/30",
                    "hover:bg-red-500/20 transition-colors",
                    "disabled:opacity-50"
                  )}
                >
                  {actionInProgress === selectedSubmission.id ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    <XIcon className="w-4 h-4" />
                  )}
                  Reject
                </button>
                <button
                  onClick={() =>
                    handleStatusUpdate(selectedSubmission.id, "approved")
                  }
                  disabled={actionInProgress === selectedSubmission.id}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white font-medium",
                    "hover:shadow-lg transition-all",
                    "disabled:opacity-50"
                  )}
                >
                  {actionInProgress === selectedSubmission.id ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                  Approve & Publish
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
