import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const DOCS_SECTIONS = [
  {
    title: "Getting Started",
    href: "/docs/getting-started",
    description: "Begin your journey with Claude AI",
    articles: [
      { title: "Introduction to Claude", href: "/docs/getting-started" },
      {
        title: "Installing Claude Code",
        href: "/docs/getting-started/installation",
      },
      { title: "Quick Start Guide", href: "/docs/getting-started/quickstart" },
    ],
  },
  {
    title: "Configuration",
    href: "/docs/configuration",
    description: "Customize Claude to your needs",
    articles: [
      { title: "CLAUDE.md File", href: "/docs/configuration/claude-md" },
      { title: "Settings & Options", href: "/docs/configuration/settings" },
      {
        title: "Environment Variables",
        href: "/docs/configuration/environment",
      },
    ],
  },
  {
    title: "Tips & Tricks",
    href: "/docs/tips-and-tricks",
    description: "Maximize your productivity",
    articles: [
      {
        title: "Effective Prompting",
        href: "/docs/tips-and-tricks/prompting",
      },
      {
        title: "Productivity Hacks",
        href: "/docs/tips-and-tricks/productivity",
      },
      { title: "Best Practices", href: "/docs/tips-and-tricks/best-practices" },
    ],
  },
  {
    title: "API Reference",
    href: "/docs/api",
    description: "Claude API documentation",
    articles: [
      { title: "API Overview", href: "/docs/api" },
      { title: "Authentication", href: "/docs/api/authentication" },
      { title: "Tool Use", href: "/docs/api/tool-use" },
    ],
  },
  {
    title: "Integrations",
    href: "/docs/integrations",
    description: "Connect Claude with your tools",
    articles: [
      { title: "MCP Servers", href: "/docs/integrations/mcp-servers" },
      { title: "IDE Plugins", href: "/docs/integrations/ide-plugins" },
      { title: "Hooks & Commands", href: "/docs/integrations/hooks" },
    ],
  },
  {
    title: "Tutorials",
    href: "/docs/tutorials",
    description: "Step-by-step development guides",
    articles: [
      { title: "Code Review", href: "/docs/tutorials/code-review" },
      { title: "Documentation Generation", href: "/docs/tutorials/documentation-generation" },
      { title: "Test Generation", href: "/docs/tutorials/test-generation" },
    ],
  },
  {
    title: "Examples",
    href: "/docs/examples",
    description: "Real-world projects and case studies",
    articles: [
      { title: "Examples Overview", href: "/docs/examples" },
      { title: "Real-World Projects", href: "/docs/examples/real-world-projects" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Header activePage="docs" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Everything you need to know about Claude AI, Claude Code, and how to
            get the most out of your AI assistant.
          </p>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {DOCS_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-6"
            >
              <Link href={section.href} className="group">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-orange-400 transition-colors">
                  {section.title}
                </h2>
              </Link>
              <p className="text-gray-400 text-sm mb-4">{section.description}</p>
              <ul className="space-y-2">
                {section.articles.map((article) => (
                  <li key={article.title}>
                    <Link
                      href={article.href}
                      className="text-gray-300 hover:text-orange-400 transition-colors text-sm flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
