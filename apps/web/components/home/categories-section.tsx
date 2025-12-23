/**
 * Categories Section
 *
 * Displays documentation categories with links to guides.
 * Extracted for code-splitting to reduce initial bundle size.
 *
 * Performance Impact:
 * - ~8KB of JavaScript moved out of initial bundle
 * - CATEGORIES constant with SVG icons loads on-demand
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";

const CATEGORIES = [
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    description:
      "Installation, setup guides, and your first steps with Claude AI and Claude Code.",
    icon: (
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
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    docs: [
      { title: "Installation", href: "/docs/getting-started/installation" },
      { title: "Quick Start", href: "/docs/getting-started/quickstart" },
      { title: "Troubleshooting", href: "/docs/getting-started/troubleshooting" },
      { title: "Migration Guide", href: "/docs/getting-started/migration" },
    ],
  },
  {
    title: "Configuration",
    href: "/docs/configuration",
    description:
      "CLAUDE.md files, settings, environment setup, and customization options.",
    icon: (
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
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    docs: [
      { title: "CLAUDE.md", href: "/docs/configuration/claude-md" },
      { title: "Settings", href: "/docs/configuration/settings" },
      { title: "Environment Variables", href: "/docs/configuration/environment" },
      { title: "Permissions & Security", href: "/docs/configuration/permissions" },
    ],
  },
  {
    title: "Tips & Tricks",
    href: "/docs/tips-and-tricks",
    description:
      "Productivity hacks, prompting strategies, and best practices for Claude AI.",
    icon: (
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
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
    docs: [
      { title: "Productivity", href: "/docs/tips-and-tricks/productivity" },
      { title: "Prompting", href: "/docs/tips-and-tricks/prompting" },
      { title: "Advanced Prompting", href: "/docs/tips-and-tricks/advanced-prompting" },
      { title: "Debugging", href: "/docs/tips-and-tricks/debugging" },
    ],
  },
  {
    title: "API Reference",
    href: "/docs/api",
    description:
      "Claude API documentation, SDK usage, tool use, and code examples.",
    icon: (
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
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
    docs: [
      { title: "Authentication", href: "/docs/api/authentication" },
      { title: "Tool Use", href: "/docs/api/tool-use" },
      { title: "Streaming", href: "/docs/api/streaming" },
      { title: "Error Handling", href: "/docs/api/error-handling" },
      { title: "Rate Limits", href: "/docs/api/rate-limits" },
      { title: "Models", href: "/docs/api/models" },
    ],
  },
  {
    title: "Integrations",
    href: "/docs/integrations",
    description:
      "MCP servers, IDE plugins, hooks, slash commands, and third-party tools.",
    icon: (
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
          d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
        />
      </svg>
    ),
    docs: [
      { title: "MCP Servers", href: "/docs/integrations/mcp-servers" },
      { title: "IDE Plugins", href: "/docs/integrations/ide-plugins" },
      { title: "Hooks", href: "/docs/integrations/hooks" },
      { title: "GitHub Actions", href: "/docs/integrations/github-actions" },
      { title: "Docker", href: "/docs/integrations/docker" },
      { title: "Databases", href: "/docs/integrations/databases" },
    ],
  },
  {
    title: "Tutorials",
    href: "/docs/tutorials",
    description:
      "Step-by-step guides for code review, documentation, and test generation.",
    icon: (
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
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    docs: [
      { title: "Code Review", href: "/docs/tutorials/code-review" },
      { title: "Documentation Generation", href: "/docs/tutorials/documentation-generation" },
      { title: "Test Generation", href: "/docs/tutorials/test-generation" },
    ],
  },
  {
    title: "Examples",
    href: "/docs/examples",
    description:
      "Real-world projects and case studies showcasing Claude Code in action.",
    icon: (
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
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    docs: [
      { title: "Real-World Projects", href: "/docs/examples/real-world-projects" },
    ],
  },
];

const ACCENT_COLORS = [
  { bg: "from-yellow-500/10 to-orange-500/10", border: "group-hover:border-yellow-500/50", text: "text-yellow-600 dark:text-yellow-400", glow: "group-hover:shadow-yellow-500/20" },
  { bg: "from-violet-500/10 to-purple-500/10", border: "group-hover:border-violet-500/50", text: "text-violet-600 dark:text-violet-400", glow: "group-hover:shadow-violet-500/20" },
  { bg: "from-cyan-500/10 to-blue-500/10", border: "group-hover:border-cyan-500/50", text: "text-cyan-600 dark:text-cyan-400", glow: "group-hover:shadow-cyan-500/20" },
  { bg: "from-blue-500/10 to-indigo-500/10", border: "group-hover:border-blue-500/50", text: "text-blue-600 dark:text-blue-400", glow: "group-hover:shadow-blue-500/20" },
  { bg: "from-emerald-500/10 to-teal-500/10", border: "group-hover:border-emerald-500/50", text: "text-emerald-600 dark:text-emerald-400", glow: "group-hover:shadow-emerald-500/20" },
  { bg: "from-pink-500/10 to-rose-500/10", border: "group-hover:border-pink-500/50", text: "text-pink-600 dark:text-pink-400", glow: "group-hover:shadow-pink-500/20" },
  { bg: "from-slate-500/10 to-gray-500/10", border: "group-hover:border-slate-500/50", text: "text-slate-600 dark:text-slate-400", glow: "group-hover:shadow-slate-500/20" },
];

export function CategoriesSection() {
  return (
    <div className="relative border-t border-gray-200 dark:border-[#1a1a1a]">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10 border border-violet-500/20 text-sm font-medium text-violet-600 dark:text-violet-400 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            34 Documentation Pages
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Explore the{" "}
            <span className="gradient-text-stripe">Documentation</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Comprehensive guides organized into 7 categories, from getting started to advanced API integration
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {CATEGORIES.map((category, index) => {
            const accent = ACCENT_COLORS[index % ACCENT_COLORS.length]!;

            return (
              <div
                key={category.title}
                className={cn(
                  "group relative rounded-2xl overflow-hidden",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "shadow-sm hover:shadow-xl",
                  accent.border,
                  accent.glow,
                  "hover:-translate-y-1",
                  "transition-all duration-300",
                  "animate-fade-in-up"
                )}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* Card number indicator */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center text-xs font-bold text-gray-400 dark:text-gray-600">
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <Link href={category.href} className="block">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        "bg-gradient-to-br",
                        accent.bg,
                        accent.text,
                        "group-hover:scale-110",
                        "transition-all duration-300"
                      )}>
                        {category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "text-lg font-bold text-gray-900 dark:text-white",
                          "group-hover:text-transparent group-hover:bg-clip-text",
                          "group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:via-blue-600 group-hover:to-cyan-600",
                          "transition-all duration-300"
                        )}>
                          {category.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {category.docs.length} {category.docs.length === 1 ? 'guide' : 'guides'}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-5">
                      {category.description}
                    </p>
                  </Link>

                  {/* Doc Links */}
                  <div className="border-t border-gray-100 dark:border-[#1a1a1a] pt-4">
                    <ul className="space-y-2.5">
                      {category.docs.slice(0, 4).map((doc) => (
                        <li key={doc.href}>
                          <Link
                            href={doc.href}
                            className={cn(
                              "group/link flex items-center gap-3 text-sm",
                              "text-gray-600 dark:text-gray-400",
                              "hover:text-gray-900 dark:hover:text-white",
                              "transition-colors duration-200"
                            )}
                          >
                            <span className={cn(
                              "flex-shrink-0 w-1.5 h-1.5 rounded-full",
                              "bg-gray-300 dark:bg-gray-600",
                              "group-hover/link:bg-gradient-to-r group-hover/link:from-violet-500 group-hover/link:to-cyan-500",
                              "transition-all duration-200"
                            )} />
                            <span className="truncate">{doc.title}</span>
                            <svg
                              className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200 text-blue-500 dark:text-cyan-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </li>
                      ))}
                      {category.docs.length > 4 && (
                        <li>
                          <Link
                            href={category.href}
                            className="text-sm font-medium text-blue-600 dark:text-cyan-400 hover:underline"
                          >
                            +{category.docs.length - 4} more
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Hover gradient border effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 blur-sm" />
                </div>
              </div>
            );
          })}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Link
            href="/docs"
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl",
              "text-sm font-semibold",
              "border-2 border-gray-200 dark:border-[#333]",
              "text-gray-700 dark:text-gray-300",
              "bg-white dark:bg-[#111111]",
              "hover:border-blue-500/50 hover:bg-blue-500/5",
              "hover:-translate-y-0.5 hover:shadow-lg",
              "transition-all duration-200"
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View All Documentation
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
