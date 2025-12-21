"use client";

/**
 * Navigation Dropdown Component
 *
 * Beautiful hover dropdown menus for the header navigation.
 * Supports multiple layouts: mega menu, grid, and simple list.
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  external?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface NavDropdownProps {
  /** The trigger label */
  label: string;
  /** Link href for the main item (clicked, not hovered) */
  href: string;
  /** Whether this item is currently active */
  isActive?: boolean;
  /** Dropdown sections */
  sections?: NavSection[];
  /** Featured item to highlight */
  featured?: NavItem;
  /** Layout style */
  layout?: "mega" | "grid" | "list";
  /** Footer content */
  footer?: React.ReactNode;
}

export function NavDropdown({
  label,
  href,
  isActive,
  sections,
  featured,
  layout = "list",
  footer,
}: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hasDropdown = sections && sections.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={dropdownRef}
    >
      {/* Trigger */}
      <Link
        href={href}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]",
          isActive
            ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a]"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-[#1a1a1a]/50"
        )}
      >
        {label}
        {hasDropdown && (
          <svg
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </Link>

      {/* Dropdown */}
      {hasDropdown && isOpen && (
        <div
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
        >
          <div
            className={cn(
              "rounded-xl border border-gray-200 dark:border-[#262626]",
              "bg-white dark:bg-[#111111]",
              "shadow-xl shadow-gray-200/50 dark:shadow-black/50",
              "overflow-hidden",
              "max-w-[calc(100vw-2rem)]",
              layout === "mega" && "min-w-[600px]",
              layout === "grid" && "min-w-[480px]",
              layout === "list" && "min-w-[240px]"
            )}
          >
            {/* Featured Item */}
            {featured && (
              <div className="p-4 bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-cyan-500/5 border-b border-gray-100 dark:border-[#222]">
                <Link
                  href={featured.href}
                  className="flex items-start gap-3 group"
                >
                  {featured.icon && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center text-white">
                      {featured.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                        {featured.label}
                      </span>
                      {featured.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                          {featured.badge}
                        </span>
                      )}
                    </div>
                    {featured.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {featured.description}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Sections */}
            <div
              className={cn(
                "p-4",
                layout === "mega" && "grid grid-cols-3 gap-6",
                layout === "grid" && "grid grid-cols-2 gap-4",
                layout === "list" && "flex flex-col gap-1"
              )}
            >
              {sections.map((section, idx) => (
                <div key={idx} className={layout === "list" ? "" : "space-y-2"}>
                  {section.title && layout !== "list" && (
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 mb-2">
                      {section.title}
                    </h4>
                  )}
                  <ul className={cn(
                    layout === "list" ? "space-y-0.5" : "space-y-1"
                  )}>
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <Link
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noopener noreferrer" : undefined}
                          className={cn(
                            "flex items-start gap-3 px-2 py-2 rounded-lg transition-all duration-150",
                            "text-gray-700 dark:text-gray-300",
                            "hover:bg-gray-50 dark:hover:bg-[#1a1a1a]",
                            "hover:text-gray-900 dark:hover:text-white",
                            "group"
                          )}
                        >
                          {item.icon && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                              {item.icon}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.label}</span>
                              {item.badge && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400">
                                  {item.badge}
                                </span>
                              )}
                              {item.external && (
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-[#222]">
                {footer}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple nav link without dropdown
 */
export function NavLink({
  label,
  href,
  isActive,
  external,
}: {
  label: string;
  href: string;
  isActive?: boolean;
  external?: boolean;
}) {
  const Component = external ? "a" : Link;
  const extraProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Component
      href={href}
      {...extraProps}
      className={cn(
        "rounded-lg px-2 py-1.5 text-sm font-medium transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]",
        isActive
          ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a]"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-[#1a1a1a]/50"
      )}
    >
      {label}
    </Component>
  );
}
