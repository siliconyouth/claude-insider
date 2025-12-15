"use client";

/**
 * Reports Management Page
 *
 * Admin page for reviewing and managing user/comment reports.
 * Supports filtering by status and type, and taking action on reports.
 */

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  getReports,
  getReportStats,
  reviewReport,
  type Report,
  type ReportStatus,
  type ReportType,
} from "@/app/actions/reports";

type Tab = "all" | "pending" | "investigating" | "action_taken" | "dismissed";

const STATUS_CONFIG: Record<ReportStatus, { label: string; bgColor: string; color: string }> = {
  pending: { label: "Pending", bgColor: "bg-yellow-900/30", color: "text-yellow-400" },
  investigating: { label: "Investigating", bgColor: "bg-blue-900/30", color: "text-blue-400" },
  action_taken: { label: "Action Taken", bgColor: "bg-emerald-900/30", color: "text-emerald-400" },
  dismissed: { label: "Dismissed", bgColor: "bg-gray-800", color: "text-gray-400" },
};

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  hate_speech: "Hate Speech",
  misinformation: "Misinformation",
  inappropriate: "Inappropriate",
  other: "Other",
};

export default function ReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    investigating: number;
    actionTaken: number;
    dismissed: number;
    byType: { user: number; comment: number };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [reporterMessage, setReporterMessage] = useState("");

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = activeTab === "all" ? undefined : activeTab;
      const result = await getReports({
        status: status as ReportStatus | undefined,
        type: typeFilter === "all" ? undefined : typeFilter,
      });

      if (result.success && result.reports) {
        setReports(result.reports);
      } else {
        toast.error(result.error || "Failed to load reports");
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, typeFilter, toast]);

  const loadStats = useCallback(async () => {
    try {
      const result = await getReportStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleReview = async (decision: "investigating" | "action_taken" | "dismissed") => {
    if (!selectedReport) return;

    setIsReviewing(true);
    try {
      const result = await reviewReport(selectedReport.id, decision, {
        reviewNotes: reviewNotes.trim() || undefined,
        actionTaken: actionTaken.trim() || undefined,
        reporterMessage: reporterMessage.trim() || undefined,
        sendNotifications: true,
      });

      if (result.success) {
        toast.success("Report updated successfully");
        setSelectedReport(null);
        setReviewNotes("");
        setActionTaken("");
        setReporterMessage("");
        loadReports();
        loadStats();
      } else {
        toast.error(result.error || "Failed to update report");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsReviewing(false);
    }
  };

  const openReport = (report: Report) => {
    setSelectedReport(report);
    setReviewNotes(report.reviewNotes || "");
    setActionTaken(report.actionTaken || "");
    setReporterMessage(report.reporterMessage || "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Reports</h2>
        <p className="mt-1 text-sm text-gray-400">
          Review and manage user and comment reports
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-400">Total Reports</p>
          </div>
          <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-500/30">
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-yellow-400/70">Pending</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/30">
            <p className="text-2xl font-bold text-blue-400">{stats.investigating}</p>
            <p className="text-xs text-blue-400/70">Investigating</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/30">
            <p className="text-2xl font-bold text-emerald-400">{stats.actionTaken}</p>
            <p className="text-xs text-emerald-400/70">Action Taken</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800 border border-gray-700">
            <p className="text-2xl font-bold text-gray-400">{stats.dismissed}</p>
            <p className="text-xs text-gray-500">Dismissed</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["pending", "investigating", "action_taken", "dismissed", "all"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === tab
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {tab === "all" ? "All" : tab === "action_taken" ? "Action Taken" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ReportType | "all")}
            className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="user">User Reports</option>
            <option value="comment">Comment Reports</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No reports found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {reports.map((report) => (
              <div
                key={report.id}
                onClick={() => openReport(report)}
                className="p-4 hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    report.reportType === "user" ? "bg-violet-900/30" : "bg-cyan-900/30"
                  )}>
                    {report.reportType === "user" ? (
                      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        STATUS_CONFIG[report.status].bgColor,
                        STATUS_CONFIG[report.status].color
                      )}>
                        {STATUS_CONFIG[report.status].label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-400">
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2">
                      {report.reportType === "user" ? (
                        <p className="text-sm text-white">
                          <span className="text-gray-400">Reported user:</span>{" "}
                          {report.reportedUserName || report.reportedUserEmail || "Unknown"}
                        </p>
                      ) : (
                        <p className="text-sm text-white truncate">
                          <span className="text-gray-400">Comment:</span>{" "}
                          {report.reportedCommentContent?.slice(0, 100) || "Unknown comment"}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Reported by: {report.reporterName || report.reporterEmail || "Unknown"}
                      </p>
                    </div>

                    {report.description && (
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                        {report.description}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
          />
          <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  selectedReport.reportType === "user" ? "bg-violet-900/30" : "bg-cyan-900/30"
                )}>
                  {selectedReport.reportType === "user" ? (
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedReport.reportType === "user" ? "User Report" : "Comment Report"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status & Reason */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  STATUS_CONFIG[selectedReport.status].bgColor,
                  STATUS_CONFIG[selectedReport.status].color
                )}>
                  {STATUS_CONFIG[selectedReport.status].label}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-400">
                  {REASON_LABELS[selectedReport.reason] || selectedReport.reason}
                </span>
              </div>

              {/* Reporter Info */}
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Reporter</h4>
                <p className="text-white">{selectedReport.reporterName || "Unknown"}</p>
                <p className="text-sm text-gray-500">{selectedReport.reporterEmail}</p>
              </div>

              {/* Reported Content */}
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-2">
                  {selectedReport.reportType === "user" ? "Reported User" : "Reported Comment"}
                </h4>
                {selectedReport.reportType === "user" ? (
                  <>
                    <p className="text-white">{selectedReport.reportedUserName || "Unknown"}</p>
                    <p className="text-sm text-gray-500">{selectedReport.reportedUserEmail}</p>
                  </>
                ) : (
                  <p className="text-white whitespace-pre-wrap">
                    {selectedReport.reportedCommentContent || "Comment not available"}
                  </p>
                )}
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Reporter's Description</h4>
                  <p className="text-white whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              )}

              {/* Review Section */}
              {selectedReport.status !== "action_taken" && selectedReport.status !== "dismissed" && (
                <>
                  <div className="pt-4 border-t border-gray-800">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Review Notes (internal)</h4>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your review..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Action Taken</h4>
                    <input
                      type="text"
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      placeholder="e.g., Warning issued, Comment hidden, User banned..."
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Message to Reporter</h4>
                    <textarea
                      value={reporterMessage}
                      onChange={(e) => setReporterMessage(e.target.value)}
                      placeholder="Optional message to send to the reporter..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    {selectedReport.status === "pending" && (
                      <button
                        onClick={() => handleReview("investigating")}
                        disabled={isReviewing}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isReviewing ? "Updating..." : "Mark as Investigating"}
                      </button>
                    )}
                    <button
                      onClick={() => handleReview("action_taken")}
                      disabled={isReviewing || !actionTaken.trim()}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isReviewing ? "Updating..." : "Action Taken"}
                    </button>
                    <button
                      onClick={() => handleReview("dismissed")}
                      disabled={isReviewing}
                      className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 disabled:opacity-50"
                    >
                      {isReviewing ? "Updating..." : "Dismiss"}
                    </button>
                  </div>
                </>
              )}

              {/* Completed Review Info */}
              {(selectedReport.status === "action_taken" || selectedReport.status === "dismissed") && (
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Review Completed</h4>
                  {selectedReport.reviewedByName && (
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-500">Reviewed by:</span> {selectedReport.reviewedByName}
                    </p>
                  )}
                  {selectedReport.reviewedAt && (
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-500">Reviewed at:</span>{" "}
                      {new Date(selectedReport.reviewedAt).toLocaleString()}
                    </p>
                  )}
                  {selectedReport.actionTaken && (
                    <p className="text-sm text-gray-300 mt-2">
                      <span className="text-gray-500">Action:</span> {selectedReport.actionTaken}
                    </p>
                  )}
                  {selectedReport.reviewNotes && (
                    <p className="text-sm text-gray-300 mt-2">
                      <span className="text-gray-500">Notes:</span> {selectedReport.reviewNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
