"use client";

/**
 * MCP Save Config Modal
 *
 * Modal for saving MCP configurations with rich metadata.
 * Supports both authenticated users (database) and guests (localStorage).
 * Features:
 * - Name, description, tags, difficulty, use cases
 * - Submit for publishing option
 * - Version creation on update
 * - Sign-in prompt for guests
 */

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import {
  saveConfig,
  updateConfig,
  saveLocalDraft,
  updateLocalDraft,
  submitForReview,
} from "@/lib/mcp/storage";
import type {
  MCPConfig,
  SavedMCPConfig,
  LocalMCPDraft,
  MCPConfigDifficulty,
} from "@/lib/mcp/schema";
import {
  XMarkIcon,
  BookmarkIcon,
  CloudArrowUpIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface MCPSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MCPConfig;
  existingConfig?: SavedMCPConfig | LocalMCPDraft | null;
  onSaved?: (config: SavedMCPConfig | LocalMCPDraft) => void;
}

const DIFFICULTY_OPTIONS: { value: MCPConfigDifficulty; label: string; description: string }[] = [
  { value: "beginner", label: "Beginner", description: "Simple setup, no advanced configuration" },
  { value: "intermediate", label: "Intermediate", description: "Requires some technical knowledge" },
  { value: "advanced", label: "Advanced", description: "Complex setup, multiple dependencies" },
];

const COMMON_TAGS = [
  "database",
  "api",
  "filesystem",
  "search",
  "ai",
  "development",
  "productivity",
  "automation",
  "security",
  "monitoring",
];

const COMMON_USE_CASES = [
  "Code assistance",
  "Database queries",
  "File management",
  "Web scraping",
  "API integration",
  "Documentation",
  "Testing",
  "Deployment",
];

