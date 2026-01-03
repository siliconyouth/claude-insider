#!/usr/bin/env node

/**
 * AI-Powered Relationship Analysis with Extended Thinking
 *
 * Uses Claude Opus 4.5 with extended thinking (ultrathinking) for deep
 * semantic analysis of relationships between:
 * 1. Documentation pages and resources
 * 2. Resources and other resources
 *
 * Usage:
 *   node scripts/ai-analyze-relationships.mjs [options]
 *
 * Options:
 *   --type=doc|resource|all   Type of relationships to analyze (default: all)
 *   --batch=N                 Batch size for processing (default: 20)
 *   --limit=N                 Limit total items processed
 *   --dry-run                 Show what would be analyzed without API calls
 *   --clear                   Clear existing AI-generated relationships first
 *   --verbose                 Show detailed progress
 */

import './lib/env.mjs';
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

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");
const CLEAR = args.includes("--clear");

const TYPE_ARG = args.find(a => a.startsWith("--type="));
const ANALYSIS_TYPE = TYPE_ARG ? TYPE_ARG.split("=")[1] : "all";

const BATCH_ARG = args.find(a => a.startsWith("--batch="));
const BATCH_SIZE = BATCH_ARG ? parseInt(BATCH_ARG.split("=")[1], 10) : 20;

