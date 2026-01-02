"use client";

/**
 * MCP Template Selector Component
 *
 * A comprehensive modal for browsing, searching, and selecting MCP templates.
 * Features:
 * - Search input with debouncing
 * - Category filter tabs
 * - Difficulty filters
 * - Template cards with details
 * - Environment variable hints
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { cn } from "@/lib/design-system";
import {
  searchTemplates,
  TEMPLATE_CATEGORIES,
  type MCPTemplate,
  type TemplateCategory,
  type TemplateDifficulty,
} from "@/lib/mcp/templates";
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface MCPTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (config: object) => void;
}

const DIFFICULTY_OPTIONS: { value: TemplateDifficulty | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Levels', color: 'gray' },
  { value: 'beginner', label: 'Beginner', color: 'emerald' },
  { value: 'intermediate', label: 'Intermediate', color: 'blue' },
  { value: 'advanced', label: 'Advanced', color: 'violet' },
];

export function MCPTemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
}: MCPTemplateSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<TemplateDifficulty | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MCPTemplate | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedCategory('all');
      setSelectedDifficulty('all');
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    return searchTemplates(search, {
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
    });
  }, [search, selectedCategory, selectedDifficulty]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: { all: number; [key: string]: number } = { all: 0 };
    Object.keys(TEMPLATE_CATEGORIES).forEach((cat) => {
      const count = searchTemplates(search, {
        category: cat as TemplateCategory,
        difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
      }).length;
      counts[cat] = count;
      counts.all += count;
    });
    return counts;
  }, [search, selectedDifficulty]);

  // Handle template selection
  const handleSelect = useCallback((template: MCPTemplate) => {
    setSelectedTemplate(template);
  }, []);

  // Handle use template
  const handleUseTemplate = useCallback(() => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate.config);
      onClose();
    }
  }, [selectedTemplate, onSelectTemplate, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedTemplate) {
          setSelectedTemplate(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedTemplate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden ui-bg-modal border ui-border rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b ui-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold ui-text-heading">MCP Server Templates</h2>
            <p className="text-sm ui-text-secondary mt-0.5">
              {filteredTemplates.length} templates available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg ui-btn-ghost"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b ui-border space-y-3 shrink-0">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ui-text-secondary" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-lg",
                "ui-input"
              )}
              autoFocus
            />
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                selectedCategory === 'all'
                  ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
                  : "ui-btn-ghost"
              )}
            >
              All ({categoryCounts.all})
            </button>
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as TemplateCategory)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  "flex items-center gap-1.5",
                  selectedCategory === key
                    ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
                    : "ui-btn-ghost"
                )}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="text-xs opacity-70">({categoryCounts[key] || 0})</span>
              </button>
            ))}
          </div>

          {/* Difficulty filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm ui-text-secondary">Difficulty:</span>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedDifficulty(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  selectedDifficulty === opt.value
                    ? opt.color === 'emerald'
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : opt.color === 'blue'
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                      : opt.color === 'violet'
                      ? "bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30"
                      : "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30"
                    : "ui-btn-ghost"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Template list */}
          <div
            className={cn(
              "overflow-y-auto p-4",
              selectedTemplate ? "w-1/2 border-r ui-border" : "w-full"
            )}
          >
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <p className="ui-text-secondary">No templates found</p>
                <p className="text-sm ui-text-secondary mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className={cn(
                "grid gap-3",
                selectedTemplate ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
              )}>
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate?.id === template.id}
                    onClick={() => handleSelect(template)}
                    compact={!!selectedTemplate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Template details panel */}
          {selectedTemplate && (
            <div className="w-1/2 overflow-y-auto p-4">
              <TemplateDetails
                template={selectedTemplate}
                onUse={handleUseTemplate}
                onClose={() => setSelectedTemplate(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Template card component
function TemplateCard({
  template,
  isSelected,
  onClick,
  compact,
}: {
  template: MCPTemplate;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all",
        "hover:shadow-lg hover:-translate-y-0.5",
        isSelected
          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
          : "ui-bg-card ui-border hover:border-blue-500/50"
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("text-2xl", compact && "text-xl")}>{template.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-medium ui-text-heading truncate",
              compact ? "text-sm" : "text-base"
            )}>
              {template.name}
            </h3>
            {template.featured && (
              <StarIconSolid className="h-4 w-4 text-yellow-500 shrink-0" />
            )}
          </div>
          {!compact && (
            <p className="text-sm ui-text-secondary mt-0.5 line-clamp-2">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                template.difficulty === 'beginner'
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : template.difficulty === 'intermediate'
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
              )}
            >
              {template.difficulty}
            </span>
            {template.category === 'official' && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                Official
              </span>
            )}
            {template.stars && template.stars > 1000 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-500/10 ui-text-secondary">
                <StarIcon className="h-3 w-3" />
                {(template.stars / 1000).toFixed(1)}k
              </span>
            )}
          </div>
        </div>
        <ChevronRightIcon className="h-5 w-5 ui-text-secondary shrink-0" />
      </div>
    </button>
  );
}

// Template details component
function TemplateDetails({
  template,
  onUse,
  onClose,
}: {
  template: MCPTemplate;
  onUse: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl">{template.icon}</span>
        <div className="flex-1">
          <h3 className="text-xl font-semibold ui-text-heading">{template.name}</h3>
          <p className="text-sm ui-text-secondary mt-1">{template.description}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium",
            template.difficulty === 'beginner'
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : template.difficulty === 'intermediate'
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-violet-500/10 text-violet-600 dark:text-violet-400"
          )}
        >
          {template.difficulty}
        </span>
        {template.category === 'official' && (
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            ✨ Official Anthropic
          </span>
        )}
        {template.packageName && (
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-gray-500/10 ui-text-secondary">
            {template.packageName}
          </span>
        )}
      </div>

      {/* Environment variables warning */}
      {template.envVars && template.envVars.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Required Environment Variables</span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {template.envVars.map((env) => (
              <li key={env.name} className="text-sm">
                <code className="font-mono text-amber-700 dark:text-amber-300">
                  {env.name}
                </code>
                <span className="ui-text-secondary"> — {env.description}</span>
                {env.example && (
                  <span className="ui-text-secondary text-xs block ml-4">
                    e.g., {env.example}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Config preview */}
      <div>
        <h4 className="text-sm font-medium ui-text-heading mb-2">Configuration Preview</h4>
        <pre className="p-3 rounded-lg bg-[#1e1e1e] text-sm font-mono text-gray-300 overflow-x-auto">
          {JSON.stringify(template.config, null, 2)}
        </pre>
      </div>

      {/* Documentation link */}
      {template.documentation && (
        <a
          href={template.documentation}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-cyan-400 hover:underline"
        >
          View documentation →
        </a>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onUse}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white font-medium shadow-lg shadow-blue-500/25",
            "hover:shadow-xl hover:shadow-blue-500/30 transition-all"
          )}
        >
          <CheckCircleIcon className="h-5 w-5" />
          Use This Template
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg ui-btn-secondary text-sm font-medium"
        >
          Back
        </button>
      </div>
    </div>
  );
}
