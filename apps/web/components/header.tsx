"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UniversalSearch } from "@/components/universal-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/auth";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/design-system";

interface HeaderProps {
  activePage?: "home" | "docs" | "getting-started" | "resources" | "playground";
}

export function Header({ activePage }: HeaderProps) {
  const t = useTranslations("navigation");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b border-gray-200 dark:border-[#262626]",
        "bg-white/80 dark:bg-[#0a0a0a]/80",
        "backdrop-blur-lg",
        "supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#0a0a0a]/60"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a
            href="https://www.claudeinsider.com"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 shadow-sm shadow-blue-500/20">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Claude Insider
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/docs"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]",
                activePage === "docs"
                  ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              {t("docs")}
            </Link>
            <Link
              href="/docs/getting-started"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]",
                activePage === "getting-started"
                  ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/resources"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]",
                activePage === "resources"
                  ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              {t("resources")}
            </Link>
            <Link
              href="/playground"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]",
                activePage === "playground"
                  ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-[#1a1a1a]"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
              )}
            >
              Playground
            </Link>
            <a
              href="https://github.com/siliconyouth/claude-insider"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]"
              )}
              aria-label="GitHub repository (opens in new tab)"
            >
              GitHub
            </a>

            {/* Divider */}
            <div className="mx-2 h-5 w-px bg-gray-200 dark:bg-[#262626]" />

            <UniversalSearch />
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1">
            <UniversalSearch />
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "p-2 rounded-md transition-colors",
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              )}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-[#262626] py-3 animate-fade-in">
            <div className="flex flex-col space-y-1">
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  activePage === "docs"
                    ? "text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                )}
              >
                {t("docs")}
              </Link>
              <Link
                href="/docs/getting-started"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  activePage === "getting-started"
                    ? "text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                )}
              >
                {t("getStarted")}
              </Link>
              <Link
                href="/resources"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  activePage === "resources"
                    ? "text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                )}
              >
                {t("resources")}
              </Link>
              <Link
                href="/playground"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  activePage === "playground"
                    ? "text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                )}
              >
                Playground
              </Link>
              <a
                href="https://github.com/siliconyouth/claude-insider"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
