"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "@/components/search";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  activePage?: "home" | "docs" | "getting-started";
}

export function Header({ activePage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-800 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a
            href="https://www.claudeinsider.com"
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">Claude Insider</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/docs"
              className={`rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                activePage === "docs"
                  ? "text-gray-900 dark:text-white font-medium transition-colors"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              }`}
            >
              Documentation
            </Link>
            <Link
              href="/docs/getting-started"
              className={`rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                activePage === "getting-started"
                  ? "text-gray-900 dark:text-white font-medium transition-colors"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              }`}
            >
              Getting Started
            </Link>
            <a
              href="https://github.com/siliconyouth/claude-insider"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="GitHub repository (opens in new tab)"
            >
              GitHub
            </a>
            <Search />
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Search />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
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
                  className="w-6 h-6"
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
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className={
                  activePage === "docs"
                    ? "text-orange-600 dark:text-orange-400 font-medium px-2 py-2"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-2 transition-colors"
                }
              >
                Documentation
              </Link>
              <Link
                href="/docs/getting-started"
                onClick={() => setMobileMenuOpen(false)}
                className={
                  activePage === "getting-started"
                    ? "text-orange-600 dark:text-orange-400 font-medium px-2 py-2"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-2 transition-colors"
                }
              >
                Getting Started
              </Link>
              <a
                href="https://github.com/siliconyouth/claude-insider"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-2 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
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
