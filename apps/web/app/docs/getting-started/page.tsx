import Link from "next/link";
import { DocsLayout } from "@/components/docs-layout";

// Navigation structure for sidebar - All 7 categories with 34 pages
// Last updated: 2025-12-09
const navigationConfig = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs/getting-started", active: true },
      { label: "Installation", href: "/docs/getting-started/installation" },
      { label: "Quick Start", href: "/docs/getting-started/quickstart" },
      { label: "Troubleshooting", href: "/docs/getting-started/troubleshooting" },
      { label: "Migration", href: "/docs/getting-started/migration" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Overview", href: "/docs/configuration" },
      { label: "CLAUDE.md", href: "/docs/configuration/claude-md" },
      { label: "Settings", href: "/docs/configuration/settings" },
      { label: "Environment", href: "/docs/configuration/environment" },
      { label: "Permissions", href: "/docs/configuration/permissions" },
    ],
  },
  {
    title: "Tips & Tricks",
    items: [
      { label: "Overview", href: "/docs/tips-and-tricks" },
      { label: "Prompting", href: "/docs/tips-and-tricks/prompting" },
      { label: "Productivity", href: "/docs/tips-and-tricks/productivity" },
      { label: "Advanced Prompting", href: "/docs/tips-and-tricks/advanced-prompting" },
      { label: "Debugging", href: "/docs/tips-and-tricks/debugging" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { label: "Overview", href: "/docs/api" },
      { label: "Authentication", href: "/docs/api/authentication" },
      { label: "Tool Use", href: "/docs/api/tool-use" },
      { label: "Streaming", href: "/docs/api/streaming" },
      { label: "Error Handling", href: "/docs/api/error-handling" },
      { label: "Rate Limits", href: "/docs/api/rate-limits" },
      { label: "Models", href: "/docs/api/models" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Overview", href: "/docs/integrations" },
      { label: "MCP Servers", href: "/docs/integrations/mcp-servers" },
      { label: "IDE Plugins", href: "/docs/integrations/ide-plugins" },
      { label: "Hooks", href: "/docs/integrations/hooks" },
      { label: "GitHub Actions", href: "/docs/integrations/github-actions" },
      { label: "Docker", href: "/docs/integrations/docker" },
      { label: "Databases", href: "/docs/integrations/databases" },
    ],
  },
  {
    title: "Tutorials",
    items: [
      { label: "Overview", href: "/docs/tutorials" },
      { label: "Code Review", href: "/docs/tutorials/code-review" },
      { label: "Documentation Generation", href: "/docs/tutorials/documentation-generation" },
      { label: "Test Generation", href: "/docs/tutorials/test-generation" },
    ],
  },
  {
    title: "Examples",
    items: [
      { label: "Overview", href: "/docs/examples" },
      { label: "Real-World Projects", href: "/docs/examples/real-world-projects" },
    ],
  },
];

export default function GettingStartedPage() {
  return (
    <DocsLayout
      title="Introduction to Claude AI"
      description="Claude is an AI assistant created by Anthropic designed to be helpful, harmless, and honest. This guide will help you get started with Claude AI and Claude Code, Anthropic's official CLI tool."
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Getting Started" },
      ]}
      sidebar={navigationConfig}
      nextPage={{ label: "Installation", href: "/docs/getting-started/installation" }}
    >
      <h2 className="text-2xl font-semibold mt-12 mb-4">What is Claude?</h2>
      <p className="text-gray-300 leading-relaxed mb-6">
        Claude is a family of large language models developed by Anthropic. It
        excels at a wide variety of tasks including:
      </p>
      <ul className="space-y-2 text-gray-300 mb-8">
        <li className="flex items-start gap-3">
          <span className="text-orange-400 mt-1">•</span>
          <span>Writing and editing code across multiple languages</span>
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

      <h2 className="text-2xl font-semibold mt-12 mb-4">What is Claude Code?</h2>
      <p className="text-gray-300 leading-relaxed mb-6">
        Claude Code is Anthropic&apos;s official command-line interface (CLI)
        for interacting with Claude. It provides:
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
          <span>Extensibility through MCP servers and custom hooks</span>
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
    </DocsLayout>
  );
}
