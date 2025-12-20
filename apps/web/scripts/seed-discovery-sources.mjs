import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Discovery sources to seed
const sources = [
  // Awesome Lists
  {
    name: 'Awesome MCP Servers',
    description: 'Curated list of MCP (Model Context Protocol) servers for Claude AI',
    type: 'awesome_list',
    url: 'https://github.com/punkpeye/awesome-mcp-servers',
    github_config: { owner: 'punkpeye', repo: 'awesome-mcp-servers', branch: 'main', path: 'README.md' },
    awesome_config: { sections: ['Servers', 'Tools', 'Frameworks'] },
    default_category: 'mcp-servers',
    default_tags: ['mcp', 'servers', 'claude'],
    scan_frequency: 'weekly',
    min_stars: 10
  },
  {
    name: 'Awesome LLM Apps',
    description: 'Collection of awesome LLM apps built with RAG and AI agents',
    type: 'awesome_list',
    url: 'https://github.com/Shubhamsaboo/awesome-llm-apps',
    github_config: { owner: 'Shubhamsaboo', repo: 'awesome-llm-apps', branch: 'main', path: 'README.md' },
    awesome_config: { sections: ['RAG', 'Agents', 'Apps'] },
    default_category: 'agents',
    default_tags: ['llm', 'agents', 'rag', 'apps'],
    scan_frequency: 'weekly',
    min_stars: 50
  },
  {
    name: 'Awesome ChatGPT Prompts',
    description: 'Curated list of prompts for ChatGPT and other LLMs',
    type: 'awesome_list',
    url: 'https://github.com/f/awesome-chatgpt-prompts',
    github_config: { owner: 'f', repo: 'awesome-chatgpt-prompts', branch: 'main', path: 'README.md' },
    awesome_config: { sections: ['Prompts'] },
    default_category: 'prompts',
    default_tags: ['prompts', 'chatgpt', 'llm'],
    scan_frequency: 'monthly',
    min_stars: 100
  },
  {
    name: 'Awesome Cursor Rules',
    description: 'Collection of cursor rules and CLAUDE.md configurations',
    type: 'awesome_list',
    url: 'https://github.com/PatrickJS/awesome-cursorrules',
    github_config: { owner: 'PatrickJS', repo: 'awesome-cursorrules', branch: 'main', path: 'README.md' },
    awesome_config: { sections: ['Rules', 'Frameworks', 'Languages'] },
    default_category: 'rules',
    default_tags: ['cursor', 'rules', 'claude-md'],
    scan_frequency: 'weekly',
    min_stars: 5
  },
  {
    name: 'Awesome AI Agents',
    description: 'Curated list of AI agents and autonomous systems',
    type: 'awesome_list',
    url: 'https://github.com/e2b-dev/awesome-ai-agents',
    github_config: { owner: 'e2b-dev', repo: 'awesome-ai-agents', branch: 'main', path: 'README.md' },
    awesome_config: { sections: ['Agents', 'Frameworks', 'Tools'] },
    default_category: 'agents',
    default_tags: ['ai-agents', 'autonomous', 'frameworks'],
    scan_frequency: 'weekly',
    min_stars: 20
  },

  // GitHub Organization
  {
    name: 'Anthropic Official Repos',
    description: 'Official Anthropic GitHub repositories',
    type: 'github_repo',
    url: 'https://github.com/anthropics',
    github_config: { owner: 'anthropics' },
    default_category: 'official',
    default_tags: ['anthropic', 'official', 'claude'],
    scan_frequency: 'daily',
    auto_approve: true,
    min_stars: 0
  },
  {
    name: 'Model Context Protocol Org',
    description: 'Official MCP GitHub organization',
    type: 'github_repo',
    url: 'https://github.com/modelcontextprotocol',
    github_config: { owner: 'modelcontextprotocol' },
    default_category: 'mcp-servers',
    default_tags: ['mcp', 'official', 'protocol'],
    scan_frequency: 'daily',
    auto_approve: true,
    min_stars: 0
  },

  // GitHub Topic Searches
  {
    name: 'GitHub Topic: Claude',
    description: 'GitHub repositories tagged with claude topic',
    type: 'github_search',
    url: 'https://github.com/topics/claude',
    github_config: { searchQuery: 'topic:claude', topics: ['claude'] },
    default_category: 'tools',
    default_tags: ['claude', 'github'],
    scan_frequency: 'weekly',
    min_stars: 50
  },
  {
    name: 'GitHub Topic: Anthropic',
    description: 'GitHub repositories tagged with anthropic topic',
    type: 'github_search',
    url: 'https://github.com/topics/anthropic',
    github_config: { searchQuery: 'topic:anthropic', topics: ['anthropic'] },
    default_category: 'tools',
    default_tags: ['anthropic', 'github'],
    scan_frequency: 'weekly',
    min_stars: 30
  },
  {
    name: 'GitHub Topic: MCP Server',
    description: 'GitHub repositories tagged with mcp-server topic',
    type: 'github_search',
    url: 'https://github.com/topics/mcp-server',
    github_config: { searchQuery: 'topic:mcp-server OR topic:model-context-protocol', topics: ['mcp-server', 'model-context-protocol'] },
    default_category: 'mcp-servers',
    default_tags: ['mcp', 'servers'],
    scan_frequency: 'weekly',
    min_stars: 10
  },
  {
    name: 'GitHub Search: Claude Code Extensions',
    description: 'VS Code and IDE extensions for Claude',
    type: 'github_search',
    url: 'https://github.com/search?q=claude+vscode+extension',
    github_config: { searchQuery: 'claude vscode extension OR claude ide plugin' },
    default_category: 'tools',
    default_tags: ['vscode', 'extension', 'ide'],
    scan_frequency: 'weekly',
    min_stars: 20
  },

  // npm Registry
  {
    name: 'npm: @anthropic-ai scope',
    description: 'Official Anthropic npm packages',
    type: 'npm',
    url: 'https://www.npmjs.com/org/anthropic-ai',
    registry_config: { scope: '@anthropic-ai' },
    default_category: 'sdks',
    default_tags: ['npm', 'sdk', 'official'],
    scan_frequency: 'daily',
    auto_approve: true,
    min_downloads: 0
  },
  {
    name: 'npm: Claude packages',
    description: 'npm packages related to Claude AI',
    type: 'npm',
    url: 'https://www.npmjs.com/search?q=claude%20anthropic',
    registry_config: { searchQuery: 'claude anthropic', keywords: ['claude', 'anthropic', 'ai'] },
    default_category: 'sdks',
    default_tags: ['npm', 'sdk', 'claude'],
    scan_frequency: 'weekly',
    min_downloads: 100
  },
  {
    name: 'npm: MCP packages',
    description: 'npm packages for Model Context Protocol',
    type: 'npm',
    url: 'https://www.npmjs.com/search?q=mcp%20model%20context%20protocol',
    registry_config: { searchQuery: 'mcp model context protocol', keywords: ['mcp', 'model-context-protocol'] },
    default_category: 'mcp-servers',
    default_tags: ['npm', 'mcp', 'sdk'],
    scan_frequency: 'weekly',
    min_downloads: 50
  },

  // PyPI Registry
  {
    name: 'PyPI: anthropic package',
    description: 'Official Anthropic Python SDK',
    type: 'pypi',
    url: 'https://pypi.org/project/anthropic/',
    registry_config: { searchQuery: 'anthropic' },
    default_category: 'sdks',
    default_tags: ['pypi', 'python', 'sdk', 'official'],
    scan_frequency: 'daily',
    auto_approve: true,
    min_downloads: 0
  },
  {
    name: 'PyPI: Claude packages',
    description: 'Python packages related to Claude AI',
    type: 'pypi',
    url: 'https://pypi.org/search/?q=claude+anthropic',
    registry_config: { searchQuery: 'claude anthropic', keywords: ['claude', 'anthropic'] },
    default_category: 'sdks',
    default_tags: ['pypi', 'python', 'claude'],
    scan_frequency: 'weekly',
    min_downloads: 100
  },

  // Websites
  {
    name: 'Anthropic Documentation',
    description: 'Official Anthropic API documentation',
    type: 'website',
    url: 'https://docs.anthropic.com',
    default_category: 'official',
    default_tags: ['docs', 'official', 'api'],
    scan_frequency: 'weekly',
    auto_approve: true
  },
  {
    name: 'Cursor Directory',
    description: 'Community cursor rules and configurations',
    type: 'website',
    url: 'https://cursor.directory',
    default_category: 'rules',
    default_tags: ['cursor', 'rules', 'community'],
    scan_frequency: 'weekly',
    min_stars: 0
  },
  {
    name: 'MCP Documentation',
    description: 'Model Context Protocol official documentation',
    type: 'website',
    url: 'https://modelcontextprotocol.io',
    default_category: 'official',
    default_tags: ['mcp', 'docs', 'official'],
    scan_frequency: 'weekly',
    auto_approve: true
  }
];

