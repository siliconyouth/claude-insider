"use client";

/**
 * MCP Capabilities Preview Component
 *
 * Shows the capabilities (resources, tools, prompts) that MCP servers provide.
 * Parses the current configuration and displays known capabilities based on
 * server templates and package metadata.
 */

import { useMemo } from "react";
import { cn } from "@/lib/design-system";
import { ALL_TEMPLATES } from "@/lib/mcp/templates";
import type { MCPConfig } from "@/lib/mcp/schema";
import {
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  ChatBubbleBottomCenterTextIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface MCPCapabilitiesPreviewProps {
  config: string;
  className?: string;
}

// Known capabilities for official MCP servers
const SERVER_CAPABILITIES: Record<
  string,
  {
    tools?: string[];
    resources?: string[];
    prompts?: string[];
    description?: string;
  }
> = {
  filesystem: {
    tools: ["read_file", "write_file", "list_directory", "create_directory", "delete", "move", "search_files"],
    resources: ["file://*"],
    description: "Read, write, and manage files and directories",
  },
  postgres: {
    tools: ["query", "execute", "list_tables", "describe_table"],
    description: "Execute SQL queries on PostgreSQL databases",
  },
  sqlite: {
    tools: ["query", "execute", "list_tables", "describe_table"],
    resources: ["sqlite://*"],
    description: "Work with SQLite databases",
  },
  github: {
    tools: [
      "search_repositories",
      "get_repository",
      "list_issues",
      "create_issue",
      "get_pull_request",
      "list_commits",
      "get_file_contents",
    ],
    resources: ["github://repo/*", "github://issue/*", "github://pr/*"],
    description: "Access GitHub repositories, issues, and pull requests",
  },
  git: {
    tools: ["status", "diff", "log", "commit", "branch", "checkout", "push", "pull"],
    description: "Enhanced git operations for version control",
  },
  slack: {
    tools: ["send_message", "list_channels", "get_channel_history", "search_messages"],
    resources: ["slack://channel/*", "slack://user/*"],
    description: "Interact with Slack workspaces and channels",
  },
  gdrive: {
    tools: ["list_files", "get_file", "create_file", "update_file", "search_files"],
    resources: ["gdrive://file/*", "gdrive://folder/*"],
    description: "Access and manage Google Drive files",
  },
  puppeteer: {
    tools: ["navigate", "screenshot", "click", "type", "evaluate", "wait_for"],
    description: "Browser automation and web scraping with Puppeteer",
  },
  "brave-search": {
    tools: ["search", "search_news", "search_images"],
    description: "Web search using Brave Search API",
  },
  fetch: {
    tools: ["fetch_url", "fetch_and_convert"],
    description: "Fetch web content and convert to markdown",
  },
  memory: {
    tools: ["store", "retrieve", "list", "delete", "search"],
    resources: ["memory://*"],
    description: "Persistent memory and knowledge graph storage",
  },
  "sequential-thinking": {
    prompts: ["think_step_by_step", "analyze_problem", "generate_solution"],
    description: "Dynamic problem-solving through thought sequences",
  },
  firecrawl: {
    tools: ["scrape", "crawl", "search", "map_urls"],
    description: "Web scraping and crawling with Firecrawl",
  },
  playwright: {
    tools: ["navigate", "screenshot", "click", "fill", "evaluate", "wait"],
    description: "Browser automation with Playwright",
  },
  supabase: {
    tools: ["query", "insert", "update", "delete", "rpc"],
    resources: ["supabase://table/*"],
    description: "Interact with Supabase projects",
  },
  notion: {
    tools: ["search", "get_page", "create_page", "update_page", "get_database"],
    resources: ["notion://page/*", "notion://database/*"],
    description: "Access and manage Notion workspaces",
  },
  docker: {
    tools: ["list_containers", "start", "stop", "logs", "exec", "build", "pull"],
    description: "Manage Docker containers and images",
  },
  redis: {
    tools: ["get", "set", "delete", "keys", "hget", "hset"],
    description: "Interact with Redis databases",
  },
  mongodb: {
    tools: ["find", "insert", "update", "delete", "aggregate"],
    description: "Query and manage MongoDB databases",
  },
};

// Parse config and extract server capabilities
function parseCapabilities(configString: string): {
  servers: Array<{
    name: string;
    packageName?: string;
    capabilities: {
      tools: string[];
      resources: string[];
      prompts: string[];
      description?: string;
    };
    hasKnownCapabilities: boolean;
  }>;
  totalTools: number;
  totalResources: number;
  totalPrompts: number;
} {
  let config: MCPConfig;
  try {
    config = JSON.parse(configString);
  } catch {
    return { servers: [], totalTools: 0, totalResources: 0, totalPrompts: 0 };
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    return { servers: [], totalTools: 0, totalResources: 0, totalPrompts: 0 };
  }

  const servers: Array<{
    name: string;
    packageName?: string;
    capabilities: {
      tools: string[];
      resources: string[];
      prompts: string[];
      description?: string;
    };
    hasKnownCapabilities: boolean;
  }> = [];

  let totalTools = 0;
  let totalResources = 0;
  let totalPrompts = 0;

  for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
    // Try to match server to known capabilities
    const knownCaps = SERVER_CAPABILITIES[serverName];

    // Also try to find by package name in args
    let packageCaps = knownCaps;
    if (!packageCaps && serverConfig.args) {
      for (const arg of serverConfig.args) {
        if (typeof arg === "string") {
          // Check if arg matches a known template package
          const matchedTemplate = ALL_TEMPLATES.find(
            (t) => t.packageName && arg.includes(t.packageName)
          );
          if (matchedTemplate) {
            packageCaps = SERVER_CAPABILITIES[matchedTemplate.id];
            break;
          }
        }
      }
    }

    const capabilities = {
      tools: packageCaps?.tools || [],
      resources: packageCaps?.resources || [],
      prompts: packageCaps?.prompts || [],
      description: packageCaps?.description,
    };

    totalTools += capabilities.tools.length;
    totalResources += capabilities.resources.length;
    totalPrompts += capabilities.prompts.length;

    // Extract package name from args
    let packageName: string | undefined;
    if (serverConfig.args) {
      for (const arg of serverConfig.args) {
        if (typeof arg === "string" && arg.startsWith("@")) {
          packageName = arg;
          break;
        }
      }
    }

    servers.push({
      name: serverName,
      packageName,
      capabilities,
      hasKnownCapabilities: !!packageCaps,
    });
  }

  return { servers, totalTools, totalResources, totalPrompts };
}

