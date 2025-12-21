/**
 * Verify v1.8.0 notification was created
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

try {
  const result = await pool.query(
    `SELECT id, title, target_type, status, scheduled_at
     FROM admin_notifications
     WHERE title LIKE '%v1.8.0%'`
  );

  if (result.rows.length > 0) {
    console.log('✓ v1.8.0 notification created:');
    console.log(JSON.stringify(result.rows[0], null, 2));
  } else {
    console.log('✗ No v1.8.0 notification found');
  }
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await pool.end();
}
