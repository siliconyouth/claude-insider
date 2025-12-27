/**
 * StatCard Component
 *
 * Displays a metric with label and optional trend indicator.
 * Used for dashboard overview statistics.
 */

import { cn } from "@/lib/design-system";

interface StatCardProps {
  /** Stat label/title */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional trend indicator */
  trend?: {
    value: number;
    label?: string;
  };
  /** Optional description */
  description?: string;
  /** Color variant */
  variant?: "default" | "success" | "warning" | "danger" | "info";
  /** Additional className */
  className?: string;
}

const variantStyles = {
  default: {
    icon: "text-gray-500 dark:text-gray-400",
    value: "text-gray-900 dark:text-white",
  },
  success: {
    icon: "text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    icon: "text-yellow-600 dark:text-yellow-400",
    value: "text-yellow-600 dark:text-yellow-400",
  },
  danger: {
    icon: "text-red-600 dark:text-red-400",
    value: "text-red-600 dark:text-red-400",
  },
  info: {
    icon: "text-blue-600 dark:text-blue-400",
    value: "text-blue-600 dark:text-blue-400",
  },
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  description,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-xl p-4 sm:p-6",
        "ui-bg-card border ui-border",
        "hover:ui-bg-card-hover transition-colors",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm ui-text-secondary">{label}</p>
          <p className={cn("mt-1 text-2xl sm:text-3xl font-bold", styles.value)}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="mt-1 text-xs ui-text-muted">{description}</p>
          )}
        </div>
        {icon && (
          <div className={cn("p-2 rounded-lg ui-bg-skeleton", styles.icon)}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-medium",
              trend.value > 0 ? "text-emerald-600 dark:text-emerald-400" : trend.value < 0 ? "text-red-600 dark:text-red-400" : "ui-text-muted"
            )}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
          {trend.label && (
            <span className="text-xs ui-text-muted">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Grid container for stat cards
 */
interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4 mb-6", gridCols[columns], className)}>
      {children}
    </div>
  );
}
