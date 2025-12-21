"use client";

/**
 * Admin Data Export Page
 *
 * Dashboard for managing bulk data exports:
 * - Create new exports with wizard
 * - View export history
 * - Download completed exports
 * - Track progress of active exports
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import {
  createExportJob,
  getExportJobs,
  getExportDownloadUrl,
  cancelExportJob,
  deleteExportJob,
  type ExportJob,
  type ExportType,
} from "@/app/actions/admin-export";
import { type ExportFormat } from "@/lib/export-formats";
import {
  DownloadIcon,
  RefreshCwIcon,
  PlusIcon,
  FileJsonIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  UsersIcon,
  ActivityIcon,
  FileIcon,
  ShieldIcon,
  PackageIcon,
  XIcon,
  CheckIcon,
  AlertCircleIcon,
  ClockIcon,
  TrashIcon,
} from "lucide-react";

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch export jobs
  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getExportJobs(1, 50);
      if (result.error) {
        setError(result.error);
      } else {
        setJobs(result.jobs || []);
        setError(null);
      }
    } catch (err) {
      setError("Failed to load exports");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh for active jobs
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (j) => j.status === "pending" || j.status === "processing"
    );
    if (!hasActiveJobs) return;

    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  // Handle download
  const handleDownload = async (jobId: string) => {
    const result = await getExportDownloadUrl(jobId);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.url) {
      window.open(result.url, "_blank");
    }
  };

  // Handle cancel
  const handleCancel = async (jobId: string) => {
    const result = await cancelExportJob(jobId);
    if (result.error) {
      alert(result.error);
    } else {
      fetchJobs();
    }
  };

  // Handle delete
  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this export?")) return;
    const result = await deleteExportJob(jobId);
    if (result.error) {
      alert(result.error);
    } else {
      fetchJobs();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Export</h1>
          <p className="mt-1 text-gray-400">
            Export user data, activity logs, and content in bulk
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchJobs}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white bg-gray-800 rounded-lg transition-colors"
          >
            <RefreshCwIcon
              className={cn("w-4 h-4", isLoading && "animate-spin")}
            />
            Refresh
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Export
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Export Wizard Modal */}
      {showWizard && (
        <ExportWizard
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            fetchJobs();
          }}
        />
      )}

      {/* Export Jobs Table */}
      <div className="rounded-xl bg-gray-800/50 border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <h2 className="font-medium text-white">Export History</h2>
        </div>

        {isLoading && jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCwIcon className="w-6 h-6 mx-auto animate-spin mb-2" />
            Loading exports...
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <PackageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No exports yet. Create your first export above.
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {jobs.map((job) => (
              <ExportJobRow
                key={job.id}
                job={job}
                onDownload={handleDownload}
                onCancel={handleCancel}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Export Job Row
function ExportJobRow({
  job,
  onDownload,
  onCancel,
  onDelete,
}: {
  job: ExportJob;
  onDownload: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusColors = {
    pending: "text-yellow-400 bg-yellow-500/10",
    processing: "text-blue-400 bg-blue-500/10",
    completed: "text-green-400 bg-green-500/10",
    failed: "text-red-400 bg-red-500/10",
    cancelled: "text-gray-400 bg-gray-500/10",
  };

  const formatIcon = {
    json: <FileJsonIcon className="w-4 h-4 text-yellow-400" />,
    csv: <FileTextIcon className="w-4 h-4 text-green-400" />,
    xlsx: <FileSpreadsheetIcon className="w-4 h-4 text-blue-400" />,
  };

  const typeIcon = {
    users: <UsersIcon className="w-4 h-4" />,
    activity: <ActivityIcon className="w-4 h-4" />,
    content: <FileIcon className="w-4 h-4" />,
    audit_logs: <ShieldIcon className="w-4 h-4" />,
    all: <PackageIcon className="w-4 h-4" />,
  };

  return (
    <div className="px-4 py-3 flex items-center gap-4">
      {/* Type & Format */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <div className="p-2 rounded-lg bg-gray-700/50">
          {typeIcon[job.export_type]}
        </div>
        <div>
          <p className="text-sm font-medium text-white capitalize">
            {job.export_type.replace("_", " ")}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {formatIcon[job.format]}
            <span className="uppercase">{job.format}</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex-1 min-w-[120px]">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full",
            statusColors[job.status]
          )}
        >
          {job.status === "pending" && <ClockIcon className="w-3 h-3" />}
          {job.status === "processing" && (
            <RefreshCwIcon className="w-3 h-3 animate-spin" />
          )}
          {job.status === "completed" && <CheckIcon className="w-3 h-3" />}
          {job.status === "failed" && <AlertCircleIcon className="w-3 h-3" />}
          {job.status === "cancelled" && <XIcon className="w-3 h-3" />}
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </span>
        {job.status === "processing" && job.current_step && (
          <p className="text-xs text-gray-500 mt-1">{job.current_step}</p>
        )}
        {job.status === "processing" && (
          <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        )}
        {job.status === "failed" && job.error_message && (
          <p className="text-xs text-red-400 mt-1">{job.error_message}</p>
        )}
      </div>

      {/* Stats */}
      <div className="text-right min-w-[100px]">
        <p className="text-sm text-gray-400">
          {job.row_count !== null ? `${job.row_count} rows` : "-"}
        </p>
        <p className="text-xs text-gray-500">{formatBytes(job.file_size)}</p>
      </div>

      {/* Created */}
      <div className="text-right min-w-[100px]">
        <p className="text-xs text-gray-400">
          {new Date(job.created_at).toLocaleDateString()}
        </p>
        <p className="text-xs text-gray-500">
          {new Date(job.created_at).toLocaleTimeString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {job.status === "completed" && (
          <button
            onClick={() => onDownload(job.id)}
            className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
            title="Download"
          >
            <DownloadIcon className="w-4 h-4" />
          </button>
        )}
        {(job.status === "pending" || job.status === "processing") && (
          <button
            onClick={() => onCancel(job.id)}
            className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
            title="Cancel"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
        {(job.status === "completed" ||
          job.status === "failed" ||
          job.status === "cancelled") && (
          <button
            onClick={() => onDelete(job.id)}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Export Wizard Component
function ExportWizard({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [exportType, setExportType] = useState<ExportType>("users");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [anonymize, setAnonymize] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await createExportJob({
        exportType,
        format,
        options: { anonymize },
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onComplete();
    } catch (err) {
      setError("Failed to create export");
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions: Array<{
    value: ExportType;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "users",
      label: "Users",
      description: "Export user accounts and profiles",
      icon: <UsersIcon className="w-6 h-6" />,
    },
    {
      value: "activity",
      label: "Activity",
      description: "Export user activity and actions",
      icon: <ActivityIcon className="w-6 h-6" />,
    },
    {
      value: "content",
      label: "Content",
      description: "Export reviews, comments, ratings",
      icon: <FileIcon className="w-6 h-6" />,
    },
    {
      value: "audit_logs",
      label: "Audit Logs",
      description: "Export admin action logs",
      icon: <ShieldIcon className="w-6 h-6" />,
    },
    {
      value: "all",
      label: "All Data",
      description: "Export everything combined",
      icon: <PackageIcon className="w-6 h-6" />,
    },
  ];

  const formatOptions: Array<{
    value: ExportFormat;
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "csv",
      label: "CSV",
      description: "Comma-separated values, Excel compatible",
      icon: <FileTextIcon className="w-6 h-6 text-green-400" />,
    },
    {
      value: "json",
      label: "JSON",
      description: "Structured data for developers",
      icon: <FileJsonIcon className="w-6 h-6 text-yellow-400" />,
    },
    {
      value: "xlsx",
      label: "Excel",
      description: "Native Excel spreadsheet format",
      icon: <FileSpreadsheetIcon className="w-6 h-6 text-blue-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Create New Export
            </h2>
            <p className="text-sm text-gray-400">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-white">
                What would you like to export?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExportType(option.value)}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      exportType === option.value
                        ? "bg-blue-500/10 border-blue-500/50"
                        : "bg-gray-800 border-gray-700 hover:border-gray-600"
                    )}
                  >
                    <div
                      className={cn(
                        "mb-2",
                        exportType === option.value
                          ? "text-blue-400"
                          : "text-gray-400"
                      )}
                    >
                      {option.icon}
                    </div>
                    <p className="font-medium text-white">{option.label}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Format */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-white">Select export format</h3>
              <div className="space-y-3">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormat(option.value)}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left flex items-center gap-4 transition-all",
                      format === option.value
                        ? "bg-blue-500/10 border-blue-500/50"
                        : "bg-gray-800 border-gray-700 hover:border-gray-600"
                    )}
                  >
                    {option.icon}
                    <div>
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="text-xs text-gray-400">
                        {option.description}
                      </p>
                    </div>
                    {format === option.value && (
                      <CheckIcon className="w-5 h-5 text-blue-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Options */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-white">Export options</h3>

              {/* Anonymize toggle */}
              <label className="flex items-center gap-3 p-4 rounded-lg bg-gray-800 border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={anonymize}
                  onChange={(e) => setAnonymize(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-white">Anonymize PII</p>
                  <p className="text-xs text-gray-400">
                    Mask emails, names, and IP addresses
                  </p>
                </div>
              </label>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">
                  Export Summary
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Data Type</dt>
                    <dd className="text-white capitalize">
                      {exportType.replace("_", " ")}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Format</dt>
                    <dd className="text-white uppercase">{format}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Anonymize</dt>
                    <dd className="text-white">{anonymize ? "Yes" : "No"}</dd>
                  </div>
                </dl>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {step > 1 ? "Back" : "Cancel"}
          </button>
          <button
            onClick={() => (step < 3 ? setStep(step + 1) : handleSubmit())}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <RefreshCwIcon className="w-4 h-4 animate-spin" />
            ) : step < 3 ? (
              "Next"
            ) : (
              "Start Export"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