export function MCPCapabilitiesPreview({
  config,
  className,
}: MCPCapabilitiesPreviewProps) {
  const { servers, totalTools, totalResources, totalPrompts } = useMemo(
    () => parseCapabilities(config),
    [config]
  );

  if (servers.length === 0) {
    return (
      <div className={cn("ui-bg-card border ui-border rounded-xl p-4", className)}>
        <div className="flex items-center gap-2 ui-text-secondary">
          <InformationCircleIcon className="h-5 w-5" />
          <span className="text-sm">Add servers to see their capabilities</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("ui-bg-card border ui-border rounded-xl overflow-hidden", className)}>
      {/* Summary header */}
      <div className="p-4 border-b ui-border bg-gradient-to-r from-violet-500/5 to-cyan-500/5">
        <h3 className="font-semibold ui-text-heading mb-3 flex items-center gap-2">
          <CubeIcon className="h-5 w-5" />
          Capabilities Preview
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-violet-600 dark:text-violet-400">
              <WrenchScrewdriverIcon className="h-4 w-4" />
              <span className="text-lg font-bold">{totalTools}</span>
            </div>
            <p className="text-xs ui-text-secondary">Tools</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400">
              <DocumentTextIcon className="h-4 w-4" />
              <span className="text-lg font-bold">{totalResources}</span>
            </div>
            <p className="text-xs ui-text-secondary">Resources</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-cyan-600 dark:text-cyan-400">
              <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
              <span className="text-lg font-bold">{totalPrompts}</span>
            </div>
            <p className="text-xs ui-text-secondary">Prompts</p>
          </div>
        </div>
      </div>

      {/* Server list */}
      <div className="max-h-[300px] overflow-y-auto">
        {servers.map((server, index) => (
          <div
            key={server.name}
            className={cn(
              "p-4",
              index !== servers.length - 1 && "border-b ui-border"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium ui-text-heading flex items-center gap-2">
                  {server.name}
                  {server.hasKnownCapabilities ? (
                    <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                  )}
                </h4>
                {server.packageName && (
                  <p className="text-xs font-mono ui-text-secondary">
                    {server.packageName}
                  </p>
                )}
              </div>
            </div>

            {server.capabilities.description && (
              <p className="text-sm ui-text-secondary mb-3">
                {server.capabilities.description}
              </p>
            )}

            {!server.hasKnownCapabilities && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                Capabilities not available for this server
              </p>
            )}

            {server.hasKnownCapabilities && (
              <div className="space-y-2">
                {/* Tools */}
                {server.capabilities.tools.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <WrenchScrewdriverIcon className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-xs font-medium ui-text-secondary">
                        Tools ({server.capabilities.tools.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {server.capabilities.tools.slice(0, 6).map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 text-xs font-mono rounded bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        >
                          {tool}
                        </span>
                      ))}
                      {server.capabilities.tools.length > 6 && (
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-500/10 ui-text-secondary">
                          +{server.capabilities.tools.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {server.capabilities.resources.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <DocumentTextIcon className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-medium ui-text-secondary">
                        Resources ({server.capabilities.resources.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {server.capabilities.resources.map((resource) => (
                        <span
                          key={resource}
                          className="px-2 py-0.5 text-xs font-mono rounded bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        >
                          {resource}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompts */}
                {server.capabilities.prompts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <ChatBubbleBottomCenterTextIcon className="h-3.5 w-3.5 text-cyan-500" />
                      <span className="text-xs font-medium ui-text-secondary">
                        Prompts ({server.capabilities.prompts.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {server.capabilities.prompts.map((prompt) => (
                        <span
                          key={prompt}
                          className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        >
                          {prompt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
