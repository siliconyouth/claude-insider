"use client";

/**
 * MCP Configuration Detail Page
 *
 * Shows details of a public MCP configuration.
 * Features:
 * - Full config JSON viewer
 * - Capabilities preview
 * - Fork and star actions
 * - Author info
 * - Related configurations
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getPublicConfig,
  toggleStar,
  hasStarred,
  forkConfig,
} from "@/lib/mcp/storage";
import type { MCPConfigWithAuthor } from "@/lib/mcp/schema";
import { MCPCapabilitiesPreview } from "@/components/mcp-playground";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  StarIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ServerStackIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

export default function MCPConfigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const configId = params.id as string;

  // State
  const [config, setConfig] = useState<MCPConfigWithAuthor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [starLoading, setStarLoading] = useState(false);
  const [forkLoading, setForkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load config
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPublicConfig(configId);
        if (!data) {
          setError("Configuration not found");
          return;
        }
        setConfig(data);

        // Check if starred
        if (isAuthenticated) {
          const starred = await hasStarred(configId);
          setIsStarred(starred);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [configId, isAuthenticated]);

  // Handle star
  const handleStar = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/sign-in?redirect=/mcp-playground/gallery/${configId}`);
      return;
    }

    setStarLoading(true);
    try {
      const nowStarred = await toggleStar(configId);
      setIsStarred(nowStarred);
      if (config) {
        setConfig({
          ...config,
          stars_count: config.stars_count + (nowStarred ? 1 : -1),
        });
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
    } finally {
      setStarLoading(false);
    }
  }, [isAuthenticated, configId, config, router]);

  // Handle fork
  const handleFork = useCallback(async () => {
    if (!isAuthenticated) {
      router.push(`/sign-in?redirect=/mcp-playground/gallery/${configId}`);
      return;
    }

    setForkLoading(true);
    try {
      const newId = await forkConfig(configId);
      router.push(`/mcp-playground?config=${newId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fork");
    } finally {
      setForkLoading(false);
    }
  }, [isAuthenticated, configId, router]);

  // Copy config JSON
  const handleCopy = useCallback(() => {
    if (!config) return;
    navigator.clipboard.writeText(JSON.stringify(config.config_json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [config]);

  // Open in playground
  const handleOpenInPlayground = useCallback(() => {
    if (!config) return;
    const encoded = btoa(encodeURIComponent(JSON.stringify(config.config_json)));
    router.push(`/mcp-playground?config=${encoded}`);
  }, [config, router]);

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen ui-bg-page flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 mx-auto ui-text-secondary animate-spin" />
          <p className="mt-2 ui-text-secondary">Loading configuration...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !config) {
    return (
      <div className="min-h-screen ui-bg-page flex items-center justify-center">
        <div className="text-center">
          <ServerStackIcon className="h-12 w-12 mx-auto ui-text-secondary mb-3" />
          <h2 className="text-xl font-semibold ui-text-heading mb-2">
            {error || "Configuration not found"}
          </h2>
          <Link
            href="/mcp-playground/gallery"
            className="text-blue-600 dark:text-cyan-400 hover:underline"
          >
            ← Back to gallery
          </Link>
        </div>
      </div>
    );
  }

  const serverCount = config.server_count || Object.keys(config.config_json.mcpServers || {}).length;
  const configJson = JSON.stringify(config.config_json, null, 2);

  return (
    <div className="min-h-screen ui-bg-page">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/mcp-playground/gallery"
          className="inline-flex items-center gap-2 text-sm ui-text-secondary hover:ui-text-heading mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Gallery
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold ui-text-heading mb-2">
                {config.name}
              </h1>
              <p className="ui-text-secondary max-w-2xl">
                {config.description || "No description provided"}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleStar}
                disabled={starLoading}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  isStarred
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                    : "ui-btn-secondary"
                )}
              >
                {starLoading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : isStarred ? (
                  <StarIconSolid className="h-5 w-5" />
                ) : (
                  <StarIcon className="h-5 w-5" />
                )}
                {config.stars_count}
              </button>
              <button
                onClick={handleFork}
                disabled={forkLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90"
              >
                {forkLoading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <DocumentDuplicateIcon className="h-5 w-5" />
                )}
                Fork
              </button>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm ui-text-secondary">
            {/* Author */}
            <div className="flex items-center gap-2">
              {config.author_avatar ? (
                <Image
                  src={config.author_avatar}
                  alt={config.author_name || "Author"}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
              <span>{config.author_name || "Anonymous"}</span>
            </div>

            {/* Published date */}
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              {formatDate(config.published_at || config.created_at)}
            </div>

            {/* Server count */}
            <div className="flex items-center gap-1">
              <ServerStackIcon className="h-4 w-4" />
              {serverCount} server{serverCount !== 1 ? "s" : ""}
            </div>

            {/* Views */}
            <div className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              {config.views_count} views
            </div>

            {/* Forks */}
            <div className="flex items-center gap-1">
              <DocumentDuplicateIcon className="h-4 w-4" />
              {config.forks_count} forks
            </div>

            {/* Difficulty */}
            {config.difficulty && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium capitalize",
                  config.difficulty === "beginner" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  config.difficulty === "intermediate" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                  config.difficulty === "advanced" && "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                {config.difficulty}
              </span>
            )}
          </div>

          {/* Tags */}
          {config.tags && config.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {config.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/mcp-playground/gallery?tags=${tag}`}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 ui-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <TagIcon className="h-3 w-3" />
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config JSON */}
          <div className="lg:col-span-2">
            <div className="ui-bg-card border ui-border rounded-xl overflow-hidden">
              <div className="p-4 border-b ui-border flex items-center justify-between">
                <h2 className="font-semibold ui-text-heading">Configuration</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ui-btn-ghost"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleOpenInPlayground}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90"
                  >
                    <BeakerIcon className="h-4 w-4" />
                    Open in Playground
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre">
                  {configJson}
                </pre>
              </div>
            </div>

            {/* Use cases */}
            {config.use_cases && config.use_cases.length > 0 && (
              <div className="mt-6 ui-bg-card border ui-border rounded-xl p-4">
                <h2 className="font-semibold ui-text-heading mb-3">Use Cases</h2>
                <ul className="space-y-2">
                  {config.use_cases.map((useCase) => (
                    <li
                      key={useCase}
                      className="flex items-center gap-2 text-sm ui-text-body"
                    >
                      <CheckIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Capabilities preview */}
            <MCPCapabilitiesPreview config={configJson} />

            {/* Quick actions */}
            <div className="ui-bg-card border ui-border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold ui-text-heading">Quick Actions</h3>
              <button
                onClick={handleFork}
                disabled={forkLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90"
              >
                {forkLoading ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <DocumentDuplicateIcon className="h-5 w-5" />
                )}
                Fork to My Configs
              </button>
              <button
                onClick={handleOpenInPlayground}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium ui-btn-secondary"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                Open in Playground
              </button>
            </div>

            {/* Forked from */}
            {config.forked_from_id && (
              <div className="ui-bg-card border ui-border rounded-xl p-4">
                <p className="text-sm ui-text-secondary">
                  Forked from{" "}
                  <Link
                    href={`/mcp-playground/gallery/${config.forked_from_id}`}
                    className="text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    original configuration
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
