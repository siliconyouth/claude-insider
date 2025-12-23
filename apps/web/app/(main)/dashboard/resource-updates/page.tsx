"use client";

/**
 * Resource Updates Dashboard
 *
 * Admin page for reviewing and approving AI-generated resource updates.
 * Shows pending update jobs with proposed changes, screenshots, and
 * allows admins to approve, reject, or cherry-pick changes.
 */

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { PageHeader, StatusBadge, EmptyState } from "@/components/dashboard/shared";
import { useToast } from "@/components/toast";

// Job status configuration - matches StatusStyle interface { bg, text, label }
const JOB_STATUS = {
  pending: { label: "Pending", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
  scraping: { label: "Scraping", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  analyzing: { label: "Analyzing", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
  screenshots: { label: "Screenshots", bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400" },
  ready_for_review: { label: "Ready for Review", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
  approved: { label: "Approved", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  rejected: { label: "Rejected", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  applied: { label: "Applied", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  failed: { label: "Failed", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
} as const;

type JobStatus = keyof typeof JOB_STATUS;

interface UpdateJob {
  id: string;
  resource_id: string;
  resource_name?: string;
  resource_slug?: string;
  status: JobStatus;
  trigger_type: "manual" | "cron";
  proposed_changes?: { field: string; confidence: number }[];
  ai_summary?: string;
  overall_confidence?: number;
  new_screenshots?: string[];
  error_message?: string;
  created_at: string;
  updated_at: string;
}

type FilterStatus = JobStatus | "all";

export default function ResourceUpdatesPage() {
  const [jobs, setJobs] = useState<UpdateJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ready_for_review");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toastApi = useToast();

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/resources/updates?${params}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");

      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalPages(Math.ceil(data.total / 20) || 1);
    } catch {
      toastApi.error("Error", "Failed to load update jobs");
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, toastApi]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = useCallback((status: FilterStatus) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Updates"
        description="Review and approve AI-generated resource updates"
        badge={jobs.filter((j) => j.status === "ready_for_review").length || undefined}
      />

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "ready_for_review", "pending", "applied", "rejected", "failed"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg font-medium transition-colors",
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#262626]"
              )}
            >
              {status === "all" ? "All" : JOB_STATUS[status]?.label || status}
            </button>
          )
        )}
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          message="No update jobs found"
          description={
            statusFilter === "ready_for_review"
              ? "No resources are pending review"
              : "No jobs match the selected filter"
          }
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onRefresh={fetchJobs} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-[#1a1a1a] disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-[#1a1a1a] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Individual job card
 */
function JobCard({ job, onRefresh: _onRefresh }: { job: UpdateJob; onRefresh: () => void }) {
  const statusConfig = JOB_STATUS[job.status];
  const changesCount = job.proposed_changes?.length || 0;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border",
        "bg-white dark:bg-[#111111]",
        "border-gray-200 dark:border-[#262626]",
        "hover:border-blue-500/30 transition-colors"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Resource info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/dashboard/resource-updates/${job.id}`}
              className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 transition-colors truncate"
            >
              {job.resource_name || "Unknown Resource"}
            </Link>
            <StatusBadge style={statusConfig} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {job.trigger_type === "cron" ? "Auto" : "Manual"}
            </span>
          </div>

          {job.ai_summary && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {job.ai_summary}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {changesCount > 0 && (
              <span className="flex items-center gap-1">
                <ChangeIcon className="w-3.5 h-3.5" />
                {changesCount} change{changesCount !== 1 ? "s" : ""}
              </span>
            )}
            {job.overall_confidence !== undefined && (
              <span className="flex items-center gap-1">
                <ConfidenceIcon className="w-3.5 h-3.5" />
                {Math.round(job.overall_confidence * 100)}% confidence
              </span>
            )}
            {job.new_screenshots && job.new_screenshots.length > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                {job.new_screenshots.length} screenshot{job.new_screenshots.length !== 1 ? "s" : ""}
              </span>
            )}
            <span>
              {new Date(job.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {job.error_message && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              Error: {job.error_message}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/resource-updates/${job.id}`}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
              job.status === "ready_for_review"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#262626]"
            )}
          >
            {job.status === "ready_for_review" ? "Review" : "View"}
          </Link>
        </div>
      </div>
    </div>
  );
}

// Icons
const ChangeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ConfidenceIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
