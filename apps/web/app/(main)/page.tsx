import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroBackground } from "@/components/hero-background";
import { DeviceShowcase } from "@/components/device-mockups";
import { LazyVoiceAssistantDemo } from "@/components/lazy-voice-assistant-demo";
import { OpenAssistantButton } from "@/components/open-assistant-button";
import { LazyResourcesSection } from "@/components/home/lazy-resources-section";
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

      {/* Hero Section - Full viewport height, Stripe-style left-aligned with device mockups */}
      <main id="main-content">
        <div className="relative isolate overflow-hidden min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] flex flex-col">
          {/* Animated lens flare background */}
          <HeroBackground className="-z-10" />

          {/* Subtle dot pattern overlay - consistent visibility in both themes */}
          <div className="absolute inset-0 -z-10 pattern-dots opacity-[0.15] dark:opacity-[0.08]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 flex-1 flex items-center w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
              {/* Left side - Text content - prioritized for LCP */}
              <div className="animate-fade-in text-left" style={{ contentVisibility: 'visible', containIntrinsicSize: '0 500px' }}>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                  v1.12.1 • 49 Features • 1,950+ Resources • AI Assistant
                </div>

                {/* Headline - Stripe-style large typography */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
                  Master{" "}
                  <span className="gradient-text-stripe">Claude AI</span>
                  <br />
                  development
                </h1>

                {/* Subheadline */}
                <p className="mt-6 text-xl sm:text-2xl leading-relaxed text-gray-700 dark:text-gray-300 max-w-xl">
                  Comprehensive docs, curated resources, and tools for Claude AI.
                  From setup to production-ready applications.
                </p>

                {/* Feature list */}
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Dashboard Charts
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Prompt Library
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    50+ Achievements
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    E2E Encrypted
                  </span>
                </div>

                {/* CTA Buttons */}
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Link
                    href="/docs/getting-started"
                    className={cn(
                      "rounded-xl px-8 py-4 text-base font-semibold text-white",
                      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                      "shadow-lg shadow-blue-500/25",
                      "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                      "hover:shadow-xl hover:shadow-blue-500/30",
                      "hover:-translate-y-0.5",
                      "transition-all duration-200"
                    )}
                  >
                    Getting Started
                  </Link>
                  <Link
                    href="/resources"
                    className={cn(
                      "rounded-xl px-6 py-4 text-base font-semibold",
                      "border-2 border-gray-300 dark:border-[#333]",
                      "text-gray-700 dark:text-gray-300",
                      "bg-white/50 dark:bg-white/5",
                      "hover:border-blue-500/50 hover:bg-blue-500/5",
                      "hover:-translate-y-0.5",
                      "transition-all duration-200",
                      "flex items-center gap-2"
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Browse Resources
                  </Link>
                </div>

                {/* Trust badge */}
                <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                  v1.12.1 • Built with Claude Code • Powered by Claude Opus 4.5 • Open Source
                </p>
              </div>

              {/* Right side - Device mockups */}
              <div className="relative animate-fade-in lg:animate-slide-in-right hidden sm:block">
                <DeviceShowcase className="w-full" />
              </div>
            </div>
          </div>

          {/* Scroll indicator - hints more content below */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden sm:flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
            <span className="text-xs font-medium">Scroll to explore</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Resources Section - lazy loaded for better LCP */}
        <LazyResourcesSection />

        {/* AI Assistant Section - content-visibility for deferred rendering */}
        <div
          className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 dark:from-[#111111]/50 to-transparent"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}
        >
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
                <LazyVoiceAssistantDemo />
              </div>
            </div>
          </div>
        </div>

        {/* Code Playground Section - content-visibility for deferred rendering */}
        <div
          className="border-t border-gray-200 dark:border-[#1a1a1a]"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 700px' }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Info */}
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  Interactive
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  Code{" "}
                  <span className="gradient-text-stripe">Playground</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                  Experiment with code in real-time. Write, run, and share JavaScript, TypeScript, and Python code directly in your browser with AI assistance.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Execute JavaScript, TypeScript & Python
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI assistance to explain and improve code
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Share code snippets via URL
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Claude API examples included
                  </li>
                </ul>
                <Link
                  href="/playground"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold",
                    "bg-gradient-to-r from-emerald-600 to-cyan-600",
                    "text-white shadow-lg shadow-emerald-500/25",
                    "hover:from-emerald-500 hover:to-cyan-500",
                    "hover:shadow-xl hover:shadow-emerald-500/30",
                    "hover:-translate-y-0.5",
                    "transition-all duration-200"
                  )}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Open Playground
                </Link>
              </div>

              {/* Right - Preview */}
              <div className="relative animate-fade-in">
                <div
                  className={cn(
                    "rounded-xl overflow-hidden",
                    "bg-[#1e1e1e] border border-[#3c3c3c]",
                    "shadow-2xl shadow-black/50"
                  )}
                >
                  {/* Editor Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#3c3c3c]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-500/20 text-yellow-400">
                        JavaScript
                      </span>
                      <span className="text-sm text-gray-400">example.js</span>
                    </div>
                    <div className="flex items-center gap-2" aria-hidden="true">
                      <span className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Run
                      </span>
                    </div>
                  </div>

                  {/* Code Area */}
                  <div className="p-4 font-mono text-sm">
                    <pre className="text-gray-300 leading-relaxed">
                      <code>
                        <span className="text-gray-500">{"// Claude API example"}</span>{"\n"}
                        <span className="text-purple-400">const</span>{" "}
                        <span className="text-blue-300">response</span>{" = "}
                        <span className="text-purple-400">await</span>{" "}
                        <span className="text-yellow-300">anthropic</span>
                        <span className="text-white">.messages.</span>
                        <span className="text-yellow-300">create</span>
                        <span className="text-white">({"{"}</span>{"\n"}
                        {"  "}<span className="text-cyan-300">model</span>:{" "}
                        <span className="text-green-400">{'"claude-sonnet-4"'}</span>,{"\n"}
                        {"  "}<span className="text-cyan-300">max_tokens</span>:{" "}
                        <span className="text-orange-400">1024</span>,{"\n"}
                        {"  "}<span className="text-cyan-300">messages</span>:{" "}
                        <span className="text-white">[{"{"}</span>{"\n"}
                        {"    "}<span className="text-cyan-300">role</span>:{" "}
                        <span className="text-green-400">{'"user"'}</span>,{"\n"}
                        {"    "}<span className="text-cyan-300">content</span>:{" "}
                        <span className="text-green-400">{'"Hello!"'}</span>{"\n"}
                        {"  "}<span className="text-white">{"}]"}</span>{"\n"}
                        <span className="text-white">{"});"}</span>
                      </code>
                    </pre>
                  </div>

                  {/* Output Area */}
                  <div className="border-t border-[#3c3c3c] bg-[#1a1a1a] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">Output</span>
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-emerald-500/20 text-emerald-400">
                        Success
                      </span>
                    </div>
                    <pre className="font-mono text-sm text-emerald-400">
                      {"{"} content: {'"Hello! How can I help..."'} {"}"}
                    </pre>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-medium shadow-lg">
                  10+ Examples
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section with Documents - content-visibility for deferred rendering */}
        <div
          className="relative border-t border-gray-200 dark:border-[#1a1a1a]"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 1000px' }}
        >
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
                // Category-specific accent colors
                const accentColors = [
                  { bg: "from-yellow-500/10 to-orange-500/10", border: "group-hover:border-yellow-500/50", text: "text-yellow-600 dark:text-yellow-400", glow: "group-hover:shadow-yellow-500/20" },
                  { bg: "from-violet-500/10 to-purple-500/10", border: "group-hover:border-violet-500/50", text: "text-violet-600 dark:text-violet-400", glow: "group-hover:shadow-violet-500/20" },
                  { bg: "from-cyan-500/10 to-blue-500/10", border: "group-hover:border-cyan-500/50", text: "text-cyan-600 dark:text-cyan-400", glow: "group-hover:shadow-cyan-500/20" },
                  { bg: "from-blue-500/10 to-indigo-500/10", border: "group-hover:border-blue-500/50", text: "text-blue-600 dark:text-blue-400", glow: "group-hover:shadow-blue-500/20" },
                  { bg: "from-emerald-500/10 to-teal-500/10", border: "group-hover:border-emerald-500/50", text: "text-emerald-600 dark:text-emerald-400", glow: "group-hover:shadow-emerald-500/20" },
                  { bg: "from-pink-500/10 to-rose-500/10", border: "group-hover:border-pink-500/50", text: "text-pink-600 dark:text-pink-400", glow: "group-hover:shadow-pink-500/20" },
                  { bg: "from-slate-500/10 to-gray-500/10", border: "group-hover:border-slate-500/50", text: "text-slate-600 dark:text-slate-400", glow: "group-hover:shadow-slate-500/20" },
                ];
                const accent = accentColors[index % accentColors.length]!;

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

        {/* Highlights Section */}
        <div className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#111111]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-xl font-semibold text-center mb-10 text-gray-900 dark:text-white">
              Built for the <span className="gradient-text-stripe">Modern Developer</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {/* Claude Opus 4.5 */}
              <div className="group text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-violet-500/20 group-hover:to-blue-500/20 transition-all duration-300">
                  <svg className="w-6 h-6 text-violet-500 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Claude Opus 4.5</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI-Powered</div>
              </div>

              {/* E2EE Messaging */}
              <div className="group text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-emerald-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
                  <svg className="w-6 h-6 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">E2EE Messaging</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Matrix Protocol</div>
              </div>

              {/* 42 AI Voices */}
              <div className="group text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
                  <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">42 AI Voices</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">ElevenLabs TTS</div>
              </div>

              {/* 1,952+ Resources */}
              <div className="group text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-all duration-300">
                  <svg className="w-6 h-6 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">1,952+</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Curated Resources</div>
              </div>

              {/* Open Source */}
              <div className="group text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500/10 to-slate-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-gray-500/20 group-hover:to-slate-500/20 transition-all duration-300">
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Open Source</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">MIT License</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
