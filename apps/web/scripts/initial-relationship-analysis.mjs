#!/usr/bin/env node

/**
 * Initial Relationship Analysis Script
 *
 * Analyzes relationships between documentation pages and resources
 * using Claude Opus 4.5 for intelligent matching.
 *
 * Usage:
 *   node scripts/initial-relationship-analysis.mjs [--dry-run] [--limit=N] [--verbose]
 *
 * Options:
 *   --dry-run   Show what would be analyzed without making API calls
 *   --limit=N   Limit to first N items for testing
 *   --verbose   Show detailed progress
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

// =============================================================================
// CONFIGURATION
// =============================================================================

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");
const LIMIT_ARG = process.argv.find(a => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : null;

const MODEL = "claude-opus-4-5-20251101";
const MIN_CONFIDENCE = 0.6;
const BATCH_SIZE = 10; // Resources per batch for analysis

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

// =============================================================================
// UTILITIES
// =============================================================================

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  red: "\x1b[31m",
  dim: "\x1b[90m",
};

function log(msg, color = "") {
  console.log(`${color}${msg}${colors.reset}`);
}

function progress(current, total, label) {
  const pct = Math.round((current / total) * 100);
  const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
  process.stdout.write(`\r  ${bar} ${pct}% (${current}/${total}) ${label}`);
}

// =============================================================================
// DATA LOADING
// =============================================================================

async function loadDocumentation(pool) {
  const result = await pool.query(`
    SELECT slug, title, description, category, content
    FROM documentation
    WHERE is_published = TRUE
    ORDER BY category, order_index
  `);
  return result.rows;
}

function loadResources() {
  const categories = [
    "official", "tools", "mcp-servers", "rules", "prompts",
    "agents", "tutorials", "sdks", "showcases", "community"
  ];

  const resources = [];
  for (const cat of categories) {
    const filePath = join(ROOT_DIR, "data/resources", `${cat}.json`);
    if (existsSync(filePath)) {
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      resources.push(...data);
    }
  }
  return resources;
}

// =============================================================================
// RELATIONSHIP ANALYSIS
// =============================================================================

const ANALYSIS_PROMPT = `You are an expert at analyzing relationships between documentation and resources for Claude Insider, a documentation hub for Claude AI.

## Your Task
Analyze the given documentation page and list of resources. Identify which resources are related to the documentation topic.

## Relationship Types
- **mentioned**: Resource is explicitly mentioned or linked in the doc
- **related**: Resource covers a similar topic or use case
- **example**: Resource is an example or implementation of concepts in the doc
- **required**: Resource is a prerequisite for the documentation
- **recommended**: Resource is recommended for users reading this doc
- **alternative**: Resource provides an alternative approach
- **extends**: Resource extends or builds upon the doc's concepts
- **implements**: Resource implements the doc's concepts

## Output Format
Return a JSON array of relationships. Only include resources with confidence >= 0.6.

[
  {
    "resourceId": "string - the resource ID",
    "relationshipType": "string - one of the types above",
    "confidence": 0.0-1.0,
    "reasoning": "string - brief explanation (1 sentence)"
  }
]

If no strong relationships exist, return an empty array: []`;

async function analyzeDocToResources(anthropic, doc, resources) {
  // Prepare resource summaries for the prompt
  const resourceSummaries = resources.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    tags: r.tags?.slice(0, 5) || [],
  }));

  const userPrompt = `## Documentation Page

**Slug**: ${doc.slug}
**Title**: ${doc.title}
**Category**: ${doc.category}
**Description**: ${doc.description || "N/A"}

**Content Preview** (first 2000 chars):
${doc.content?.slice(0, 2000) || "N/A"}

---

## Resources to Analyze

${JSON.stringify(resourceSummaries, null, 2)}

---

Analyze which resources are related to this documentation page. Return JSON array only.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: ANALYSIS_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textContent = response.content.find(c => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return [];
    }

    // Parse response
    const text = textContent.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const relationships = JSON.parse(jsonMatch[0]);
    return relationships.filter(r => r.confidence >= MIN_CONFIDENCE);
  } catch (error) {
    log(`    Error analyzing: ${error.message}`, colors.red);
    return [];
  }
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function storeRelationships(pool, docSlug, relationships) {
  let stored = 0;

  for (const rel of relationships) {
    // Find resource ID in database
    const resourceResult = await pool.query(
      `SELECT id FROM resources WHERE slug = $1 OR id::text = $1`,
      [rel.resourceId]
    );

    if (resourceResult.rows.length === 0) {
      if (VERBOSE) {
        log(`    Resource not found in DB: ${rel.resourceId}`, colors.dim);
      }
      continue;
    }

    const resourceId = resourceResult.rows[0].id;

    // Upsert relationship
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
      rel.relationshipType,
      rel.confidence,
      MODEL,
      rel.reasoning,
    ]);

    stored++;
  }

  return stored;
}

async function updateRelatedDocsCounts(pool) {
  // Update the denormalized related_docs_count on resources
  await pool.query(`
    UPDATE resources r SET
      related_docs_count = (
        SELECT COUNT(*) FROM doc_resource_relationships dr
        WHERE dr.resource_id = r.id AND dr.is_active = TRUE
      )
  `);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  Initial Relationship Analysis");
  console.log("=".repeat(60) + "\n");

  if (DRY_RUN) {
    log("Running in DRY RUN mode - no API calls or DB writes\n", colors.yellow);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    // Load data
    log("Loading documentation...", colors.blue);
    let docs = await loadDocumentation(pool);
    log(`  Found ${docs.length} documentation pages`, colors.green);

    log("\nLoading resources...", colors.blue);
    let resources = loadResources();
    log(`  Found ${resources.length} resources`, colors.green);

    // Apply limit if specified
    if (LIMIT) {
      docs = docs.slice(0, LIMIT);
      log(`\nLimiting to first ${LIMIT} docs`, colors.yellow);
    }

    console.log("\n" + "-".repeat(60));
    console.log("  Analyzing Relationships");
    console.log("-".repeat(60) + "\n");

    let totalRelationships = 0;
    let processedDocs = 0;

    for (const doc of docs) {
      processedDocs++;
      log(`\n[${processedDocs}/${docs.length}] ${doc.title}`, colors.blue);
      log(`  Slug: ${doc.slug}`, colors.dim);

      if (DRY_RUN) {
        log(`  [DRY RUN] Would analyze against ${resources.length} resources`, colors.yellow);
        continue;
      }

      // Analyze in batches to avoid huge prompts
      const allRelationships = [];
      for (let i = 0; i < resources.length; i += BATCH_SIZE) {
        const batch = resources.slice(i, i + BATCH_SIZE);
        if (VERBOSE) {
          progress(i + batch.length, resources.length, "resources analyzed");
        }

        const batchRelationships = await analyzeDocToResources(anthropic, doc, batch);
        allRelationships.push(...batchRelationships);

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (VERBOSE) {
        console.log(); // New line after progress bar
      }

      // Store relationships
      if (allRelationships.length > 0) {
        const stored = await storeRelationships(pool, doc.slug, allRelationships);
        log(`  Found ${allRelationships.length} relationships, stored ${stored}`, colors.green);
        totalRelationships += stored;

        // Log high-confidence ones
        const highConf = allRelationships.filter(r => r.confidence >= 0.8);
        for (const rel of highConf.slice(0, 3)) {
          log(`    → ${rel.resourceId} (${rel.relationshipType}, ${Math.round(rel.confidence * 100)}%)`, colors.dim);
        }
      } else {
        log(`  No strong relationships found`, colors.dim);
      }
    }

    // Update counts
    if (!DRY_RUN) {
      log("\nUpdating relationship counts...", colors.blue);
      await updateRelatedDocsCounts(pool);
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("  Analysis Complete");
    console.log("=".repeat(60));
    console.log(`
  Documentation Pages: ${docs.length}
  Resources Analyzed:  ${resources.length}
  Relationships Found: ${totalRelationships}
    `);

    if (DRY_RUN) {
      log("This was a dry run. Run without --dry-run to execute.\n", colors.yellow);
    }

  } finally {
    await pool.end();
  }
}

main().catch(error => {
  log(`\nError: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
