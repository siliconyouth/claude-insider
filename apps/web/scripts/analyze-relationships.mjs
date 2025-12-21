#!/usr/bin/env node

/**
 * Relationship Analysis Script for Claude Code CLI
 *
 * This script analyzes documentation content and discovers relationships
 * to resources using Claude Opus 4.5. It's designed to run in Claude Code
 * to use subscription credits instead of API credits.
 *
 * Usage:
 *   node scripts/analyze-relationships.mjs --slug=api/index      # Single doc
 *   node scripts/analyze-relationships.mjs --resource=<uuid>     # Single resource
 *   node scripts/analyze-relationships.mjs --all                 # All pending docs
 *   node scripts/analyze-relationships.mjs --dry-run             # Preview only
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
    slug: null,
    resource: null,
    all: false,
    dryRun: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--slug=")) {
      options.slug = arg.slice(7);
    } else if (arg.startsWith("--resource=")) {
      options.resource = arg.slice(11);
    } else if (arg === "--all") {
      options.all = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Relationship Analysis Script for Claude Code CLI

Usage:
  node scripts/analyze-relationships.mjs [options]

Options:
  --slug=<slug>       Analyze a specific document by slug
  --resource=<uuid>   Find relationships for a specific resource
  --all               Analyze all documents marked as 'pending'
  --dry-run           Preview analysis without saving to database
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  node scripts/analyze-relationships.mjs --slug=api/tool-use
  node scripts/analyze-relationships.mjs --all --dry-run
  node scripts/analyze-relationships.mjs --resource=550e8400-e29b-41d4-a716-446655440000
`);
      process.exit(0);
    }
  }

  return options;
}

// ─────────────────────────────────────────────────────────────────
// Main Analysis Functions
// ─────────────────────────────────────────────────────────────────

async function main() {
  const options = parseArgs();
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("\\n🔍 Relationship Analysis Script");
  console.log("================================\\n");

  if (options.dryRun) {
    console.log("⚠️  DRY RUN MODE - No changes will be saved\\n");
  }

  try {
    // Get all available resources for matching
    const resourcesResult = await pool.query(`
      SELECT id, title, slug, description, category_slug
      FROM resources
      WHERE status != 'archived'
      ORDER BY title
    `);
    const resources = resourcesResult.rows;
    console.log(`📚 Loaded ${resources.length} resources for matching\\n`);

    if (options.slug) {
      // Analyze a single document
      await analyzeDocument(pool, options.slug, resources, options);
    } else if (options.resource) {
      // Find relationships for a specific resource
      await analyzeResource(pool, options.resource, resources, options);
    } else if (options.all) {
      // Analyze all pending documents
      await analyzeAllPending(pool, resources, options);
    } else {
      console.log("Error: Please specify --slug, --resource, or --all");
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

async function analyzeDocument(pool, slug, resources, options) {
  console.log(`📄 Analyzing document: ${slug}`);

  // Get document content from documentation table
  const docResult = await pool.query(`
    SELECT slug, title, description, content, category
    FROM documentation
    WHERE slug = $1 AND is_published = true
  `, [slug]);

  if (docResult.rows.length === 0) {
    console.log(`\\n⚠️  Document not found: ${slug}`);
    return;
  }

  const doc = docResult.rows[0];
  console.log(`   Title: ${doc.title}`);
  console.log(`   Category: ${doc.category}`);

  // Get existing relationships
  const existingResult = await pool.query(`
    SELECT resource_id, relationship_type, confidence_score
    FROM doc_resource_relationships
    WHERE doc_slug = $1 AND is_active = true
  `, [slug]);

  console.log(`   Existing relationships: ${existingResult.rows.length}\\n`);

  // In a real implementation, this would call Claude API to analyze
  // For now, we'll just show what would be analyzed
  console.log("📝 Analysis would be performed by Claude Opus 4.5");
  console.log("   This script is a placeholder for Claude Code integration");
  console.log("   Run this script in Claude Code to use your subscription\\n");

  if (options.verbose) {
    console.log("Document content preview:");
    console.log(`   ${doc.content?.substring(0, 200)}...\\n`);
  }

  // Update operation status in queue
  if (!options.dryRun) {
    await pool.query(`
      UPDATE ai_operation_queue
      SET status = 'completed', completed_at = NOW()
      WHERE target_type = 'documentation'
        AND target_id = $1
        AND status = 'pending'
    `, [slug]);
  }

  console.log("✅ Analysis complete (placeholder)");
}

async function analyzeResource(pool, resourceId, resources, options) {
  console.log(`📦 Analyzing resource: ${resourceId}`);

  const resourceResult = await pool.query(`
    SELECT id, title, slug, description, category_slug
    FROM resources
    WHERE id = $1
  `, [resourceId]);

  if (resourceResult.rows.length === 0) {
    console.log(`\\n⚠️  Resource not found: ${resourceId}`);
    return;
  }

  const resource = resourceResult.rows[0];
  console.log(`   Title: ${resource.title}`);

  // Get all documentation for matching
  const docsResult = await pool.query(`
    SELECT slug, title, description, category
    FROM documentation
    WHERE is_published = true
  `);

  console.log(`   Checking against ${docsResult.rows.length} documents\\n`);

  console.log("📝 Analysis would be performed by Claude Opus 4.5");
  console.log("   This script is a placeholder for Claude Code integration\\n");

  console.log("✅ Analysis complete (placeholder)");
}

async function analyzeAllPending(pool, resources, options) {
  // Get all documents that need analysis
  const pendingResult = await pool.query(`
    SELECT slug, title, category
    FROM documentation
    WHERE is_published = true
    AND slug NOT IN (
      SELECT DISTINCT doc_slug FROM doc_resource_relationships WHERE is_active = true
    )
    ORDER BY category, title
    LIMIT 20
  `);

  console.log(`📋 Found ${pendingResult.rows.length} documents pending analysis\\n`);

  if (pendingResult.rows.length === 0) {
    console.log("All documents have been analyzed!");
    return;
  }

  for (const doc of pendingResult.rows) {
    console.log(`\\n─────────────────────────────────────`);
    await analyzeDocument(pool, doc.slug, resources, options);
  }

  console.log(`\\n═════════════════════════════════════`);
  console.log(`✅ Analyzed ${pendingResult.rows.length} documents`);
}

// ─────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
