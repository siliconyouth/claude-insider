"use client";

/**
 * Sources Management Page
 *
 * Configure and manage resource discovery sources.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";

interface Source {
  id: number;
  name: string;
  type: string;
  url?: string;
  isActive: boolean;
  lastScanAt?: string;
  resourcesDiscovered?: number;
  createdAt: string;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/resources/sources");
      if (response.ok) {
        const data = await response.json();
        setSources(data.docs || []);
      }
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  return (
    <div className="space-y-8 lg:ml-64">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Discovery Sources
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure sources for automatic resource discovery
          </p>
        </div>
        <Link
          href="/admin/collections/resource-sources/create"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2",
            "text-sm font-medium text-white",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
            "transition-all"
          )}
        >
          <PlusIcon className="h-4 w-4" />
          Add Source
        </Link>
      </div>

      {/* Source Types Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            type: "github_repo",
            name: "GitHub Repo",
            description: "Single repository",
            icon: <GitHubIcon />,
          },
          {
            type: "github_org",
            name: "GitHub Org",
            description: "Organization repos",
            icon: <GitHubIcon />,
          },
          {
            type: "awesome_list",
            name: "Awesome List",
            description: "Curated lists",
            icon: <ListIcon />,
          },
          {
            type: "npm_search",
            name: "npm Search",
            description: "Package search",
            icon: <NpmIcon />,
          },
        ].map((sourceType) => (
          <div
            key={sourceType.type}
            className={cn(
              "rounded-xl border p-4",
              "border-gray-200 dark:border-[#262626]",
              "bg-white dark:bg-[#111111]"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400">
                {sourceType.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {sourceType.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {sourceType.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sources List */}
      <div
        className={cn(
          "rounded-xl border overflow-hidden",
          "border-gray-200 dark:border-[#262626]",
          "bg-white dark:bg-[#111111]"
        )}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#262626] bg-gray-50 dark:bg-[#0a0a0a]">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">
            Configured Sources
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading sources...</p>
          </div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center">
            <DatabaseIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No sources configured yet
            </p>
            <Link
              href="/admin/collections/resource-sources/create"
              className={cn(
                "mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2",
                "text-sm font-medium text-white",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600"
              )}
            >
              <PlusIcon className="h-4 w-4" />
              Add Your First Source
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#262626]">
            {sources.map((source) => (
              <SourceRow key={source.id} source={source} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Setup */}
      <div
        className={cn(
          "rounded-xl border p-6",
          "border-gray-200 dark:border-[#262626]",
          "bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-cyan-500/5"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recommended Sources
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add these popular sources to discover Claude-related resources
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <RecommendedSource
            name="Anthropic GitHub"
            type="github_org"
            url="https://github.com/anthropics"
            description="Official Anthropic repositories"
          />
          <RecommendedSource
            name="MCP Servers"
            type="github_search"
            url="topic:model-context-protocol"
            description="MCP server implementations"
          />
          <RecommendedSource
            name="Anthropic npm"
            type="npm_search"
            url="@anthropic-ai"
            description="Official npm packages"
          />
          <RecommendedSource
            name="Claude Tools"
            type="github_search"
            url="topic:claude-ai"
            description="Community Claude tools"
          />
        </div>
      </div>
    </div>
  );
}

function SourceRow({ source }: { source: Source }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "github_repo":
      case "github_org":
      case "github_search":
        return <GitHubIcon className="h-4 w-4" />;
      case "awesome_list":
        return <ListIcon className="h-4 w-4" />;
      case "npm_package":
      case "npm_search":
        return <NpmIcon className="h-4 w-4" />;
      default:
        return <GlobeIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          source.isActive
            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            : "bg-gray-100 dark:bg-[#262626] text-gray-400"
        )}
      >
        {getTypeIcon(source.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {source.name}
          </h3>
          {!source.isActive && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-[#262626] text-gray-500">
              Inactive
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {source.url || source.type}
        </p>
      </div>

      {source.resourcesDiscovered !== undefined && (
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {source.resourcesDiscovered}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">discovered</p>
        </div>
      )}

      <Link
        href={`/admin/collections/resource-sources/${source.id}`}
        className={cn(
          "p-2 rounded-lg transition-colors",
          "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
          "hover:bg-gray-100 dark:hover:bg-[#262626]"
        )}
      >
        <EditIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

function RecommendedSource({
  name,
  type,
  url,
  description,
}: {
  name: string;
  type: string;
  url: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-3",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]"
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 dark:bg-[#262626] text-gray-500">
        {type.includes("github") ? (
          <GitHubIcon className="h-4 w-4" />
        ) : type.includes("npm") ? (
          <NpmIcon className="h-4 w-4" />
        ) : (
          <ListIcon className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <Link
        href={`/admin/collections/resource-sources/create?type=${type}&url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md",
          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-400",
          "hover:bg-blue-200 dark:hover:bg-blue-900/50",
          "transition-colors"
        )}
      >
        Add
      </Link>
    </div>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function NpmIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}
