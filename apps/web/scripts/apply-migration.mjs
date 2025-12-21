/**
 * Apply a specific migration to the database
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env vars
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8');
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrationFile = process.argv[2] || '091_fix_resource_relationships.sql';
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migrationFile);

console.log(`\nApplying migration: ${migrationFile}\n`);

try {
  const sql = readFileSync(migrationPath, 'utf-8');
  await pool.query(sql);
  console.log('✓ Migration applied successfully\n');

  // Verify key tables
  console.log('Verification:');

  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM resource_resource_relationships');
    console.log(`  ✓ resource_resource_relationships: ${result.rows[0].count} rows`);
  } catch (err) {
    console.log('  ✗ resource_resource_relationships: MISSING');
  }

  try {
    await pool.query('SELECT * FROM get_pending_analysis_jobs() LIMIT 1');
    console.log('  ✓ get_pending_analysis_jobs() function exists');
  } catch (err) {
    console.log('  ✗ get_pending_analysis_jobs() function missing');
  }

  try {
    const statsResult = await pool.query('SELECT * FROM get_relationship_stats()');
    console.log('  ✓ get_relationship_stats() function works');
    console.log('    Stats:', JSON.stringify(statsResult.rows[0], null, 2));
  } catch (err) {
    console.log('  ✗ get_relationship_stats() function missing');
  }

} catch (err) {
  console.error('Error applying migration:', err.message);
  if (err.detail) console.error('Detail:', err.detail);
  process.exit(1);
} finally {
  await pool.end();
}

console.log('\nDone!\n');
