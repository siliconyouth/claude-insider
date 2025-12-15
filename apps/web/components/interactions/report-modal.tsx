"use client";

/**
 * Report Modal
 *
 * Modal for users to report other users or comments.
 * Supports different report reasons and optional description.
 */

import { useState } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import { reportUser, reportComment, type ReportReason } from "@/app/actions/reports";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "user" | "comment";
  targetId: string;
  targetName?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "spam", label: "Spam", description: "Unwanted promotional or repetitive content" },
  { value: "harassment", label: "Harassment", description: "Targeting or bullying behavior" },
  { value: "hate_speech", label: "Hate Speech", description: "Discriminatory or hateful content" },
  { value: "misinformation", label: "Misinformation", description: "False or misleading information" },
  { value: "inappropriate", label: "Inappropriate Content", description: "Adult, violent, or offensive material" },
  { value: "other", label: "Other", description: "Something else not listed above" },
];

export function ReportModal({ isOpen, onClose, type, targetId, targetName }: ReportModalProps) {
  const toast = useToast();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason for your report");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = type === "user"
        ? await reportUser(targetId, selectedReason, description.trim() || undefined)
        : await reportComment(targetId, selectedReason, description.trim() || undefined);

      if (result.success) {
        toast.success("Report submitted. Thank you for helping keep our community safe.");
        handleClose();
      } else {
        toast.error(result.error || "Failed to submit report");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Report {type === "user" ? "User" : "Comment"}
                </h3>
                {targetName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {type === "user" ? "Reporting" : "Comment by"}: {targetName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Why are you reporting this {type}?
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    selectedReason === reason.value
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    className="mt-0.5 text-red-500 focus:ring-red-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {reason.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {reason.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about why you're reporting this..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
              {description.length}/500
            </p>
          </div>

          {/* Info */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Reports are reviewed by our moderation team. We take all reports seriously and will
              investigate accordingly. Submitting false reports may result in action against your account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium text-white transition-all",
              "bg-red-600 hover:bg-red-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
