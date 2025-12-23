"use client";

/**
 * Resource Update Job Detail Page
 *
 * Shows detailed view of an update job including:
 * - Proposed changes with side-by-side diff
 * - AI summary and confidence scores
 * - Screenshot comparison (old vs new)
 * - Approve/Reject actions with field selection
 */

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { PageHeader, StatusBadge } from "@/components/dashboard/shared";
import { useToast } from "@/components/toast";

// Types
interface ProposedChange {
  field: string;
  fieldLabel: string;
  oldValue: unknown;
  newValue: unknown;
  confidence: number;
  reason: string;
  isBreaking: boolean;
}

interface UpdateJob {
  id: string;
  resource_id: string;
  resource_name?: string;
  resource_slug?: string;
  status: string;
  trigger_type: "manual" | "cron";
  triggered_by?: string;
  scraped_content?: { url: string; scrapedAt: string }[];
  scraped_at?: string;
  scrape_errors?: { url: string; error: string }[];
  proposed_changes?: ProposedChange[];
  ai_summary?: string;
  ai_model?: string;
  analyzed_at?: string;
  overall_confidence?: number;
  new_screenshots?: string[];
  old_screenshots?: string[];
  screenshot_errors?: string[];
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  selected_changes?: string[];
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toastApi = useToast();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<UpdateJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch job details
  useEffect(() => {
    async function fetchJob() {
      try {
        const response = await fetch(`/api/admin/resources/updates/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch job");
        const data = await response.json();
        setJob(data.job);
        // Select all fields by default
        if (data.job?.proposed_changes) {
          setSelectedFields(new Set(data.job.proposed_changes.map((c: ProposedChange) => c.field)));
        }
      } catch {
        toastApi.error("Error", "Failed to load update job");
      } finally {
        setIsLoading(false);
      }
    }
    fetchJob();
  }, [jobId, toastApi]);

  const toggleField = useCallback((field: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!job?.proposed_changes) return;
    setSelectedFields(new Set(job.proposed_changes.map((c) => c.field)));
  }, [job]);

  const selectNone = useCallback(() => {
    setSelectedFields(new Set());
  }, []);

  const handleApprove = useCallback(async () => {
    if (!job) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/resources/updates/${jobId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedFields: Array.from(selectedFields),
          reviewNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve");
      }

      toastApi.success("Success", "Changes applied successfully");
      router.push("/dashboard/resource-updates");
    } catch (error) {
      toastApi.error("Error", error instanceof Error ? error.message : "Failed to approve changes");
    } finally {
      setIsSubmitting(false);
    }
  }, [job, jobId, selectedFields, reviewNotes, router, toastApi]);

  const handleReject = useCallback(async () => {
    if (!job || !reviewNotes.trim()) {
      toastApi.error("Notes Required", "Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/resources/updates/${jobId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNotes }),
      });

      if (!response.ok) throw new Error("Failed to reject");

      toastApi.success("Rejected", "Update job has been rejected");
      router.push("/dashboard/resource-updates");
    } catch {
      toastApi.error("Error", "Failed to reject job");
    } finally {
      setIsSubmitting(false);
    }
  }, [job, jobId, reviewNotes, router, toastApi]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Job not found</p>
        <Link href="/dashboard/resource-updates" className="text-blue-600 dark:text-cyan-400 mt-2 inline-block">
          Back to updates
        </Link>
      </div>
    );
  }

  const isReviewable = job.status === "ready_for_review";
  const changesCount = job.proposed_changes?.length || 0;
  const selectedCount = selectedFields.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/resource-updates"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-2 inline-block"
          >
            &larr; Back to updates
          </Link>
          <PageHeader
            title={job.resource_name || "Resource Update"}
            description={`Job ${job.id.slice(0, 8)}... • ${job.trigger_type === "cron" ? "Automatic" : "Manual"} update`}
          />
        </div>
        <StatusBadge
          style={getStatusStyle(job.status)}
        />
      </div>

      {/* AI Summary */}
      {job.ai_summary && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <AIIcon className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                AI Analysis Summary
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {job.ai_summary}
              </p>
              {job.overall_confidence !== undefined && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Overall confidence: {Math.round(job.overall_confidence * 100)}%
                  {job.ai_model && ` • Model: ${job.ai_model}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proposed Changes */}
      {job.proposed_changes && job.proposed_changes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Proposed Changes ({changesCount})
            </h2>
            {isReviewable && (
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
                >
                  Select all
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={selectNone}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Select none
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {job.proposed_changes.map((change) => (
              <ChangeCard
                key={change.field}
                change={change}
                selected={selectedFields.has(change.field)}
                onToggle={() => toggleField(change.field)}
                isReviewable={isReviewable}
              />
            ))}
          </div>
        </div>
      )}

      {/* Screenshots */}
      {((job.new_screenshots && job.new_screenshots.length > 0) ||
        (job.old_screenshots && job.old_screenshots.length > 0)) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Screenshots
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {job.new_screenshots?.map((url, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  New Screenshot {i + 1}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`New screenshot ${i + 1}`}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#262626]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {(job.error_message || (job.scrape_errors && job.scrape_errors.length > 0)) && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
          <h3 className="font-medium text-red-700 dark:text-red-400 mb-2">Errors</h3>
          {job.error_message && (
            <p className="text-sm text-red-600 dark:text-red-400">{job.error_message}</p>
          )}
          {job.scrape_errors?.map((err, i) => (
            <p key={i} className="text-sm text-red-600 dark:text-red-400">
              {err.url}: {err.error}
            </p>
          ))}
        </div>
      )}

      {/* Review Actions */}
      {isReviewable && (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Review Decision
          </h3>

          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Add review notes (required for rejection)..."
            className={cn(
              "w-full p-3 rounded-lg border mb-4",
              "bg-white dark:bg-[#0a0a0a]",
              "border-gray-200 dark:border-[#262626]",
              "text-gray-900 dark:text-white",
              "placeholder:text-gray-400"
            )}
            rows={3}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCount} of {changesCount} changes selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg",
                  "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
                  "hover:bg-red-200 dark:hover:bg-red-900/30",
                  "disabled:opacity-50 transition-colors"
                )}
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting || selectedCount === 0}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg",
                  "bg-green-600 text-white",
                  "hover:bg-green-700",
                  "disabled:opacity-50 transition-colors"
                )}
              >
                {isSubmitting ? "Applying..." : `Apply ${selectedCount} Changes`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Review Info */}
      {job.reviewed_at && (
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Review History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {job.status === "applied" ? "Approved" : job.status === "rejected" ? "Rejected" : "Reviewed"} on{" "}
            {new Date(job.reviewed_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {job.review_notes && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              Notes: {job.review_notes}
            </p>
          )}
          {job.selected_changes && job.selected_changes.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Applied fields: {job.selected_changes.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual change card with diff view
 */
function ChangeCard({
  change,
  selected,
  onToggle,
  isReviewable,
}: {
  change: ProposedChange;
  selected: boolean;
  onToggle: () => void;
  isReviewable: boolean;
}) {
  const confidencePercent = Math.round(change.confidence * 100);
  const confidenceColor =
    confidencePercent >= 80
      ? "text-green-600 dark:text-green-400"
      : confidencePercent >= 50
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-colors",
        "bg-white dark:bg-[#111111]",
        selected
          ? "border-blue-500 dark:border-cyan-500"
          : "border-gray-200 dark:border-[#262626]",
        change.isBreaking && "ring-2 ring-red-500/20"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {isReviewable && (
          <button
            onClick={onToggle}
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
              selected
                ? "bg-blue-600 border-blue-600"
                : "border-gray-300 dark:border-gray-600"
            )}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {change.fieldLabel}
            </span>
            <span className={cn("text-xs font-medium", confidenceColor)}>
              {confidencePercent}%
            </span>
            {change.isBreaking && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                Breaking
              </span>
            )}
          </div>

          {/* Diff View */}
          <div className="space-y-2">
            <div className="p-2 rounded bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">Old:</span>
              <pre className="text-sm text-red-700 dark:text-red-300 mt-1 whitespace-pre-wrap break-words">
                {formatValue(change.oldValue)}
              </pre>
            </div>
            <div className="p-2 rounded bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">New:</span>
              <pre className="text-sm text-green-700 dark:text-green-300 mt-1 whitespace-pre-wrap break-words">
                {formatValue(change.newValue)}
              </pre>
            </div>
          </div>

          {/* Reason */}
          {change.reason && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span className="font-medium">Reason:</span> {change.reason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility functions
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "(empty)";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "(none)";
    return value.join("\n");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function getStatusStyle(status: string): { label: string; bg: string; text: string } {
  const defaultStyle = { label: "Pending", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" };
  const styles: Record<string, { label: string; bg: string; text: string }> = {
    pending: defaultStyle,
    scraping: { label: "Scraping", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
    analyzing: { label: "Analyzing", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
    screenshots: { label: "Screenshots", bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400" },
    ready_for_review: { label: "Ready for Review", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400" },
    approved: { label: "Approved", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    rejected: { label: "Rejected", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
    applied: { label: "Applied", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    failed: { label: "Failed", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  };
  return styles[status] ?? defaultStyle;
}

// Icons
const AIIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
