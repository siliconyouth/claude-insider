import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function verify() {
  console.log('=== VERIFYING DATABASE TABLES ===\n');

  const { rows } = await pool.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename LIKE 'resource%'
    ORDER BY tablename
  `);

  console.log('Resource-related tables:');
  rows.forEach(r => console.log('  ✓', r.tablename));

  // Check resource_sources
  try {
    const { rows: sources } = await pool.query('SELECT COUNT(*) as count FROM resource_sources');
    console.log('\nresource_sources count:', sources[0].count);
  } catch (e) {
    console.log('\nresource_sources error:', e.message);
  }

  // Check resource_discovery_queue
  try {
    const { rows: queue } = await pool.query('SELECT COUNT(*) as count FROM resource_discovery_queue');
    console.log('resource_discovery_queue count:', queue[0].count);
  } catch (e) {
    console.log('resource_discovery_queue error:', e.message);
  }

  await pool.end();
}

verify().catch(console.error);
