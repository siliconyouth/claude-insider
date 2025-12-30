/**
 * Security Settings Page
 *
 * Configure bot detection, fingerprinting, honeypots, and logging.
 * Uses TanStack Query for data fetching and batch updates.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import {
  useSecuritySettings,
  useUpdateSecuritySettings,
  type SecuritySetting,
} from "@/lib/query/hooks";
import {
  CogIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const categoryLabels: Record<string, { title: string; description: string }> = {
  general: {
    title: "General",
    description: "Master security controls",
  },
  bot_detection: {
    title: "Bot Detection",
    description: "Vercel BotID configuration",
  },
  fingerprint: {
    title: "Fingerprinting",
    description: "FingerprintJS visitor tracking",
  },
  honeypot: {
    title: "Honeypot System",
    description: "Fake content for bots",
  },
  logging: {
    title: "Logging",
    description: "Security event logging",
  },
  trust: {
    title: "Trust Scoring",
    description: "Visitor trust algorithm",
  },
};

function formatSettingLabel(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SecuritySettingsPage() {
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, unknown>
  >({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const settingsQuery = useSecuritySettings();
  const updateMutation = useUpdateSecuritySettings();

  const grouped = settingsQuery.data?.grouped || {};
  const isLoading = settingsQuery.isPending;
  const error = settingsQuery.error;

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleChange = (key: string, value: unknown) => {
    setPendingChanges((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      return;
    }

    const updates = Object.entries(pendingChanges).map(([key, value]) => ({
      key,
      value,
    }));

    await updateMutation.mutateAsync({ updates });
    setPendingChanges({});
    setSuccessMessage(`${updates.length} setting(s) updated`);
  };

  const getValue = (setting: SecuritySetting) => {
    if (setting.key in pendingChanges) {
      return pendingChanges[setting.key];
    }
    return setting.value;
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

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
              <CogIcon className="h-8 w-8 text-gray-500" />
              Security Settings
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Configure security features and behavior
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => settingsQuery.refetch()}
            disabled={settingsQuery.isFetching}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "border border-gray-200 dark:border-[#262626]",
              "hover:border-blue-500/50 transition-colors"
            )}
          >
            <ArrowPathIcon
              className={cn("h-4 w-4", settingsQuery.isFetching && "animate-spin")}
            />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
              "bg-blue-500 text-white",
              "hover:bg-blue-600 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {updateMutation.isPending ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500">
          <p className="text-sm">{error.message}</p>
        </div>
      )}
      {updateMutation.error && (
        <div className="rounded-lg bg-red-500/10 p-4 text-red-500">
          <p className="text-sm">{updateMutation.error.message}</p>
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg bg-emerald-500/10 p-4 text-emerald-500">
          <p className="text-sm">{successMessage}</p>
        </div>
      )}
      {hasChanges && (
        <div className="rounded-lg bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
          <p className="text-sm">
            You have unsaved changes. Click &quot;Save Changes&quot; to apply
            them.
          </p>
        </div>
      )}

      {/* Settings Groups */}
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-[#262626] dark:bg-[#111111]">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categoryLabels).map(([category, info]) => {
            const categorySettings = grouped[category] || [];
            if (categorySettings.length === 0) return null;

            return (
              <div
                key={category}
                className={cn(
                  "rounded-xl p-6",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {info.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{info.description}</p>

                <div className="mt-6 space-y-4">
                  {categorySettings.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 dark:border-[#1a1a1a]"
                    >
                      <div className="flex-1">
                        <label className="font-medium text-gray-700 dark:text-gray-200">
                          {formatSettingLabel(setting.key)}
                        </label>
                        {setting.description && (
                          <p className="text-sm text-gray-500">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {setting.valueType === "boolean" ? (
                          <button
                            onClick={() =>
                              handleChange(setting.key, !getValue(setting))
                            }
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              getValue(setting)
                                ? "bg-blue-500"
                                : "bg-gray-300 dark:bg-gray-600"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                getValue(setting)
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              )}
                            />
                          </button>
                        ) : setting.valueType === "number" ? (
                          <input
                            type="number"
                            value={String(getValue(setting))}
                            onChange={(e) =>
                              handleChange(
                                setting.key,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-1 text-right text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(getValue(setting))}
                            onChange={(e) =>
                              handleChange(setting.key, e.target.value)
                            }
                            className="w-48 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm dark:border-[#262626] dark:bg-[#1a1a1a]"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
