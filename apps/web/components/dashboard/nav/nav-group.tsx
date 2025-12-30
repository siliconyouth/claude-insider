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
// ICONS
// ============================================

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={cn(
        "w-4 h-4 transition-transform duration-200",
        expanded ? "rotate-180" : "rotate-0",
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
  );
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
      {/* Group Header */}
      <button
        onClick={() => toggleGroup(id)}
        className={cn(
          "ui-nav-group-header",
          expanded && "ui-nav-group-header-active",
        )}
        aria-expanded={expanded}
        aria-controls={`nav-group-${id}`}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span className="w-4 h-4 flex items-center justify-center opacity-60">
              {icon}
            </span>
          )}
          <span>{label}</span>
          {typeof badge === "number" && badge > 0 && (
            <span
              className={cn(
                "ui-nav-badge-group",
                "text-[10px] px-1.5 py-0.5 rounded-full",
                badgeUrgent && "ui-nav-badge-urgent",
              )}
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
        <ChevronIcon expanded={expanded} />
      </button>

      {/* Group Content */}
      <div
        id={`nav-group-${id}`}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="flex flex-col gap-0.5 py-1 pl-2">{children}</div>
      </div>
    </div>
  );
}
