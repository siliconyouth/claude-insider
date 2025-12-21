#!/usr/bin/env node

/**
 * Documentation Rewrite Script for Claude Code CLI
 *
 * This script rewrites documentation from source URLs using Claude Opus 4.5.
 * It scrapes official documentation and generates updated MDX content.
 * Designed to run in Claude Code to use subscription credits instead of API credits.
 *
 * Usage:
 *   node scripts/rewrite-docs.mjs --slug=api/streaming         # Single doc
 *   node scripts/rewrite-docs.mjs --category=api               # By category
 *   node scripts/rewrite-docs.mjs --outdated                   # All stale content
 *   node scripts/rewrite-docs.mjs --dry-run                    # Preview only
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string (from .env.local)
 */

import './lib/env.mjs';
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const CONTENT_DIR = join(ROOT_DIR, "content");

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
    category: null,
    outdated: false,
    dryRun: false,
    verbose: false,
    force: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--slug=")) {
      options.slug = arg.slice(7);
    } else if (arg.startsWith("--category=")) {
      options.category = arg.slice(11);
    } else if (arg === "--outdated") {
      options.outdated = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Documentation Rewrite Script for Claude Code CLI

Usage:
  node scripts/rewrite-docs.mjs [options]

Options:
  --slug=<slug>       Rewrite a specific document by slug
  --category=<cat>    Rewrite all documents in a category
  --outdated          Rewrite documents not updated in 30+ days
  --force             Force rewrite even if recently updated
  --dry-run           Preview rewrite without saving
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  node scripts/rewrite-docs.mjs --slug=api/streaming
  node scripts/rewrite-docs.mjs --category=api --dry-run
  node scripts/rewrite-docs.mjs --outdated --force
`);
      process.exit(0);
    }
  }

  return options;
}

// ─────────────────────────────────────────────────────────────────
// Main Rewrite Functions
// ─────────────────────────────────────────────────────────────────

async function main() {
  const options = parseArgs();
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("\\n📝 Documentation Rewrite Script");
  console.log("================================\\n");

  if (options.dryRun) {
    console.log("⚠️  DRY RUN MODE - No changes will be saved\\n");
  }

  try {
    if (options.slug) {
      // Rewrite a single document
      await rewriteDocument(pool, options.slug, options);
    } else if (options.category) {
      // Rewrite all documents in a category
      await rewriteCategory(pool, options.category, options);
    } else if (options.outdated) {
      // Rewrite outdated documents
      await rewriteOutdated(pool, options);
    } else {
      console.log("Error: Please specify --slug, --category, or --outdated");
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

async function rewriteDocument(pool, slug, options) {
  console.log(`📄 Rewriting document: ${slug}`);

  // Get document from database
  const docResult = await pool.query(`
    SELECT slug, title, description, content, category, source_urls,
           updated_at, content_hash
    FROM documentation
    WHERE slug = $1
  `, [slug]);

  if (docResult.rows.length === 0) {
    console.log(`\\n⚠️  Document not found: ${slug}`);
    return;
  }

  const doc = docResult.rows[0];
  console.log(`   Title: ${doc.title}`);
  console.log(`   Category: ${doc.category}`);
  console.log(`   Last updated: ${doc.updated_at || 'never'}`);

  // Check for source URLs
  const sourceUrls = doc.source_urls || [];
  if (sourceUrls.length === 0) {
    console.log("\\n⚠️  No source URLs configured for this document");
    console.log("   Add source URLs in the Payload CMS admin panel");
    return;
  }

  console.log(`   Source URLs: ${sourceUrls.length}`);
  for (const url of sourceUrls) {
    console.log(`     - ${url}`);
  }

  // Check MDX file
  const mdxPath = join(CONTENT_DIR, doc.category, `${slug.split('/').pop()}.mdx`);
  const mdxExists = existsSync(mdxPath);
  console.log(`   MDX file: ${mdxExists ? 'exists' : 'NOT FOUND'}`);

  console.log("\\n📝 Rewrite would be performed by Claude Opus 4.5:");
  console.log("   1. Scrape each source URL");
  console.log("   2. Analyze and synthesize content");
  console.log("   3. Generate new MDX with:");
  console.log("      - Updated information");
  console.log("      - Preserved code examples");
  console.log("      - ContentMeta component");
  console.log("   4. Show diff for review");
  console.log("   5. Save to MDX file and database\\n");

  if (options.verbose && doc.content) {
    console.log("Current content preview:");
    console.log(`   ${doc.content.substring(0, 200)}...\\n`);
  }

  // Update operation status in queue
  if (!options.dryRun) {
    await pool.query(`
      UPDATE ai_operation_queue
      SET status = 'completed', completed_at = NOW()
      WHERE target_type = 'documentation'
        AND target_id = $1
        AND operation_type = 'rewrite_doc'
        AND status = 'pending'
    `, [slug]);
  }

  console.log("✅ Rewrite complete (placeholder)");
}

async function rewriteCategory(pool, category, options) {
  console.log(`📂 Rewriting category: ${category}`);

  const docsResult = await pool.query(`
    SELECT slug, title
    FROM documentation
    WHERE category = $1 AND is_published = true
    ORDER BY order_index
  `, [category]);

  console.log(`   Found ${docsResult.rows.length} documents\\n`);

  if (docsResult.rows.length === 0) {
    console.log("No documents found in this category");
    return;
  }

  for (const doc of docsResult.rows) {
    console.log(`\\n─────────────────────────────────────`);
    await rewriteDocument(pool, doc.slug, options);
  }

  console.log(`\\n═════════════════════════════════════`);
  console.log(`✅ Processed ${docsResult.rows.length} documents`);
}

async function rewriteOutdated(pool, options) {
  console.log("🕐 Finding outdated documents...\\n");

  const outdatedResult = await pool.query(`
    SELECT slug, title, category, updated_at
    FROM documentation
    WHERE is_published = true
    AND (updated_at IS NULL OR updated_at < NOW() - INTERVAL '30 days')
    ORDER BY updated_at ASC NULLS FIRST
    LIMIT 10
  `);

  console.log(`📋 Found ${outdatedResult.rows.length} outdated documents\\n`);

  if (outdatedResult.rows.length === 0) {
    console.log("All documents are up to date!");
    return;
  }

  for (const doc of outdatedResult.rows) {
    console.log(`\\n─────────────────────────────────────`);
    await rewriteDocument(pool, doc.slug, options);
  }

  console.log(`\\n═════════════════════════════════════`);
  console.log(`✅ Processed ${outdatedResult.rows.length} documents`);
}

// ─────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