const LIMIT_ARG = args.find(a => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : null;

// Model with extended thinking
const MODEL = "claude-opus-4-5-20251101";
const MIN_CONFIDENCE = 0.65;
const THINKING_BUDGET = 10000; // tokens for extended thinking

// =============================================================================
// CONSOLE STYLING
// =============================================================================

const colors = {
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
  console.log(`${color}${msg}${colors.reset}`);
}

function progress(current, total, label = "") {
  const pct = Math.round((current / total) * 100);
  const filled = Math.floor(pct / 5);
  const bar = "█".repeat(filled) + "░".repeat(20 - filled);
  process.stdout.write(`\r  [${bar}] ${pct}% (${current}/${total}) ${label}    `);
}

// =============================================================================
// DATA LOADING
// =============================================================================

const { Pool } = pg;

async function loadDocumentation(pool) {
  const result = await pool.query(`
    SELECT slug, title, description, category, content
    FROM documentation
    WHERE is_published = TRUE
    ORDER BY category, order_index
  `);
  return result.rows;
}

async function loadResources(pool) {
  const result = await pool.query(`
    SELECT
      id, slug, title, description, category, subcategory,
      github_owner, github_repo, url,
      key_features, use_cases, target_audience
    FROM resources
    WHERE is_published = TRUE
    ORDER BY category, title
  `);
  return result.rows;
}

// =============================================================================
// DOC-TO-RESOURCE ANALYSIS
// =============================================================================

const DOC_RESOURCE_SYSTEM = `You are an expert at analyzing semantic relationships between documentation and resources.

## Context
Claude Insider is a documentation hub for Claude AI. You're analyzing which resources are genuinely related to each documentation page.

## Relationship Types (use the most specific one that applies)
- mentioned: Resource is explicitly referenced or linked in the documentation
- required: Resource is a prerequisite - users need this to follow the documentation
- recommended: Resource significantly enhances understanding or provides practical value
- example: Resource demonstrates or implements concepts from the documentation
- extends: Resource builds upon or extends the documentation's concepts
- alternative: Resource provides a different approach to the same topic

## Quality Guidelines
- Only identify relationships with genuine semantic connection
- Consider the resource's actual functionality, not just keyword matches
- Confidence 0.9+: Very strong, explicit connection
- Confidence 0.75-0.89: Clear conceptual relationship
- Confidence 0.65-0.74: Moderate but meaningful connection
- Below 0.65: Do not include

## Output Format
Return ONLY a valid JSON array. No markdown, no explanations.
[{"resourceId": "slug", "relationshipType": "type", "confidence": 0.XX, "reasoning": "One sentence explanation"}]
If no strong relationships exist, return: []`;

function selectCandidatesForDoc(doc, resources) {
  // Keyword matching for relevance scoring
  const docText = `${doc.title} ${doc.description || ""} ${doc.content || ""}`.toLowerCase();
  const docCategory = doc.category.toLowerCase();

  // Category relevance map
  const categoryRelevance = {
    "api": ["sdks", "official", "tools"],
    "configuration": ["tools", "rules", "official"],
    "integrations": ["mcp-servers", "tools", "sdks"],
    "tutorials": ["tools", "agents", "sdks", "showcases"],
    "tips-and-tricks": ["tools", "prompts", "rules"],
    "getting-started": ["official", "tools", "sdks"],
    "examples": ["showcases", "tools", "agents"],
  };

  const relevantCategories = categoryRelevance[docCategory] || ["tools", "sdks", "official"];

  // Score each resource
  const scored = resources.map(r => {
    let score = 0;

    // Category match
    if (relevantCategories.includes(r.category)) score += 3;

    // Title/description keyword matches
    const resourceText = `${r.title} ${r.description || ""}`.toLowerCase();
    const titleWords = r.title.toLowerCase().split(/\s+/);

    for (const word of titleWords) {
      if (word.length > 3 && docText.includes(word)) score += 2;
    }

    // Featured resources get a boost
    if (r.is_featured) score += 1;

    return { resource: r, score };
  });

  // Sort by score and take top candidates
  scored.sort((a, b) => b.score - a.score);

  // Return top 100 candidates (balances coverage vs token limits)
  return scored.slice(0, 100).map(s => s.resource);
}

async function analyzeDocResources(anthropic, doc, resources) {
  // Select relevant candidates first
  const candidates = selectCandidatesForDoc(doc, resources);

  // Create compact resource summaries
  const summaries = candidates.map(r => ({
    id: r.slug,
    title: r.title,
    desc: r.description?.slice(0, 150) || "",
    cat: r.category,
  }));

  const userPrompt = `## Documentation: "${doc.title}"
Category: ${doc.category}
Slug: ${doc.slug}
Description: ${doc.description || "N/A"}

Content (first 2000 chars):
${doc.content?.slice(0, 2000) || "N/A"}

---

## Available Resources (${summaries.length} items)
${JSON.stringify(summaries, null, 1)}

---

Think deeply about which resources have genuine semantic relationships with this documentation. Consider:
1. What concepts does this doc teach?
2. Which resources implement, extend, or complement these concepts?
3. What would actually help someone reading this documentation?

Return JSON array of relationships.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: {
        type: "enabled",
        budget_tokens: THINKING_BUDGET,
      },
      messages: [
        { role: "user", content: DOC_RESOURCE_SYSTEM + "\n\n" + userPrompt }
      ],
    });

    // Extract text content (after thinking)
    const textBlock = response.content.find(c => c.type === "text");
    if (!textBlock) return [];

    const text = textBlock.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    const relationships = JSON.parse(jsonMatch[0]);
    return relationships.filter(r => r.confidence >= MIN_CONFIDENCE);
  } catch (_error) {
    log(`    Error: ${error.message}`, colors.red);
    return [];
  }
}

// =============================================================================
// RESOURCE-TO-RESOURCE ANALYSIS
// =============================================================================

const RESOURCE_RESOURCE_SYSTEM = `You are an expert at analyzing semantic relationships between software resources, tools, and libraries.

## Context
Claude Insider catalogs resources for Claude AI development. You're identifying meaningful relationships between resources.

## Relationship Types
- similar: Very similar functionality or purpose (same problem domain)
- alternative: Drop-in replacement or competing solution
- complement: Work well together, different but synergistic
- uses: Source resource depends on or uses target resource
- integrates: Source has explicit integration with target
- fork: Source is a fork or derivative of target
- inspired_by: Source is inspired by target's approach

## Quality Guidelines
- Focus on functional relationships, not superficial similarities
- Same category doesn't automatically mean related
- Confidence 0.9+: Explicit documented relationship
- Confidence 0.75-0.89: Clear functional relationship
- Confidence 0.65-0.74: Meaningful but indirect connection
- Below 0.65: Do not include

## Output Format
Return ONLY a valid JSON array. No markdown, no explanations.
[{"sourceId": "slug", "targetId": "slug", "type": "relationship_type", "confidence": 0.XX, "reasoning": "One sentence", "bidirectional": true/false}]`;

async function analyzeResourceRelationships(anthropic, sourceResource, candidates) {
  const candidateSummaries = candidates.map(r => ({
    id: r.slug,
    title: r.title,
    desc: r.description?.slice(0, 150) || "",
    cat: r.category,
    github: r.github_owner ? `${r.github_owner}/${r.github_repo}` : null,
  }));

  const userPrompt = `## Source Resource: "${sourceResource.title}"
ID: ${sourceResource.slug}
Category: ${sourceResource.category}
${sourceResource.subcategory ? `Subcategory: ${sourceResource.subcategory}` : ""}
Description: ${sourceResource.description || "N/A"}
${sourceResource.github_owner ? `GitHub: ${sourceResource.github_owner}/${sourceResource.github_repo}` : ""}
${sourceResource.key_features?.length ? `Features: ${sourceResource.key_features.slice(0, 5).join(", ")}` : ""}
${sourceResource.use_cases?.length ? `Use Cases: ${sourceResource.use_cases.slice(0, 3).join(", ")}` : ""}

---

## Candidate Related Resources (${candidateSummaries.length} items)
${JSON.stringify(candidateSummaries, null, 1)}

---

Analyze which candidates have genuine relationships with the source resource. Think about:
1. Do they solve similar problems or target the same users?
2. Are they alternatives, complements, or dependencies?
3. Would knowing about one help users of the other?

Return JSON array of relationships. Set bidirectional=true if the relationship works both ways.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: {
        type: "enabled",
        budget_tokens: THINKING_BUDGET,
      },
      messages: [
        { role: "user", content: RESOURCE_RESOURCE_SYSTEM + "\n\n" + userPrompt }
      ],
    });

    const textBlock = response.content.find(c => c.type === "text");
    if (!textBlock) return [];

    const text = textBlock.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    const relationships = JSON.parse(jsonMatch[0]);
    return relationships.filter(r => r.confidence >= MIN_CONFIDENCE);
  } catch (_error) {
    log(`    Error: ${error.message}`, colors.red);
    return [];
  }
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function clearExistingRelationships(pool, type) {
  if (type === "doc" || type === "all") {
    await pool.query(`
      DELETE FROM doc_resource_relationships
      WHERE is_manual = FALSE
    `);
    log("  Cleared existing doc-resource relationships", colors.yellow);
  }

  if (type === "resource" || type === "all") {
    await pool.query(`
      DELETE FROM resource_relationships
      WHERE is_manual = FALSE
    `);
    log("  Cleared existing resource-resource relationships", colors.yellow);
  }
}