async function seedSources() {
  console.log('=== SEEDING DISCOVERY SOURCES ===\n');

  let inserted = 0;
  let skipped = 0;

  for (const source of sources) {
    // Check if source already exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM resource_sources WHERE url = $1',
      [source.url]
    );

    if (existing.length > 0) {
      console.log(`⏭️  Skipping (exists): ${source.name}`);
      skipped++;
      continue;
    }

    // Calculate next scan time
    const nextScan = source.scan_frequency === 'manual' ? null : new Date();

    try {
      await pool.query(`
        INSERT INTO resource_sources (
          name, description, type, url,
          github_config, registry_config, awesome_config,
          default_category, default_tags,
          auto_approve, min_stars, min_downloads,
          scan_frequency, next_scan_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        source.name,
        source.description,
        source.type,
        source.url,
        JSON.stringify(source.github_config || {}),
        JSON.stringify(source.registry_config || {}),
        JSON.stringify(source.awesome_config || {}),
        source.default_category,
        source.default_tags || [],
        source.auto_approve || false,
        source.min_stars || 0,
        source.min_downloads || 0,
        source.scan_frequency || 'weekly',
        nextScan,
        true
      ]);

      console.log(`✅ Added: ${source.name}`);
      inserted++;
    } catch (err) {
      console.log(`❌ Error adding ${source.name}:`, err.message);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total sources: ${sources.length}`);

  // Show final count
  const { rows } = await pool.query('SELECT type, COUNT(*) as count FROM resource_sources GROUP BY type ORDER BY count DESC');
  console.log('\nSources by type:');
  rows.forEach(r => console.log(`  ${r.type}: ${r.count}`));

  await pool.end();
}

seedSources().catch(console.error);
