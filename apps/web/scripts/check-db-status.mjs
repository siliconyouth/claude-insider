/**
 * Database Status Check Script
 *
 * Verifies migration status by checking for tables and columns
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
console.log('                    DATABASE STATUS CHECK');
console.log('═══════════════════════════════════════════════════════════════\n');

// Check key tables
const tableChecks = [
  { name: 'resources', migration: '081' },
  { name: 'resource_tags', migration: '081' },
  { name: 'resource_authors', migration: '081' },
  { name: 'resource_alternatives', migration: '081' },
  { name: 'resource_favorites', migration: '082' },
  { name: 'resource_ratings', migration: '082' },
  { name: 'resource_reviews', migration: '083' },
  { name: 'resource_comments', migration: '083' },
  { name: 'resource_update_jobs', migration: '084' },
  { name: 'documentation', migration: '086' },
  { name: 'documentation_history', migration: '086' },
  { name: 'documentation_sections', migration: '086' },
  { name: 'doc_resource_relationships', migration: '087' },
  { name: 'resource_resource_relationships', migration: '087' },
  { name: 'relationship_analysis_jobs', migration: '087' },
  { name: 'ai_pipeline_settings', migration: '089' },
  { name: 'ai_operation_queue', migration: '089' },
  { name: 'resource_sources', migration: '090' },
  { name: 'resource_discovery_queue', migration: '090' },
];

console.log('📊 TABLE STATUS');
console.log('───────────────────────────────────────────────────────────────');

for (const check of tableChecks) {
  try {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${check.name}`);
    console.log(`✓ ${check.name.padEnd(35)} ${String(result.rows[0].count).padStart(6)} rows  (migration ${check.migration})`);
  } catch (err) {
    console.log(`✗ ${check.name.padEnd(35)} MISSING  (migration ${check.migration})`);
  }
}

// Check specific columns from migration 088
console.log('\n\n📝 MIGRATION 088 (Resource Enhancements) Columns');
console.log('───────────────────────────────────────────────────────────────');

const m088Columns = [
  'ai_overview', 'ai_summary', 'ai_analyzed_at', 'ai_confidence',
  'key_features', 'use_cases', 'pros', 'cons', 'target_audience',
  'prerequisites', 'related_docs_count', 'related_resources_count',
  'primary_screenshot_url', 'thumbnail_url', 'views_this_week', 'trending_score'
];

for (const col of m088Columns) {
  try {
    await pool.query(`SELECT ${col} FROM resources LIMIT 1`);
    console.log(`✓ resources.${col}`);
  } catch (err) {
    console.log(`✗ resources.${col} - MISSING`);
  }
}

// Check relationship stats function
console.log('\n\n📈 DATABASE FUNCTIONS');
console.log('───────────────────────────────────────────────────────────────');

try {
  await pool.query('SELECT * FROM get_relationship_stats()');
  console.log('✓ get_relationship_stats()');
} catch (err) {
  console.log('✗ get_relationship_stats() - MISSING');
}

try {
  await pool.query('SELECT * FROM get_pending_analysis_jobs() LIMIT 1');
  console.log('✓ get_pending_analysis_jobs()');
} catch (err) {
  console.log('✗ get_pending_analysis_jobs() - MISSING');
}

// Summary stats
console.log('\n\n📊 SUMMARY');
console.log('───────────────────────────────────────────────────────────────');

const { rows: [resourceCount] } = await pool.query('SELECT COUNT(*) as count FROM resources');
const { rows: [docCount] } = await pool.query('SELECT COUNT(*) as count FROM documentation');
const { rows: [docRelCount] } = await pool.query('SELECT COUNT(*) as count FROM doc_resource_relationships WHERE is_active = TRUE');
const { rows: [resRelCount] } = await pool.query('SELECT COUNT(*) as count FROM resource_resource_relationships WHERE is_active = TRUE');
const { rows: [queueCount] } = await pool.query('SELECT COUNT(*) as count FROM resource_discovery_queue');
const { rows: [sourceCount] } = await pool.query('SELECT COUNT(*) as count FROM resource_sources');

console.log(`Resources:              ${resourceCount.count}`);
console.log(`Documentation:          ${docCount.count}`);
console.log(`Doc-Resource Rels:      ${docRelCount.count}`);
console.log(`Resource-Resource Rels: ${resRelCount.count}`);
console.log(`Discovery Queue:        ${queueCount.count}`);
console.log(`Sources:                ${sourceCount.count}`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    CHECK COMPLETE');
console.log('═══════════════════════════════════════════════════════════════\n');

await pool.end();
