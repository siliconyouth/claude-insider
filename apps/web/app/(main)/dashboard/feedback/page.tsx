"use client";

/**
 * Feedback Management Page
 *
 * Moderators and admins can view and manage feedback from beta testers.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import {
  usePaginatedList,
  useStatusAction,
  FEEDBACK_STATUS,
  FEEDBACK_TYPE,
  SEVERITY,
  type FeedbackStatus,
  type FeedbackType,
  type Severity,
} from "@/lib/dashboard";
import {
  PageHeader,
  StatusBadge,
  ReviewModal,
  DetailRow,
} from "@/components/dashboard/shared";
import type { AdminFeedback } from "@/types/admin";

type FilterStatus = FeedbackStatus | "all";
type FilterType = FeedbackType | "all";

export default function FeedbackPage() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("open");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [selectedItem, setSelectedItem] = useState<AdminFeedback | null>(null);

  // Fetch feedback with pagination
  const {
    items: feedback,
    isLoading,
    page,
    totalPages,
    setPage,
    refetch,
  } = usePaginatedList<AdminFeedback>("feedback", {
    limit: 20,
    initialFilters: { status: statusFilter, feedbackType: typeFilter },
  });

  // Status update action
  const { updateStatus, isLoading: isUpdating } = useStatusAction("feedback", {
    successMessage: "Status updated successfully",
    onSuccess: () => {
      if (selectedItem) {
        refetch();
      }
    },
  });

  const handleStatusUpdate = useCallback(
    async (newStatus: string) => {
      if (!selectedItem) return;
      const result = await updateStatus(selectedItem.id, newStatus);
      if (result.success) {
        setSelectedItem({ ...selectedItem, status: newStatus as FeedbackStatus });
      }
    },
    [selectedItem, updateStatus]
  );

  const handleFilterChange = useCallback(
    (type: "status" | "type", value: string) => {
      if (type === "status") {
        setStatusFilter(value as FilterStatus);
      } else {
        setTypeFilter(value as FilterType);
      }
      setPage(1);
    },
    [setPage]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Manage bug reports, feature requests, and general feedback"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <FilterButtons
          options={["all", "open", "in_progress", "resolved", "closed"]}
          value={statusFilter}
          onChange={(v) => handleFilterChange("status", v)}
          getLabel={(s) => (s === "all" ? "All" : FEEDBACK_STATUS[s as FeedbackStatus]?.label || s)}
          variant="blue"
        />

        <FilterButtons
          options={["all", "bug", "feature", "general"]}
          value={typeFilter}
          onChange={(v) => handleFilterChange("type", v)}
          getLabel={(t) => (t === "all" ? "All" : FEEDBACK_TYPE[t as FeedbackType]?.label || t)}
          getIcon={(t) => (t === "bug" ? "🐛 " : t === "feature" ? "💡 " : t === "general" ? "💬 " : "")}
          variant="violet"
        />
      </div>

      {/* Feedback List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No feedback found</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {feedback.map((item) => (
              <FeedbackRow
                key={item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                onSelect={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <ReviewModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          size="lg"
          isLoading={isUpdating}
        >
          <FeedbackDetail
            item={selectedItem}
            onStatusUpdate={handleStatusUpdate}
            isUpdating={isUpdating}
          />
        </ReviewModal>
      )}
    </div>
  );
}

// Filter buttons component
function FilterButtons({
  options,
  value,
  onChange,
  getLabel,
  getIcon,
  variant,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  getLabel: (value: string) => string;
  getIcon?: (value: string) => string;
  variant: "blue" | "violet";
}) {
  const activeClass = variant === "blue"
    ? "bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30"
    : "bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-500/30";

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            value === option ? activeClass : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          {getIcon?.(option)}
          {getLabel(option)}
        </button>
      ))}
    </div>
  );
}

// Feedback row component
function FeedbackRow({
  item,
  isSelected,
  onSelect,
}: {
  item: AdminFeedback;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer",
        isSelected && "bg-gray-50 dark:bg-gray-800/50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        <FeedbackTypeIcon type={item.feedbackType} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</h3>
            <StatusBadge style={FEEDBACK_STATUS[item.status as FeedbackStatus] || FEEDBACK_STATUS.open} />
            {item.severity && (
              <StatusBadge style={SEVERITY[item.severity as Severity] || SEVERITY.low} />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            by {item.userName || item.userEmail}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{item.description}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Feedback detail component
function FeedbackDetail({
  item,
  onStatusUpdate,
  isUpdating,
}: {
  item: AdminFeedback;
  onStatusUpdate: (status: string) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Header with type icon */}
      <div className="flex items-center gap-3">
        <FeedbackTypeIcon type={item.feedbackType} />
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            by {item.userName} • {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        <StatusBadge style={FEEDBACK_STATUS[item.status as FeedbackStatus] || FEEDBACK_STATUS.open} />
        {item.severity && (
          <StatusBadge style={SEVERITY[item.severity as Severity] || SEVERITY.low} />
        )}
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
        <p className="mt-2 text-gray-900 dark:text-white whitespace-pre-wrap">{item.description}</p>
      </div>

      {/* Page URL */}
      {item.pageUrl && (
        <DetailRow
          label="Page URL"
          value={
            <a
              href={item.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-cyan-400 hover:text-blue-500 dark:hover:text-cyan-300 text-sm truncate"
            >
              {item.pageUrl}
            </a>
          }
        />
      )}

      {/* User Agent */}
      {item.userAgent && (
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">User Agent</label>
          <p className="mt-1 text-xs text-gray-500 break-all">{item.userAgent}</p>
        </div>
      )}

      {/* Status Update */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Update Status</label>
        <div className="flex flex-wrap gap-2">
          {["open", "in_progress", "resolved", "closed", "wont_fix"].map((status) => (
            <button
              key={status}
              onClick={() => onStatusUpdate(status)}
              disabled={isUpdating || item.status === status}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                item.status === status
                  ? "bg-blue-600 text-white cursor-default"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
              )}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Feedback type icon
function FeedbackTypeIcon({ type }: { type: string }) {
  const defaultIcon = { bg: "bg-blue-100 dark:bg-blue-900/30", emoji: "💬" };
  const icons: Record<string, { bg: string; emoji: string }> = {
    bug: { bg: "bg-red-100 dark:bg-red-900/30", emoji: "🐛" },
    feature: { bg: "bg-emerald-100 dark:bg-emerald-900/30", emoji: "💡" },
    general: defaultIcon,
  };
  const config = icons[type] ?? defaultIcon;

  return (
    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", config.bg)}>
      <span className="text-lg">{config.emoji}</span>
    </div>
  );
}
