/**
 * MCP Templates Library
 *
 * Provides curated MCP server templates with pre-built configurations.
 * Integrates with the 2,118 MCP servers in the resources database.
 */

import type { MCPConfig } from './schema';

/**
 * Template category for filtering
 */
export type TemplateCategory =
  | 'official'
  | 'database'
  | 'web'
  | 'filesystem'
  | 'cloud'
  | 'ai'
  | 'dev-tools'
  | 'communication'
  | 'data'
  | 'other';

/**
 * Difficulty level
 */
export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * MCP Template with metadata
 */
export interface MCPTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  icon: string;
  packageName?: string;
  config: MCPConfig;
  envVars?: Array<{
    name: string;
    description: string;
    required: boolean;
    example?: string;
  }>;
  documentation?: string;
  featured?: boolean;
  stars?: number;
}

/**
 * Curated official Anthropic MCP server templates
 */
export const OFFICIAL_TEMPLATES: MCPTemplate[] = [
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read and write files, navigate directories',
    category: 'official',
    difficulty: 'beginner',
    icon: '📁',
    packageName: '@modelcontextprotocol/server-filesystem',
    featured: true,
    config: {
      mcpServers: {
        filesystem: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/dir'],
        },
      },
    },
    envVars: [],
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Query and manage PostgreSQL databases',
    category: 'official',
    difficulty: 'intermediate',
    icon: '🐘',
    packageName: '@modelcontextprotocol/server-postgres',
    featured: true,
    config: {
      mcpServers: {
        postgres: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-postgres'],
          env: {
            POSTGRES_URL: '${DATABASE_URL}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'DATABASE_URL',
        description: 'PostgreSQL connection string',
        required: true,
        example: 'postgresql://user:password@localhost:5432/mydb',
      },
    ],
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Work with SQLite databases locally',
    category: 'official',
    difficulty: 'beginner',
    icon: '💾',
    packageName: '@modelcontextprotocol/server-sqlite',
    featured: true,
    config: {
      mcpServers: {
        sqlite: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sqlite', '/path/to/database.db'],
        },
      },
    },
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access repositories, issues, and pull requests',
    category: 'official',
    difficulty: 'intermediate',
    icon: '🐙',
    packageName: '@modelcontextprotocol/server-github',
    featured: true,
    config: {
      mcpServers: {
        github: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_TOKEN: '${GITHUB_TOKEN}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'GITHUB_TOKEN',
        description: 'GitHub personal access token',
        required: true,
        example: 'ghp_xxxxxxxxxxxxxxxxxxxx',
      },
    ],
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Enhanced git operations and repository management',
    category: 'official',
    difficulty: 'beginner',
    icon: '🔀',
    packageName: '@modelcontextprotocol/server-git',
    featured: true,
    config: {
      mcpServers: {
        git: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-git'],
        },
      },
    },
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Interact with Slack workspaces and channels',
    category: 'official',
    difficulty: 'intermediate',
    icon: '💬',
    packageName: '@modelcontextprotocol/server-slack',
    featured: true,
    config: {
      mcpServers: {
        slack: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-slack'],
          env: {
            SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'SLACK_BOT_TOKEN',
        description: 'Slack bot OAuth token',
        required: true,
        example: 'xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx',
      },
    ],
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'Access and manage Google Drive files',
    category: 'official',
    difficulty: 'intermediate',
    icon: '📂',
    packageName: '@modelcontextprotocol/server-gdrive',
    config: {
      mcpServers: {
        gdrive: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-gdrive'],
          env: {
            GOOGLE_APPLICATION_CREDENTIALS: '${GOOGLE_CREDENTIALS_PATH}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'GOOGLE_CREDENTIALS_PATH',
        description: 'Path to Google service account JSON file',
        required: true,
        example: '/path/to/credentials.json',
      },
    ],
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive',
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Browser automation and web scraping',
    category: 'official',
    difficulty: 'intermediate',
    icon: '🎭',
    packageName: '@modelcontextprotocol/server-puppeteer',
    featured: true,
    config: {
      mcpServers: {
        puppeteer: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        },
      },
    },
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Web search using Brave Search API',
    category: 'official',
    difficulty: 'beginner',
    icon: '🦁',
    packageName: '@modelcontextprotocol/server-brave-search',
    config: {
      mcpServers: {
        'brave-search': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-brave-search'],
          env: {
            BRAVE_API_KEY: '${BRAVE_API_KEY}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'BRAVE_API_KEY',
        description: 'Brave Search API key',
        required: true,
        example: 'BSAxxxxxxxxxxxxxxxxxxxx',
      },
    ],
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
  },
  {
    id: 'fetch',
    name: 'Fetch',
    description: 'Fetch web content and convert to markdown',
    category: 'official',
    difficulty: 'beginner',
    icon: '🌐',
    packageName: '@modelcontextprotocol/server-fetch',
    config: {
      mcpServers: {
        fetch: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-fetch'],
        },
      },
    },
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Persistent memory and knowledge graph',
    category: 'official',
    difficulty: 'beginner',
    icon: '🧠',
    packageName: '@modelcontextprotocol/server-memory',
    config: {
      mcpServers: {
        memory: {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-memory'],
        },
      },
    },
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    description: 'Dynamic problem-solving through thought sequences',
    category: 'official',
    difficulty: 'advanced',
    icon: '💭',
    packageName: '@modelcontextprotocol/server-sequential-thinking',
    config: {
      mcpServers: {
        'sequential-thinking': {
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        },
      },
    },
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
  },
];

