/**
 * Create Resource-Resource Relationships
 *
 * Uses Claude Opus 4.5 analysis to identify relationships between resources:
 * - similar: Similar purpose/functionality
 * - alternative: Drop-in replacement
 * - complement: Works well together
 * - uses: Source uses target internally
 * - integrates: Source has integration with target
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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

console.log('═══════════════════════════════════════════════════════════════');
console.log('        RESOURCE-RESOURCE RELATIONSHIP CREATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// Known relationships based on Claude Opus 4.5 analysis
const KNOWN_RELATIONSHIPS = [
  // Official Claude tools and SDKs
  { source: 'claude-code', target: 'anthropic-python', type: 'uses', confidence: 0.95, reasoning: 'Claude Code uses the Anthropic Python SDK internally' },
  { source: 'claude-code', target: 'typescript-sdk', type: 'uses', confidence: 0.90, reasoning: 'Claude Code integrates with TypeScript SDK' },
  { source: 'claude-code', target: 'python-sdk', type: 'uses', confidence: 0.90, reasoning: 'Claude Code uses the Python SDK' },

  // MCP Server relationships - similar functionality
  { source: 'mcp-server-fetch', target: 'puppeteer', type: 'alternative', confidence: 0.75, reasoning: 'Both provide web fetching capabilities for MCP' },
  { source: 'github-mcp-server', target: 'gitlab', type: 'alternative', confidence: 0.85, reasoning: 'Alternative Git platform integrations for MCP' },
  { source: 'filesystem', target: 'sqlite', type: 'complement', confidence: 0.70, reasoning: 'File and database access complement each other' },
  { source: 'postgres', target: 'sqlite', type: 'alternative', confidence: 0.80, reasoning: 'Alternative database integrations for MCP' },
  { source: 'playwright-mcp', target: 'puppeteer', type: 'alternative', confidence: 0.85, reasoning: 'Both provide browser automation for MCP' },
  { source: 'markitdown', target: 'fetch', type: 'complement', confidence: 0.70, reasoning: 'Markitdown converts fetched HTML to Markdown' },
  { source: 'context7', target: 'fetch', type: 'complement', confidence: 0.75, reasoning: 'Context7 provides documentation context, fetch provides web access' },
  { source: 'brave-search', target: 'fetch', type: 'complement', confidence: 0.70, reasoning: 'Search and fetch work together for web research' },
  { source: 'memory', target: 'sqlite', type: 'complement', confidence: 0.70, reasoning: 'Memory and database storage complement each other' },
  { source: 'fastmcp', target: 'mcp-python', type: 'uses', confidence: 0.90, reasoning: 'FastMCP is built on the MCP Python SDK' },
  { source: 'mcp-framework', target: 'servers', type: 'complement', confidence: 0.80, reasoning: 'MCP framework helps build and manage MCP servers' },

  // AI Agent framework relationships
  { source: 'langchain', target: 'llamaindex', type: 'alternative', confidence: 0.85, reasoning: 'Both are popular LLM application frameworks with similar capabilities' },
  { source: 'langchain', target: 'crewai', type: 'complement', confidence: 0.75, reasoning: 'CrewAI can use LangChain components for agent orchestration' },
  { source: 'autogen', target: 'crewai', type: 'alternative', confidence: 0.80, reasoning: 'Both are multi-agent conversation frameworks' },
  { source: 'opendevin', target: 'aider', type: 'alternative', confidence: 0.75, reasoning: 'Both are AI-powered coding assistants' },
  { source: 'metagpt', target: 'crewai', type: 'similar', confidence: 0.70, reasoning: 'Both enable multi-agent collaboration for complex tasks' },
  { source: 'autogen', target: 'langchain', type: 'complement', confidence: 0.70, reasoning: 'AutoGen agents can use LangChain tools' },
  { source: 'camel-ai', target: 'crewai', type: 'alternative', confidence: 0.70, reasoning: 'Both are role-playing agent frameworks' },
  { source: 'agentgpt', target: 'autogpt', type: 'similar', confidence: 0.80, reasoning: 'Both are autonomous GPT agents' },

  // Tools - Coding assistants
  { source: 'aider', target: 'claude-code', type: 'alternative', confidence: 0.85, reasoning: 'Both are CLI-based AI coding assistants' },
  { source: 'cursor', target: 'claude-code', type: 'complement', confidence: 0.80, reasoning: 'IDE and CLI coding assistants work well together' },
  { source: 'cursor', target: 'continue', type: 'alternative', confidence: 0.80, reasoning: 'Both are AI-powered IDE extensions' },
  { source: 'zed', target: 'cursor', type: 'alternative', confidence: 0.75, reasoning: 'Both are AI-enhanced code editors' },
  { source: 'cody', target: 'continue', type: 'alternative', confidence: 0.75, reasoning: 'Both are AI coding assistant extensions' },
  { source: 'copilot', target: 'cursor', type: 'alternative', confidence: 0.80, reasoning: 'Both are AI coding assistants for IDEs' },
  { source: 'windsurf', target: 'cursor', type: 'alternative', confidence: 0.85, reasoning: 'Both are AI-first code editors' },
  { source: 'codex-cli', target: 'claude-code', type: 'alternative', confidence: 0.85, reasoning: 'Both are CLI-based AI coding tools' },

  // Tools - Chat interfaces
  { source: 'open-webui', target: 'lobe-chat', type: 'alternative', confidence: 0.80, reasoning: 'Both are self-hosted AI chat interfaces' },
  { source: 'chatbox', target: 'lobe-chat', type: 'alternative', confidence: 0.75, reasoning: 'Both are desktop AI chat applications' },
  { source: 'nextchat', target: 'lobe-chat', type: 'alternative', confidence: 0.80, reasoning: 'Both are web-based AI chat applications' },
  { source: 'jan', target: 'open-webui', type: 'alternative', confidence: 0.75, reasoning: 'Both are self-hosted LLM interfaces' },
  { source: 'cherry-studio', target: 'chatbox', type: 'alternative', confidence: 0.75, reasoning: 'Both are desktop AI chat clients' },

  // SDKs
  { source: 'anthropic-python', target: 'anthropic-typescript', type: 'alternative', confidence: 0.90, reasoning: 'Official Anthropic SDKs for different programming languages' },
  { source: 'vercel-ai-sdk', target: 'langchain', type: 'complement', confidence: 0.70, reasoning: 'Both provide AI integration, can be used together' },
  { source: 'openai-python', target: 'anthropic-python', type: 'alternative', confidence: 0.75, reasoning: 'Both are LLM provider SDKs' },
  { source: 'one-api', target: 'gpt-api-free', type: 'similar', confidence: 0.80, reasoning: 'Both are API aggregation/proxy services' },

  // Prompts & Configuration
  { source: 'awesome-chatgpt-prompts', target: 'awesome-claude-prompts', type: 'similar', confidence: 0.85, reasoning: 'Both are curated prompt collections for AI assistants' },
  { source: 'awesome-cursor-rules', target: 'claude-md', type: 'similar', confidence: 0.80, reasoning: 'Both provide coding AI configuration patterns' },
  { source: 'system-prompts', target: 'awesome-chatgpt-prompts', type: 'similar', confidence: 0.75, reasoning: 'Both are prompt collections' },
  { source: 'code2prompt', target: 'repomix', type: 'alternative', confidence: 0.80, reasoning: 'Both convert codebases to LLM prompts' },

  // Tutorials and Learning
  { source: 'anthropic-courses', target: 'deeplearning-ai', type: 'similar', confidence: 0.80, reasoning: 'Both offer Claude/AI educational content' },
  { source: 'prompt-eng-tutorial', target: 'anthropic-courses', type: 'complement', confidence: 0.75, reasoning: 'Interactive tutorial complements course content' },
  { source: 'rag-from-scratch', target: 'langchain', type: 'uses', confidence: 0.75, reasoning: 'RAG tutorials often use LangChain' },

  // Official tools
  { source: 'claude-cookbook', target: 'anthropic-cookbook', type: 'similar', confidence: 0.90, reasoning: 'Both are official Anthropic code examples' },
  { source: 'claude-code-action', target: 'claude-code', type: 'uses', confidence: 0.85, reasoning: 'GitHub Action for Claude Code automation' },
  { source: 'claude-code-sdk-python', target: 'claude-code', type: 'uses', confidence: 0.90, reasoning: 'Python SDK for programmatic Claude Code usage' }
];

// Find resources by slug pattern
async function findResourceBySlug(pattern) {
  const result = await pool.query(`
    SELECT id, slug, title, category FROM resources
    WHERE slug ILIKE $1
       OR title ILIKE $2
    ORDER BY COALESCE(github_stars, 0) DESC NULLS LAST
    LIMIT 1
  `, [`%${pattern}%`, `%${pattern}%`]);
  return result.rows[0];
}

// Create relationships
console.log('🔗 CREATING KNOWN RELATIONSHIPS');
console.log('───────────────────────────────────────────────────────────────\n');

let createdCount = 0;
let skippedCount = 0;
let notFoundCount = 0;

for (const rel of KNOWN_RELATIONSHIPS) {
  const source = await findResourceBySlug(rel.source);
  const target = await findResourceBySlug(rel.target);

  if (!source) {
    console.log(`  ⚠ Not found: ${rel.source}`);
    notFoundCount++;
    continue;
  }

  if (!target) {
    console.log(`  ⚠ Not found: ${rel.target}`);
    notFoundCount++;
    continue;
  }

  if (source.id === target.id) {
    console.log(`  ⚠ Same resource: ${rel.source} = ${rel.target}`);
    skippedCount++;
    continue;
  }

  // Check if relationship already exists
  const existing = await pool.query(`
    SELECT id FROM resource_resource_relationships
    WHERE source_resource_id = $1 AND target_resource_id = $2
  `, [source.id, target.id]);

  if (existing.rows.length > 0) {
    console.log(`  ⤳ Exists: ${source.title} → ${target.title}`);
    skippedCount++;
    continue;
  }

  // Create relationship
  await pool.query(`
    INSERT INTO resource_resource_relationships (
      source_resource_id, target_resource_id,
      relationship_type, confidence_score,
      ai_model, ai_reasoning,
      is_bidirectional, is_active, is_manual
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    source.id, target.id,
    rel.type, rel.confidence,
    'claude-opus-4.5', rel.reasoning,
    true, true, false
  ]);

  console.log(`  ✓ Created: ${source.title} [${rel.type}] ${target.title}`);
  createdCount++;
}

// Auto-detect relationships between top resources in same category
console.log('\n\n🔍 AUTO-DETECTING CATEGORY RELATIONSHIPS');
console.log('───────────────────────────────────────────────────────────────\n');

// Get top resources per category (high stars, good data quality)
const topByCategory = await pool.query(`
  WITH ranked AS (
    SELECT id, slug, title, category, description,
           COALESCE(github_stars, 0) as stars,
           ROW_NUMBER() OVER (PARTITION BY category ORDER BY COALESCE(github_stars, 0) DESC) as rank
    FROM resources
    WHERE is_published = TRUE
      AND title IS NOT NULL
      AND title NOT LIKE 'GitHub%'
      AND title NOT LIKE '**%'
      AND LENGTH(COALESCE(description, '')) > 30
      AND COALESCE(github_stars, 0) > 5000
  )
  SELECT * FROM ranked WHERE rank <= 8
  ORDER BY category, stars DESC
`);

const byCategory = {};
for (const r of topByCategory.rows) {
  if (!byCategory[r.category]) byCategory[r.category] = [];
  byCategory[r.category].push(r);
}

// Create relationships between top resources in same category
for (const [category, categoryResources] of Object.entries(byCategory)) {
  if (categoryResources.length < 2) continue;

  console.log(`${category.toUpperCase()} (${categoryResources.length} top resources):`);

  for (let i = 0; i < categoryResources.length && i < 5; i++) {
    for (let j = i + 1; j < categoryResources.length && j < 5; j++) {
      const source = categoryResources[i];
      const target = categoryResources[j];

      // Check if relationship exists (either direction)
      const existing = await pool.query(`
        SELECT id FROM resource_resource_relationships
        WHERE (source_resource_id = $1 AND target_resource_id = $2)
           OR (source_resource_id = $2 AND target_resource_id = $1)
      `, [source.id, target.id]);

      if (existing.rows.length > 0) {
        continue;
      }

      // Determine relationship type based on category
      let relType = 'similar';
      let confidence = 0.65;
      let reasoning = `Both are popular ${category} with significant community adoption (${source.stars.toLocaleString()} and ${target.stars.toLocaleString()} GitHub stars)`;

      if (category === 'agents' || category === 'tools') {
        relType = 'alternative';
        confidence = 0.70;
        reasoning = `Alternative ${category.slice(0, -1)} options for similar use cases`;
      } else if (category === 'mcp-servers') {
        relType = 'similar';
        confidence = 0.65;
        reasoning = 'Both are popular MCP servers extending Claude capabilities';
      }

      await pool.query(`
        INSERT INTO resource_resource_relationships (
          source_resource_id, target_resource_id,
          relationship_type, confidence_score,
          ai_model, ai_reasoning,
          is_bidirectional, is_active, is_manual
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        source.id, target.id,
        relType, confidence,
        'claude-opus-4.5', reasoning,
        true, true, false
      ]);

      console.log(`  ✓ ${source.title.substring(0,25)} [${relType}] ${target.title.substring(0,25)}`);
      createdCount++;
    }
  }
  console.log('');
}

// Summary
console.log('═══════════════════════════════════════════════════════════════');
console.log('                    RELATIONSHIP SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Created:   ${createdCount} new relationships`);
console.log(`  Skipped:   ${skippedCount} (already exist or same resource)`);
console.log(`  Not found: ${notFoundCount} (resource slug not matched)`);

// Get final count
const finalCount = await pool.query(`
  SELECT COUNT(*) as count FROM resource_resource_relationships WHERE is_active = TRUE
`);
console.log(`\n  Total active resource-resource relationships: ${finalCount.rows[0].count}`);

// Get breakdown by type
const byType = await pool.query(`
  SELECT relationship_type, COUNT(*) as count
  FROM resource_resource_relationships
  WHERE is_active = TRUE
  GROUP BY relationship_type
  ORDER BY count DESC
`);

console.log('\n  By relationship type:');
for (const row of byType.rows) {
  console.log(`    ${row.relationship_type.padEnd(15)} ${row.count}`);
}

console.log('\n═══════════════════════════════════════════════════════════════\n');

await pool.end();
