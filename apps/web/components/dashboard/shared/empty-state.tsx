/**
 * EmptyState Component
 *
 * Displays a centered message when a list/table has no items.
 * Follows design system with consistent styling.
 */

import { cn } from "@/lib/design-system";

interface EmptyStateProps {
  /** Icon to display (React node) */
  icon?: React.ReactNode;
  /** Main message */
  message: string;
  /** Optional description text */
  description?: string;
  /** Optional action button/link */
  action?: React.ReactNode;
  /** Additional className */
  className?: string;
}

export function EmptyState({
  icon,
  message,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-gray-500 dark:text-gray-400">
          {icon}
        </div>
      )}
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
        {message}
      </p>
      {description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Compact empty state for inline use
 */
interface EmptyStateInlineProps {
  message: string;
  className?: string;
}

export function EmptyStateInline({ message, className }: EmptyStateInlineProps) {
  return (
    <p className={cn("py-8 text-center text-gray-500 dark:text-gray-400", className)}>
      {message}
    </p>
  );
}
