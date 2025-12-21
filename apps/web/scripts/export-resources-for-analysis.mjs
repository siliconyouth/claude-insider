#!/usr/bin/env node

/**
 * Export Resources for Relationship Analysis
 * Outputs resource data in a format suitable for Claude Code analysis
 */

import './lib/env.mjs';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('📦 Exporting resources for analysis...\n');

  // Get all published resources with tags
  const resources = await pool.query(`
    SELECT
      r.id, r.slug, r.title, r.description, r.category,
      r.github_owner, r.github_repo, r.npm_package, r.pypi_package,
      r.key_features, r.use_cases, r.target_audience,
      COALESCE(
        (SELECT array_agg(t.tag) FROM resource_tags t WHERE t.resource_id = r.id),
        '{}'::text[]
      ) as tags
    FROM resources r
    WHERE r.is_published = true
    ORDER BY r.category, r.title
  `);

  console.log(`Found ${resources.rows.length} resources\n`);

  // Group by category
  const byCategory = {};
  for (const r of resources.rows) {
    if (!byCategory[r.category]) {
      byCategory[r.category] = [];
    }
    byCategory[r.category].push({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description?.slice(0, 200),
      github: r.github_owner && r.github_repo ? `${r.github_owner}/${r.github_repo}` : null,
      npm: r.npm_package,
      pypi: r.pypi_package,
      tags: r.tags || [],
      features: r.key_features?.slice(0, 3),
      useCases: r.use_cases?.slice(0, 3),
    });
  }

  // Print summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('RESOURCES BY CATEGORY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const [category, items] of Object.entries(byCategory)) {
    console.log(`\n## ${category.toUpperCase()} (${items.length} resources)\n`);
    for (const r of items.slice(0, 30)) { // Limit to 30 per category for readability
      console.log(`- **${r.title}** (${r.slug})`);
      if (r.description) console.log(`  ${r.description.slice(0, 100)}...`);
      if (r.tags.length > 0) console.log(`  Tags: ${r.tags.join(', ')}`);
    }
    if (items.length > 30) {
      console.log(`  ... and ${items.length - 30} more`);
    }
  }

  // Save to JSON for detailed analysis
  const outputPath = path.join(__dirname, 'resources-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(byCategory, null, 2));
  console.log(`\n\n📁 Full data saved to: ${outputPath}`);

  // Get existing resource-resource relationships
  const existingRels = await pool.query(`
    SELECT source_resource_id, target_resource_id, relationship_type, confidence_score
    FROM resource_relationships
    WHERE is_active = true
  `);
  console.log(`\n🔗 Existing resource-resource relationships: ${existingRels.rows.length}`);

  await pool.end();
}

run().catch(console.error);
