"use client";

/**
 * Ban Appeal Modal
 *
 * Displays when a banned user signs in, allowing them to:
 * 1. View their ban reason
 * 2. Submit an appeal
 * 3. Add additional context to pending appeals
 * 4. View appeal history and status
 */

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  checkBanStatus,
  submitBanAppeal,
  addAppealContext,
  getMyAppeals,
  type BanAppeal,
} from "@/app/actions/ban-appeals";

interface BanAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

type View = "info" | "appeal" | "history" | "add-context";

export function BanAppealModal({ isOpen, onClose, onSignOut }: BanAppealModalProps) {
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  // Ban status
  const [banReason, setBanReason] = useState<string | null>(null);
  const [bannedAt, setBannedAt] = useState<string | null>(null);
  const [pendingAppeal, setPendingAppeal] = useState(false);

  // View state
  const [view, setView] = useState<View>("info");

  // Appeals
  const [appeals, setAppeals] = useState<BanAppeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<BanAppeal | null>(null);

  // Form state
  const [reason, setReason] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // Load ban status on mount
  useEffect(() => {
    if (isOpen) {
      loadBanStatus();
    }
  }, [isOpen]);

  const loadBanStatus = async () => {
    const result = await checkBanStatus();
    if (result.banned) {
      setBanReason(result.banReason || null);
      setBannedAt(result.bannedAt || null);
      setPendingAppeal(result.pendingAppeal || false);
    }
  };

  const loadAppeals = async () => {
    const result = await getMyAppeals();
    if (!result.error && result.appeals) {
      setAppeals(result.appeals);
    }
  };

  const handleSubmitAppeal = () => {
    if (reason.trim().length < 20) {
      toast.error("Please provide a detailed reason (at least 20 characters)");
      return;
    }

    startTransition(async () => {
      const result = await submitBanAppeal(reason.trim(), additionalContext.trim() || undefined);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Appeal submitted successfully! We will review it within 5-7 business days.");
      setReason("");
      setAdditionalContext("");
      setPendingAppeal(true);
      setView("info");
    });
  };

  const handleAddContext = () => {
    if (!selectedAppeal) return;
    if (additionalContext.trim().length < 10) {
      toast.error("Please provide more detail (at least 10 characters)");
      return;
    }

    startTransition(async () => {
      const result = await addAppealContext(selectedAppeal.id, additionalContext.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Additional information added to your appeal");
      setAdditionalContext("");
      setSelectedAppeal(null);
      setView("history");
      loadAppeals();
    });
  };

  const handleViewHistory = () => {
    loadAppeals();
    setView("history");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-lg max-h-[90vh] overflow-y-auto",
          "bg-white dark:bg-[#111111]",
          "rounded-2xl shadow-2xl",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#262626] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Account Suspended
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your account access has been restricted
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Info View */}
          {view === "info" && (
            <div className="space-y-6">
              {/* Ban Reason */}
              {banReason && (
                <div
                  className={cn(
                    "p-4 rounded-lg",
                    "bg-red-50 dark:bg-red-900/20",
                    "border border-red-200 dark:border-red-800"
                  )}
                >
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Reason for suspension:
                  </p>
                  <p className="text-red-700 dark:text-red-300">{banReason}</p>
                  {bannedAt && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Suspended on {new Date(bannedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Status Message */}
              {pendingAppeal ? (
                <div
                  className={cn(
                    "p-4 rounded-lg",
                    "bg-yellow-50 dark:bg-yellow-900/20",
                    "border border-yellow-200 dark:border-yellow-800"
                  )}
                >
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    Appeal Pending
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You have a pending appeal under review. We will notify you via email once a decision is made.
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  If you believe this suspension was made in error, you can submit an appeal explaining your situation.
                </p>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {!pendingAppeal && (
                  <button
                    onClick={() => setView("appeal")}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg text-sm font-medium",
                      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                      "text-white",
                      "hover:shadow-lg hover:-translate-y-0.5",
                      "transition-all duration-200"
                    )}
                  >
                    Submit an Appeal
                  </button>
                )}

                <button
                  onClick={handleViewHistory}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg text-sm font-medium",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  )}
                >
                  View Appeal History
                </button>

                <button
                  onClick={onSignOut}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg text-sm font-medium",
                    "text-gray-500 dark:text-gray-400",
                    "hover:text-gray-700 dark:hover:text-gray-200"
                  )}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Appeal Form View */}
          {view === "appeal" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Why should your account be reinstated? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you believe your account should be reinstated..."
                  rows={4}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg text-sm",
                    "bg-white dark:bg-[#0a0a0a]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white",
                    "placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "resize-none"
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 20 characters ({reason.length}/20)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Any additional information that might help us understand your situation..."
                  rows={3}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg text-sm",
                    "bg-white dark:bg-[#0a0a0a]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white",
                    "placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "resize-none"
                  )}
                />
              </div>

              <div
                className={cn(
                  "p-3 rounded-lg",
                  "bg-gray-50 dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By submitting an appeal, you acknowledge that your request will be reviewed by our moderation team.
                  Appeals are typically reviewed within 5-7 business days.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setView("info")}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-lg text-sm font-medium",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  )}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitAppeal}
                  disabled={isPending || reason.length < 20}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-lg text-sm font-medium",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isPending ? "Submitting..." : "Submit Appeal"}
                </button>
              </div>
            </div>
          )}

          {/* History View */}
          {view === "history" && (
            <div className="space-y-4">
              {appeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No appeals submitted yet
                  </p>
                </div>
              ) : (
                appeals.map((appeal) => (
                  <div
                    key={appeal.id}
                    className={cn(
                      "p-4 rounded-lg",
                      "bg-gray-50 dark:bg-[#1a1a1a]",
                      "border border-gray-200 dark:border-[#262626]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              appeal.status === "pending" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                              appeal.status === "approved" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              appeal.status === "rejected" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}
                          >
                            {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(appeal.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {appeal.reason}
                        </p>
                        {appeal.responseMessage && (
                          <div className="mt-2 p-2 rounded bg-gray-100 dark:bg-[#0a0a0a]">
                            <p className="text-xs text-gray-500 mb-1">Response:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {appeal.responseMessage}
                            </p>
                          </div>
                        )}
                      </div>
                      {appeal.status === "pending" && (
                        <button
                          onClick={() => {
                            setSelectedAppeal(appeal);
                            setAdditionalContext("");
                            setView("add-context");
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium",
                            "border border-gray-200 dark:border-[#262626]",
                            "text-gray-600 dark:text-gray-400",
                            "hover:bg-gray-100 dark:hover:bg-[#262626]"
                          )}
                        >
                          Add Info
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={() => setView("info")}
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-sm font-medium",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-700 dark:text-gray-300",
                  "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                )}
              >
                Back
              </button>
            </div>
          )}

          {/* Add Context View */}
          {view === "add-context" && selectedAppeal && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Add Information to Your Appeal
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Provide any additional context that might help our moderation team understand your situation better.
                </p>

                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Enter additional information..."
                  rows={4}
                  autoFocus
                  className={cn(
                    "w-full px-4 py-3 rounded-lg text-sm",
                    "bg-white dark:bg-[#0a0a0a]",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-900 dark:text-white",
                    "placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    "resize-none"
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 10 characters ({additionalContext.length}/10)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedAppeal(null);
                    setView("history");
                  }}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-lg text-sm font-medium",
                    "border border-gray-200 dark:border-[#262626]",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContext}
                  disabled={isPending || additionalContext.length < 10}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-lg text-sm font-medium",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isPending ? "Adding..." : "Add Information"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
