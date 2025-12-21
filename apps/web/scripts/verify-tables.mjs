import './lib/env.mjs';
import pg from 'pg';
import { join } from 'path';

const { Pool } = pg;

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
