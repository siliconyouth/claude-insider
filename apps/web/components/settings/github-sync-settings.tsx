"use client";

/**
 * GitHub CLAUDE.md Sync Settings
 *
 * Allows users to sync their CLAUDE.md content to a GitHub repository.
 * Features:
 * - Repository selection from user's GitHub account
 * - One-click sync with visual feedback
 * - Sync status and last sync time tracking
 * - Branch selection support
 *
 * Requires GitHub OAuth connection with public_repo scope.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useSound } from "@/hooks/use-sound-effects";

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  url: string;
  defaultBranch: string;
  lastPush: string;
  language: string | null;
}

interface SyncStatus {
  lastSyncedAt: string | null;
  lastSyncedRepo: string | null;
  commitUrl: string | null;
}

interface GitHubSyncSettingsProps {
  isGitHubConnected: boolean;
  onConnectGitHub?: () => void;
}

export function GitHubSyncSettings({
  isGitHubConnected,
  onConnectGitHub,
}: GitHubSyncSettingsProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncedAt: null,
    lastSyncedRepo: null,
    commitUrl: null,
  });
  const [existsInRepo, setExistsInRepo] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const { playSuccess, playError } = useSound();

  // Load saved sync preferences from localStorage
  useEffect(() => {
    const savedStatus = localStorage.getItem("github-sync-status");
    if (savedStatus) {
      try {
        const parsed = JSON.parse(savedStatus);
        setSyncStatus(parsed);
        // If we have a saved repo, try to auto-select it
        if (parsed.lastSyncedRepo) {
          setSelectedRepo({
            id: 0,
            name: parsed.lastSyncedRepo.split("/")[1] || parsed.lastSyncedRepo,
            fullName: parsed.lastSyncedRepo,
            description: null,
            private: false,
            url: `https://github.com/${parsed.lastSyncedRepo}`,
            defaultBranch: "main",
            lastPush: "",
            language: null,
          });
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Fetch user's repositories
  const fetchRepos = useCallback(async () => {
    if (!isGitHubConnected) return;

    setIsLoadingRepos(true);
    setError(null);

    try {
      const response = await fetch("/api/github/repos");
      const data = await response.json();

      if (!response.ok) {
        if (data.needsReconnect) {
          setError("GitHub connection expired. Please reconnect your account.");
          return;
        }
        throw new Error(data.error || "Failed to fetch repositories");
      }

      setRepos(data.repos || []);

      // Auto-select the previously synced repo if it's in the list
      if (syncStatus.lastSyncedRepo) {
        const savedRepo = data.repos?.find(
          (r: GitHubRepo) => r.fullName === syncStatus.lastSyncedRepo
        );
        if (savedRepo) {
          setSelectedRepo(savedRepo);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load repositories");
    } finally {
      setIsLoadingRepos(false);
    }
  }, [isGitHubConnected, syncStatus.lastSyncedRepo]);

  // Load repos when GitHub is connected
  useEffect(() => {
    if (isGitHubConnected) {
      fetchRepos();
    }
  }, [isGitHubConnected, fetchRepos]);

  // Check if CLAUDE.md exists in selected repo
  const checkSyncStatus = useCallback(async () => {
    if (!selectedRepo) return;

    setIsCheckingStatus(true);

    try {
      const [owner, repo] = selectedRepo.fullName.split("/");
      const response = await fetch(
        `/api/github/sync?owner=${owner}&repo=${repo}&branch=${selectedRepo.defaultBranch}`
      );
      const data = await response.json();

      if (response.ok) {
        setExistsInRepo(data.exists);
      } else if (data.needsReconnect) {
        setError("GitHub connection expired. Please reconnect your account.");
      }
    } catch {
      // Silent fail - not critical
    } finally {
      setIsCheckingStatus(false);
    }
  }, [selectedRepo]);

  useEffect(() => {
    if (selectedRepo) {
      checkSyncStatus();
    }
  }, [selectedRepo, checkSyncStatus]);

  // Sync CLAUDE.md to selected repository
  const handleSync = async () => {
    if (!selectedRepo) {
      setError("Please select a repository first");
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the current user's CLAUDE.md template
      const templateResponse = await fetch("/api/user/claude-md");
      const templateData = await templateResponse.json();

      if (!templateResponse.ok) {
        throw new Error(templateData.error || "Failed to get CLAUDE.md template");
      }

      const [owner, repo] = selectedRepo.fullName.split("/");

      const syncResponse = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          content: templateData.content,
          branch: selectedRepo.defaultBranch,
        }),
      });

      const syncData = await syncResponse.json();

      if (!syncResponse.ok) {
        if (syncData.needsReconnect) {
          throw new Error("GitHub connection expired. Please reconnect your account.");
        }
        throw new Error(syncData.error || "Failed to sync CLAUDE.md");
      }

      // Update sync status
      const newStatus: SyncStatus = {
        lastSyncedAt: new Date().toISOString(),
        lastSyncedRepo: selectedRepo.fullName,
        commitUrl: syncData.commit?.url || null,
      };
      setSyncStatus(newStatus);
      localStorage.setItem("github-sync-status", JSON.stringify(newStatus));

      setExistsInRepo(true);
      setSuccess(
        syncData.message === "CLAUDE.md created"
          ? "CLAUDE.md created successfully!"
          : "CLAUDE.md updated successfully!"
      );
      playSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync CLAUDE.md");
      playError();
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter repos by search query
  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isGitHubConnected) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
            GitHub CLAUDE.md Sync
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sync your CLAUDE.md configuration to your GitHub repositories.
          </p>
        </div>

        <div className="p-6 rounded-lg border border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111] text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your GitHub account to sync CLAUDE.md to your repositories.
          </p>
          <button
            onClick={onConnectGitHub}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              "bg-gray-900 dark:bg-white text-white dark:text-gray-900",
              "hover:bg-gray-800 dark:hover:bg-gray-100"
            )}
          >
            Connect GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
          GitHub CLAUDE.md Sync
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sync your personalized CLAUDE.md configuration to any of your GitHub repositories.
        </p>
      </div>

      {/* Repository Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Repository
        </label>

        {/* Selected Repo Display */}
        <button
          onClick={() => setShowRepoSelector(!showRepoSelector)}
          disabled={isLoadingRepos}
          className={cn(
            "w-full p-4 rounded-lg border text-left transition-all",
            "border-gray-200 dark:border-[#262626]",
            "bg-white dark:bg-[#111111]",
            "hover:border-blue-500/50",
            isLoadingRepos && "opacity-50 cursor-wait"
          )}
        >
          {isLoadingRepos ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mt-1" />
              </div>
            </div>
          ) : selectedRepo ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {selectedRepo.private ? (
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedRepo.fullName}
                  </p>
                  {selectedRepo.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {selectedRepo.description}
                    </p>
                  )}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span>Select a repository...</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </button>

        {/* Repository Dropdown */}
        {showRepoSelector && (
          <div className="rounded-lg border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111] shadow-lg overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-200 dark:border-[#262626]">
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 text-sm rounded-lg",
                  "bg-gray-50 dark:bg-[#0a0a0a]",
                  "border border-gray-200 dark:border-[#262626]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              />
            </div>

            {/* Repo List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredRepos.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? "No matching repositories" : "No repositories found"}
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      setSelectedRepo(repo);
                      setShowRepoSelector(false);
                      setSearchQuery("");
                      setExistsInRepo(null);
                    }}
                    className={cn(
                      "w-full p-3 text-left transition-colors",
                      "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                      selectedRepo?.id === repo.id && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        {repo.private ? (
                          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {repo.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              {repo.language}
                            </span>
                          )}
                          {repo.private && <span>Private</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Refresh Button */}
            <div className="p-3 border-t border-gray-200 dark:border-[#262626]">
              <button
                onClick={() => {
                  fetchRepos();
                  setShowRepoSelector(false);
                }}
                className="text-sm text-blue-600 dark:text-cyan-400 hover:underline"
              >
                Refresh repository list
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sync Status */}
      {selectedRepo && (
        <div className="space-y-4">
          {/* Status Indicator */}
          <div className={cn(
            "p-4 rounded-lg border",
            isCheckingStatus
              ? "border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#111111]"
              : existsInRepo
                ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
                : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10"
          )}>
            {isCheckingStatus ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin" />
                Checking status...
              </div>
            ) : existsInRepo ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    CLAUDE.md exists in this repository
                  </span>
                </div>
                {syncStatus.lastSyncedAt && syncStatus.lastSyncedRepo === selectedRepo.fullName && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Last synced: {new Date(syncStatus.lastSyncedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  CLAUDE.md will be created in this repository
                </span>
              </div>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={cn(
              "w-full px-4 py-3 rounded-lg text-sm font-medium transition-all",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:opacity-90 hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
          >
            {isSyncing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Syncing...
              </span>
            ) : existsInRepo ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Update CLAUDE.md
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Sync CLAUDE.md
              </span>
            )}
          </button>

          {/* Last Sync Info */}
          {syncStatus.commitUrl && syncStatus.lastSyncedRepo === selectedRepo.fullName && (
            <div className="text-center">
              <a
                href={syncStatus.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-cyan-400 hover:underline"
              >
                View last commit on GitHub →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          What is CLAUDE.md?
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          CLAUDE.md is a configuration file that helps Claude Code understand your project&apos;s
          context, coding conventions, and preferences. By syncing it to your repositories,
          you&apos;ll get more consistent and relevant assistance when using Claude Code in your projects.
        </p>
      </div>
    </div>
  );
}
