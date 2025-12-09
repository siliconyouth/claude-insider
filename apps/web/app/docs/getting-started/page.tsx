import Link from "next/link";
import { DocsLayout } from "@/components/docs-layout";

// Navigation structure for sidebar (same as in [...slug]/page.tsx)
const navigationConfig = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs/getting-started", active: true },
      { label: "Installation", href: "/docs/getting-started/installation" },
      { label: "Quick Start", href: "/docs/getting-started/quickstart" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Overview", href: "/docs/configuration" },
      { label: "CLAUDE.md", href: "/docs/configuration/claude-md" },
      { label: "Settings", href: "/docs/configuration/settings" },
    ],
  },
  {
    title: "Tips & Tricks",
    items: [
      { label: "Overview", href: "/docs/tips-and-tricks" },
      { label: "Prompting", href: "/docs/tips-and-tricks/prompting" },
      { label: "Productivity", href: "/docs/tips-and-tricks/productivity" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { label: "Overview", href: "/docs/api" },
      { label: "Authentication", href: "/docs/api/authentication" },
      { label: "Tool Use", href: "/docs/api/tool-use" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "Overview", href: "/docs/integrations" },
      { label: "MCP Servers", href: "/docs/integrations/mcp-servers" },
      { label: "IDE Plugins", href: "/docs/integrations/ide-plugins" },
      { label: "Hooks", href: "/docs/integrations/hooks" },
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