async function storeDocRelationship(pool, docSlug, resourceSlug, rel) {
  // Find resource ID
  const resourceResult = await pool.query(
    `SELECT id FROM resources WHERE slug = $1`,
    [resourceSlug]
  );

  if (resourceResult.rows.length === 0) return false;
  const resourceId = resourceResult.rows[0].id;

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
    MODEL + " (extended thinking)",
    rel.reasoning,
  ]);

  return true;
}

async function storeResourceRelationship(pool, sourceSlug, targetSlug, rel) {
  // Skip self-relationships
  if (sourceSlug === targetSlug) return false;

  // Find resource IDs
  const sourceResult = await pool.query(`SELECT id FROM resources WHERE slug = $1`, [sourceSlug]);
  const targetResult = await pool.query(`SELECT id FROM resources WHERE slug = $1`, [targetSlug]);

  if (sourceResult.rows.length === 0 || targetResult.rows.length === 0) return false;

  const sourceId = sourceResult.rows[0].id;
  const targetId = targetResult.rows[0].id;

  // Double-check no self-relationship (IDs might be same even with different slugs due to aliases)
  if (sourceId === targetId) return false;

  await pool.query(`
    INSERT INTO resource_relationships (
      source_resource_id, target_resource_id, relationship_type,
      confidence_score, ai_model, ai_reasoning,
      is_bidirectional, is_manual, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, TRUE)
    ON CONFLICT (source_resource_id, target_resource_id) DO UPDATE SET
      relationship_type = EXCLUDED.relationship_type,
      confidence_score = EXCLUDED.confidence_score,
      ai_model = EXCLUDED.ai_model,
      ai_reasoning = EXCLUDED.ai_reasoning,
      is_bidirectional = EXCLUDED.is_bidirectional,
      analyzed_at = NOW()
  `, [
    sourceId,
    targetId,
    rel.type,
    rel.confidence,
    MODEL + " (extended thinking)",
    rel.reasoning,
    rel.bidirectional || false,
  ]);

  return true;
}

