#!/usr/bin/env node

/**
 * Insert AI-Analyzed Relationships
 *
 * This script inserts pre-analyzed relationships between documentation
 * and resources into the database. The analysis was performed by Claude Opus 4.5
 * based on semantic understanding of content, categories, and tags.
 */

import './lib/env.mjs';
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

// Load environment
function loadEnv() {
  const envPath = join(ROOT_DIR, ".env.local");
  if (!existsSync(envPath)) {
    console.error("Error: .env.local file not found");
    process.exit(1);
  }

  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const { Pool } = pg;

// Relationship definitions analyzed by Claude Opus 4.5
// Correct slugs based on actual database content
const RELATIONSHIPS = {
  // API Reference docs
  "api/index": [
    { resourceId: "anthropic-docs", type: "required", confidence: 0.95, reasoning: "Official API reference is the primary source for API documentation" },
    { resourceId: "anthropic-sdk-python", type: "recommended", confidence: 0.92, reasoning: "Python SDK implements the API endpoints covered in this doc" },
    { resourceId: "anthropic-sdk-typescript", type: "recommended", confidence: 0.92, reasoning: "TypeScript SDK implements the API endpoints covered in this doc" },
    { resourceId: "sdk-python-official", type: "recommended", confidence: 0.90, reasoning: "Official Python SDK for using the API" },
    { resourceId: "sdk-typescript-official", type: "recommended", confidence: 0.90, reasoning: "Official TypeScript SDK for using the API" },
    { resourceId: "claude-console", type: "related", confidence: 0.85, reasoning: "Console is where API keys are managed" },
    { resourceId: "anthropic-cookbook", type: "example", confidence: 0.88, reasoning: "Cookbook provides practical API usage examples" },
  ],
  "api/authentication": [
    { resourceId: "anthropic-docs", type: "required", confidence: 0.95, reasoning: "Official docs cover authentication requirements" },
    { resourceId: "claude-console", type: "required", confidence: 0.92, reasoning: "Console is where API keys are created and managed" },
    { resourceId: "anthropic-sdk-python", type: "recommended", confidence: 0.85, reasoning: "SDK handles authentication automatically" },
    { resourceId: "anthropic-sdk-typescript", type: "recommended", confidence: 0.85, reasoning: "SDK handles authentication automatically" },
  ],
  "api/models": [
    { resourceId: "anthropic-docs", type: "required", confidence: 0.95, reasoning: "Official source for model specifications" },
    { resourceId: "claude-console", type: "related", confidence: 0.80, reasoning: "Console shows available models for your account" },
    { resourceId: "anthropic-cookbook", type: "example", confidence: 0.82, reasoning: "Cookbook shows model usage in practice" },
  ],
  "api/rate-limits": [
    { resourceId: "anthropic-docs", type: "required", confidence: 0.95, reasoning: "Official rate limit documentation" },
    { resourceId: "claude-console", type: "related", confidence: 0.85, reasoning: "Console shows your current rate limit tier" },
  ],
  "api/streaming": [
    { resourceId: "anthropic-docs", type: "required", confidence: 0.92, reasoning: "Official streaming API documentation" },
    { resourceId: "streaming-tutorial", type: "extends", confidence: 0.90, reasoning: "Tutorial expands on streaming implementation" },
    { resourceId: "anthropic-sdk-python", type: "recommended", confidence: 0.88, reasoning: "SDK provides streaming utilities" },
    { resourceId: "anthropic-sdk-typescript", type: "recommended", confidence: 0.88, reasoning: "SDK provides streaming utilities" },
    { resourceId: "vercel-ai-sdk", type: "alternative", confidence: 0.85, reasoning: "Vercel AI SDK offers alternative streaming approach" },
  ],
  "api/tool-use": [
    { resourceId: "anthropic-docs", type: "required", confidence: 0.95, reasoning: "Official tool use documentation" },
    { resourceId: "tool-use-tutorial", type: "extends", confidence: 0.92, reasoning: "Tutorial expands on tool use concepts" },
    { resourceId: "structured-outputs", type: "related", confidence: 0.85, reasoning: "Tool use often involves structured outputs" },
    { resourceId: "anthropic-cookbook", type: "example", confidence: 0.88, reasoning: "Cookbook has tool use examples" },
    { resourceId: "langchain", type: "implements", confidence: 0.82, reasoning: "LangChain implements Claude tool use" },
  ],
  "api/error-handling": [
    { resourceId: "anthropic-docs", type: "required", confidence: 0.92, reasoning: "Official error documentation" },
    { resourceId: "anthropic-sdk-python", type: "related", confidence: 0.85, reasoning: "SDK provides error handling utilities" },
    { resourceId: "anthropic-sdk-typescript", type: "related", confidence: 0.85, reasoning: "SDK provides error handling utilities" },
  ],

  // Configuration docs
  "configuration/index": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.95, reasoning: "Official Claude Code configuration docs" },
    { resourceId: "claude-code-repo", type: "related", confidence: 0.90, reasoning: "Repository with configuration examples" },
    { resourceId: "cursor-directory", type: "related", confidence: 0.80, reasoning: "Directory of configuration rules" },
    { resourceId: "awesome-cursorrules", type: "example", confidence: 0.78, reasoning: "Collection of configuration examples" },
  ],
  "configuration/account-security": [
    { resourceId: "claude-console", type: "required", confidence: 0.90, reasoning: "Console is where security settings are managed" },
    { resourceId: "anthropic-docs", type: "related", confidence: 0.85, reasoning: "Official security documentation" },
  ],
  "configuration/claude-md": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.95, reasoning: "Official CLAUDE.md documentation" },
    { resourceId: "claude-code-repo", type: "example", confidence: 0.90, reasoning: "Repository contains CLAUDE.md examples" },
    { resourceId: "cursor-directory", type: "related", confidence: 0.85, reasoning: "Similar configuration concept" },
    { resourceId: "awesome-cursorrules", type: "alternative", confidence: 0.82, reasoning: "Alternative configuration approach" },
    { resourceId: "rules-nextjs", type: "example", confidence: 0.80, reasoning: "Framework-specific configuration example" },
    { resourceId: "rules-typescript", type: "example", confidence: 0.80, reasoning: "Language-specific configuration example" },
  ],
  "configuration/environment": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.92, reasoning: "Official environment variable docs" },
    { resourceId: "anthropic-sdk-python", type: "related", confidence: 0.85, reasoning: "SDK reads environment variables" },
    { resourceId: "anthropic-sdk-typescript", type: "related", confidence: 0.85, reasoning: "SDK reads environment variables" },
  ],
  "configuration/permissions": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.92, reasoning: "Official permissions documentation" },
    { resourceId: "claude-code-repo", type: "related", confidence: 0.88, reasoning: "Repository shows permission configurations" },
  ],
  "configuration/settings": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.92, reasoning: "Official settings documentation" },
    { resourceId: "claude-code-repo", type: "related", confidence: 0.85, reasoning: "Repository contains settings examples" },
  ],

  // Getting Started docs (correct slugs)
  "getting-started/quickstart": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.95, reasoning: "Official quick start guide" },
    { resourceId: "claude-code-tutorial", type: "extends", confidence: 0.90, reasoning: "Tutorial with quick start examples" },
    { resourceId: "anthropic-cookbook", type: "example", confidence: 0.85, reasoning: "Cookbook has quick start examples" },
    { resourceId: "claude-code-repo", type: "related", confidence: 0.92, reasoning: "Official repository for installation" },
  ],
  "getting-started/installation": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.95, reasoning: "Official installation instructions" },
    { resourceId: "claude-code-repo", type: "required", confidence: 0.92, reasoning: "Repository with installation files" },
    { resourceId: "claude-code-tutorial", type: "extends", confidence: 0.88, reasoning: "Tutorial covers installation" },
  ],
  "getting-started/migration": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.90, reasoning: "Official migration documentation" },
    { resourceId: "claude-code-repo", type: "related", confidence: 0.85, reasoning: "Repository with migration guides" },
    { resourceId: "github-discussions", type: "related", confidence: 0.75, reasoning: "Community discusses migration issues" },
  ],
  "getting-started/troubleshooting": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.90, reasoning: "Official troubleshooting guide" },
    { resourceId: "github-discussions", type: "recommended", confidence: 0.88, reasoning: "GitHub issues for troubleshooting" },
    { resourceId: "reddit-claudeai", type: "related", confidence: 0.75, reasoning: "Community troubleshooting discussions" },
    { resourceId: "anthropic-discord", type: "related", confidence: 0.75, reasoning: "Discord for live troubleshooting help" },
  ],

  // Integrations docs (correct slugs)
  "integrations/index": [
    { resourceId: "mcp-docs", type: "required", confidence: 0.95, reasoning: "MCP is the primary integration protocol" },
    { resourceId: "awesome-mcp-servers", type: "recommended", confidence: 0.92, reasoning: "Comprehensive list of MCP integrations" },
    { resourceId: "langchain-anthropic", type: "example", confidence: 0.88, reasoning: "Example of Claude integration" },
    { resourceId: "llamaindex-anthropic", type: "example", confidence: 0.88, reasoning: "Example of Claude integration" },
    { resourceId: "vercel-ai-sdk", type: "example", confidence: 0.85, reasoning: "Example of Claude integration" },
  ],
  "integrations/mcp-servers": [
    { resourceId: "mcp-docs", type: "required", confidence: 0.98, reasoning: "Official MCP documentation" },
    { resourceId: "awesome-mcp-servers", type: "recommended", confidence: 0.95, reasoning: "Curated list of MCP servers" },
    { resourceId: "mcp-filesystem", type: "example", confidence: 0.92, reasoning: "Official MCP server example" },
    { resourceId: "mcp-git", type: "example", confidence: 0.92, reasoning: "Official MCP server example" },
    { resourceId: "mcp-postgres", type: "example", confidence: 0.90, reasoning: "Database MCP server" },
    { resourceId: "mcp-puppeteer", type: "example", confidence: 0.90, reasoning: "Browser automation MCP server" },
    { resourceId: "mcp-fetch", type: "example", confidence: 0.90, reasoning: "HTTP MCP server" },
    { resourceId: "mcp-memory", type: "example", confidence: 0.88, reasoning: "Memory/persistence MCP server" },
    { resourceId: "mcp-github", type: "example", confidence: 0.88, reasoning: "GitHub integration MCP server" },
    { resourceId: "firecrawl-mcp", type: "example", confidence: 0.88, reasoning: "Web scraping MCP server" },
    { resourceId: "mcp-notion", type: "example", confidence: 0.85, reasoning: "Notion integration MCP server" },
    { resourceId: "mcp-server-tutorial", type: "extends", confidence: 0.90, reasoning: "Tutorial on building MCP servers" },
    { resourceId: "mcp-docker", type: "example", confidence: 0.85, reasoning: "Docker MCP server" },
    { resourceId: "mcp-linear", type: "example", confidence: 0.82, reasoning: "Linear project management MCP" },
  ],
  "integrations/ide-plugins": [
    { resourceId: "cursor-editor", type: "recommended", confidence: 0.95, reasoning: "Popular AI-powered IDE" },
    { resourceId: "continue-dev", type: "recommended", confidence: 0.92, reasoning: "VS Code/JetBrains extension for Claude" },
    { resourceId: "cline-vscode", type: "recommended", confidence: 0.90, reasoning: "VS Code Claude agent" },
    { resourceId: "zed-editor", type: "related", confidence: 0.85, reasoning: "Editor with Claude integration" },
    { resourceId: "windsurf", type: "related", confidence: 0.85, reasoning: "AI-native IDE" },
    { resourceId: "neovim-avante", type: "example", confidence: 0.82, reasoning: "Neovim Claude plugin" },
    { resourceId: "cursor-directory", type: "related", confidence: 0.80, reasoning: "IDE configuration resources" },
  ],
  "integrations/github-actions": [
    { resourceId: "claude-code-repo", type: "related", confidence: 0.85, reasoning: "GitHub Actions examples in repo" },
    { resourceId: "mcp-github", type: "related", confidence: 0.80, reasoning: "GitHub API integration" },
    { resourceId: "github-discussions", type: "related", confidence: 0.75, reasoning: "GitHub integration discussions" },
  ],
  "integrations/hooks": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.95, reasoning: "Official hooks documentation" },
    { resourceId: "claude-code-repo", type: "example", confidence: 0.90, reasoning: "Hook examples in repository" },
  ],
  "integrations/docker": [
    { resourceId: "mcp-docker", type: "recommended", confidence: 0.92, reasoning: "Docker MCP server" },
    { resourceId: "claude-code-docs", type: "related", confidence: 0.85, reasoning: "Docker usage documentation" },
    { resourceId: "open-webui", type: "example", confidence: 0.80, reasoning: "Docker-based Claude UI" },
  ],
  "integrations/databases": [
    { resourceId: "mcp-postgres", type: "recommended", confidence: 0.95, reasoning: "PostgreSQL MCP server" },
    { resourceId: "mcp-sqlite", type: "recommended", confidence: 0.92, reasoning: "SQLite MCP server" },
    { resourceId: "vector-databases", type: "extends", confidence: 0.88, reasoning: "Vector DB integration for RAG" },
    { resourceId: "llamaindex", type: "related", confidence: 0.82, reasoning: "RAG framework with DB support" },
  ],

  // Tips and Tricks docs
  "tips-and-tricks/index": [
    { resourceId: "prompt-engineering-guide", type: "related", confidence: 0.90, reasoning: "Prompting tips are core to effective use" },
    { resourceId: "anthropic-prompt-library", type: "example", confidence: 0.88, reasoning: "Collection of effective prompts" },
    { resourceId: "claude-code-docs", type: "related", confidence: 0.85, reasoning: "Official tips and best practices" },
  ],
  "tips-and-tricks/prompting": [
    { resourceId: "prompt-engineering-guide", type: "required", confidence: 0.95, reasoning: "Official prompting guide" },
    { resourceId: "anthropic-prompt-library", type: "example", confidence: 0.92, reasoning: "Prompt examples and templates" },
    { resourceId: "chain-of-thought", type: "extends", confidence: 0.90, reasoning: "Advanced prompting technique" },
    { resourceId: "few-shot-learning", type: "extends", confidence: 0.90, reasoning: "Prompting with examples" },
    { resourceId: "awesome-chatgpt-prompts", type: "example", confidence: 0.85, reasoning: "Large prompt collection" },
    { resourceId: "prompts-chat", type: "example", confidence: 0.82, reasoning: "Prompt discovery platform" },
    { resourceId: "system-prompts-coding", type: "example", confidence: 0.88, reasoning: "Coding-focused prompts" },
  ],
  "tips-and-tricks/advanced-prompting": [
    { resourceId: "prompt-engineering-guide", type: "required", confidence: 0.95, reasoning: "Official advanced prompting guide" },
    { resourceId: "chain-of-thought", type: "extends", confidence: 0.92, reasoning: "Chain-of-thought reasoning" },
    { resourceId: "self-reflection", type: "extends", confidence: 0.88, reasoning: "Self-reflection techniques" },
    { resourceId: "few-shot-learning", type: "extends", confidence: 0.88, reasoning: "Few-shot learning patterns" },
    { resourceId: "anthropic-courses", type: "recommended", confidence: 0.85, reasoning: "Courses on advanced prompting" },
    { resourceId: "dspy", type: "implements", confidence: 0.80, reasoning: "Programmatic prompting framework" },
  ],
  "tips-and-tricks/debugging": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.90, reasoning: "Official debugging documentation" },
    { resourceId: "aider", type: "related", confidence: 0.80, reasoning: "Debugging-capable coding tool" },
    { resourceId: "cline-vscode", type: "related", confidence: 0.80, reasoning: "VS Code debugging integration" },
  ],
  "tips-and-tricks/productivity": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.90, reasoning: "Official productivity tips" },
    { resourceId: "raycast-ai", type: "example", confidence: 0.85, reasoning: "Productivity tool with Claude" },
    { resourceId: "obsidian-copilot", type: "example", confidence: 0.82, reasoning: "Note-taking productivity" },
    { resourceId: "notion-ai", type: "example", confidence: 0.80, reasoning: "Workspace productivity" },
  ],

  // Tutorials docs
  "tutorials/index": [
    { resourceId: "anthropic-courses", type: "required", confidence: 0.95, reasoning: "Official Anthropic courses" },
    { resourceId: "deeplearning-claude", type: "recommended", confidence: 0.92, reasoning: "Professional Claude courses" },
    { resourceId: "building-ai-apps", type: "extends", confidence: 0.90, reasoning: "Official building guide" },
    { resourceId: "anthropic-cookbook", type: "example", confidence: 0.88, reasoning: "Practical code examples" },
  ],
  "tutorials/code-review": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.92, reasoning: "Official code review features" },
    { resourceId: "prompt-code-reviewer", type: "example", confidence: 0.90, reasoning: "Code review prompt" },
    { resourceId: "continue-dev", type: "implements", confidence: 0.85, reasoning: "IDE with code review features" },
    { resourceId: "cline-vscode", type: "implements", confidence: 0.85, reasoning: "VS Code code review agent" },
  ],
  "tutorials/documentation-generation": [
    { resourceId: "prompt-technical-writer", type: "example", confidence: 0.90, reasoning: "Documentation writing prompt" },
    { resourceId: "rules-documentation", type: "example", confidence: 0.85, reasoning: "Documentation rules" },
    { resourceId: "claude-code-docs", type: "related", confidence: 0.82, reasoning: "Claude Code for docs generation" },
  ],
  "tutorials/test-generation": [
    { resourceId: "claude-code-docs", type: "required", confidence: 0.90, reasoning: "Official test generation docs" },
    { resourceId: "rules-testing", type: "example", confidence: 0.88, reasoning: "Testing rules and patterns" },
    { resourceId: "anthropic-cookbook", type: "example", confidence: 0.82, reasoning: "Testing examples in cookbook" },
  ],

  // Examples docs
  "examples/index": [
    { resourceId: "anthropic-cookbook", type: "required", confidence: 0.95, reasoning: "Official example collection" },
    { resourceId: "awesome-llm-apps", type: "recommended", confidence: 0.92, reasoning: "LLM app examples" },
    { resourceId: "claude-insider", type: "example", confidence: 0.90, reasoning: "This site is built with Claude" },
  ],
  "examples/real-world-projects": [
    { resourceId: "claude-insider", type: "example", confidence: 0.95, reasoning: "Real-world Claude Code project" },
    { resourceId: "awesome-llm-apps", type: "example", confidence: 0.90, reasoning: "Collection of real LLM apps" },
    { resourceId: "anthropic-cookbook", type: "example", confidence: 0.88, reasoning: "Practical project examples" },
    { resourceId: "v0-vercel", type: "example", confidence: 0.85, reasoning: "Production AI application" },
    { resourceId: "chatbox", type: "example", confidence: 0.82, reasoning: "Cross-platform chat app" },
    { resourceId: "open-webui", type: "example", confidence: 0.82, reasoning: "Self-hosted LLM UI" },
    { resourceId: "khoj", type: "example", confidence: 0.80, reasoning: "AI second brain project" },
    { resourceId: "obsidian-copilot", type: "example", confidence: 0.78, reasoning: "Obsidian plugin project" },
  ],
};

