import Fuse from "fuse.js";

export interface SearchDocument {
  title: string;
  description: string;
  content: string;
  url: string;
  category: string;
}

// Build search index from all documentation pages
export function buildSearchIndex(): SearchDocument[] {
  // This is a static list of all documentation pages
  // In a more dynamic setup, this could be generated at build time
  return [
    // Getting Started
    {
      title: "Getting Started",
      description: "Begin your journey with Claude Code",
      content:
        "Introduction to Claude Code, your AI-powered coding companion. Learn how to install, configure, and start using Claude Code in your development workflow.",
      url: "/docs/getting-started",
      category: "Getting Started",
    },
    {
      title: "Installation",
      description: "Install Claude Code on your system",
      content:
        "Install Claude Code using npm, Homebrew, or download directly. System requirements, installation methods, verify installation, authenticate, first run.",
      url: "/docs/getting-started/installation",
      category: "Getting Started",
    },
    {
      title: "Quick Start",
      description: "Get up and running with Claude Code in minutes",
      content:
        "Quick start guide, first session, basic commands, file operations, code generation, debugging, git integration, best practices.",
      url: "/docs/getting-started/quickstart",
      category: "Getting Started",
    },

    // Configuration
    {
      title: "Configuration",
      description: "Customize Claude Code for your workflow",
      content:
        "Configuration overview, settings files, CLAUDE.md, environment variables, project settings, global settings.",
      url: "/docs/configuration",
      category: "Configuration",
    },
    {
      title: "CLAUDE.md Guide",
      description: "Configure project-specific AI instructions",
      content:
        "CLAUDE.md file, project instructions, memory file, context, rules, conventions, workflows, best practices.",
      url: "/docs/configuration/claude-md",
      category: "Configuration",
    },
    {
      title: "Settings",
      description: "All configuration options for Claude Code",
      content:
        "Settings reference, JSON configuration, environment variables, API keys, model selection, permissions, themes, keybindings.",
      url: "/docs/configuration/settings",
      category: "Configuration",
    },

    // Tips & Tricks
    {
      title: "Tips & Tricks",
      description: "Maximize your productivity with Claude AI",
      content:
        "Tips and tricks overview, quick wins, pro tips, file references, git context, chain operations.",
      url: "/docs/tips-and-tricks",
      category: "Tips & Tricks",
    },
    {
      title: "Prompting Strategies",
      description: "Master the art of communicating with Claude",
      content:
        "Prompting techniques, context, constraints, format, chain of thought, role assignment, few-shot examples, structured output.",
      url: "/docs/tips-and-tricks/prompting",
      category: "Tips & Tricks",
    },
    {
      title: "Productivity Hacks",
      description: "Work faster and smarter with Claude Code",
      content:
        "Keyboard shortcuts, slash commands, workflow optimization, session management, automation, daily workflows.",
      url: "/docs/tips-and-tricks/productivity",
      category: "Tips & Tricks",
    },

    // API
    {
      title: "API Reference",
      description: "Complete reference for the Claude API",
      content:
        "API reference, REST API, Messages API, streaming, models, Claude Opus, Claude Sonnet, Claude Haiku, error handling, rate limits.",
      url: "/docs/api",
      category: "API",
    },
    {
      title: "Authentication",
      description: "Secure your Claude API integration",
      content:
        "API authentication, API keys, environment variables, secrets management, security best practices, server-side integration.",
      url: "/docs/api/authentication",
      category: "API",
    },
    {
      title: "Tool Use",
      description: "Enable Claude to interact with external systems",
      content:
        "Tool use, function calling, tool definitions, input schema, tool calls, tool results, streaming, tool choice, best practices.",
      url: "/docs/api/tool-use",
      category: "API",
    },

    // Integrations
    {
      title: "Integrations",
      description: "Connect Claude Code with your development tools",
      content:
        "Integrations overview, MCP servers, IDE plugins, hooks, database access, git integration, CI/CD.",
      url: "/docs/integrations",
      category: "Integrations",
    },
    {
      title: "MCP Servers",
      description: "Extend Claude Code with Model Context Protocol servers",
      content:
        "MCP servers, Model Context Protocol, filesystem server, PostgreSQL, SQLite, Git, GitHub, Slack, Google Drive, custom servers.",
      url: "/docs/integrations/mcp-servers",
      category: "Integrations",
    },
    {
      title: "IDE Plugins",
      description: "Integrate Claude Code into your code editor",
      content:
        "IDE plugins, VS Code extension, JetBrains plugins, Neovim integration, Sublime Text, Emacs, inline chat, code actions.",
      url: "/docs/integrations/ide-plugins",
      category: "Integrations",
    },
    {
      title: "Hooks",
      description: "Automate workflows with Claude Code hooks",
      content:
        "Hooks, pre-tool hooks, post-tool hooks, notification hooks, matchers, environment variables, automation, code quality pipeline.",
      url: "/docs/integrations/hooks",
      category: "Integrations",
    },
  ];
}

// Create a Fuse instance for searching
export function createSearchInstance(documents: SearchDocument[]): Fuse<SearchDocument> {
  return new Fuse(documents, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "description", weight: 0.3 },
      { name: "content", weight: 0.2 },
      { name: "category", weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
  });
}

// Search function
export function search(
  fuse: Fuse<SearchDocument>,
  query: string,
  limit: number = 10
): SearchDocument[] {
  if (!query || query.length < 2) {
    return [];
  }

  const results = fuse.search(query, { limit });
  return results.map((result) => result.item);
}
