/**
 * Honeypot Configuration Page
 *
 * Create, edit, and manage honeypot configurations.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { format } from "date-fns";
import type { HoneypotConfig, HoneypotResponseType } from "@/lib/honeypot";
import {
  BugAntIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function HoneypotsPage() {
  const [honeypots, setHoneypots] = useState<HoneypotConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingHoneypot, setEditingHoneypot] = useState<HoneypotConfig | null>(
    null
  );

  const fetchHoneypots = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard/security/honeypots");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch honeypots");
      }

      setHoneypots(data.honeypots);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch honeypots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHoneypots();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this honeypot?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/dashboard/security/honeypots?id=${id}`,
        { method: "DELETE" }
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete honeypot");
      }

      fetchHoneypots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete honeypot");
    }
  };

  const handleToggleEnabled = async (honeypot: HoneypotConfig) => {
    try {
      const response = await fetch("/api/dashboard/security/honeypots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: honeypot.id, enabled: !honeypot.enabled }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to update honeypot");
      }

      fetchHoneypots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update honeypot");
    }
  };

  const responseTypeColors: Record<HoneypotResponseType, string> = {
    fake_data: "bg-blue-500/10 text-blue-500",
    delay: "bg-amber-500/10 text-amber-500",
    redirect: "bg-purple-500/10 text-purple-500",
    block: "bg-red-500/10 text-red-500",
    template: "bg-emerald-500/10 text-emerald-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/security"
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
              <BugAntIcon className="h-8 w-8 text-amber-500" />
              Honeypot Configuration
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Configure fake content for bots and scrapers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHoneypots}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "hover:border-blue-500/50 transition-colors"
            )}
          >
            <ArrowPathIcon
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingHoneypot(null);
              setShowForm(true);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "bg-amber-500 text-white",
              "hover:bg-amber-600 transition-colors"
            )}
          >
            <PlusIcon className="h-4 w-4" />
            New Honeypot
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Honeypots List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-[#262626] dark:bg-[#111111]">
            <p className="text-gray-500">Loading honeypots...</p>
          </div>
        ) : honeypots.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-[#262626] dark:bg-[#111111]">
            <BugAntIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No honeypots configured</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm text-amber-500 hover:underline"
            >
              Create your first honeypot
            </button>
          </div>
        ) : (
          honeypots.map((honeypot) => (
            <div
              key={honeypot.id}
              className={cn(
                "rounded-xl p-5",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#262626]",
                !honeypot.enabled && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {honeypot.name}
                    </h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        responseTypeColors[honeypot.responseType]
                      )}
                    >
                      {honeypot.responseType.replace(/_/g, " ")}
                    </span>
                    {!honeypot.enabled && (
                      <span className="rounded-full bg-gray-500/10 px-2 py-0.5 text-xs text-gray-500">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {honeypot.description || "No description"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="font-mono">
                      {honeypot.method} {honeypot.pathPattern}
                    </span>
                    <span>Priority: {honeypot.priority}</span>
                    {honeypot.responseDelayMs > 0 && (
                      <span>Delay: {honeypot.responseDelayMs}ms</span>
                    )}
                    <span>{honeypot.triggerCount} triggers</span>
                    {honeypot.lastTriggeredAt && (
                      <span>
                        Last:{" "}
                        {format(new Date(honeypot.lastTriggeredAt), "MMM d, HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEnabled(honeypot)}
                    className={cn(
                      "rounded-lg px-3 py-1 text-sm",
                      honeypot.enabled
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-gray-500/10 text-gray-500"
                    )}
                  >
                    {honeypot.enabled ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingHoneypot(honeypot);
                      setShowForm(true);
                    }}
                    className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                    title="Edit"
                  >
                    <PencilIcon className="h-5 w-5 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(honeypot.id)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <HoneypotForm
          honeypot={editingHoneypot}
          onClose={() => {
            setShowForm(false);
            setEditingHoneypot(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingHoneypot(null);
            fetchHoneypots();
          }}
        />
      )}
    </div>
  );
}

// Honeypot Form Component
function HoneypotForm({
  honeypot,
  onClose,
  onSave,
}: {
  honeypot: HoneypotConfig | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: honeypot?.name || "",
    description: honeypot?.description || "",
    pathPattern: honeypot?.pathPattern || "/api/*",
    method: honeypot?.method || "ALL",
    priority: honeypot?.priority || 100,
    responseType: honeypot?.responseType || ("fake_data" as HoneypotResponseType),
    responseDelayMs: honeypot?.responseDelayMs || 0,
    redirectUrl: honeypot?.redirectUrl || "",
    statusCode: honeypot?.statusCode || 200,
    targetBotsOnly: honeypot?.targetBotsOnly ?? true,
    targetLowTrust: honeypot?.targetLowTrust ?? false,
    trustThreshold: honeypot?.trustThreshold || 30,
    enabled: honeypot?.enabled ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = "/api/dashboard/security/honeypots";
      const method = honeypot ? "PATCH" : "POST";
      const body = honeypot ? { id: honeypot.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save honeypot");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save honeypot");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-xl overflow-auto rounded-xl bg-white p-6 dark:bg-[#111111]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {honeypot ? "Edit Honeypot" : "Create Honeypot"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Path Pattern</label>
              <input
                type="text"
                value={formData.pathPattern}
                onChange={(e) =>
                  setFormData({ ...formData, pathPattern: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono dark:border-[#262626] dark:bg-[#1a1a1a]"
                placeholder="/api/*"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Method</label>
              <select
                value={formData.method}
                onChange={(e) =>
                  setFormData({ ...formData, method: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
              >
                <option value="ALL">ALL</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Response Type</label>
              <select
                value={formData.responseType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responseType: e.target.value as HoneypotResponseType,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
              >
                <option value="fake_data">Fake Data</option>
                <option value="delay">Tarpit (Delay)</option>
                <option value="redirect">Redirect</option>
                <option value="block">Block</option>
                <option value="template">Template</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Delay (ms)</label>
              <input
                type="number"
                value={formData.responseDelayMs}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responseDelayMs: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
                min="0"
                max="60000"
              />
            </div>
          </div>

          {formData.responseType === "redirect" && (
            <div>
              <label className="block text-sm font-medium">Redirect URL</label>
              <input
                type="url"
                value={formData.redirectUrl}
                onChange={(e) =>
                  setFormData({ ...formData, redirectUrl: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Priority</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 100,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
                min="1"
              />
              <p className="mt-1 text-xs text-gray-500">Lower = higher priority</p>
            </div>
            <div>
              <label className="block text-sm font-medium">Status Code</label>
              <input
                type="number"
                value={formData.statusCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statusCode: parseInt(e.target.value) || 200,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
                min="100"
                max="599"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.targetBotsOnly}
                onChange={(e) =>
                  setFormData({ ...formData, targetBotsOnly: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm">Target bots only</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.targetLowTrust}
                onChange={(e) =>
                  setFormData({ ...formData, targetLowTrust: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm">Also target low trust visitors</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
                className="rounded"
              />
              <span className="text-sm">Enabled</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium",
                "bg-amber-500 text-white",
                "hover:bg-amber-600 transition-colors",
                "disabled:opacity-50"
              )}
            >
              {isSubmitting ? "Saving..." : honeypot ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
