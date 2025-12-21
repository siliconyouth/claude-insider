/**
 * Analyze Documentation and Resources
 *
 * This script checks for:
 * 1. Resources with missing descriptions
 * 2. Documentation without relationships
 * 3. Resources without resource-resource relationships
 */

import './lib/env.mjs';
import pg from 'pg';
import { join } from 'path';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('           DOCUMENTATION & RESOURCES ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Get resources with missing descriptions
console.log('📦 RESOURCES WITH MISSING OR SHORT DESCRIPTIONS');
console.log('───────────────────────────────────────────────────────────────');

const missingDescRes = await pool.query(`
  SELECT id, title, slug, category,
         COALESCE(LENGTH(description), 0) as desc_length,
         COALESCE(description, '') as description
  FROM resources
  WHERE description IS NULL
     OR LENGTH(description) < 50
  ORDER BY category, title
  LIMIT 50
`);

console.log(`Found ${missingDescRes.rows.length} resources with missing/short descriptions:\n`);
for (const r of missingDescRes.rows) {
  console.log(`  [${r.category}] ${r.title} (${r.desc_length} chars)`);
  if (r.description) console.log(`    "${r.description.substring(0, 60)}..."`);
}

// 2. Get resource categories and counts
console.log('\n\n📊 RESOURCES BY CATEGORY');
console.log('───────────────────────────────────────────────────────────────');

const categoryRes = await pool.query(`
  SELECT category, COUNT(*) as count,
         SUM(CASE WHEN description IS NULL OR LENGTH(description) < 50 THEN 1 ELSE 0 END) as missing_desc
  FROM resources
  GROUP BY category
  ORDER BY count DESC
`);

for (const c of categoryRes.rows) {
  console.log(`  ${c.category.padEnd(20)} ${String(c.count).padStart(5)} resources (${c.missing_desc} missing desc)`);
}

// 3. Check resource-resource relationships
console.log('\n\n🔗 RESOURCE-RESOURCE RELATIONSHIPS');
console.log('───────────────────────────────────────────────────────────────');

const relRes = await pool.query(`
  SELECT COUNT(*) as count FROM resource_resource_relationships WHERE is_active = TRUE
`);
console.log(`Current relationships: ${relRes.rows[0].count}`);

// 4. Get top resources that could have relationships
console.log('\n\n🎯 TOP RESOURCES FOR RELATIONSHIP ANALYSIS');
console.log('───────────────────────────────────────────────────────────────');

const topRes = await pool.query(`
  SELECT r.id, r.title, r.slug, r.category, r.description,
         COALESCE(r.github_stars, 0) as stars,
         (SELECT COUNT(*) FROM doc_resource_relationships dr WHERE dr.resource_id = r.id) as doc_rels
  FROM resources r
  WHERE r.is_published = TRUE
  ORDER BY COALESCE(r.github_stars, 0) DESC, r.title
  LIMIT 30
`);

console.log('Top 30 resources by GitHub stars:\n');
for (const r of topRes.rows) {
  console.log(`  ${r.title.substring(0,30).padEnd(30)} ⭐${String(r.stars).padStart(6)}  📚${r.doc_rels} doc-rels  [${r.category}]`);
}

// 5. Find potential relationship candidates by category
console.log('\n\n🔍 POTENTIAL RELATIONSHIP CANDIDATES BY CATEGORY');
console.log('───────────────────────────────────────────────────────────────');

const candidatesRes = await pool.query(`
  SELECT category, array_agg(title ORDER BY COALESCE(github_stars, 0) DESC) as resources
  FROM resources
  WHERE is_published = TRUE
  GROUP BY category
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC
`);

for (const c of candidatesRes.rows) {
  const resources = c.resources.slice(0, 10);
  console.log(`\n${c.category} (${c.resources.length} resources):`);
  console.log(`  ${resources.join(', ')}${c.resources.length > 10 ? '...' : ''}`);
}

// 6. Get documentation pages
console.log('\n\n📚 DOCUMENTATION PAGES');
console.log('───────────────────────────────────────────────────────────────');

const docsRes = await pool.query(`
  SELECT slug, title, category,
         (SELECT COUNT(*) FROM doc_resource_relationships dr WHERE dr.doc_slug = d.slug) as resource_rels
  FROM documentation d
  WHERE is_published = TRUE
  ORDER BY category, slug
`);

console.log(`Found ${docsRes.rows.length} documentation pages:\n`);
for (const d of docsRes.rows) {
  console.log(`  ${d.slug.padEnd(35)} ${(d.title || '').substring(0,30).padEnd(30)} 📦${d.resource_rels} rels`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    ANALYSIS COMPLETE');
console.log('═══════════════════════════════════════════════════════════════\n');

await pool.end();
