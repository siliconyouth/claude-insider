/**
 * Verify v1.8.0 notification was created
 */

import './lib/env.mjs';
import pg from 'pg';
import { join } from 'path';

const { Pool } = pg;

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
