/**
 * PageHeader Component
 *
 * Dashboard page header with title, description, and optional actions.
 * Consistent styling across all dashboard pages.
 */

import { cn } from "@/lib/design-system";

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional description/subtitle */
  description?: string;
  /** Optional badge (e.g., count indicator) */
  badge?: React.ReactNode;
  /** Optional actions (buttons, links) */
  actions?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold ui-text-heading">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1 text-sm ui-text-secondary">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

/**
 * CountBadge for use with PageHeader
 */
interface CountBadgeProps {
  count: number;
  className?: string;
}

export function CountBadge({ count, className }: CountBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30",
        className
      )}
    >
      {count.toLocaleString()}
    </span>
  );
}
