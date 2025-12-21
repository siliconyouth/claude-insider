/**
 * Check Resource Enhancement Status
 *
 * Reports on how many resources have been enhanced with AI-generated
 * summaries, features, use cases, etc.
 */

import pg from 'pg';

// Use DATABASE_URL from environment (run with: npx dotenvx run -f .env.local -- node script.mjs)

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkStatus() {
  console.log('📊 Resource Enhancement Status\n');
  console.log('='.repeat(50));

  const client = await pool.connect();

  try {
    // Total published resources
    const totalResult = await client.query(`
      SELECT COUNT(*) as count FROM resources WHERE status = 'published'
    `);
    const total = parseInt(totalResult.rows[0].count);
    console.log(`\n📦 Total Published Resources: ${total}`);

    // Resources with ai_analyzed_at
    const analyzedResult = await client.query(`
      SELECT COUNT(*) as count FROM resources
      WHERE status = 'published' AND ai_analyzed_at IS NOT NULL
    `);
    const analyzed = parseInt(analyzedResult.rows[0].count);
    console.log(`🤖 AI Analyzed: ${analyzed} (${((analyzed/total)*100).toFixed(1)}%)`);

    // Resources with ai_summary
    const summaryResult = await client.query(`
      SELECT COUNT(*) as count FROM resources
      WHERE status = 'published' AND ai_summary IS NOT NULL AND ai_summary != ''
    `);
    const withSummary = parseInt(summaryResult.rows[0].count);
    console.log(`📝 With AI Summary: ${withSummary} (${((withSummary/total)*100).toFixed(1)}%)`);

    // Resources with key_features
    const featuresResult = await client.query(`
      SELECT COUNT(*) as count FROM resources
      WHERE status = 'published' AND key_features IS NOT NULL AND array_length(key_features, 1) > 0
    `);
    const withFeatures = parseInt(featuresResult.rows[0].count);
    console.log(`✨ With Key Features: ${withFeatures} (${((withFeatures/total)*100).toFixed(1)}%)`);

    // Resources with use_cases
    const useCasesResult = await client.query(`
      SELECT COUNT(*) as count FROM resources
      WHERE status = 'published' AND use_cases IS NOT NULL AND array_length(use_cases, 1) > 0
    `);
    const withUseCases = parseInt(useCasesResult.rows[0].count);
    console.log(`🎯 With Use Cases: ${withUseCases} (${((withUseCases/total)*100).toFixed(1)}%)`);

    // Resources with pros
    const prosResult = await client.query(`
      SELECT COUNT(*) as count FROM resources
      WHERE status = 'published' AND pros IS NOT NULL AND array_length(pros, 1) > 0
    `);
    const withPros = parseInt(prosResult.rows[0].count);
    console.log(`👍 With Pros: ${withPros} (${((withPros/total)*100).toFixed(1)}%)`);

    // Resources with cons
    const consResult = await client.query(`
      SELECT COUNT(*) as count FROM resources
      WHERE status = 'published' AND cons IS NOT NULL AND array_length(cons, 1) > 0
    `);
    const withCons = parseInt(consResult.rows[0].count);
    console.log(`👎 With Cons: ${withCons} (${((withCons/total)*100).toFixed(1)}%)`);

    // Resources needing enhancement (missing key fields)
    const needingResult = await client.query(`
      SELECT COUNT(*) as count FROM resources
      WHERE status = 'published'
        AND (
          ai_summary IS NULL OR ai_summary = ''
          OR key_features IS NULL OR array_length(key_features, 1) IS NULL
          OR use_cases IS NULL OR array_length(use_cases, 1) IS NULL
        )
    `);
    const needing = parseInt(needingResult.rows[0].count);
    console.log(`\n⚠️  Needing Enhancement: ${needing} (${((needing/total)*100).toFixed(1)}%)`);

    // Sample of resources needing enhancement
    const sampleResult = await client.query(`
      SELECT id, slug, title, category
      FROM resources
      WHERE status = 'published'
        AND (
          ai_summary IS NULL OR ai_summary = ''
          OR key_features IS NULL OR array_length(key_features, 1) IS NULL
        )
      LIMIT 10
    `);

    if (sampleResult.rows.length > 0) {
      console.log('\n📋 Sample Resources Needing Enhancement:');
      sampleResult.rows.forEach((r, i) => {
        console.log(`   ${i+1}. [${r.category}] ${r.title} (${r.slug})`);
      });
    }

    console.log('\n' + '='.repeat(50));

    return { total, analyzed, withSummary, withFeatures, needing };

  } finally {
    client.release();
    await pool.end();
  }
}

checkStatus().catch(console.error);
