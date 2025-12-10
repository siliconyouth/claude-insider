"use client";

import Link from "next/link";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { usePrefetch } from "@/hooks/use-prefetch";
import type { PrefetchPriority } from "@/lib/prefetch-queue";
import { cn } from "@/lib/design-system";

type LinkProps = ComponentProps<typeof Link>;

interface PrefetchLinkProps extends Omit<LinkProps, "ref"> {
  /**
   * Override prefetch priority
   */
  priority?: PrefetchPriority;

  /**
   * Show prefetch indicator (dot)
   */
  showIndicator?: boolean;

  /**
   * Delay before prefetching on hover (ms)
   * @default 100
   */
  hoverDelay?: number;

  /**
   * Disable prefetching
   */
  noPrefetch?: boolean;

  /**
   * Children
   */
  children: ReactNode;
}

/**
 * Smart Link component with hover-based prefetching
 *
 * Part of the UX System - Pillar 4: Smart Prefetching
 *
 * Features:
 * - Prefetches on hover after short delay
 * - Prefetches on focus for keyboard navigation
 * - Prefetches when link enters viewport (low priority)
 * - Shows optional indicator when prefetched
 * - Respects priority queue to avoid overwhelming the network
 *
 * @example
 * ```tsx
 * <PrefetchLink href="/docs/getting-started" priority="high">
 *   Getting Started
 * </PrefetchLink>
 *
 * <PrefetchLink href="/docs/api" showIndicator>
 *   API Reference
 * </PrefetchLink>
 * ```
 */
export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  function PrefetchLink(
    {
      href,
      priority,
      showIndicator = false,
      hoverDelay = 100,
      noPrefetch = false,
      className,
      children,
      ...props
    },
    forwardedRef
  ) {
    const url = typeof href === "string" ? href : href.pathname || "";

    const { ref: prefetchRef, isPrefetching, isPrefetched } = usePrefetch(url, {
      onHover: !noPrefetch,
      onFocus: !noPrefetch,
      onIntersection: !noPrefetch,
      hoverDelay,
      priority,
    });

    // Combine refs
    const setRefs = (node: HTMLAnchorElement | null) => {
      // Call prefetch ref
      prefetchRef(node);

      // Handle forwarded ref
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    return (
      <Link
        ref={setRefs}
        href={href}
        className={cn(
          "relative",
          isPrefetching && "prefetch-loading",
          className
        )}
        prefetch={false} // We handle prefetching ourselves
        {...props}
      >
        {children}
        {showIndicator && (isPrefetching || isPrefetched) && (
          <span
            className={cn(
              "absolute -right-2 -top-0.5 h-1.5 w-1.5 rounded-full transition-all duration-300",
              isPrefetching && "bg-blue-400 animate-pulse",
              isPrefetched && "bg-green-400"
            )}
            aria-hidden="true"
          />
        )}
      </Link>
    );
  }
);

/**
 * Navigation link with prefetching for sidebar/header navigation
 */
interface NavPrefetchLinkProps extends PrefetchLinkProps {
  /**
   * Whether this link is currently active
   */
  isActive?: boolean;

  /**
   * Icon to display before the link text
   */
  icon?: ReactNode;
}

export const NavPrefetchLink = forwardRef<HTMLAnchorElement, NavPrefetchLinkProps>(
  function NavPrefetchLink(
    { isActive = false, icon, className, children, ...props },
    ref
  ) {
    return (
      <PrefetchLink
        ref={ref}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "text-gray-600 dark:text-gray-400",
          "hover:bg-gray-100 dark:hover:bg-ds-surface-2",
          "hover:text-gray-900 dark:hover:text-white",
          isActive && "bg-gray-100 dark:bg-ds-surface-2 text-gray-900 dark:text-white",
          className
        )}
        priority="high"
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </PrefetchLink>
    );
  }
);

/**
 * Card link with prefetching for category/feature cards
 */
interface CardPrefetchLinkProps extends PrefetchLinkProps {
  /**
   * Card title
   */
  title: string;

  /**
   * Card description
   */
  description?: string;

  /**
   * Icon or image for the card
   */
  icon?: ReactNode;
}

export function CardPrefetchLink({
  title,
  description,
  icon,
  className,
  ...props
}: CardPrefetchLinkProps) {
  return (
    <PrefetchLink
      className={cn(
        "group block rounded-xl border border-gray-200 dark:border-ds-border-1",
        "bg-white dark:bg-ds-surface-2 p-6",
        "shadow-sm transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        "hover:border-gray-300 dark:hover:border-ds-border-2",
        className
      )}
      priority="normal"
      showIndicator
      {...props}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {description}
        </p>
      )}
    </PrefetchLink>
  );
}

/**
 * Breadcrumb link with prefetching
 */
export function BreadcrumbPrefetchLink({
  className,
  children,
  ...props
}: PrefetchLinkProps) {
  return (
    <PrefetchLink
      className={cn(
        "text-sm text-gray-500 dark:text-gray-400",
        "hover:text-gray-700 dark:hover:text-gray-200",
        "transition-colors",
        className
      )}
      priority="high"
      {...props}
    >
      {children}
    </PrefetchLink>
  );
}

/**
 * TOC (Table of Contents) link with prefetching
 * For internal page links, uses smooth scroll
 */
interface TocLinkProps extends Omit<PrefetchLinkProps, "href"> {
  /**
   * The anchor ID (without #)
   */
  anchor: string;

  /**
   * Whether this section is currently active
   */
  isActive?: boolean;

  /**
   * Nesting level (0 = top level)
   */
  level?: number;
}

export function TocLink({
  anchor,
  isActive = false,
  level = 0,
  className,
  children,
  ...props
}: TocLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      // Update URL without triggering navigation
      window.history.pushState(null, "", `#${anchor}`);
    }
  };

  return (
    <a
      href={`#${anchor}`}
      onClick={handleClick}
      className={cn(
        "block text-sm transition-colors py-1",
        level > 0 && "pl-4",
        isActive
          ? "text-blue-600 dark:text-cyan-400 font-medium"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
