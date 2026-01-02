"use client";

/**
 * MCP Toolbar Component
 *
 * Action buttons for the MCP Playground:
 * - Template selector
 * - Format JSON
 * - Copy to clipboard
 * - Share via URL
 * - Reset to default
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/components/toast";
import {
  ClipboardIcon,
  ArrowPathIcon,
  CodeBracketIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { formatMCPConfig, encodeConfigForURL } from "@/lib/mcp/validator";

interface MCPToolbarProps {
  config: string;
  onConfigChange: (config: string) => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  defaultConfig: string;
  className?: string;
}

export function MCPToolbar({
  config,
  onConfigChange,
  onOpenTemplates,
  onOpenExport,
  defaultConfig,
  className,
}: MCPToolbarProps) {
  const { success, error, info } = useToast();
  const [justCopied, setJustCopied] = useState(false);
  const [justShared, setJustShared] = useState(false);

  // Format JSON
  const handleFormat = useCallback(() => {
    const formatted = formatMCPConfig(config);
    if (formatted !== config) {
      onConfigChange(formatted);
      success("Formatted", "JSON has been formatted");
    }
  }, [config, onConfigChange, success]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(config);
      setJustCopied(true);
      success("Copied!", "Configuration copied to clipboard");
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      error("Failed to copy", "Please try again or copy manually");
    }
  }, [config, success, error]);

  // Share via URL
  const handleShare = useCallback(async () => {
    try {
      const encoded = encodeConfigForURL(config);
      const shareUrl = `${window.location.origin}/mcp-playground?config=${encoded}`;

      await navigator.clipboard.writeText(shareUrl);
      setJustShared(true);
      success("Link copied!", "Share URL copied to clipboard");
      setTimeout(() => setJustShared(false), 2000);
    } catch {
      error("Failed to create share link", "Please try again");
    }
  }, [config, success, error]);

  // Reset to default
  const handleReset = useCallback(() => {
    if (config !== defaultConfig) {
      onConfigChange(defaultConfig);
      info("Reset", "Configuration reset to default");
    }
  }, [config, defaultConfig, onConfigChange, info]);

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Template selector button */}
      <button
        onClick={onOpenTemplates}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
          "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
          "text-white shadow-lg shadow-blue-500/25",
          "hover:shadow-xl hover:shadow-blue-500/30 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "dark:focus:ring-offset-[#0a0a0a]"
        )}
      >
        <DocumentDuplicateIcon className="h-4 w-4" />
        Templates
      </button>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

      {/* Format button */}
      <ToolbarButton
        onClick={handleFormat}
        icon={<CodeBracketIcon className="h-4 w-4" />}
        label="Format"
        title="Format JSON (Ctrl+Shift+F)"
      />

      {/* Copy button */}
      <ToolbarButton
        onClick={handleCopy}
        icon={
          justCopied ? (
            <CheckIcon className="h-4 w-4 text-emerald-500" />
          ) : (
            <ClipboardIcon className="h-4 w-4" />
          )
        }
        label={justCopied ? "Copied!" : "Copy"}
        title="Copy to clipboard"
        success={justCopied}
      />

      {/* Share button */}
      <ToolbarButton
        onClick={handleShare}
        icon={
          justShared ? (
            <CheckIcon className="h-4 w-4 text-emerald-500" />
          ) : (
            <ShareIcon className="h-4 w-4" />
          )
        }
        label={justShared ? "Copied!" : "Share"}
        title="Copy shareable link"
        success={justShared}
      />

      {/* Export button */}
      <ToolbarButton
        onClick={onOpenExport}
        icon={<ArrowDownTrayIcon className="h-4 w-4" />}
        label="Export"
        title="Export configuration for Claude Desktop or Claude Code"
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Reset button */}
      <ToolbarButton
        onClick={handleReset}
        icon={<ArrowPathIcon className="h-4 w-4" />}
        label="Reset"
        title="Reset to default configuration"
        variant="ghost"
      />
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title: string;
  success?: boolean;
  variant?: "default" | "ghost";
}

function ToolbarButton({
  onClick,
  icon,
  label,
  title,
  success = false,
  variant = "default",
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "dark:focus:ring-offset-[#0a0a0a]",
        variant === "ghost"
          ? "ui-btn-ghost"
          : success
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          : "ui-bg-card border ui-border hover:border-blue-500/50 ui-text-body"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
