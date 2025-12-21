#!/usr/bin/env node

/**
 * Check Relationship Status
 * Shows current state of doc-resource and resource-resource relationships
 */

import './lib/env.mjs';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  // Count docs
  const docsCount = await pool.query('SELECT COUNT(*) FROM documentation WHERE is_published = true');
  console.log('📄 Published Docs:', docsCount.rows[0].count);

  // Count resources
  const resourcesCount = await pool.query('SELECT COUNT(*) FROM resources WHERE is_published = true');
  console.log('📦 Published Resources:', resourcesCount.rows[0].count);

  // Count existing doc-resource relationships
  const docResRels = await pool.query('SELECT COUNT(*) FROM doc_resource_relationships WHERE is_active = true');
  console.log('🔗 Doc-Resource Relationships:', docResRels.rows[0].count);

  // Count existing resource-resource relationships
  const resResRels = await pool.query('SELECT COUNT(*) FROM resource_relationships WHERE is_active = true');
  console.log('🔗 Resource-Resource Relationships:', resResRels.rows[0].count);

  // List docs
  const allDocs = await pool.query(`
    SELECT d.slug, d.title, d.category, d.description,
           (SELECT COUNT(*) FROM doc_resource_relationships dr WHERE dr.doc_slug = d.slug AND dr.is_active = true) as rel_count
    FROM documentation d
    WHERE d.is_published = true
    ORDER BY d.category, d.title
  `);
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📝 ALL DOCUMENTATION');
  console.log('═══════════════════════════════════════════════════════════════');
  for (const doc of allDocs.rows) {
    const status = doc.rel_count > 0 ? `✓ ${doc.rel_count} rels` : '❌ no rels';
    console.log(`  [${doc.category}] ${doc.slug} - ${status}`);
  }

  // Sample resources with their categories
  const resourceCategories = await pool.query(`
    SELECT category, COUNT(*) as count
    FROM resources
    WHERE is_published = true
    GROUP BY category
    ORDER BY count DESC
  `);
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📦 RESOURCES BY CATEGORY');
  console.log('═══════════════════════════════════════════════════════════════');
  for (const cat of resourceCategories.rows) {
    console.log(`  ${cat.category}: ${cat.count} resources`);
  }

  await pool.end();
}

run().catch(console.error);