async function updateDenormalizedCounts(pool) {
  log("\n📊 Updating denormalized counts...", colors.cyan);

  // Update related_docs_count
  await pool.query(`
    UPDATE resources r SET
      related_docs_count = (
        SELECT COUNT(*) FROM doc_resource_relationships dr
        WHERE dr.resource_id = r.id AND dr.is_active = TRUE
      ),
      related_doc_slugs = (
        SELECT ARRAY_AGG(dr.doc_slug)
        FROM doc_resource_relationships dr
        WHERE dr.resource_id = r.id AND dr.is_active = TRUE
      )
  `);

  // Update related_resources_count
  await pool.query(`
    UPDATE resources r SET
      related_resources_count = (
        SELECT COUNT(*) FROM (
          SELECT target_resource_id as related_id
          FROM resource_relationships
          WHERE source_resource_id = r.id AND is_active = TRUE
          UNION
          SELECT source_resource_id as related_id
          FROM resource_relationships
          WHERE target_resource_id = r.id AND is_active = TRUE AND is_bidirectional = TRUE
        ) combined
      ),
      related_resource_slugs = (
        SELECT ARRAY_AGG(res.slug)
        FROM (
          SELECT target_resource_id as related_id
          FROM resource_relationships
          WHERE source_resource_id = r.id AND is_active = TRUE
          UNION
          SELECT source_resource_id as related_id
          FROM resource_relationships
          WHERE target_resource_id = r.id AND is_active = TRUE AND is_bidirectional = TRUE
        ) combined
        JOIN resources res ON res.id = combined.related_id
      )
  `);

  log("  ✓ Counts updated", colors.green);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("\n" + "═".repeat(70));
  log(" 🧠 AI Relationship Analysis with Extended Thinking", colors.bold + colors.cyan);
  console.log("═".repeat(70));
  log(`   Model: ${MODEL}`, colors.dim);
  log(`   Thinking Budget: ${THINKING_BUDGET} tokens`, colors.dim);
  log(`   Analysis Type: ${ANALYSIS_TYPE}`, colors.dim);
  log(`   Batch Size: ${BATCH_SIZE}`, colors.dim);
  if (LIMIT) log(`   Limit: ${LIMIT}`, colors.dim);
  if (DRY_RUN) log(`   Mode: DRY RUN`, colors.yellow);
  console.log("═".repeat(70) + "\n");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const anthropic = new Anthropic();

  try {
    // Optionally clear existing relationships
    if (CLEAR && !DRY_RUN) {
      log("🗑️  Clearing existing AI-generated relationships...", colors.yellow);
      await clearExistingRelationships(pool, ANALYSIS_TYPE);
    }

    // Load data
    log("📦 Loading data...", colors.cyan);
    const docs = await loadDocumentation(pool);
    const resources = await loadResources(pool);
    log(`   ${docs.length} documentation pages`, colors.dim);
    log(`   ${resources.length} resources\n`, colors.dim);

    let totalDocRels = 0;
    let totalResRels = 0;

    // ===================
    // Doc-Resource Analysis
    // ===================
    if (ANALYSIS_TYPE === "doc" || ANALYSIS_TYPE === "all") {
      log("📚 Analyzing Doc-Resource Relationships...\n", colors.magenta);

      const docsToProcess = LIMIT ? docs.slice(0, LIMIT) : docs;

      for (let i = 0; i < docsToProcess.length; i++) {
        const doc = docsToProcess[i];
        progress(i + 1, docsToProcess.length, doc.slug);

        if (DRY_RUN) continue;

        const relationships = await analyzeDocResources(anthropic, doc, resources);

        for (const rel of relationships) {
          const stored = await storeDocRelationship(pool, doc.slug, rel.resourceId, rel);
          if (stored) totalDocRels++;
        }

        // Rate limiting - small delay between docs
        await new Promise(r => setTimeout(r, 500));
      }

      console.log("\n");
      log(`   ✓ Created ${totalDocRels} doc-resource relationships`, colors.green);
    }

    // ===================
    // Resource-Resource Analysis
    // ===================
    if (ANALYSIS_TYPE === "resource" || ANALYSIS_TYPE === "all") {
      log("\n🔗 Analyzing Resource-Resource Relationships...\n", colors.magenta);

      // Group resources by category for smarter candidate selection
      const byCategory = {};
      for (const r of resources) {
        if (!byCategory[r.category]) byCategory[r.category] = [];
        byCategory[r.category].push(r);
      }

      const resourcesToProcess = LIMIT ? resources.slice(0, LIMIT) : resources;

      for (let i = 0; i < resourcesToProcess.length; i++) {
        const resource = resourcesToProcess[i];
        progress(i + 1, resourcesToProcess.length, resource.slug);

        if (DRY_RUN) continue;

        // Get candidates: same category + related categories
        const candidates = [];

        // Same category (excluding self)
        const sameCategory = (byCategory[resource.category] || [])
          .filter(r => r.slug !== resource.slug);
        candidates.push(...sameCategory.slice(0, 30));

        // Related categories based on resource type
        const relatedCategories = {
          "tools": ["sdks", "agents"],
          "sdks": ["tools", "official"],
          "agents": ["tools", "mcp-servers"],
          "mcp-servers": ["tools", "agents"],
          "official": ["sdks", "tools"],
        };

        const related = relatedCategories[resource.category] || [];
        for (const cat of related) {
          const catResources = byCategory[cat] || [];
          candidates.push(...catResources.slice(0, 15));
        }

        // Limit candidates to avoid too long prompts
        const limitedCandidates = candidates.slice(0, 50);

        if (limitedCandidates.length === 0) continue;

        const relationships = await analyzeResourceRelationships(
          anthropic, resource, limitedCandidates
        );

        for (const rel of relationships) {
          const stored = await storeResourceRelationship(
            pool, resource.slug, rel.targetId, rel
          );
          if (stored) totalResRels++;
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      console.log("\n");
      log(`   ✓ Created ${totalResRels} resource-resource relationships`, colors.green);
    }

    // Update denormalized counts
    if (!DRY_RUN) {
      await updateDenormalizedCounts(pool);
    }

    // Summary
    console.log("\n" + "═".repeat(70));
    log(" ✅ Analysis Complete", colors.bold + colors.green);
    console.log("═".repeat(70));
    log(`   Doc-Resource relationships: ${totalDocRels}`, colors.cyan);
    log(`   Resource-Resource relationships: ${totalResRels}`, colors.cyan);
    console.log("═".repeat(70) + "\n");

  } catch (_error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
