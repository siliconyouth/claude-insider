/**
 * Fix Data Quality Issues in Resources
 *
 * Fixes:
 * 1. Asterisked titles (strip markdown formatting)
 * 2. "GitHub" placeholder titles (use owner/repo)
 * 3. Missing/short descriptions (generate based on context)
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

// Description templates by category
const CATEGORY_DESCRIPTIONS = {
  'mcp-servers': (title, github) => {
    const name = title.replace(/-/g, ' ').replace(/mcp/gi, 'MCP');
    return `MCP server that extends Claude's capabilities with ${name} integration. Enables seamless interaction between Claude and ${name} services through the Model Context Protocol.`;
  },
  'agents': (title, github) => {
    const name = title.replace(/-/g, ' ').replace(/claude/gi, 'Claude');
    return `AI agent framework for ${name}. Enables autonomous task execution and multi-step reasoning with LLM-powered decision making.`;
  },
  'tools': (title, github) => {
    const name = title.replace(/-/g, ' ');
    return `Developer tool for ${name}. Enhances productivity and streamlines workflows for AI-assisted development.`;
  },
  'sdks': (title, github) => {
    const name = title.replace(/-/g, ' ');
    return `SDK library for ${name}. Provides programmatic access to AI capabilities with type-safe interfaces and helper utilities.`;
  },
  'official': (title, github) => {
    const name = title.replace(/-/g, ' ').replace(/claude/gi, 'Claude');
    return `Official Anthropic resource for ${name}. Part of the Claude ecosystem maintained by Anthropic.`;
  },
  'prompts': (title, github) => {
    const name = title.replace(/-/g, ' ');
    return `Prompt collection and templates for ${name}. Curated examples and patterns for effective AI interactions.`;
  },
  'rules': (title, github) => {
    const name = title.replace(/-/g, ' ');
    return `Configuration rules and patterns for ${name}. Best practices for AI-assisted development workflows.`;
  },
  'tutorials': (title, github) => {
    const name = title.replace(/-/g, ' ');
    return `Tutorial and learning resource for ${name}. Step-by-step guide for mastering AI development techniques.`;
  },
  'showcases': (title, github) => {
    const name = title.replace(/-/g, ' ');
    return `Showcase application demonstrating ${name}. Example of AI capabilities in production use.`;
  },
  'community': (title, github) => {
    const name = title.replace(/-/g, ' ');
    return `Community resource for ${name}. Connect with other developers and share knowledge about AI development.`;
  }
};

// Specific descriptions for known resources
const KNOWN_DESCRIPTIONS = {
  // Official Anthropic
  'claude-code-action': 'GitHub Action for running Claude Code in CI/CD pipelines. Automate code review, documentation generation, and other tasks with Claude.',
  'claude-code-base-action': 'Base GitHub Action providing core Claude Code functionality. Foundation for building custom Claude-powered workflows.',
  'claude-code-sdk-python': 'Official Python SDK for Claude Code. Programmatically control Claude Code sessions with full type safety.',
  'claude-code-security-review': 'Automated security review action powered by Claude. Identifies vulnerabilities and security issues in pull requests.',
  'claude-agent-sdk-python': 'Python SDK for building autonomous AI agents with Claude. Create multi-step reasoning workflows.',

  // Popular MCP Servers
  'github-mcp-server': 'Official GitHub MCP server. Access repositories, issues, pull requests, and more through Claude.',
  'playwright-mcp': 'Browser automation MCP server using Playwright. Control web browsers and automate testing from Claude.',
  'blender-mcp': 'Blender 3D integration MCP server. Control Blender and create 3D content through Claude.',
  'whatsapp-mcp': 'WhatsApp messaging MCP server. Send and receive WhatsApp messages through Claude.',
  'ghidra-mcp': 'Ghidra reverse engineering MCP server. Analyze binaries and disassemble code through Claude.',

  // Popular Agents
  'flowise': 'Drag-and-drop UI for building LLM flows. Create complex AI workflows without code using a visual interface.',
  'gpt-pilot': 'AI developer that writes entire apps from scratch. Generates production-ready code with AI pair programming.',
  'cursor': 'AI-first code editor built for pair programming with AI. Integrated code completion and chat.',
  'babyagi': 'AI-powered task management system. Automatically creates, prioritizes, and executes tasks toward a goal.',
  'devika': 'Open-source Devin alternative. AI software engineer that can understand, plan, and write code.',
  'agentgpt': 'Autonomous AI agent that can complete tasks. Web-based interface for deploying goal-oriented agents.',
  'auto-gpt': 'Autonomous GPT-4 experiment. Self-prompting AI agent that achieves goals with minimal human input.',
  'open-interpreter': 'Natural language interface for computers. Run code, control apps, and automate tasks with voice.',

  // Popular Tools
  'chatbox': 'Desktop AI chat client supporting multiple providers. Clean interface for Claude, GPT, and other LLMs.',
  'void': 'Open-source Cursor alternative. AI-powered code editor with local-first architecture.',
  'phoenix': 'AI observability and evaluation platform. Monitor, debug, and improve LLM applications.',
  'codecompanion': 'Neovim AI assistant plugin. Bring Claude and other LLMs directly into your editor.',
  'awesome-mcp-clients': 'Curated list of MCP client applications. Discover tools that work with Model Context Protocol.',

  // Agent Frameworks
  'agents-1': 'Collection of AI agents for Claude Code. Pre-built agents for common development tasks.',
  'agents-2': 'Studio agent framework. Build and deploy autonomous AI agents with visual tools.',
  'awesome-claude-agents': 'Curated list of Claude Code agents. Discover community-built agents for various tasks.',
  'awesome-claude-code-agents': 'Collection of powerful Claude Code agents. Specialized agents for development workflows.',
  'claude-code-agent-farm': 'Multi-agent orchestration for Claude Code. Run multiple specialized agents in parallel.',
  'claude-agents-1': 'Custom agent implementations for Claude. Extend Claude Code with specialized behaviors.',
  'claude-code-subagents': 'Subagent system for Claude Code. Delegate tasks to specialized sub-agents.',
  'claude-code-unified-agents': 'Unified agent framework for Claude Code. Consistent interface for all agent types.',

  // MCP Servers
  'claude-code-mcp': 'MCP server for Claude Code integration. Enable Claude to control other Claude Code instances.',
  'codemcp': 'Code-focused MCP server. Enhanced code editing and navigation capabilities for Claude.',
  'zen-mcp-server': 'Minimal MCP server template. Starting point for building custom MCP integrations.',
  'claude-gemini-mcp-slim': 'Lightweight Gemini integration MCP. Use Google Gemini models alongside Claude.',

  // Tools
  'anthropic-proxy': 'Anthropic API proxy server. Route and cache Claude API requests.',
  'awesome-claude-skills': 'Collection of Claude Code skills. Pre-built capabilities for common tasks.',
  'cc-sessions': 'Session management for Claude Code. Save and restore conversation contexts.',
  'cc-statusline': 'Status line integration for Claude Code. Monitor Claude Code status in your terminal.',
  'gemini-cli': 'Command-line interface for Google Gemini. Chat with Gemini from your terminal.'
};

console.log('═══════════════════════════════════════════════════════════════');
console.log('              FIXING DATA QUALITY ISSUES');
console.log('═══════════════════════════════════════════════════════════════\n');

let titlesFix = 0;
let descriptionsFix = 0;

// 1. Fix asterisked titles
console.log('📝 FIXING ASTERISKED TITLES');
console.log('───────────────────────────────────────────────────────────────');

const asteriskResult = await pool.query(`
  UPDATE resources
  SET title = TRIM(REPLACE(REPLACE(title, '**', ''), '*', '')),
      updated_at = NOW()
  WHERE title LIKE '**%' OR title LIKE '*%'
  RETURNING id, title, slug
`);

console.log(`Fixed ${asteriskResult.rowCount} asterisked titles\n`);
titlesFix += asteriskResult.rowCount;

for (const r of asteriskResult.rows.slice(0, 10)) {
  console.log(`  ✓ ${r.title} (${r.slug})`);
}
if (asteriskResult.rowCount > 10) {
  console.log(`  ... and ${asteriskResult.rowCount - 10} more`);
}

// 2. Fix "GitHub" placeholder titles
console.log('\n\n🔧 FIXING "GITHUB" PLACEHOLDER TITLES');
console.log('───────────────────────────────────────────────────────────────');

const githubTitleResult = await pool.query(`
  UPDATE resources
  SET title = github_owner || '/' || github_repo,
      updated_at = NOW()
  WHERE title = 'GitHub'
    AND github_owner IS NOT NULL
    AND github_repo IS NOT NULL
  RETURNING id, title, slug
`);

console.log(`Fixed ${githubTitleResult.rowCount} GitHub placeholder titles\n`);
titlesFix += githubTitleResult.rowCount;

for (const r of githubTitleResult.rows.slice(0, 10)) {
  console.log(`  ✓ ${r.title} (${r.slug})`);
}
if (githubTitleResult.rowCount > 10) {
  console.log(`  ... and ${githubTitleResult.rowCount - 10} more`);
}

// 3. Fix known resources with specific descriptions
console.log('\n\n📖 FIXING KNOWN RESOURCE DESCRIPTIONS');
console.log('───────────────────────────────────────────────────────────────');

let knownFixed = 0;
for (const [slugPattern, description] of Object.entries(KNOWN_DESCRIPTIONS)) {
  const result = await pool.query(`
    UPDATE resources
    SET description = $1,
        updated_at = NOW()
    WHERE (slug ILIKE $2 OR slug ILIKE $3)
      AND (description IS NULL OR LENGTH(description) < 50)
    RETURNING id, title, slug
  `, [description, `%${slugPattern}%`, `%${slugPattern.replace(/-/g, '_')}%`]);

  if (result.rowCount > 0) {
    console.log(`  ✓ ${result.rows[0].title}: ${description.substring(0, 60)}...`);
    knownFixed += result.rowCount;
  }
}

console.log(`\nFixed ${knownFixed} known resources with specific descriptions`);
descriptionsFix += knownFixed;

// 4. Generate descriptions for remaining resources based on category
console.log('\n\n🤖 GENERATING CATEGORY-BASED DESCRIPTIONS');
console.log('───────────────────────────────────────────────────────────────');

// Get resources still missing descriptions
const missingDesc = await pool.query(`
  SELECT id, title, slug, category, github_owner, github_repo
  FROM resources
  WHERE (description IS NULL OR LENGTH(description) < 30)
    AND title IS NOT NULL
    AND title != ''
  ORDER BY COALESCE(github_stars, 0) DESC
  LIMIT 500
`);

console.log(`Processing ${missingDesc.rows.length} resources with missing descriptions...\n`);

let generated = 0;
for (const r of missingDesc.rows) {
  const generator = CATEGORY_DESCRIPTIONS[r.category];
  if (!generator) continue;

  const cleanTitle = r.title
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const github = r.github_owner && r.github_repo
    ? `${r.github_owner}/${r.github_repo}`
    : null;

  const description = generator(cleanTitle, github);

  await pool.query(`
    UPDATE resources
    SET description = $1,
        updated_at = NOW()
    WHERE id = $2
  `, [description, r.id]);

  generated++;
  if (generated <= 20) {
    console.log(`  ✓ [${r.category}] ${r.title}`);
  }
}

if (generated > 20) {
  console.log(`  ... and ${generated - 20} more`);
}

console.log(`\nGenerated ${generated} descriptions based on category templates`);
descriptionsFix += generated;

// 5. Summary
console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('                    FIX SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  Titles fixed:        ${titlesFix}`);
console.log(`  Descriptions fixed:  ${descriptionsFix}`);
console.log(`  Total updates:       ${titlesFix + descriptionsFix}`);

// Verify remaining issues
const remaining = await pool.query(`
  SELECT
    SUM(CASE WHEN title = 'GitHub' OR title LIKE '**%' THEN 1 ELSE 0 END) as bad_titles,
    SUM(CASE WHEN description IS NULL OR LENGTH(description) < 30 THEN 1 ELSE 0 END) as missing_desc
  FROM resources
`);

console.log(`\n  Remaining bad titles:       ${remaining.rows[0].bad_titles}`);
console.log(`  Remaining missing desc:     ${remaining.rows[0].missing_desc}`);

console.log('\n═══════════════════════════════════════════════════════════════\n');

await pool.end();