export function MCPSaveModal({
  isOpen,
  onClose,
  config,
  existingConfig,
  onSaved,
}: MCPSaveModalProps) {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const isUpdate = !!existingConfig;

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [difficulty, setDifficulty] = useState<MCPConfigDifficulty | "">("");
  const [useCasesInput, setUseCasesInput] = useState("");
  const [createVersion, setCreateVersion] = useState(true);
  const [changeSummary, setChangeSummary] = useState("");
  const [submitForPublishing, setSubmitForPublishing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Populate form from existing config
  useEffect(() => {
    if (existingConfig) {
      setName(existingConfig.name);
      setDescription(existingConfig.description || "");
      setTagsInput((existingConfig.tags || []).join(", "));
      setDifficulty(existingConfig.difficulty ?? "");
      setUseCasesInput((existingConfig.use_cases || []).join(", "));
    } else {
      // Generate name from server names
      const serverNames = Object.keys(config.mcpServers || {});
      const firstName = serverNames[0];
      if (firstName) {
        setName(serverNames.length === 1 ? firstName : `${firstName} + ${serverNames.length - 1} more`);
      }
    }
  }, [existingConfig, config, isOpen]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(false);
      setSubmitForPublishing(false);
      setChangeSummary("");
    }
  }, [isOpen]);

  // Parse tags and use cases from input
  const parseTags = useCallback((input: string): string[] => {
    return input
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);
  }, []);

  const parseUseCases = useCallback((input: string): string[] => {
    return input
      .split(",")
      .map((uc) => uc.trim())
      .filter((uc) => uc.length > 0);
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const tags = parseTags(tagsInput);
      const useCases = parseUseCases(useCasesInput);

      if (isAuthenticated) {
        // Save to database
        let savedConfig: SavedMCPConfig;

        if (isUpdate && "id" in existingConfig!) {
          // Update existing
          savedConfig = await updateConfig(
            existingConfig.id,
            {
              name: name.trim(),
              description: description.trim() || undefined,
              config_json: config,
              tags,
              difficulty: difficulty || undefined,
              use_cases: useCases,
            },
            createVersion,
            changeSummary || undefined
          );
        } else {
          // Create new
          savedConfig = await saveConfig({
            name: name.trim(),
            description: description.trim() || undefined,
            config_json: config,
            tags,
            difficulty: difficulty || undefined,
            use_cases: useCases,
          });
        }

        // Submit for publishing if requested
        if (submitForPublishing && savedConfig.status === "draft") {
          await submitForReview(savedConfig.id);
          savedConfig.status = "pending_review";
        }

        setSuccess(true);
        onSaved?.(savedConfig);
        setTimeout(() => onClose(), 1500);
      } else {
        // Save to localStorage
        let savedDraft: LocalMCPDraft;

        if (isUpdate && existingConfig) {
          savedDraft = updateLocalDraft(existingConfig.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            config_json: config,
            tags,
            difficulty: difficulty || undefined,
            use_cases: useCases,
          })!;
        } else {
          savedDraft = saveLocalDraft({
            name: name.trim(),
            description: description.trim() || undefined,
            config_json: config,
            tags,
            difficulty: difficulty || undefined,
            use_cases: useCases,
          });
        }

        setSuccess(true);
        onSaved?.(savedDraft);
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  }, [
    name,
    description,
    config,
    tagsInput,
    difficulty,
    useCasesInput,
    isAuthenticated,
    isUpdate,
    existingConfig,
    createVersion,
    changeSummary,
    submitForPublishing,
    parseTags,
    parseUseCases,
    onSaved,
    onClose,
  ]);

  // Add common tag
  const addTag = useCallback((tag: string) => {
    const currentTags = parseTags(tagsInput);
    if (!currentTags.includes(tag.toLowerCase())) {
      setTagsInput(
        currentTags.length > 0 ? `${tagsInput}, ${tag}` : tag
      );
    }
  }, [tagsInput, parseTags]);

  // Add common use case
  const addUseCase = useCallback((useCase: string) => {
    const current = parseUseCases(useCasesInput);
    if (!current.some((uc) => uc.toLowerCase() === useCase.toLowerCase())) {
      setUseCasesInput(
        current.length > 0 ? `${useCasesInput}, ${useCase}` : useCase
      );
    }
  }, [useCasesInput, parseUseCases]);

  if (!isOpen) return null;

  // Count servers for display
  const serverCount = Object.keys(config.mcpServers || {}).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-lg max-h-[90vh] overflow-y-auto",
          "ui-bg-modal border ui-border rounded-2xl shadow-2xl"
        )}
        style={{
          paddingBottom: "calc(1rem + var(--mobile-nav-height, 0px))",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b ui-border ui-bg-modal">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
              <BookmarkIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold ui-text-heading">
                {isUpdate ? "Update Configuration" : "Save Configuration"}
              </h2>
              <p className="text-sm ui-text-secondary">
                {serverCount} server{serverCount !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg ui-btn-ghost"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="font-medium">
                Configuration saved successfully!
              </span>
            </div>
          </div>
        )}

        {/* Guest user notice */}
        {!authLoading && !isAuthenticated && (
          <div className="p-4 bg-blue-500/10 border-b border-blue-500/20">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Saving to browser storage (local only).{" "}
                  <Link
                    href="/sign-in"
                    className="font-medium underline hover:no-underline"
                  >
                    Sign in
                  </Link>{" "}
                  to sync across devices, publish to gallery, and get version history.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="config-name" className="block text-sm font-medium ui-text-heading mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="config-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My MCP Configuration"
              className="ui-input w-full"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="config-description" className="block text-sm font-medium ui-text-heading mb-1">
              Description
            </label>
            <textarea
              id="config-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this configuration do?"
              rows={3}
              className="ui-input w-full resize-none"
              maxLength={500}
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium ui-text-heading mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDifficulty(option.value)}
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all",
                    difficulty === option.value
                      ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "ui-border ui-btn-ghost"
                  )}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="config-tags" className="block text-sm font-medium ui-text-heading mb-1">
              Tags
            </label>
            <input
              id="config-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="database, api, development"
              className="ui-input w-full"
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {COMMON_TAGS.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full transition-colors",
                    parseTags(tagsInput).includes(tag)
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                      : "bg-gray-100 dark:bg-gray-800 ui-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <TagIcon className="h-3 w-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced options */}
          <div className="border ui-border rounded-lg overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-3 ui-btn-ghost"
            >
              <span className="text-sm font-medium ui-text-heading">
                Advanced Options
              </span>
              <ChevronDownIcon
                className={cn(
                  "h-4 w-4 ui-text-secondary transition-transform",
                  showAdvanced && "rotate-180"
                )}
              />
            </button>

            {showAdvanced && (
              <div className="p-3 pt-0 space-y-4 border-t ui-border">
                {/* Use cases */}
                <div>
                  <label htmlFor="config-use-cases" className="block text-sm font-medium ui-text-heading mb-1">
                    Use Cases
                  </label>
                  <input
                    id="config-use-cases"
                    type="text"
                    value={useCasesInput}
                    onChange={(e) => setUseCasesInput(e.target.value)}
                    placeholder="Code assistance, API integration"
                    className="ui-input w-full"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COMMON_USE_CASES.slice(0, 4).map((uc) => (
                      <button
                        key={uc}
                        onClick={() => addUseCase(uc)}
                        className={cn(
                          "px-2 py-0.5 text-xs rounded-full transition-colors",
                          parseUseCases(useCasesInput).some(
                            (u) => u.toLowerCase() === uc.toLowerCase()
                          )
                            ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                            : "bg-gray-100 dark:bg-gray-800 ui-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700"
                        )}
                      >
                        {uc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Version history (update only) */}
                {isUpdate && isAuthenticated && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={createVersion}
                        onChange={(e) => setCreateVersion(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm ui-text-heading">
                        Save current state as version before updating
                      </span>
                    </label>

                    {createVersion && (
                      <input
                        type="text"
                        value={changeSummary}
                        onChange={(e) => setChangeSummary(e.target.value)}
                        placeholder="What changed? (optional)"
                        className="ui-input w-full text-sm"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit for publishing (authenticated only) */}
          {isAuthenticated && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={submitForPublishing}
                  onChange={(e) => setSubmitForPublishing(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <CloudArrowUpIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                      Submit for Publishing
                    </span>
                  </div>
                  <p className="text-xs text-violet-600/80 dark:text-violet-400/80 mt-0.5">
                    Share in the public gallery after moderator approval
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-4 border-t ui-border ui-bg-modal flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg ui-btn-secondary font-medium"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || success}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg font-medium transition-all",
              "bg-gradient-to-r from-violet-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <BookmarkIcon className="h-4 w-4" />
                {isUpdate ? "Update" : "Save"}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
