#!/usr/bin/env node

/**
 * Manual Relationship Analysis Helper
 *
 * Outputs resource summaries for manual AI analysis and accepts
 * relationship data to insert into the database.
 *
 * Usage:
 *   node scripts/manual-relationship-analysis.mjs --list=<category>
 *   node scripts/manual-relationship-analysis.mjs --insert
 */

import './lib/env.mjs';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const args = process.argv.slice(2);
const LIST_ARG = args.find(a => a.startsWith('--list='));
const INSERT = args.includes('--insert');
const STATS = args.includes('--stats');
const CATEGORY = LIST_ARG ? LIST_ARG.split('=')[1] : null;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// =============================================================================
// LIST RESOURCES FOR A CATEGORY
// =============================================================================

async function listResources(category) {
  const filePath = join(__dirname, `../data/resources/${category}.json`);
  if (!existsSync(filePath)) {
    console.error(`Category file not found: ${category}.json`);
    process.exit(1);
  }

  const resources = JSON.parse(readFileSync(filePath, 'utf-8'));

  console.log(`\n# ${category.toUpperCase()} Resources (${resources.length} total)\n`);

  resources.forEach((r, i) => {
    console.log(`## ${i + 1}. ${r.title} [${r.slug}]`);
    console.log(`   ${r.description?.slice(0, 150) || 'No description'}...`);
    if (r.keyFeatures?.length) {
      console.log(`   Features: ${r.keyFeatures.slice(0, 3).join(', ')}`);
    }
    if (r.subcategory) {
      console.log(`   Subcategory: ${r.subcategory}`);
    }
    console.log('');
  });
}

// =============================================================================
// INSERT RELATIONSHIPS FROM STDIN JSON
// =============================================================================

async function insertRelationships() {
  let input = '';
  process.stdin.setEncoding('utf8');

  for await (const chunk of process.stdin) {
    input += chunk;
  }

  const relationships = JSON.parse(input);
  console.log(`\nInserting ${relationships.length} relationships...\n`);

  // Get resource ID mapping
  const { rows } = await pool.query(`SELECT id, slug FROM resources WHERE is_published = TRUE`);
  const slugToId = new Map(rows.map(r => [r.slug, r.id]));

  let inserted = 0;
  let skipped = 0;

  for (const rel of relationships) {
    const sourceId = slugToId.get(rel.source);
    const targetId = slugToId.get(rel.target);

    if (!sourceId || !targetId) {
      console.log(`  ⚠ Skipped: ${rel.source} → ${rel.target} (slug not found)`);
      skipped++;
      continue;
    }

    if (sourceId === targetId) {
      console.log(`  ⚠ Skipped self-relationship: ${rel.source}`);
      skipped++;
      continue;
    }

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
          ai_reasoning = EXCLUDED.ai_reasoning,
          is_bidirectional = EXCLUDED.is_bidirectional,
          analyzed_at = NOW()
      `, [
        sourceId,
        targetId,
        rel.type,
        rel.confidence || 0.8,
        'claude-opus-4-5 (claude-code)',
        rel.reason || '',
        rel.bidirectional || false
      ]);
      inserted++;
      console.log(`  ✓ ${rel.source} → ${rel.target} (${rel.type})`);
    } catch (_e) {
      console.log(`  ✗ Error: ${rel.source} → ${rel.target}: ${e.message}`);
      skipped++;
    }
  }

  console.log(`\n✓ Inserted: ${inserted}, Skipped: ${skipped}`);
}

// =============================================================================
// SHOW STATS
// =============================================================================

async function showStats() {
  const [total, byType, byCategory] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM resource_relationships WHERE is_active = TRUE`),
    pool.query(`
      SELECT relationship_type, COUNT(*) as count
      FROM resource_relationships WHERE is_active = TRUE
      GROUP BY relationship_type ORDER BY count DESC
    `),
    pool.query(`
      SELECT r.category, COUNT(*) as count
      FROM resource_relationships rr
      JOIN resources r ON rr.source_resource_id = r.id
      WHERE rr.is_active = TRUE
      GROUP BY r.category ORDER BY count DESC
    `)
  ]);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(' Resource Relationship Statistics');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n Total Relationships: ${total.rows[0].count}\n`);

  console.log(' By Type:');
  byType.rows.forEach(r => console.log(`   ${r.relationship_type}: ${r.count}`));

  console.log('\n By Source Category:');
  byCategory.rows.forEach(r => console.log(`   ${r.category}: ${r.count}`));

  console.log('═══════════════════════════════════════════════════════\n');
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  try {
    if (CATEGORY) {
      await listResources(CATEGORY);
    } else if (INSERT) {
      await insertRelationships();
    } else if (STATS) {
      await showStats();
    } else {
      console.log(`
Usage:
  node scripts/manual-relationship-analysis.mjs --list=<category>  # List resources
  node scripts/manual-relationship-analysis.mjs --insert          # Insert from stdin JSON
  node scripts/manual-relationship-analysis.mjs --stats           # Show statistics

Categories: agents, community, mcp-servers, official, prompts, rules, sdks, showcases, tools, tutorials
      `);
    }
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
