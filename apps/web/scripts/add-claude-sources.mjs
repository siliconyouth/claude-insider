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

// New Claude-focused discovery sources
const sources = [
  // Awesome Claude Code Lists
  {
    name: 'Awesome Claude Code (hesreallyhim)',
    description: 'Curated list of awesome Claude Code resources, tips, and tools',
    type: 'awesome_list',
    url: 'https://github.com/hesreallyhim/awesome-claude-code',
    github_config: { owner: 'hesreallyhim', repo: 'awesome-claude-code', branch: 'main', path: 'README.md' },
    awesome_config: { sections: ['Tools', 'Tips', 'Resources', 'Extensions'] },
    default_category: 'tools',
    default_tags: ['claude-code', 'awesome', 'curated'],
    scan_frequency: 'weekly',
    min_stars: 5
  },
  {
    name: 'Awesome Claude (alvinunreal)',
    description: 'Comprehensive collection of Claude AI resources and projects',
    type: 'awesome_list',
    url: 'https://github.com/alvinunreal/awesome-claude',
    github_config: { owner: 'alvinunreal', repo: 'awesome-claude', branch: 'main', path: 'README.md' },
    awesome_config: { sections: ['Projects', 'Tools', 'Resources', 'Tutorials'] },
    default_category: 'tools',
    default_tags: ['claude', 'awesome', 'curated'],
    scan_frequency: 'weekly',
    min_stars: 5
  },
  {
    name: 'Awesome Claude Code (jqueryscript)',
    description: 'Another curated list of Claude Code tools and resources',
    type: 'awesome_list',
    url: 'https://github.com/jqueryscript/awesome-claude-code',
    github_config: { owner: 'jqueryscript', repo: 'awesome-claude-code', branch: 'main', path: 'README.md' },
    awesome_config: { sections: ['Tools', 'Extensions', 'Tutorials'] },
    default_category: 'tools',
    default_tags: ['claude-code', 'awesome', 'curated'],
    scan_frequency: 'weekly',
    min_stars: 5
  },

  // Websites
  {
    name: 'ClaudeLog MCP Directory',
    description: 'Claude Code MCP servers directory on ClaudeLog',
    type: 'website',
    url: 'https://claudelog.com/claude-code-mcps/awesome-claude-code/',
    default_category: 'mcp-servers',
    default_tags: ['mcp', 'directory', 'claude-code'],
    scan_frequency: 'weekly',
    min_stars: 0
  },
  {
    name: 'AwesomeClaude.ai',
    description: 'Community directory of Claude AI tools and resources',
    type: 'website',
    url: 'https://awesomeclaude.ai/',
    default_category: 'tools',
    default_tags: ['claude', 'directory', 'community'],
    scan_frequency: 'weekly',
    min_stars: 0
  },
  {
    name: 'Reddit r/ClaudeAI',
    description: 'Claude AI subreddit - community discussions and tool discoveries',
    type: 'website',
    url: 'https://www.reddit.com/r/ClaudeAI/',
    default_category: 'community',
    default_tags: ['reddit', 'community', 'discussions'],
    scan_frequency: 'weekly',
    min_stars: 0
  },
  {
    name: 'Anthropic Claude Code Best Practices',
    description: 'Official Anthropic engineering blog - Claude Code best practices',
    type: 'website',
    url: 'https://www.anthropic.com/engineering/claude-code-best-practices',
    default_category: 'official',
    default_tags: ['official', 'anthropic', 'best-practices', 'claude-code'],
    scan_frequency: 'weekly',
    auto_approve: true,
    min_stars: 0
  }
];

async function addSources() {
  console.log('=== ADDING CLAUDE-FOCUSED DISCOVERY SOURCES ===\n');

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
        new Date(), // next_scan_at = now (ready for scanning)
        true
      ]);

      console.log(`✅ Added: ${source.name}`);
      console.log(`   ${source.url}`);
      inserted++;
    } catch (err) {
      console.log(`❌ Error adding ${source.name}:`, err.message);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);

  // Show final count by type
  const { rows } = await pool.query(`
    SELECT type, COUNT(*) as count
    FROM resource_sources
    GROUP BY type
    ORDER BY count DESC
  `);
  console.log('\nSources by type:');
  rows.forEach(r => console.log(`  ${r.type}: ${r.count}`));

  // Show total
  const { rows: total } = await pool.query('SELECT COUNT(*) as count FROM resource_sources');
  console.log(`\nTotal sources: ${total[0].count}`);

  await pool.end();
}

addSources().catch(console.error);
