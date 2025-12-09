"use client";

import Link from "next/link";
import { Search } from "@/components/search";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  activePage?: "home" | "docs" | "getting-started";
}

export function Header({ activePage }: HeaderProps) {
  return (
    <header className="border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-lg z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a
            href="https://www.claudeinsider.com"
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <span className="text-xl font-semibold">Claude Insider</span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/docs"
              className={
                activePage === "docs"
                  ? "text-white font-medium transition-colors"
                  : "text-gray-400 hover:text-white transition-colors"
              }
            >
              Documentation
            </Link>
            <Link
              href="/docs/getting-started"
              className={
                activePage === "getting-started"
                  ? "text-white font-medium transition-colors"
                  : "text-gray-400 hover:text-white transition-colors"
              }
            >
              Getting Started
            </Link>
            <a
              href="https://github.com/siliconyouth/claude-insider"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <Search />
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
