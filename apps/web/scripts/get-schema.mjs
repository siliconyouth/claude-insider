/**
 * Get resources table schema
 */

import './lib/env.mjs';
import pg from 'pg';
import { join } from 'path';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const result = await pool.query(`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'resources'
  ORDER BY ordinal_position
`);

console.log('Resources table columns:');
for (const row of result.rows) {
  console.log(`  ${row.column_name.padEnd(30)} ${row.data_type}`);
}

await pool.end();
