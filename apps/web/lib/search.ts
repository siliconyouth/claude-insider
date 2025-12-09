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
    {
      title: "Troubleshooting",
      description: "Common issues and solutions for Claude Code",
      content:
        "Troubleshooting, common errors, installation problems, authentication issues, network errors, permission denied, debugging tips, FAQ.",
      url: "/docs/getting-started/troubleshooting",
      category: "Getting Started",
    },
    {
      title: "Migration Guide",
      description: "Transitioning to Claude Code from other AI assistants",
      content:
        "Migration, GitHub Copilot, Cursor, Codeium, ChatGPT, transition guide, workflow changes, configuration migration.",
      url: "/docs/getting-started/migration",
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
    {
      title: "Environment Variables",
      description: "Complete reference for Claude Code environment variables",
      content:
        "Environment variables, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, configuration, shell profile, direnv, secrets management.",
      url: "/docs/configuration/environment",
      category: "Configuration",
    },
    {
      title: "Permissions & Security",
      description: "Configure Claude Code permissions for safe operation",
      content:
        "Permissions, security, auto-approve, tool permissions, bash commands, file access, network access, git operations, safety.",
      url: "/docs/configuration/permissions",
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
    {
      title: "Advanced Prompting",
      description: "Advanced prompting techniques for Claude Code",
      content:
        "Advanced prompting, chain of thought, meta-prompting, system prompts, role-based prompting, structured output, reasoning.",
      url: "/docs/tips-and-tricks/advanced-prompting",
      category: "Tips & Tricks",
    },
    {
      title: "Debugging",
      description: "Debugging techniques with Claude Code",
      content:
        "Debugging, error analysis, stack traces, reproduction, bug hunting, binary search, git bisect, logging, troubleshooting.",
      url: "/docs/tips-and-tricks/debugging",
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
    {
      title: "Streaming",
      description: "Implement real-time streaming responses",
      content:
        "Streaming, SSE, server-sent events, real-time, progressive rendering, cancellation, React hooks, async iteration.",
      url: "/docs/api/streaming",
      category: "API",
    },
    {
      title: "Error Handling",
      description: "Handle API errors gracefully",
      content:
        "Error handling, HTTP status codes, retry logic, exponential backoff, rate limit errors, authentication errors, best practices.",
      url: "/docs/api/error-handling",
      category: "API",
    },
    {
      title: "Rate Limits",
      description: "Understand and work within API rate limits",
      content:
        "Rate limits, quotas, tokens per minute, requests per minute, throttling, queuing, optimization, tier limits.",
      url: "/docs/api/rate-limits",
      category: "API",
    },
    {
      title: "Models",
      description: "Compare and select Claude models",
      content:
        "Models, Claude Opus, Claude Sonnet, Claude Haiku, model selection, comparison, pricing, performance, capabilities.",
      url: "/docs/api/models",
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
    {
      title: "GitHub Actions",
      description: "Automate workflows with Claude Code in CI/CD",
      content:
        "GitHub Actions, CI/CD, automation, code review, documentation generation, test generation, workflows, pull requests.",
      url: "/docs/integrations/github-actions",
      category: "Integrations",
    },
    {
      title: "Docker",
      description: "Run Claude Code in containerized environments",
      content:
        "Docker, containers, Dockerfile, docker-compose, Kubernetes, CI/CD, development environment, production deployment.",
      url: "/docs/integrations/docker",
      category: "Integrations",
    },
    {
      title: "Databases",
      description: "Connect Claude Code to databases via MCP",
      content:
        "Databases, PostgreSQL, MySQL, SQLite, MongoDB, Redis, MCP servers, queries, schema exploration, data analysis.",
      url: "/docs/integrations/databases",
      category: "Integrations",
    },

    // Tutorials
    {
      title: "Tutorials",
      description: "Step-by-step tutorials for common development workflows",
      content:
        "Tutorials, guides, code review, documentation generation, test generation, workflows, best practices.",
      url: "/docs/tutorials",
      category: "Tutorials",
    },
    {
      title: "Code Review",
      description: "Automated code review with Claude",
      content:
        "Code review, automated review, security audit, performance review, bug detection, pull request review, best practices.",
      url: "/docs/tutorials/code-review",
      category: "Tutorials",
    },
    {
      title: "Documentation Generation",
      description: "Auto-generate comprehensive documentation",
      content:
        "Documentation generation, README, API docs, JSDoc, docstrings, architecture docs, user guides, automated documentation.",
      url: "/docs/tutorials/documentation-generation",
      category: "Tutorials",
    },
    {
      title: "Test Generation",
      description: "Generate comprehensive test suites with Claude",
      content:
        "Test generation, unit tests, integration tests, Jest, pytest, testing library, mocking, test coverage, TDD.",
      url: "/docs/tutorials/test-generation",
      category: "Tutorials",
    },

    // Examples
    {
      title: "Examples",
      description: "Real-world examples and case studies",
      content:
        "Examples, case studies, real-world projects, workflows, web development, API development, automation.",
      url: "/docs/examples",
      category: "Examples",
    },
    {
      title: "Real-World Projects",
      description: "Case studies of Claude Code in production",
      content:
        "Real-world projects, case studies, e-commerce API, CLI tools, component library, data pipeline, production, success stories.",
      url: "/docs/examples/real-world-projects",
      category: "Examples",
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
