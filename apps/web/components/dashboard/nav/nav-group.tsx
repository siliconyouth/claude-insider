"use client";

/**
 * Dashboard Navigation Group
 *
 * Collapsible section containing multiple NavItems.
 * State persists to localStorage via NavContext.
 */

import { useNav } from "./nav-context";
import { cn } from "@/lib/design-system";
import type { ReactNode } from "react";

// ============================================
// TYPES
// ============================================

interface NavGroupProps {
  id: string;
  label: string;
  children: ReactNode;
  /** Total badge count for the group (sum of child badges) */
  badge?: number;
  /** Whether any child has urgent badge */
  badgeUrgent?: boolean;
  /** Default expanded state (overridden by localStorage) */
  defaultExpanded?: boolean;
  /** Icon for the group header */
  icon?: ReactNode;
}

// ============================================
// COMPONENT
// ============================================

export function NavGroup({
  id,
  label,
  children,
  badge,
  badgeUrgent = false,
  icon,
}: NavGroupProps) {
  const { isExpanded, toggleGroup } = useNav();
  const expanded = isExpanded(id);

  return (
    <div className="mb-1">
      {/* Group Header - Simple inline flexbox layout */}
      <button
        type="button"
        onClick={() => toggleGroup(id)}
        aria-expanded={expanded}
        aria-controls={`nav-group-${id}`}
        className={cn(
          // Layout: horizontal flex, vertically centered, full width
          "flex items-center w-full",
          // Spacing
          "px-3 py-2 gap-2",
          // Typography
          "text-xs font-semibold uppercase tracking-wider",
          // Colors
          "text-gray-500 dark:text-gray-400",
          "hover:text-gray-700 dark:hover:text-gray-200",
          // Interaction
          "cursor-pointer transition-colors",
          // Active state
          expanded && "text-blue-600 dark:text-cyan-400"
        )}
      >
        {/* Icon */}
        {icon && (
          <span className="w-4 h-4 opacity-60">{icon}</span>
        )}

        {/* Label - grows to fill space */}
        <span className="flex-1 text-left">{label}</span>

        {/* Badge */}
        {typeof badge === "number" && badge > 0 && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              badgeUrgent
                ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
            )}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}

        {/* Chevron */}
        <svg
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            expanded && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Group Content */}
      <div
        id={`nav-group-${id}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-0.5 py-1 pl-2">{children}</div>
      </div>
    </div>
  );
}
