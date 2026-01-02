"use client";

/**
 * MCP Validation Panel Component
 *
 * Displays validation results for MCP configurations.
 * Shows errors, warnings, and success state with helpful messages.
 */

import { cn } from "@/lib/design-system";
import type { ValidationResult } from "@/lib/mcp/schema";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";

interface MCPValidationPanelProps {
  result: ValidationResult | null;
  isValidating?: boolean;
  className?: string;
}

export function MCPValidationPanel({
  result,
  isValidating = false,
  className,
}: MCPValidationPanelProps) {
  // Loading state
  if (isValidating) {
    return (
      <div className={cn("ui-bg-card border ui-border rounded-xl p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="ui-text-secondary text-sm">Validating...</span>
        </div>
      </div>
    );
  }

  // No result yet
  if (!result) {
    return (
      <div className={cn("ui-bg-card border ui-border rounded-xl p-4", className)}>
        <div className="flex items-center gap-3 ui-text-secondary">
          <ServerIcon className="h-5 w-5" />
          <span className="text-sm">Enter an MCP configuration to validate</span>
        </div>
      </div>
    );
  }

  const { valid, errors, warnings, serverCount } = result;
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div className={cn("ui-bg-card border ui-border rounded-xl overflow-hidden", className)}>
      {/* Status header */}
      <div
        className={cn(
          "px-4 py-3 flex items-center gap-3",
          valid
            ? "bg-emerald-500/10 border-b border-emerald-500/20"
            : "bg-red-500/10 border-b border-red-500/20"
        )}
      >
        {valid ? (
          <>
            <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Valid Configuration
            </span>
          </>
        ) : (
          <>
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-600 dark:text-red-400">
              {errors.length} Error{errors.length !== 1 ? "s" : ""} Found
            </span>
          </>
        )}
      </div>

      {/* Server count */}
      <div className="px-4 py-3 border-b ui-border">
        <div className="flex items-center gap-2 text-sm">
          <ServerIcon className="h-4 w-4 ui-text-secondary" />
          <span className="ui-text-secondary">
            {serverCount} server{serverCount !== 1 ? "s" : ""} defined
          </span>
        </div>
      </div>

      {/* Errors list */}
      {hasErrors && (
        <div className="px-4 py-3 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
            Errors
          </h4>
          <ul className="space-y-2">
            {errors.map((error, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm bg-red-500/5 rounded-lg p-2"
              >
                <ExclamationCircleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 dark:text-red-300">{error.message}</p>
                  {error.path && (
                    <p className="text-xs text-red-500/70 mt-0.5 font-mono">
                      at {error.path}
                    </p>
                  )}
                  {error.line && (
                    <p className="text-xs text-red-500/70 mt-0.5">
                      Line {error.line}
                      {error.column && `, Column ${error.column}`}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings list */}
      {hasWarnings && (
        <div className={cn("px-4 py-3 space-y-2", hasErrors && "border-t ui-border")}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Warnings
          </h4>
          <ul className="space-y-2">
            {warnings.map((warning, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm bg-amber-500/5 rounded-lg p-2"
              >
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-700 dark:text-amber-300">{warning.message}</p>
                  {warning.path && (
                    <p className="text-xs text-amber-500/70 mt-0.5 font-mono">
                      at {warning.path}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success message */}
      {valid && !hasWarnings && (
        <div className="px-4 py-3">
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            Your MCP configuration is valid and ready to use!
          </p>
          <p className="text-xs ui-text-secondary mt-1">
            Copy the configuration to your Claude settings file.
          </p>
        </div>
      )}
    </div>
  );
}
