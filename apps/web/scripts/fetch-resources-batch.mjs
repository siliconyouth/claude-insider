/**
 * Fetch Resources for Enhancement
 *
 * Outputs resources as JSON for Claude Code to analyze and enhance
 */

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const BATCH_SIZE = parseInt(process.argv[2]) || 50;
const OFFSET = parseInt(process.argv[3]) || 0;

async function fetchBatch() {
  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT id, slug, title, description, category, github_owner, github_repo,
             website_url, docs_url
      FROM resources
      WHERE ai_analyzed_at IS NULL OR ai_summary IS NULL OR ai_summary = ''
      ORDER BY category, title
      LIMIT $1 OFFSET $2
    `, [BATCH_SIZE, OFFSET]);

    // Count remaining
    const countResult = await client.query(`
      SELECT COUNT(*) as remaining FROM resources
      WHERE ai_analyzed_at IS NULL OR ai_summary IS NULL OR ai_summary = ''
    `);

    console.log(JSON.stringify({
      batch: { offset: OFFSET, size: result.rows.length },
      remaining: parseInt(countResult.rows[0].remaining),
      resources: result.rows
    }, null, 2));

  } finally {
    client.release();
    await pool.end();
  }
}

fetchBatch().catch(console.error);
