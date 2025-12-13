"use client";

/**
 * Data Management Component
 *
 * Export data and manage account deletion.
 */

import { useState, useTransition } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  exportUserData,
  requestAccountDeletion,
  cancelAccountDeletion,
  getPendingDeletionRequest,
} from "@/app/actions/account";

export function DataManagement() {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<{
    pending: boolean;
    expiresAt?: string;
  } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const toast = useToast();

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportUserData();
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `claude-insider-data-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Data exported successfully");
      }
    });
  };

  const handleCheckDeletion = async () => {
    const result = await getPendingDeletionRequest();
    setPendingDeletion({
      pending: result.pending ?? false,
      expiresAt: result.expiresAt,
    });
    if (!result.pending) {
      setShowDeleteConfirm(true);
    }
  };

  const handleRequestDeletion = () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    startTransition(async () => {
      const result = await requestAccountDeletion();
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Deletion request sent. Check your email.");
      setShowDeleteConfirm(false);
      setConfirmText("");
      setPendingDeletion({ pending: true });
    });
  };

  const handleCancelDeletion = () => {
    startTransition(async () => {
      const result = await cancelAccountDeletion();
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Deletion request cancelled");
      setPendingDeletion({ pending: false });
    });
  };

  // Pending deletion state
  if (pendingDeletion?.pending) {
    return (
      <div className="space-y-4">
        {/* Export */}
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-xl",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download all your data as JSON
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isPending}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-sm shadow-blue-500/25",
              "hover:shadow-md hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              "transition-all duration-200"
            )}
          >
            {isPending ? "..." : "Export"}
          </button>
        </div>

        {/* Pending Deletion */}
        <div
          className={cn(
            "p-4 rounded-xl",
            "bg-red-50 dark:bg-red-900/20",
            "border border-red-200 dark:border-red-800"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
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
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                Account Deletion Pending
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                A deletion request is pending. Check your email to confirm.
                {pendingDeletion.expiresAt && (
                  <span className="block mt-1">
                    Expires: {new Date(pendingDeletion.expiresAt).toLocaleString()}
                  </span>
                )}
              </p>
              <button
                onClick={handleCancelDeletion}
                disabled={isPending}
                className={cn(
                  "mt-3 px-4 py-2 text-sm font-medium rounded-lg",
                  "border border-red-300 dark:border-red-700",
                  "text-red-700 dark:text-red-300",
                  "hover:bg-red-100 dark:hover:bg-red-900/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors"
                )}
              >
                {isPending ? "..." : "Cancel Deletion Request"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Delete confirmation dialog
  if (showDeleteConfirm) {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            "p-6 rounded-xl",
            "bg-red-50 dark:bg-red-900/20",
            "border border-red-200 dark:border-red-800"
          )}
        >
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Delete Your Account
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">
            This action is <strong>permanent and irreversible</strong>. All your data will be
            deleted, including:
          </p>
          <ul className="text-sm text-red-600 dark:text-red-400 mb-4 space-y-1">
            <li>• Profile and account information</li>
            <li>• Comments, suggestions, and favorites</li>
            <li>• Collections and their items</li>
            <li>• Followers and following relationships</li>
            <li>• Achievements and progress</li>
          </ul>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4 font-medium">
            Type &quot;DELETE&quot; to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className={cn(
              "w-full px-4 py-2 rounded-lg mb-4",
              "bg-white dark:bg-[#0a0a0a]",
              "border border-red-300 dark:border-red-700",
              "text-gray-900 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-red-500"
            )}
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setConfirmText("");
              }}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleRequestDeletion}
              disabled={isPending || confirmText !== "DELETE"}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg text-sm font-medium",
                "bg-red-600 text-white",
                "hover:bg-red-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "..." : "Request Deletion"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default state
  return (
    <div className="space-y-4">
      {/* Export Data */}
      <div
        className={cn(
          "flex items-center justify-between p-4 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Download all your data as JSON (GDPR-compliant)
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isPending}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white shadow-sm shadow-blue-500/25",
            "hover:shadow-md hover:-translate-y-0.5",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
            "transition-all duration-200"
          )}
        >
          {isPending ? "Exporting..." : "Export"}
        </button>
      </div>

      {/* Delete Account */}
      <div
        className={cn(
          "flex items-center justify-between p-4 rounded-xl",
          "bg-gray-50 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}
      >
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Permanently delete your account and all data
          </p>
        </div>
        <button
          onClick={handleCheckDeletion}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg",
            "border border-red-200 dark:border-red-800",
            "text-red-600 dark:text-red-400",
            "hover:bg-red-50 dark:hover:bg-red-900/20",
            "transition-colors"
          )}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
