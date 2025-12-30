"use client";

/**
 * Dashboard Navigation Item
 *
 * Individual navigation link with active state detection and optional badge.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/design-system";
import type { ReactNode } from "react";

// ============================================
// TYPES
// ============================================

interface NavItemProps {
  href: string;
  label: string;
  icon?: ReactNode;
  /** Badge count for pending items */
  badge?: number;
  /** Whether to treat badge as urgent (red) */
  badgeUrgent?: boolean;
  /** External link (opens in new tab) */
  external?: boolean;
  /** Match exact path only (default: true) */
  exact?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function NavItem({
  href,
  label,
  icon,
  badge,
  badgeUrgent = false,
  external = false,
  exact = true,
}: NavItemProps) {
  const pathname = usePathname();

  // Check if this item is active
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  // External link icon
  const ExternalIcon = () => (
    <svg
      className="w-3 h-3 ui-nav-external"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );

  const content = (
    <>
      {/* Icon */}
      {icon && (
        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="flex-1 truncate">{label}</span>

      {/* Badge */}
      {typeof badge === "number" && badge > 0 && (
        <span
          className={cn(
            badgeUrgent ? "ui-nav-badge-urgent" : "ui-nav-badge",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}

      {/* External indicator */}
      {external && <ExternalIcon />}
    </>
  );

  // External links use regular anchor
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("ui-nav-item group", isActive && "ui-nav-item-active")}
      >
        {content}
      </a>
    );
  }

  // Internal links use Next.js Link
  return (
    <Link
      href={href}
      className={cn("ui-nav-item", isActive && "ui-nav-item-active")}
    >
      {content}
    </Link>
  );
}
