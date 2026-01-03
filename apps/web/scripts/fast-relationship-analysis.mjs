#!/usr/bin/env node

/**
 * Fast Relationship Analysis
 *
 * Optimized for speed using:
 * - Claude Sonnet 4 (faster than Opus)
 * - Batch processing (25 resources per API call)
 * - Parallel API calls (5 concurrent)
 * - No extended thinking
 *
 * Usage:
 *   node scripts/fast-relationship-analysis.mjs [options]
 *
 * Options:
 *   --type=doc|resource|all   Type to analyze (default: all)
 *   --parallel=N              Concurrent API calls (default: 5)
 *   --batch=N                 Resources per batch (default: 25)
 *   --clear                   Clear existing relationships first
 *   --dry-run                 Show what would be done
 */

import './lib/env.mjs';
import { readFileSync, existsSync } from "fs";
import { join as _join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));

// =============================================================================
// CONFIGURATION
// =============================================================================

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const CLEAR = args.includes("--clear");

const TYPE_ARG = args.find(a => a.startsWith("--type="));
const ANALYSIS_TYPE = TYPE_ARG ? TYPE_ARG.split("=")[1] : "all";

const PARALLEL_ARG = args.find(a => a.startsWith("--parallel="));
const PARALLEL = PARALLEL_ARG ? parseInt(PARALLEL_ARG.split("=")[1], 10) : 5;

const BATCH_ARG = args.find(a => a.startsWith("--batch="));
const BATCH_SIZE = BATCH_ARG ? parseInt(BATCH_ARG.split("=")[1], 10) : 25;

const MODEL = "claude-sonnet-4-20250514"; // Fast model
const _MIN_CONFIDENCE = 0.65;

// =============================================================================
// CONSOLE STYLING
// =============================================================================

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function log(msg, color = "") {
  console.log(`${color}${msg}${c.reset}`);
}

function progress(current, total, extra = "") {
  const pct = Math.round((current / total) * 100);
  const filled = Math.floor(pct / 5);
  const bar = "█".repeat(filled) + "░".repeat(20 - filled);
  process.stdout.write(`\r  [${bar}] ${pct}% (${current}/${total}) ${extra}    `);
}

// =============================================================================
// DATA LOADING
// =============================================================================

const { Pool } = pg;

async function loadData(pool) {
  const [docsRes, resourcesRes] = await Promise.all([
    pool.query(`
      SELECT slug, title, description, category, content
      FROM documentation WHERE is_published = TRUE
      ORDER BY category, order_index
    `),
    pool.query(`
      SELECT id, slug, title, description, category, subcategory,
             github_owner, github_repo, key_features, use_cases, target_audience
      FROM resources WHERE is_published = TRUE
      ORDER BY category, title
    `)
  ]);

  return {
    docs: docsRes.rows,
    resources: resourcesRes.rows,
    resourceMap: new Map(resourcesRes.rows.map(r => [r.slug, r]))
  };
}

// =============================================================================
// BATCH DOC-RESOURCE ANALYSIS
// =============================================================================

const DOC_BATCH_PROMPT = `Analyze which resources relate to each documentation page.

Relationship types: mentioned, required, recommended, example, extends, alternative

For each doc, identify up to 10 most relevant resources.
Return JSON: {"docSlug": [{"resourceId": "slug", "type": "type", "confidence": 0.65-1.0, "reason": "brief"}]}
Only include confidence >= 0.65. Empty object {} if no matches.`;

async function analyzeDocBatch(anthropic, docs, resources) {
  // Create compact summaries
  const docSummaries = docs.map(d => ({
    slug: d.slug,
    title: d.title,
    cat: d.category,
    desc: d.description?.slice(0, 100) || "",
  }));

  const resourceSummaries = resources.slice(0, 150).map(r => ({
    id: r.slug,
    title: r.title,
    cat: r.category,
    desc: r.description?.slice(0, 80) || "",
  }));

  const prompt = `${DOC_BATCH_PROMPT}

DOCS:
${JSON.stringify(docSummaries)}

RESOURCES:
${JSON.stringify(resourceSummaries)}

Return JSON object mapping each doc slug to its related resources.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch (_error) {
    log(`    Error: ${error.message}`, c.red);
    return {};
  }
}

// =============================================================================
// BATCH RESOURCE-RESOURCE ANALYSIS
// =============================================================================

const RESOURCE_BATCH_PROMPT = `Analyze relationships between source resources and candidate resources.

Types: similar, alternative, complement, uses, integrates, fork, inspired_by

For each source, find related candidates (max 5 each).
Return JSON: {"sourceSlug": [{"targetId": "slug", "type": "type", "confidence": 0.65-1.0, "bidirectional": bool}]}
Skip self-relationships. Empty {} if no matches.`;

async function analyzeResourceBatch(anthropic, sources, candidates) {
  const sourceSummaries = sources.map(r => ({
    id: r.slug,
    title: r.title,
    cat: r.category,
    desc: r.description?.slice(0, 100) || "",
    github: r.github_owner ? `${r.github_owner}/${r.github_repo}` : null,
  }));

  const candidateSummaries = candidates.map(r => ({
    id: r.slug,
    title: r.title,
    cat: r.category,
    desc: r.description?.slice(0, 80) || "",
  }));

  const prompt = `${RESOURCE_BATCH_PROMPT}

SOURCES:
${JSON.stringify(sourceSummaries)}

CANDIDATES:
${JSON.stringify(candidateSummaries)}

Return JSON mapping each source slug to related candidates.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  } catch (_error) {
    log(`    Error: ${error.message}`, c.red);
    return {};
  }
}

