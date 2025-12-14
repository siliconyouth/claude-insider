"use client";

/**
 * Discovery Controls Page
 *
 * AI-powered resource discovery interface.
 */

import { useState } from "react";
import { cn } from "@/lib/design-system";

type DiscoveryMode = "url" | "github" | "npm" | "awesome";

interface DiscoveryResult {
  success: boolean;
  url?: string;
  analysis?: {
    title: string;
    description: string;
    suggestedCategory: string;
    suggestedTags: string[];
    scores: {
      confidence: number;
      relevance: number;
      quality: number;
    };
    possibleDuplicate?: {
      detected: boolean;
      similarTitle?: string;
    };
  };
  queueItem?: {
    id: number;
    title: string;
  };
  error?: string;
}

export default function DiscoverPage() {
  const [mode, setMode] = useState<DiscoveryMode>("url");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);

  // Form states
  const [url, setUrl] = useState("");
  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [npmPackage, setNpmPackage] = useState("");
  const [awesomeListUrl, setAwesomeListUrl] = useState("");

  const handleDiscover = async () => {
    setLoading(true);
    setResult(null);

    try {
      let discoverUrl = "";

      switch (mode) {
        case "url":
          discoverUrl = url;
          break;
        case "github":
          discoverUrl = `https://github.com/${githubOwner}/${githubRepo}`;
          break;
        case "npm":
          discoverUrl = `https://www.npmjs.com/package/${npmPackage}`;
          break;
        case "awesome":
          discoverUrl = awesomeListUrl;
          break;
      }

      if (!discoverUrl) {
        setResult({ success: false, error: "Please enter a URL or package name" });
        return;
      }

      const response = await fetch("/api/admin/resources/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: discoverUrl,
          autoQueue: true,
          quickCheckFirst: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          url: discoverUrl,
          analysis: data.analysis,
          queueItem: data.queueItem,
        });
      } else {
        setResult({
          success: false,
          error: data.error || "Discovery failed",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Discovery failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setUrl("");
    setGithubOwner("");
    setGithubRepo("");
    setNpmPackage("");
    setAwesomeListUrl("");
    setResult(null);
  };

  return (
    <div className="space-y-8 lg:ml-64">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Discover Resources
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Use Claude Opus 4.5 to analyze and categorize new resources
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 rounded-lg bg-gray-100 dark:bg-[#111111] w-fit">
        {[
          { id: "url" as const, label: "URL", icon: <LinkIcon /> },
          { id: "github" as const, label: "GitHub", icon: <GitHubIcon /> },
          { id: "npm" as const, label: "npm", icon: <NpmIcon /> },
          { id: "awesome" as const, label: "Awesome List", icon: <ListIcon /> },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              setResult(null);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
              mode === m.id
                ? "bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Discovery Form */}
      <div
        className={cn(
          "rounded-xl border p-6",
          "border-gray-200 dark:border-[#262626]",
          "bg-white dark:bg-[#111111]"
        )}
      >
        {mode === "url" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resource URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/example/project"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border",
                  "border-gray-200 dark:border-[#262626]",
                  "bg-white dark:bg-[#0a0a0a]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter any URL - GitHub repos, npm packages, documentation pages, tools, etc.
            </p>
          </div>
        )}

        {mode === "github" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Owner / Organization
                </label>
                <input
                  type="text"
                  value={githubOwner}
                  onChange={(e) => setGithubOwner(e.target.value)}
                  placeholder="anthropics"
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border",
                    "border-gray-200 dark:border-[#262626]",
                    "bg-white dark:bg-[#0a0a0a]",
                    "text-gray-900 dark:text-white",
                    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500"
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repository
                </label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="claude-code"
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border",
                    "border-gray-200 dark:border-[#262626]",
                    "bg-white dark:bg-[#0a0a0a]",
                    "text-gray-900 dark:text-white",
                    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500"
                  )}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the GitHub organization/user and repository name.
            </p>
          </div>
        )}

        {mode === "npm" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package Name
              </label>
              <input
                type="text"
                value={npmPackage}
                onChange={(e) => setNpmPackage(e.target.value)}
                placeholder="@anthropic-ai/sdk"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border",
                  "border-gray-200 dark:border-[#262626]",
                  "bg-white dark:bg-[#0a0a0a]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the npm package name (e.g., @anthropic-ai/sdk).
            </p>
          </div>
        )}

        {mode === "awesome" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Awesome List URL
              </label>
              <input
                type="url"
                value={awesomeListUrl}
                onChange={(e) => setAwesomeListUrl(e.target.value)}
                placeholder="https://github.com/username/awesome-claude"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border",
                  "border-gray-200 dark:border-[#262626]",
                  "bg-white dark:bg-[#0a0a0a]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter a GitHub awesome-list URL to parse and discover resources from it.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleDiscover}
            disabled={loading}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-6 py-3",
              "text-sm font-medium text-white",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
              "shadow-lg shadow-blue-500/25",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all hover:-translate-y-0.5"
            )}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing with Claude...
              </>
            ) : (
              <>
                <SparkleIcon className="h-5 w-5" />
                Discover & Analyze
              </>
            )}
          </button>
          <button
            onClick={clearForm}
            className={cn(
              "px-4 py-3 rounded-lg text-sm font-medium",
              "text-gray-600 dark:text-gray-400",
              "hover:bg-gray-100 dark:hover:bg-[#262626]",
              "transition-colors"
            )}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className={cn(
            "rounded-xl border p-6",
            result.success
              ? "border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10"
              : "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10"
          )}
        >
          {result.success ? (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Resource Added to Queue
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {result.analysis?.title || result.url}
                  </p>
                </div>
              </div>

              {/* Analysis Results */}
              {result.analysis && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Scores */}
                  <div className="rounded-lg bg-white dark:bg-[#111111] p-4 border border-gray-200 dark:border-[#262626]">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      AI Scores
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {result.analysis.scores.confidence}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {result.analysis.scores.relevance}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Relevance</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {result.analysis.scores.quality}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Quality</p>
                      </div>
                    </div>
                  </div>

                  {/* Category & Tags */}
                  <div className="rounded-lg bg-white dark:bg-[#111111] p-4 border border-gray-200 dark:border-[#262626]">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Classification
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <span className="font-medium">Category:</span>{" "}
                      {result.analysis.suggestedCategory}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.analysis.suggestedTags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicate Warning */}
              {result.analysis?.possibleDuplicate?.detected && (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ Possible duplicate detected: {result.analysis.possibleDuplicate.similarTitle}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <a
                  href="/dashboard/resources/queue"
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                    "text-sm font-medium text-white",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600"
                  )}
                >
                  Review in Queue
                </a>
                <button
                  onClick={clearForm}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "text-gray-600 dark:text-gray-400",
                    "hover:bg-gray-100 dark:hover:bg-[#262626]",
                    "transition-colors"
                  )}
                >
                  Discover Another
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Discovery Failed
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div
        className={cn(
          "rounded-xl border p-6",
          "border-gray-200 dark:border-[#262626]",
          "bg-gray-50 dark:bg-[#0a0a0a]"
        )}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Discovery Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>
              Claude Opus 4.5 analyzes content, suggests categories, and scores relevance automatically
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>
              GitHub repos are automatically enriched with stars, forks, and language data
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>
              npm packages include download counts and dependency information
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>
              All discovered resources go to the review queue for approval before publishing
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Icons
function LinkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function NpmIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
