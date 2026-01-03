"use client";

/**
 * MCP Playground Page
 *
 * Interactive playground for testing, validating, and sharing
 * MCP (Model Context Protocol) server configurations.
 *
 * Features:
 * - Monaco-based JSON editor with syntax highlighting
 * - Real-time validation with detailed error messages
 * - 27+ pre-built templates for common MCP servers
 * - URL-based sharing for configurations
 * - AI assistance via unified chat
 * - Save, version, and publish configurations
 * - Auto-save to localStorage for guests
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { useMCPAutoSave } from "@/hooks/use-mcp-autosave";
import {
  MCPConfigEditor,
  MCPValidationPanel,
  MCPToolbar,
  MCPTemplateSelector,
  MCPExportModal,
  MCPCapabilitiesPreview,
  MCPServerList,
  MCPSaveModal,
  MCPMyConfigs,
  MCPVersionHistory,
} from "@/components/mcp-playground";
import { validateMCPConfig, decodeConfigFromURL } from "@/lib/mcp/validator";
import { getConfig } from "@/lib/mcp/storage";
import {
  DEFAULT_CONFIG_STRING,
  type ValidationResult,
  type MCPConfig,
  type SavedMCPConfig,
  type LocalMCPDraft,
} from "@/lib/mcp/schema";
import { getFeaturedTemplates } from "@/lib/mcp/templates";
import { openAIAssistant } from "@/components/unified-chat";
import { getPageContext } from "@/lib/ai-context";
import {
  BeakerIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  ServerStackIcon,
  BookmarkIcon,
  FolderOpenIcon,
  ArrowPathIcon,
  XMarkIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

// Get featured templates for quick access
const FEATURED_TEMPLATES = getFeaturedTemplates().slice(0, 6);

export default function MCPPlaygroundPage() {
  const searchParams = useSearchParams();
  const _router = useRouter();
  const { isAuthenticated } = useAuth();

  // State
  const [config, setConfig] = useState<string>(DEFAULT_CONFIG_STRING);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showMyConfigs, setShowMyConfigs] = useState(false);

  // Currently loaded config (for updates and version history)
  const [currentSavedConfig, setCurrentSavedConfig] = useState<SavedMCPConfig | LocalMCPDraft | null>(null);

  // Auto-save hook
  const { hasUnsavedWork, restoreConfig, dismissRestore } = useMCPAutoSave(config, {
    onRestore: (restored) => {
      setConfig(JSON.stringify(restored, null, 2));
    },
  });

  // Load config from URL on mount (supports both encoded configs and saved config IDs)
  useEffect(() => {
    async function loadFromUrl() {
      const encodedConfig = searchParams.get("config");
      const configId = searchParams.get("id");

      if (configId) {
        // Load saved config by ID
        try {
          const saved = await getConfig(configId);
          if (saved) {
            setConfig(JSON.stringify(saved.config_json, null, 2));
            setCurrentSavedConfig(saved);
          }
        } catch (err) {
          console.error("Failed to load config:", err);
        }
      } else if (encodedConfig) {
        const decoded = decodeConfigFromURL(encodedConfig);
        if (decoded) {
          setConfig(decoded);
        }
      }
    }

    loadFromUrl();
  }, [searchParams]);

  // Handle loading a saved config
  const handleLoadConfig = useCallback(
    (configJson: MCPConfig, savedConfig: SavedMCPConfig | LocalMCPDraft) => {
      setConfig(JSON.stringify(configJson, null, 2));
      setCurrentSavedConfig(savedConfig);
      setShowMyConfigs(false);
    },
    []
  );

  // Handle save complete
  const handleSaved = useCallback(
    (saved: SavedMCPConfig | LocalMCPDraft) => {
      setCurrentSavedConfig(saved);
    },
    []
  );

  // Handle restore from auto-save
  const handleRestore = useCallback(() => {
    const restored = restoreConfig();
    if (restored) {
      setConfig(JSON.stringify(restored, null, 2));
    }
  }, [restoreConfig]);

  // Handle version restore
  const handleVersionRestore = useCallback((restoredConfig: MCPConfig) => {
    setConfig(JSON.stringify(restoredConfig, null, 2));
  }, []);

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsValidating(true);
      const result = validateMCPConfig(config);
      setValidationResult(result);
      setIsValidating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [config]);

  // Handle template selection
  const handleSelectTemplate = useCallback((templateConfig: object) => {
    setConfig(JSON.stringify(templateConfig, null, 2));
    setShowTemplates(false);
  }, []);

  // Ask AI for help with rich MCP context
  const handleAskAI = useCallback(() => {
    // Extract server names from config
    let serverNames = "";
    let serverCountStr = "0";
    try {
      const parsed = JSON.parse(config);
      const names = Object.keys(parsed?.mcpServers || {});
      serverNames = names.join(", ");
      serverCountStr = String(names.length);
    } catch {
      // Invalid JSON, still allow asking for help
    }

    // Build error/warning summary
    const errors = validationResult?.errors?.map((e) => e.message).join("; ") || "";
    const warnings = validationResult?.warnings?.map((w) => w.message).join("; ") || "";

    openAIAssistant({
      question: errors
        ? "Help me fix the errors in my MCP configuration"
        : "Help me with my MCP configuration",
      context: {
        page: getPageContext(),
        content: {
          type: "mcp-config",
          code: config,
          language: "json",
          title: "MCP Configuration",
          metadata: {
            serverCount: serverCountStr,
            serverNames: serverNames || "none",
            errors: errors || "none",
            warnings: warnings || "none",
          },
        },
      },
    });
  }, [config, validationResult]);

  // Get errors for editor markers
  const editorErrors = useMemo(() => {
    if (!validationResult) return [];
    return [
      ...validationResult.errors.map((e) => ({ ...e, severity: "error" as const })),
      ...validationResult.warnings.map((e) => ({ ...e, severity: "warning" as const })),
    ];
  }, [validationResult]);

  // Get server count for export modal
  const serverCount = useMemo(() => {
    try {
      const parsed = JSON.parse(config);
      return Object.keys(parsed?.mcpServers || {}).length;
    } catch {
      return 0;
    }
  }, [config]);

  // Parse config for save modal
  const parsedConfig = useMemo((): MCPConfig | null => {
    try {
      return JSON.parse(config);
    } catch {
      return null;
    }
  }, [config]);

  return (
    <div className="min-h-screen ui-bg-page flex flex-col">
      <Header activePage="tools" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Restore banner */}
        {hasUnsavedWork && (
          <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                You have unsaved work from a previous session.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRestore}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700"
              >
                Restore
              </button>
              <button
                onClick={dismissRestore}
                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/20"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                <BeakerIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold ui-text-heading">MCP Playground</h1>
                {currentSavedConfig && (
                  <p className="text-sm ui-text-secondary">
                    Editing: <span className="font-medium">{currentSavedConfig.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowMyConfigs(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ui-btn-secondary"
              >
                <FolderOpenIcon className="h-4 w-4" />
                My Configs
              </button>
              <button
                onClick={() => setShowSave(true)}
                disabled={!parsedConfig}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-gradient-to-r from-violet-600 to-cyan-600",
                  "text-white hover:opacity-90 disabled:opacity-50"
                )}
              >
                <BookmarkIcon className="h-4 w-4" />
                {currentSavedConfig ? "Update" : "Save"}
              </button>
              <Link
                href="/mcp-playground/gallery"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ui-btn-secondary"
              >
                <GlobeAltIcon className="h-4 w-4" />
                Gallery
              </Link>
            </div>
          </div>
          <p className="ui-text-secondary max-w-2xl mt-2">
            Test, validate, and share MCP (Model Context Protocol) server configurations.
            Browse 27+ templates or write your own configuration for Claude Desktop and Claude Code.
          </p>
        </header>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor section - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Toolbar */}
            <MCPToolbar
              config={config}
              onConfigChange={setConfig}
              onOpenTemplates={() => setShowTemplates(true)}
              onOpenExport={() => setShowExport(true)}
              defaultConfig={DEFAULT_CONFIG_STRING}
            />

            {/* Monaco Editor */}
            <MCPConfigEditor
              value={config}
              onChange={setConfig}
              errors={editorErrors}
              height="450px"
            />

            {/* Help section */}
            <div className="ui-bg-card border ui-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 ui-text-secondary" />
                  <span className="text-sm ui-text-secondary">
                    Need help with your configuration?
                  </span>
                </div>
                <button
                  onClick={handleAskAI}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "text-white hover:opacity-90 transition-opacity"
                  )}
                >
                  <LightBulbIcon className="h-4 w-4" />
                  Ask AI
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-4">
            {/* Validation Panel */}
            <MCPValidationPanel result={validationResult} isValidating={isValidating} />

            {/* Server List - shows configured servers with add/remove */}
            <MCPServerList
              config={config}
              onConfigChange={setConfig}
              onAddServer={() => setShowTemplates(true)}
            />

            {/* Capabilities Preview - shows what each server provides */}
            <MCPCapabilitiesPreview config={config} />

            {/* Version History (only for authenticated users with saved config) */}
            {isAuthenticated && currentSavedConfig && "status" in currentSavedConfig && (
              <MCPVersionHistory
                configId={currentSavedConfig.id}
                currentConfig={parsedConfig || { mcpServers: {} }}
                onRestore={handleVersionRestore}
              />
            )}

            {/* Quick Templates - collapsed view */}
            <div className="ui-bg-card border ui-border rounded-xl p-4">
              <h3 className="font-semibold ui-text-heading mb-3 flex items-center gap-2">
                <ServerStackIcon className="h-4 w-4" />
                Quick Templates
              </h3>
              <div className="space-y-2">
                {FEATURED_TEMPLATES.slice(0, 3).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.config)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-left",
                      "ui-btn-ghost border ui-border",
                      "hover:border-blue-500/50 transition-colors"
                    )}
                  >
                    <span className="text-lg">{template.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium ui-text-heading truncate">
                          {template.name}
                        </p>
                        {template.category === 'official' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                            Official
                          </span>
                        )}
                      </div>
                      <p className="text-xs ui-text-secondary truncate">
                        {template.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTemplates(true)}
                className="mt-3 w-full text-center text-sm text-blue-600 dark:text-cyan-400 hover:underline"
              >
                Browse all 27+ templates →
              </button>
            </div>

            {/* Documentation link */}
            <Link
              href="/docs/integrations/mcp-servers"
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl",
                "ui-bg-card border ui-border",
                "hover:border-blue-500/50 transition-colors"
              )}
            >
              <BookOpenIcon className="h-5 w-5 ui-text-secondary" />
              <div>
                <p className="text-sm font-medium ui-text-heading">
                  MCP Documentation
                </p>
                <p className="text-xs ui-text-secondary">
                  Learn how to configure MCP servers
                </p>
              </div>
            </Link>

            {/* Schema hints */}
            <div className="ui-bg-card border ui-border rounded-xl p-4">
              <h3 className="font-semibold ui-text-heading mb-3">Configuration Schema</h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 rounded bg-gray-100 dark:bg-gray-800/50">
                  <span className="text-violet-600 dark:text-violet-400">mcpServers</span>
                  <span className="ui-text-secondary"> (required)</span>
                </div>
                <div className="pl-4 space-y-1">
                  <div className="p-2 rounded bg-gray-100 dark:bg-gray-800/50">
                    <span className="text-blue-600 dark:text-blue-400">command</span>
                    <span className="ui-text-secondary"> : string</span>
                  </div>
                  <div className="p-2 rounded bg-gray-100 dark:bg-gray-800/50">
                    <span className="text-cyan-600 dark:text-cyan-400">args</span>
                    <span className="ui-text-secondary"> : string[]</span>
                  </div>
                  <div className="p-2 rounded bg-gray-100 dark:bg-gray-800/50">
                    <span className="text-emerald-600 dark:text-emerald-400">env</span>
                    <span className="ui-text-secondary">{" : { [key]: string }"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      <MCPTemplateSelector
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Export Modal */}
      <MCPExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        config={config}
        serverCount={serverCount}
      />

      {/* Save Modal */}
      {parsedConfig && (
        <MCPSaveModal
          isOpen={showSave}
          onClose={() => setShowSave(false)}
          config={parsedConfig}
          existingConfig={currentSavedConfig}
          onSaved={handleSaved}
        />
      )}

      {/* My Configs Drawer/Modal */}
      {showMyConfigs && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMyConfigs(false)}
          />
          {/* Drawer */}
          <div className="relative ml-auto w-full max-w-md h-full ui-bg-modal border-l ui-border overflow-y-auto">
            <div className="sticky top-0 z-10 p-4 border-b ui-border ui-bg-modal flex items-center justify-between">
              <h2 className="text-lg font-semibold ui-text-heading flex items-center gap-2">
                <FolderOpenIcon className="h-5 w-5" />
                My Configurations
              </h2>
              <button
                onClick={() => setShowMyConfigs(false)}
                className="p-2 rounded-lg ui-btn-ghost"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <MCPMyConfigs
                onLoadConfig={handleLoadConfig}
                onRefresh={() => {}}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
