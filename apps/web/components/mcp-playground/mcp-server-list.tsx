"use client";

/**
 * MCP Server List Component
 *
 * Displays and manages multiple MCP servers in a configuration.
 * Features:
 * - List of configured servers
 * - Enable/disable toggles
 * - Remove server
 * - Add server from templates
 * - Combine multiple templates
 */

import { useMemo, useCallback } from "react";
import { cn } from "@/lib/design-system";
import type { MCPConfig } from "@/lib/mcp/schema";
import {
  TrashIcon,
  PlusIcon,
  ServerStackIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface MCPServerListProps {
  config: string;
  onConfigChange: (config: string) => void;
  onAddServer: () => void;
  className?: string;
}

interface ServerEntry {
  name: string;
  command: string;
  args?: string[];
  hasEnv: boolean;
  packageName?: string;
  disabled: boolean;
}

// Parse config to extract servers
function parseServers(configString: string): {
  servers: ServerEntry[];
  isValid: boolean;
} {
  try {
    const config: MCPConfig = JSON.parse(configString);
    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      return { servers: [], isValid: false };
    }

    const servers: ServerEntry[] = [];
    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      // Extract package name from args
      let packageName: string | undefined;
      if (serverConfig.args) {
        for (const arg of serverConfig.args) {
          if (typeof arg === "string" && (arg.startsWith("@") || arg.includes("mcp"))) {
            packageName = arg;
            break;
          }
        }
      }

      servers.push({
        name,
        command: serverConfig.command,
        args: serverConfig.args,
        hasEnv: !!(serverConfig.env && Object.keys(serverConfig.env).length > 0),
        packageName,
        disabled: !!(serverConfig as unknown as Record<string, unknown>).disabled,
      });
    }

    return { servers, isValid: true };
  } catch {
    return { servers: [], isValid: false };
  }
}

// Remove a server from config
function removeServer(configString: string, serverName: string): string {
  try {
    const config: MCPConfig = JSON.parse(configString);
    if (config.mcpServers && config.mcpServers[serverName]) {
      delete config.mcpServers[serverName];
    }
    return JSON.stringify(config, null, 2);
  } catch {
    return configString;
  }
}

// Toggle server enabled/disabled state
function toggleServer(configString: string, serverName: string): string {
  try {
    const config = JSON.parse(configString);
    if (config.mcpServers && config.mcpServers[serverName]) {
      const server = config.mcpServers[serverName];
      if (server.disabled) {
        // Enable: remove the disabled field
        delete server.disabled;
      } else {
        // Disable: add disabled field
        server.disabled = true;
      }
    }
    return JSON.stringify(config, null, 2);
  } catch {
    return configString;
  }
}

// Server icon based on name/package
function getServerIcon(name: string, packageName?: string): string {
  const iconMap: Record<string, string> = {
    filesystem: "📁",
    postgres: "🐘",
    sqlite: "💾",
    github: "🐙",
    git: "🔀",
    slack: "💬",
    gdrive: "📂",
    puppeteer: "🎭",
    playwright: "🎪",
    "brave-search": "🦁",
    fetch: "🌐",
    memory: "🧠",
    firecrawl: "🔥",
    docker: "🐳",
    kubernetes: "⎈",
    redis: "🔴",
    mongodb: "🍃",
    supabase: "⚡",
    notion: "📝",
    linear: "📐",
    sentry: "🐛",
    aws: "☁️",
  };

  // Check name first
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }

  // Check package name
  if (packageName) {
    const lowerPkg = packageName.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerPkg.includes(key)) {
        return icon;
      }
    }
  }

  return "📦";
}

export function MCPServerList({
  config,
  onConfigChange,
  onAddServer,
  className,
}: MCPServerListProps) {
  const { servers, isValid } = useMemo(() => parseServers(config), [config]);

  const handleRemoveServer = useCallback(
    (serverName: string) => {
      const newConfig = removeServer(config, serverName);
      onConfigChange(newConfig);
    },
    [config, onConfigChange]
  );

  const handleToggleServer = useCallback(
    (serverName: string) => {
      const newConfig = toggleServer(config, serverName);
      onConfigChange(newConfig);
    },
    [config, onConfigChange]
  );

  if (!isValid) {
    return (
      <div className={cn("ui-bg-card border ui-border rounded-xl p-4", className)}>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <ExclamationCircleIcon className="h-5 w-5" />
          <span className="text-sm">Fix JSON errors to manage servers</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("ui-bg-card border ui-border rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b ui-border flex items-center justify-between">
        <h3 className="font-semibold ui-text-heading flex items-center gap-2">
          <ServerStackIcon className="h-5 w-5" />
          Configured Servers
          {servers.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {servers.length}
            </span>
          )}
        </h3>
        <button
          onClick={onAddServer}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
            "bg-gradient-to-r from-violet-600 to-cyan-600",
            "text-white hover:opacity-90 transition-opacity"
          )}
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Server list */}
      {servers.length === 0 ? (
        <div className="p-6 text-center">
          <ServerStackIcon className="h-8 w-8 mx-auto ui-text-secondary mb-2" />
          <p className="text-sm ui-text-secondary">No servers configured</p>
          <button
            onClick={onAddServer}
            className="mt-3 text-sm text-blue-600 dark:text-cyan-400 hover:underline"
          >
            Add your first server →
          </button>
        </div>
      ) : (
        <div className="divide-y ui-border max-h-[280px] overflow-y-auto">
          {servers.map((server) => (
            <div
              key={server.name}
              className={cn(
                "p-3 flex items-center gap-3 transition-colors",
                server.disabled
                  ? "opacity-50 bg-gray-100 dark:bg-gray-800/50"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
              )}
            >
              {/* Toggle switch */}
              <button
                onClick={() => handleToggleServer(server.name)}
                className={cn(
                  "relative w-9 h-5 rounded-full shrink-0 transition-colors",
                  server.disabled
                    ? "bg-gray-300 dark:bg-gray-600"
                    : "bg-emerald-500"
                )}
                title={server.disabled ? "Enable server" : "Disable server"}
                aria-label={server.disabled ? "Enable server" : "Disable server"}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    server.disabled ? "left-0.5" : "left-[18px]"
                  )}
                />
              </button>

              {/* Icon */}
              <span className="text-xl shrink-0">
                {getServerIcon(server.name, server.packageName)}
              </span>

              {/* Server info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium truncate",
                    server.disabled ? "ui-text-secondary line-through" : "ui-text-heading"
                  )}>
                    {server.name}
                  </p>
                  {server.hasEnv && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      ENV
                    </span>
                  )}
                  {server.disabled && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-500/10 text-gray-600 dark:text-gray-400">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono ui-text-secondary truncate">
                  {server.packageName || `${server.command} ${(server.args || []).join(" ")}`}
                </p>
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemoveServer(server.name)}
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  "text-gray-400 hover:text-red-500 hover:bg-red-500/10",
                  "transition-colors"
                )}
                title="Remove server"
                aria-label="Remove server"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      {servers.length > 0 && (
        <div className="p-3 border-t ui-border bg-gray-50 dark:bg-gray-800/30">
          <button
            onClick={onAddServer}
            className="w-full text-center text-sm text-blue-600 dark:text-cyan-400 hover:underline"
          >
            Browse templates to add more →
          </button>
        </div>
      )}
    </div>
  );
}
