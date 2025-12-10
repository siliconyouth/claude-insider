import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { VoiceAssistantDemo } from "@/components/voice-assistant-demo";
import { OpenAssistantButton } from "@/components/open-assistant-button";
import { HeroBackground } from "@/components/hero-background";
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header activePage="home" />

      {/* Hero Section */}
      <main id="main-content">
        <div className="relative isolate overflow-hidden min-h-[600px]">
          {/* Animated lens flare background */}
          <HeroBackground className="-z-10" />

          {/* Subtle dot pattern overlay */}
          <div className="absolute inset-0 -z-10 pattern-dots opacity-30 dark:opacity-20" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center animate-fade-in">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl gradient-text-stripe">
                Claude Insider
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Your comprehensive resource for Claude AI documentation, tips,
                tricks, configuration guides, and setup instructions.
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                Built entirely with Claude Code powered by Claude Opus 4.5
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/docs/getting-started"
                  className={cn(
                    "rounded-lg px-6 py-3 text-sm font-semibold text-white",
                    "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                    "shadow-lg shadow-blue-500/25",
                    "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                    "hover:shadow-xl hover:shadow-blue-500/30",
                    "hover:-translate-y-0.5",
                    "transition-all duration-200"
                  )}
                >
                  Get Started
                </Link>
                <Link
                  href="/docs"
                  className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Browse Docs <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Section */}
        <div className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 dark:from-[#111111]/50 to-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-sm mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  New Feature
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  Meet the Claude Insider{" "}
                  <span className="gradient-text-stripe">
                    AI Assistant
                  </span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                  Ask questions about Claude AI using voice or text. Get instant answers powered by Claude with premium text-to-speech responses from ElevenLabs.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Voice input with Web Speech API
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Premium voices powered by ElevenLabs
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Powered by Claude Sonnet 4 (claude-sonnet-4-20250514)
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Export conversations to clipboard
                  </li>
                </ul>
                <OpenAssistantButton />
              </div>
              <div className="relative animate-fade-in">
                <VoiceAssistantDemo />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section with Documents */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Explore Documentation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            34 comprehensive guides covering everything from installation to advanced API usage
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {CATEGORIES.map((category, index) => (
              <div
                key={category.title}
                className={cn(
                  "group relative rounded-xl p-6",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "shadow-sm",
                  "hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10",
                  "hover:-translate-y-1",
                  "transition-all duration-300",
                  "animate-fade-in-up"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link href={category.href} className="block mb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      "bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10",
                      "text-blue-600 dark:text-cyan-400",
                      "group-hover:from-violet-500/20 group-hover:via-blue-500/20 group-hover:to-cyan-500/20 group-hover:scale-110",
                      "transition-all duration-300"
                    )}>
                      {category.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                      {category.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{category.description}</p>
                </Link>
                <div className="border-t border-gray-200 dark:border-[#262626] pt-4">
                  <ul className="space-y-2">
                    {category.docs.map((doc) => (
                      <li key={doc.href}>
                        <Link
                          href={doc.href}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3 h-3 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {doc.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="group">
                <div className="text-3xl font-bold gradient-text-stripe group-hover:scale-110 transition-transform">34</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                  Documentation Pages
                </div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold gradient-text-stripe group-hover:scale-110 transition-transform">7</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                  Categories
                </div>
              </div>
              <div className="group">
                <div className="text-3xl font-bold gradient-text-stripe group-hover:scale-110 transition-transform">100%</div>
                <div className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                  Built with Claude
                </div>
              </div>
              <div className="group">
                <div className="text-2xl sm:text-3xl font-bold gradient-text-stripe group-hover:scale-110 transition-transform">
                  Open Source
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Free forever</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Quick Links
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/changelog"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-600 dark:text-gray-400",
                "bg-white dark:bg-[#111111]",
                "hover:text-blue-600 dark:hover:text-cyan-400",
                "hover:border-blue-500/50",
                "hover:-translate-y-0.5 hover:shadow-md",
                "transition-all duration-200"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Changelog
            </Link>
            <Link
              href="/feed.xml"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-600 dark:text-gray-400",
                "bg-white dark:bg-[#111111]",
                "hover:text-blue-600 dark:hover:text-cyan-400",
                "hover:border-blue-500/50",
                "hover:-translate-y-0.5 hover:shadow-md",
                "transition-all duration-200"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
              RSS Feed
            </Link>
            <a
              href="https://github.com/siliconyouth/claude-insider"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-600 dark:text-gray-400",
                "bg-white dark:bg-[#111111]",
                "hover:text-blue-600 dark:hover:text-cyan-400",
                "hover:border-blue-500/50",
                "hover:-translate-y-0.5 hover:shadow-md",
                "transition-all duration-200"
              )}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
            <a
              href="https://docs.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-600 dark:text-gray-400",
                "bg-white dark:bg-[#111111]",
                "hover:text-blue-600 dark:hover:text-cyan-400",
                "hover:border-blue-500/50",
                "hover:-translate-y-0.5 hover:shadow-md",
                "transition-all duration-200"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Official Docs
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
