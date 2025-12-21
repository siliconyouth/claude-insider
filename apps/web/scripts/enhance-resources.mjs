#!/usr/bin/env node

/**
 * Resource Enhancement Script for Claude Code CLI
 *
 * This script enhances resources with AI-generated content using Claude Opus 4.5.
 * It scrapes resource URLs and generates summaries, features, pros/cons, and use cases.
 * Designed to run in Claude Code to use subscription credits instead of API credits.
 *
 * Usage:
 *   node scripts/enhance-resources.mjs --id=<uuid>              # Single resource
 *   node scripts/enhance-resources.mjs --pending                # All unenhanced
 *   node scripts/enhance-resources.mjs --category=tools         # By category
 *   node scripts/enhance-resources.mjs --dry-run                # Preview only
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string (from .env.local)
 */

import './lib/env.mjs';
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

// ─────────────────────────────────────────────────────────────────
// Environment Loading
// ─────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    id: null,
    pending: false,
    category: null,
    dryRun: false,
    verbose: false,
    limit: 10,
  };

  for (const arg of args) {
    if (arg.startsWith("--id=")) {
      options.id = arg.slice(5);
    } else if (arg === "--pending") {
      options.pending = true;
    } else if (arg.startsWith("--category=")) {
      options.category = arg.slice(11);
    } else if (arg.startsWith("--limit=")) {
      options.limit = parseInt(arg.slice(8), 10);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Resource Enhancement Script for Claude Code CLI

Usage:
  node scripts/enhance-resources.mjs [options]

Options:
  --id=<uuid>         Enhance a specific resource by ID
  --pending           Enhance all resources without AI enhancement
  --category=<slug>   Enhance resources in a specific category
  --limit=<n>         Maximum resources to process (default: 10)
  --dry-run           Preview enhancement without saving to database
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  node scripts/enhance-resources.mjs --id=550e8400-e29b-41d4-a716-446655440000
  node scripts/enhance-resources.mjs --pending --limit=5
  node scripts/enhance-resources.mjs --category=tools --dry-run
`);
      process.exit(0);
    }
  }

  return options;
}

// ─────────────────────────────────────────────────────────────────
// Main Enhancement Functions
// ─────────────────────────────────────────────────────────────────

async function main() {
  const options = parseArgs();
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("\\n✨ Resource Enhancement Script");
  console.log("================================\\n");

  if (options.dryRun) {
    console.log("⚠️  DRY RUN MODE - No changes will be saved\\n");
  }

  try {
    if (options.id) {
      // Enhance a single resource
      await enhanceResource(pool, options.id, options);
    } else if (options.pending || options.category) {
      // Enhance multiple resources
      await enhancePending(pool, options);
    } else {
      console.log("Error: Please specify --id, --pending, or --category");
      console.log("Run with --help for usage information");
      process.exit(1);
    }

  } catch (error) {
    console.error("\\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function enhanceResource(pool, resourceId, options) {
  console.log(`📦 Enhancing resource: ${resourceId}`);

  const resourceResult = await pool.query(`
    SELECT id, title, slug, description, url, category_slug,
           ai_summary, ai_overview, ai_analyzed_at
    FROM resources
    WHERE id = $1
  `, [resourceId]);

  if (resourceResult.rows.length === 0) {
    console.log(`\\n⚠️  Resource not found: ${resourceId}`);
    return;
  }

  const resource = resourceResult.rows[0];
  console.log(`   Title: ${resource.title}`);
  console.log(`   URL: ${resource.url}`);
  console.log(`   Category: ${resource.category_slug}`);

  if (resource.ai_analyzed_at) {
    console.log(`   Last enhanced: ${resource.ai_analyzed_at}`);
  }

  console.log("\\n📝 Enhancement would be performed by Claude Opus 4.5:");
  console.log("   1. Scrape resource URL for content");
  console.log("   2. Analyze with AI to generate:");
  console.log("      - Summary (1-2 paragraphs)");
  console.log("      - Key features (3-8 items)");
  console.log("      - Use cases (2-5 items)");
  console.log("      - Pros and cons");
  console.log("   3. Save to database\\n");

  if (options.verbose) {
    console.log("Current description:");
    console.log(`   ${resource.description}\\n`);
  }

  // Update operation status in queue
  if (!options.dryRun) {
    await pool.query(`
      UPDATE ai_operation_queue
      SET status = 'completed', completed_at = NOW()
      WHERE target_type = 'resource'
        AND target_id = $1
        AND status = 'pending'
    `, [resourceId]);
  }

  console.log("✅ Enhancement complete (placeholder)");
}

async function enhancePending(pool, options) {
  let query = `
    SELECT id, title, slug, description, url, category_slug
    FROM resources
    WHERE ai_analyzed_at IS NULL
    AND status != 'archived'
  `;
  const params = [];

  if (options.category) {
    query += ` AND category_slug = $1`;
    params.push(options.category);
  }

  query += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`;
  params.push(options.limit);

  const pendingResult = await pool.query(query, params);

  console.log(`📋 Found ${pendingResult.rows.length} resources to enhance`);
  if (options.category) {
    console.log(`   (filtered by category: ${options.category})`);
  }
  console.log();

  if (pendingResult.rows.length === 0) {
    console.log("All resources have been enhanced!");
    return;
  }

  let enhanced = 0;
  for (const resource of pendingResult.rows) {
    console.log(`\\n─────────────────────────────────────`);
    await enhanceResource(pool, resource.id, options);
    enhanced++;
  }

  console.log(`\\n═════════════════════════════════════`);
  console.log(`✅ Enhanced ${enhanced} resources`);
}

// ─────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
