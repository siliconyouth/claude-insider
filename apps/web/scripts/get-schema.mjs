/**
 * Get resources table schema
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
