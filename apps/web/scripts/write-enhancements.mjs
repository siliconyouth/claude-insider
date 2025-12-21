/**
 * Write Resource Enhancements to Database
 *
 * Reads enhancements from stdin (JSON) and writes to database
 *
 * Usage: echo '<json>' | npx dotenvx run -f .env.local -- node scripts/write-enhancements.mjs
 */

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function writeEnhancements() {
  // Read JSON from stdin
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  const enhancements = JSON.parse(input);
  const client = await pool.connect();
  let success = 0;
  let errors = 0;

  console.log(`📝 Writing ${enhancements.length} enhancements...`);

  try {
    for (const e of enhancements) {
      try {
        await client.query(`
          UPDATE resources SET
            ai_summary = $1,
            key_features = $2,
            use_cases = $3,
            pros = $4,
            cons = $5,
            target_audience = $6,
            prerequisites = $7,
            ai_analyzed_at = NOW(),
            ai_confidence = 0.95
          WHERE id = $8
        `, [
          e.ai_summary,
          e.key_features,
          e.use_cases,
          e.pros,
          e.cons,
          e.target_audience,
          e.prerequisites,
          e.id
        ]);
        success++;
      } catch (err) {
        console.error(`❌ Error for ${e.id}: ${err.message}`);
        errors++;
      }
    }

    console.log(`✅ Done: ${success} success, ${errors} errors`);
  } finally {
    client.release();
    await pool.end();
  }
}

writeEnhancements().catch(console.error);