// =============================================================================
// PARALLEL PROCESSING
// =============================================================================

async function _processInParallel(items, batchSize, parallelCount, processor) {
  const results = [];
  const batches = [];

  // Create batches
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  // Process in parallel waves
  for (let i = 0; i < batches.length; i += parallelCount) {
    const wave = batches.slice(i, i + parallelCount);
    const waveResults = await Promise.all(wave.map(processor));
    results.push(...waveResults);
    progress(Math.min(i + parallelCount, batches.length), batches.length);
  }

  return results;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function clearRelationships(pool, type) {
  if (type === "doc" || type === "all") {
    await pool.query(`DELETE FROM doc_resource_relationships WHERE is_manual = FALSE`);
    log("  Cleared doc-resource relationships", c.yellow);
  }
  if (type === "resource" || type === "all") {
    await pool.query(`DELETE FROM resource_relationships WHERE is_manual = FALSE`);
    log("  Cleared resource-resource relationships", c.yellow);
  }
}

async function insertDocRelationships(pool, docSlug, relationships, resourceMap) {
  let count = 0;
  for (const rel of relationships) {
    const resource = resourceMap.get(rel.resourceId);
    if (!resource) continue;

    try {
      await pool.query(`
        INSERT INTO doc_resource_relationships
        (doc_slug, resource_id, relationship_type, confidence_score, ai_model, ai_reasoning, is_manual, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, FALSE, TRUE)
        ON CONFLICT (doc_slug, resource_id) DO UPDATE SET
          relationship_type = EXCLUDED.relationship_type,
          confidence_score = EXCLUDED.confidence_score,
          ai_model = EXCLUDED.ai_model,
          ai_reasoning = EXCLUDED.ai_reasoning,
          analyzed_at = NOW()
      `, [docSlug, resource.id, rel.type, rel.confidence, MODEL, rel.reason || ""]);
      count++;
    } catch (_e) { /* skip duplicates */ }
  }
  return count;
}

async function insertResourceRelationships(pool, sourceSlug, relationships, resourceMap) {
  let count = 0;
  const source = resourceMap.get(sourceSlug);
  if (!source) return 0;

  for (const rel of relationships) {
    if (rel.targetId === sourceSlug) continue; // Skip self
    const target = resourceMap.get(rel.targetId);
    if (!target || source.id === target.id) continue;

    try {
      await pool.query(`
        INSERT INTO resource_relationships
        (source_resource_id, target_resource_id, relationship_type, confidence_score,
         ai_model, ai_reasoning, is_bidirectional, is_manual, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, TRUE)
        ON CONFLICT (source_resource_id, target_resource_id) DO UPDATE SET
          relationship_type = EXCLUDED.relationship_type,
          confidence_score = EXCLUDED.confidence_score,
          ai_model = EXCLUDED.ai_model,
          is_bidirectional = EXCLUDED.is_bidirectional,
          analyzed_at = NOW()
      `, [source.id, target.id, rel.type, rel.confidence, MODEL, "", rel.bidirectional || false]);
      count++;
    } catch (_e) { /* skip duplicates */ }
  }
  return count;
}

async function updateCounts(pool) {
  await pool.query(`
    UPDATE resources r SET
      related_docs_count = (SELECT COUNT(*) FROM doc_resource_relationships WHERE resource_id = r.id AND is_active = TRUE),
      related_doc_slugs = (SELECT ARRAY_AGG(doc_slug) FROM doc_resource_relationships WHERE resource_id = r.id AND is_active = TRUE)
  `);

  await pool.query(`
    UPDATE resources r SET
      related_resources_count = (
        SELECT COUNT(*) FROM (
          SELECT target_resource_id FROM resource_relationships WHERE source_resource_id = r.id AND is_active = TRUE
          UNION
          SELECT source_resource_id FROM resource_relationships WHERE target_resource_id = r.id AND is_active = TRUE AND is_bidirectional = TRUE
        ) x
      ),
      related_resource_slugs = (
        SELECT ARRAY_AGG(res.slug) FROM (
          SELECT target_resource_id as rid FROM resource_relationships WHERE source_resource_id = r.id AND is_active = TRUE
          UNION
          SELECT source_resource_id FROM resource_relationships WHERE target_resource_id = r.id AND is_active = TRUE AND is_bidirectional = TRUE
        ) x JOIN resources res ON res.id = x.rid
      )
  `);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("\n" + "═".repeat(70));
  log(" ⚡ Fast Relationship Analysis", c.bold + c.cyan);
  console.log("═".repeat(70));
  log(`   Model: ${MODEL} (fast)`, c.dim);
  log(`   Parallel: ${PARALLEL} concurrent calls`, c.dim);
  log(`   Batch: ${BATCH_SIZE} items per call`, c.dim);
  log(`   Type: ${ANALYSIS_TYPE}`, c.dim);
  if (DRY_RUN) log(`   Mode: DRY RUN`, c.yellow);
  console.log("═".repeat(70) + "\n");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const anthropic = new Anthropic();

  try {
    if (CLEAR && !DRY_RUN) {
      log("🗑️  Clearing existing relationships...", c.yellow);
      await clearRelationships(pool, ANALYSIS_TYPE);
    }

    log("📦 Loading data...", c.cyan);
    const { docs, resources, resourceMap } = await loadData(pool);
    log(`   ${docs.length} docs, ${resources.length} resources\n`, c.dim);

    let totalDocRels = 0;
    let totalResRels = 0;

    // ===================
    // Doc-Resource (batch all docs in one call for speed)
    // ===================
    if (ANALYSIS_TYPE === "doc" || ANALYSIS_TYPE === "all") {
      log("📚 Analyzing Doc-Resource relationships...\n", c.magenta);

      if (!DRY_RUN) {
        // Process docs in batches of 10, with parallel calls
        const docBatches = [];
        for (let i = 0; i < docs.length; i += 10) {
          docBatches.push(docs.slice(i, i + 10));
        }

        let processed = 0;
        for (let i = 0; i < docBatches.length; i += PARALLEL) {
          const wave = docBatches.slice(i, i + PARALLEL);
          const results = await Promise.all(
            wave.map(batch => analyzeDocBatch(anthropic, batch, resources))
          );

          for (const result of results) {
            for (const [docSlug, rels] of Object.entries(result)) {
              if (Array.isArray(rels)) {
                totalDocRels += await insertDocRelationships(pool, docSlug, rels, resourceMap);
              }
            }
          }

          processed += wave.length;
          progress(processed, docBatches.length, `${totalDocRels} relationships`);
        }
      }

      console.log("\n");
      log(`   ✓ Created ${totalDocRels} doc-resource relationships`, c.green);
    }

    // ===================
    // Resource-Resource
    // ===================
    if (ANALYSIS_TYPE === "resource" || ANALYSIS_TYPE === "all") {
      log("\n🔗 Analyzing Resource-Resource relationships...\n", c.magenta);

      if (!DRY_RUN) {
        // Group by category for smarter candidate selection
        const byCategory = {};
        for (const r of resources) {
          if (!byCategory[r.category]) byCategory[r.category] = [];
          byCategory[r.category].push(r);
        }

        const categories = Object.keys(byCategory);
        let catIndex = 0;

        for (const category of categories) {
          const catResources = byCategory[category];
          log(`   Category: ${category} (${catResources.length} resources)`, c.dim);

          // Get candidates from same + related categories
          const relatedCats = {
            "tools": ["sdks", "agents"],
            "sdks": ["tools", "official"],
            "agents": ["tools", "mcp-servers"],
            "mcp-servers": ["tools", "agents"],
            "official": ["sdks", "tools"],
          };

          let candidates = [...catResources];
          for (const relCat of (relatedCats[category] || [])) {
            candidates.push(...(byCategory[relCat] || []).slice(0, 50));
          }
          candidates = candidates.slice(0, 100); // Limit candidates

          // Process in batches
          const batches = [];
          for (let i = 0; i < catResources.length; i += BATCH_SIZE) {
            batches.push(catResources.slice(i, i + BATCH_SIZE));
          }

          for (let i = 0; i < batches.length; i += PARALLEL) {
            const wave = batches.slice(i, i + PARALLEL);
            const results = await Promise.all(
              wave.map(batch => analyzeResourceBatch(anthropic, batch, candidates))
            );

            for (const result of results) {
              for (const [sourceSlug, rels] of Object.entries(result)) {
                if (Array.isArray(rels)) {
                  totalResRels += await insertResourceRelationships(pool, sourceSlug, rels, resourceMap);
                }
              }
            }
          }

          catIndex++;
          progress(catIndex, categories.length, `${totalResRels} relationships`);
        }
      }

      console.log("\n");
      log(`   ✓ Created ${totalResRels} resource-resource relationships`, c.green);
    }

    // Update counts
    if (!DRY_RUN) {
      log("\n📊 Updating counts...", c.cyan);
      await updateCounts(pool);
      log("   ✓ Done", c.green);
    }

    // Summary
    console.log("\n" + "═".repeat(70));
    log(" ✅ Complete!", c.bold + c.green);
    console.log("═".repeat(70));
    log(`   Doc-Resource: ${totalDocRels}`, c.cyan);
    log(`   Resource-Resource: ${totalResRels}`, c.cyan);
    console.log("═".repeat(70) + "\n");

  } finally {
    await pool.end();
  }
}

main().catch(console.error);