const MODEL = "claude-opus-4-5-20251101";

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  Inserting AI-Analyzed Relationships");
  console.log("=".repeat(60) + "\n");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // First, clear existing AI-generated relationships
    console.log("Clearing existing AI-generated relationships...");
    await pool.query(`DELETE FROM doc_resource_relationships WHERE is_manual = FALSE`);

    // Get resource IDs from database
    console.log("Loading resource IDs from database...");
    const resourceResult = await pool.query(`SELECT id, slug FROM resources`);
    const resourceMap = new Map();
    for (const row of resourceResult.rows) {
      resourceMap.set(row.slug, row.id);
    }
    console.log(`  Found ${resourceMap.size} resources in database\n`);

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const [docSlug, relationships] of Object.entries(RELATIONSHIPS)) {
      console.log(`Processing: ${docSlug}`);
      let inserted = 0;
      let skipped = 0;

      for (const rel of relationships) {
        // Look up resource ID from our map
        const resourceId = resourceMap.get(rel.resourceId);

        if (!resourceId) {
          console.log(`  ⚠ Resource not found: ${rel.resourceId}`);
          skipped++;
          totalSkipped++;
          continue;
        }

        try {
          await pool.query(`
            INSERT INTO doc_resource_relationships (
              doc_slug, resource_id, relationship_type, confidence_score,
              ai_model, ai_reasoning, is_manual, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, FALSE, TRUE)
            ON CONFLICT (doc_slug, resource_id) DO UPDATE SET
              relationship_type = EXCLUDED.relationship_type,
              confidence_score = EXCLUDED.confidence_score,
              ai_model = EXCLUDED.ai_model,
              ai_reasoning = EXCLUDED.ai_reasoning,
              analyzed_at = NOW()
          `, [
            docSlug,
            resourceId,
            rel.type,
            rel.confidence,
            MODEL,
            rel.reasoning,
          ]);

          inserted++;
          totalInserted++;
        } catch (error) {
          console.log(`  ⚠ Error: ${error.message}`);
          skipped++;
          totalSkipped++;
        }
      }

      console.log(`  ✓ ${inserted} inserted, ${skipped} skipped`);
    }

    // Update related_docs_count on resources
    console.log("\nUpdating relationship counts...");
    await pool.query(`
      UPDATE resources r SET
        related_docs_count = (
          SELECT COUNT(*) FROM doc_resource_relationships dr
          WHERE dr.resource_id = r.id AND dr.is_active = TRUE
        )
    `);

    // Get final stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_relationships,
        COUNT(DISTINCT doc_slug) as docs_with_relationships,
        COUNT(DISTINCT resource_id) as resources_with_relationships,
        ROUND(AVG(confidence_score)::numeric, 2) as avg_confidence
      FROM doc_resource_relationships
      WHERE is_active = TRUE
    `);
    const stats = statsResult.rows[0];

    console.log("\n" + "=".repeat(60));
    console.log("  Summary");
    console.log("=".repeat(60));
    console.log(`
  Documents Processed: ${Object.keys(RELATIONSHIPS).length}
  Relationships Inserted: ${totalInserted}
  Skipped (errors): ${totalSkipped}

  Database Statistics:
  - Total Active Relationships: ${stats.total_relationships}
  - Docs with Relationships: ${stats.docs_with_relationships}
  - Resources with Relationships: ${stats.resources_with_relationships}
  - Average Confidence: ${stats.avg_confidence}
    `);

  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error(`\nError: ${error.message}`);
  console.error(error);
  process.exit(1);
});
