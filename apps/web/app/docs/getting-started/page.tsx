import Link from "next/link";
import { Header } from "@/components/header";

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen">
      <Header activePage="getting-started" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              <div className="text-sm font-semibold text-gray-300 mb-4">
                Getting Started
              </div>
              <Link
                href="/docs/getting-started"
                className="block px-3 py-2 text-sm text-orange-400 bg-orange-500/10 rounded-lg"
              >
                Introduction
              </Link>
              <Link
                href="/docs/getting-started/installation"
                className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Installation
              </Link>
              <Link
                href="/docs/getting-started/quickstart"
                className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Quick Start
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
              <Link href="/docs" className="hover:text-white transition-colors">
                Docs
              </Link>
              <span>/</span>
              <span className="text-white">Getting Started</span>
            </nav>

            <article className="prose prose-invert prose-orange max-w-none">
              <h1 className="text-4xl font-bold mb-6">
                Introduction to Claude AI
              </h1>

              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Claude is an AI assistant created by Anthropic designed to be
                helpful, harmless, and honest. This guide will help you get
                started with Claude AI and Claude Code, Anthropic&apos;s
                official CLI tool.
              </p>

              <h2 className="text-2xl font-semibold mt-12 mb-4">
                What is Claude?
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                Claude is a family of large language models developed by
                Anthropic. It excels at a wide variety of tasks including:
              </p>
              <ul className="space-y-2 text-gray-300 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>
                    Writing and editing code across multiple languages
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Analyzing and explaining complex topics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Creative writing and brainstorming</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Research and data analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Task automation and workflow optimization</span>
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mt-12 mb-4">
                What is Claude Code?
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                Claude Code is Anthropic&apos;s official command-line interface
                (CLI) for interacting with Claude. It provides:
              </p>
              <ul className="space-y-2 text-gray-300 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Direct terminal access to Claude AI</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>File system integration for code editing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Project-aware context with CLAUDE.md files</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>
                    Extensibility through MCP servers and custom hooks
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>IDE integrations for VS Code, JetBrains, and more</span>
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mt-12 mb-4">Next Steps</h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                Ready to get started? Follow these guides to set up Claude:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
                <Link
                  href="/docs/getting-started/installation"
                  className="group p-4 rounded-lg border border-gray-800 hover:border-orange-500/50 bg-gray-900/50 hover:bg-gray-900 transition-all"
                >
                  <h3 className="font-semibold group-hover:text-orange-400 transition-colors mb-1">
                    Installation Guide
                  </h3>
                  <p className="text-sm text-gray-400">
                    Install Claude Code on your system
                  </p>
                </Link>
                <Link
                  href="/docs/getting-started/quickstart"
                  className="group p-4 rounded-lg border border-gray-800 hover:border-orange-500/50 bg-gray-900/50 hover:bg-gray-900 transition-all"
                >
                  <h3 className="font-semibold group-hover:text-orange-400 transition-colors mb-1">
                    Quick Start
                  </h3>
                  <p className="text-sm text-gray-400">
                    Your first steps with Claude Code
                  </p>
                </Link>
              </div>
            </article>

            {/* Page Navigation */}
            <div className="flex justify-between mt-16 pt-8 border-t border-gray-800">
              <div></div>
              <Link
                href="/docs/getting-started/installation"
                className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <span>Installation</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-400">
              Claude Insider - Built with Claude Code & Opus 4.5
            </span>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Claude AI
              </a>
              <a
                href="https://github.com/siliconyouth/claude-insider"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
