"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UniversalSearch } from "@/components/universal-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/auth";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { InboxDropdown } from "@/components/messaging";
import { NavDropdown, NavLink } from "@/components/nav-dropdown";
import { cn } from "@/lib/design-system";

interface HeaderProps {
  activePage?: "home" | "docs" | "getting-started" | "resources" | "playground" | "stats" | "prompts";
}

// Icons for navigation items
const BookIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const RocketIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CogIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const PuzzleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);

const AcademicIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
);

const ServerIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const ToolsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  </svg>
);

const TemplateIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

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
            <div className="flex h-8 w-8 shrink-0 aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 shadow-sm shadow-blue-500/20">
              <span className="text-sm font-bold text-white tracking-tight">Ci</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Claude Insider
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5">
            {/* Docs Dropdown */}
            <NavDropdown
              label={t("docs")}
              href="/docs"
              isActive={activePage === "docs"}
              layout="mega"
              featured={{
                label: "AI Assistant",
                href: "/assistant",
                description: "Chat with Claude about Claude Code - get instant answers from our documentation",
                icon: <SparklesIcon />,
                badge: "NEW",
              }}
              sections={[
                {
                  title: "Getting Started",
                  items: [
                    { label: "Introduction", href: "/docs/getting-started", description: "What is Claude Code?", icon: <BookIcon /> },
                    { label: "Installation", href: "/docs/getting-started/installation", description: "Install and setup", icon: <RocketIcon /> },
                    { label: "First Steps", href: "/docs/getting-started/first-steps", description: "Your first session", icon: <LightbulbIcon /> },
                  ],
                },
                {
                  title: "Core Concepts",
                  items: [
                    { label: "Configuration", href: "/docs/configuration", description: "CLAUDE.md and settings", icon: <CogIcon /> },
                    { label: "API Reference", href: "/docs/api", description: "SDK and endpoints", icon: <CodeIcon /> },
                    { label: "Integrations", href: "/docs/integrations", description: "IDE and tool integrations", icon: <PuzzleIcon /> },
                  ],
                },
                {
                  title: "Learn More",
                  items: [
                    { label: "Tips & Tricks", href: "/docs/tips-and-tricks", description: "Pro tips and best practices", icon: <LightbulbIcon /> },
                    { label: "Tutorials", href: "/docs/tutorials", description: "Step-by-step guides", icon: <AcademicIcon /> },
                    { label: "Examples", href: "/docs/examples", description: "Real-world code examples", icon: <CodeIcon /> },
                  ],
                },
              ]}
              footer={
                <Link href="/docs" className="text-sm text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                  View all documentation
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              }
            />

            {/* Resources Dropdown */}
            <NavDropdown
              label={t("resources")}
              href="/resources"
              isActive={activePage === "resources"}
              layout="grid"
              sections={[
                {
                  title: "Development",
                  items: [
                    { label: "MCP Servers", href: "/resources/mcp-servers", description: "Model Context Protocol servers", icon: <ServerIcon />, badge: "1,950+" },
                    { label: "Tools & SDKs", href: "/resources/tools", description: "Development utilities", icon: <ToolsIcon /> },
                    { label: "CLAUDE.md Rules", href: "/resources/rules", description: "Project configuration templates", icon: <TemplateIcon /> },
                  ],
                },
                {
                  title: "Learning",
                  items: [
                    { label: "Tutorials", href: "/resources/tutorials", description: "Step-by-step guides", icon: <AcademicIcon /> },
                    { label: "Showcases", href: "/resources/showcases", description: "Example projects", icon: <SparklesIcon /> },
                    { label: "Community", href: "/resources/community", description: "Forums and Discord", icon: <UsersIcon /> },
                  ],
                },
              ]}
              footer={
                <Link href="/resources" className="text-sm text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                  Browse all resources
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              }
            />

            {/* Simple Links */}
            <NavLink label="Playground" href="/playground" isActive={activePage === "playground"} />
            <NavLink label="Stats" href="/stats" isActive={activePage === "stats"} />

            {/* Donate Button */}
            <Link
              href="/donate"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg ml-1",
                "text-sm font-medium",
                "bg-gradient-to-r from-pink-500 to-rose-500",
                "text-white shadow-sm shadow-pink-500/25",
                "hover:shadow-md hover:shadow-pink-500/30 hover:-translate-y-0.5",
                "transition-all duration-200"
              )}
            >
              <HeartIcon />
              <span>Donate</span>
            </Link>

            {/* Divider */}
            <div className="mx-2 h-5 w-px bg-gray-200 dark:bg-[#262626]" />

            {/* Right side utilities - consistent gap */}
            <div className="flex items-center gap-2">
              <UniversalSearch expanded />
              <ThemeToggle />
              <InboxDropdown />
              <NotificationBell />
              <UserMenu />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1">
            <UniversalSearch />
            <ThemeToggle />
            <InboxDropdown />
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
              <Link
                href="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-2",
                  "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
                  "hover:opacity-90"
                )}
              >
                <HeartIcon />
                Support Us
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