/**
 * Popular community MCP server templates
 */
export const COMMUNITY_TEMPLATES: MCPTemplate[] = [
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: 'Web scraping and crawling with Firecrawl',
    category: 'web',
    difficulty: 'intermediate',
    icon: '🔥',
    packageName: 'firecrawl-mcp',
    stars: 5133,
    featured: true,
    config: {
      mcpServers: {
        firecrawl: {
          command: 'npx',
          args: ['-y', 'firecrawl-mcp'],
          env: {
            FIRECRAWL_API_KEY: '${FIRECRAWL_API_KEY}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'FIRECRAWL_API_KEY',
        description: 'Firecrawl API key',
        required: true,
      },
    ],
    documentation: 'https://github.com/mendableai/firecrawl-mcp-server',
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description: 'Browser automation with Playwright',
    category: 'web',
    difficulty: 'intermediate',
    icon: '🎪',
    packageName: '@anthropic/mcp-server-playwright',
    featured: true,
    config: {
      mcpServers: {
        playwright: {
          command: 'npx',
          args: ['-y', '@anthropic/mcp-server-playwright'],
        },
      },
    },
    documentation: 'https://github.com/anthropics/mcp-server-playwright',
  },
  {
    id: 'context7',
    name: 'Context7',
    description: 'Up-to-date documentation for any library',
    category: 'dev-tools',
    difficulty: 'beginner',
    icon: '📚',
    packageName: '@context7/mcp-server',
    featured: true,
    config: {
      mcpServers: {
        context7: {
          command: 'npx',
          args: ['-y', '@context7/mcp-server'],
        },
      },
    },
    documentation: 'https://context7.com',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Interact with Supabase projects',
    category: 'database',
    difficulty: 'intermediate',
    icon: '⚡',
    packageName: '@supabase/mcp-server',
    config: {
      mcpServers: {
        supabase: {
          command: 'npx',
          args: ['-y', '@supabase/mcp-server'],
          env: {
            SUPABASE_URL: '${SUPABASE_URL}',
            SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'SUPABASE_URL',
        description: 'Supabase project URL',
        required: true,
      },
      {
        name: 'SUPABASE_ANON_KEY',
        description: 'Supabase anonymous key',
        required: true,
      },
    ],
    documentation: 'https://supabase.com/docs/guides/ai/mcp',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Access and manage Notion workspaces',
    category: 'data',
    difficulty: 'intermediate',
    icon: '📝',
    packageName: '@notionhq/mcp-server',
    config: {
      mcpServers: {
        notion: {
          command: 'npx',
          args: ['-y', '@notionhq/mcp-server'],
          env: {
            NOTION_API_KEY: '${NOTION_API_KEY}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'NOTION_API_KEY',
        description: 'Notion integration token',
        required: true,
      },
    ],
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Manage Linear issues and projects',
    category: 'dev-tools',
    difficulty: 'intermediate',
    icon: '📐',
    packageName: '@linear/mcp-server',
    config: {
      mcpServers: {
        linear: {
          command: 'npx',
          args: ['-y', '@linear/mcp-server'],
          env: {
            LINEAR_API_KEY: '${LINEAR_API_KEY}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'LINEAR_API_KEY',
        description: 'Linear API key',
        required: true,
      },
    ],
  },
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Access Sentry error tracking data',
    category: 'dev-tools',
    difficulty: 'intermediate',
    icon: '🐛',
    packageName: '@sentry/mcp-server',
    config: {
      mcpServers: {
        sentry: {
          command: 'npx',
          args: ['-y', '@sentry/mcp-server'],
          env: {
            SENTRY_AUTH_TOKEN: '${SENTRY_AUTH_TOKEN}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'SENTRY_AUTH_TOKEN',
        description: 'Sentry authentication token',
        required: true,
      },
    ],
  },
  {
    id: 'todoist',
    name: 'Todoist',
    description: 'Manage Todoist tasks and projects',
    category: 'data',
    difficulty: 'beginner',
    icon: '✅',
    packageName: '@doist/mcp-server-todoist',
    config: {
      mcpServers: {
        todoist: {
          command: 'npx',
          args: ['-y', '@doist/mcp-server-todoist'],
          env: {
            TODOIST_API_TOKEN: '${TODOIST_API_TOKEN}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'TODOIST_API_TOKEN',
        description: 'Todoist API token',
        required: true,
      },
    ],
  },
  {
    id: 'raycast',
    name: 'Raycast',
    description: 'Interact with Raycast extensions',
    category: 'dev-tools',
    difficulty: 'intermediate',
    icon: '🚀',
    packageName: '@raycast/mcp-server',
    config: {
      mcpServers: {
        raycast: {
          command: 'npx',
          args: ['-y', '@raycast/mcp-server'],
        },
      },
    },
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Access and manage Airtable bases',
    category: 'data',
    difficulty: 'intermediate',
    icon: '📊',
    packageName: 'mcp-server-airtable',
    config: {
      mcpServers: {
        airtable: {
          command: 'npx',
          args: ['-y', 'mcp-server-airtable'],
          env: {
            AIRTABLE_API_KEY: '${AIRTABLE_API_KEY}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'AIRTABLE_API_KEY',
        description: 'Airtable personal access token',
        required: true,
      },
    ],
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'Interact with AWS services',
    category: 'cloud',
    difficulty: 'advanced',
    icon: '☁️',
    packageName: 'mcp-server-aws',
    config: {
      mcpServers: {
        aws: {
          command: 'npx',
          args: ['-y', 'mcp-server-aws'],
          env: {
            AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID}',
            AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY}',
            AWS_REGION: '${AWS_REGION}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'AWS_ACCESS_KEY_ID',
        description: 'AWS access key ID',
        required: true,
      },
      {
        name: 'AWS_SECRET_ACCESS_KEY',
        description: 'AWS secret access key',
        required: true,
      },
      {
        name: 'AWS_REGION',
        description: 'AWS region',
        required: true,
        example: 'us-east-1',
      },
    ],
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Manage Docker containers and images',
    category: 'dev-tools',
    difficulty: 'intermediate',
    icon: '🐳',
    packageName: 'mcp-server-docker',
    config: {
      mcpServers: {
        docker: {
          command: 'npx',
          args: ['-y', 'mcp-server-docker'],
        },
      },
    },
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Manage Kubernetes clusters',
    category: 'cloud',
    difficulty: 'advanced',
    icon: '⎈',
    packageName: 'mcp-server-kubernetes',
    config: {
      mcpServers: {
        kubernetes: {
          command: 'npx',
          args: ['-y', 'mcp-server-kubernetes'],
        },
      },
    },
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Interact with Redis databases',
    category: 'database',
    difficulty: 'intermediate',
    icon: '🔴',
    packageName: 'mcp-server-redis',
    config: {
      mcpServers: {
        redis: {
          command: 'npx',
          args: ['-y', 'mcp-server-redis'],
          env: {
            REDIS_URL: '${REDIS_URL}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'REDIS_URL',
        description: 'Redis connection URL',
        required: true,
        example: 'redis://localhost:6379',
      },
    ],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    description: 'Query and manage MongoDB databases',
    category: 'database',
    difficulty: 'intermediate',
    icon: '🍃',
    packageName: 'mcp-server-mongodb',
    config: {
      mcpServers: {
        mongodb: {
          command: 'npx',
          args: ['-y', 'mcp-server-mongodb'],
          env: {
            MONGODB_URI: '${MONGODB_URI}',
          },
        },
      },
    },
    envVars: [
      {
        name: 'MONGODB_URI',
        description: 'MongoDB connection URI',
        required: true,
        example: 'mongodb://localhost:27017/mydb',
      },
    ],
  },
];

/**
 * All templates combined
 */
export const ALL_TEMPLATES: MCPTemplate[] = [...OFFICIAL_TEMPLATES, ...COMMUNITY_TEMPLATES];

/**
 * Category metadata for display
 */
export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; icon: string; description: string }> = {
  official: {
    label: 'Official',
    icon: '✨',
    description: 'Official Anthropic MCP servers',
  },
  database: {
    label: 'Database',
    icon: '🗄️',
    description: 'PostgreSQL, SQLite, MongoDB, Redis',
  },
  web: {
    label: 'Web',
    icon: '🌐',
    description: 'Web scraping, browser automation',
  },
  filesystem: {
    label: 'Filesystem',
    icon: '📁',
    description: 'File and directory operations',
  },
  cloud: {
    label: 'Cloud',
    icon: '☁️',
    description: 'AWS, GCP, Kubernetes',
  },
  ai: {
    label: 'AI',
    icon: '🤖',
    description: 'AI and ML integrations',
  },
  'dev-tools': {
    label: 'Dev Tools',
    icon: '🛠️',
    description: 'GitHub, Linear, Sentry, Docker',
  },
  communication: {
    label: 'Communication',
    icon: '💬',
    description: 'Slack, Discord, Email',
  },
  data: {
    label: 'Data',
    icon: '📊',
    description: 'Notion, Airtable, Todoist',
  },
  other: {
    label: 'Other',
    icon: '📦',
    description: 'Miscellaneous servers',
  },
};

/**
 * Search and filter templates
 */
export function searchTemplates(
  query: string,
  options?: {
    category?: TemplateCategory;
    difficulty?: TemplateDifficulty;
    featuredOnly?: boolean;
  }
): MCPTemplate[] {
  let results = ALL_TEMPLATES;

  // Filter by category
  if (options?.category) {
    results = results.filter((t) => t.category === options.category);
  }

  // Filter by difficulty
  if (options?.difficulty) {
    results = results.filter((t) => t.difficulty === options.difficulty);
  }

  // Filter featured only
  if (options?.featuredOnly) {
    results = results.filter((t) => t.featured);
  }

  // Search by query
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.packageName?.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }

  // Sort: featured first, then by stars, then alphabetically
  return results.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    if ((a.stars || 0) !== (b.stars || 0)) return (b.stars || 0) - (a.stars || 0);
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get featured templates
 */
export function getFeaturedTemplates(): MCPTemplate[] {
  return ALL_TEMPLATES.filter((t) => t.featured).sort((a, b) => (b.stars || 0) - (a.stars || 0));
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): MCPTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

/**
 * Generate a config string from a template
 */
export function generateConfigFromTemplate(template: MCPTemplate): string {
  return JSON.stringify(template.config, null, 2);
}

/**
 * Merge multiple templates into a single config
 */
export function mergeTemplateConfigs(templates: MCPTemplate[]): MCPConfig {
  const merged: MCPConfig = { mcpServers: {} };

  for (const template of templates) {
    Object.assign(merged.mcpServers, template.config.mcpServers);
  }

  return merged;
}
