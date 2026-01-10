/**
 * Cleanup Fragment Prompts Script
 *
 * Removes prompts with garbage/fragment titles that were incorrectly imported.
 * These include titles starting with -, *, #, •, –, ", [, |, etc.
 *
 * Usage: npx dotenvx run -f .env.local -- npx tsx scripts/cleanup-fragment-prompts.ts [--dry-run]
 */

import { pool } from "../lib/db";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (dryRun) {
    console.log("=== DRY RUN MODE ===\n");
  }

  // Find all garbage prompts with fragment-like titles
  const findQuery = `
    SELECT id, title
    FROM prompts
    WHERE
      -- Starts with special characters
      title ~ '^[\\-\\*\\#\\•\\–\\"|\\[\\{]'
      -- Or starts with whitespace
      OR title ~ '^\\s'
      -- Or very short titles that are likely fragments
      OR (LENGTH(title) < 15 AND title ~ '^[^A-Z]')
      -- Or contains markdown artifacts
      OR title LIKE '%**%:%'
      OR title LIKE '%\${%'
      -- Or Turkish/Chinese fragments
      OR title LIKE '%Beş odak%'
      OR title LIKE '%Dizin yapısını%'
      OR title LIKE '%资源详情%'
      -- Or emoji-only titles
      OR title ~ '^[🛠️📝💡🔍🎯]'
      -- Or looks like a bullet point continuation
      OR title LIKE '- %:%'
      OR title LIKE '* %:%'
    ORDER BY title
  `;

  const garbagePrompts = await pool.query(findQuery);

  console.log(`Found ${garbagePrompts.rowCount} garbage prompts to delete:\n`);

  for (const prompt of garbagePrompts.rows) {
    console.log(`  - "${prompt.title.substring(0, 60)}${prompt.title.length > 60 ? '...' : ''}"`);
  }

  if (garbagePrompts.rowCount === 0) {
    console.log("\nNo garbage prompts found. Database is clean!");
    process.exit(0);
  }

  if (!dryRun) {
    const ids = garbagePrompts.rows.map((r: { id: string }) => r.id);

    // Delete from prompt_claude_hints first (foreign key)
    const hintsResult = await pool.query(
      `DELETE FROM prompt_claude_hints WHERE prompt_id = ANY($1) RETURNING prompt_id`,
      [ids]
    );
    console.log(`\nDeleted ${hintsResult.rowCount} hint records`);

    // Delete from prompts
    const promptsResult = await pool.query(
      `DELETE FROM prompts WHERE id = ANY($1) RETURNING id`,
      [ids]
    );
    console.log(`Deleted ${promptsResult.rowCount} prompt records`);
  }

  // Show final stats
  const statsResult = await pool.query(`
    SELECT
      COUNT(*) as total,
      ROUND(AVG(h.overall_optimization_score)::numeric, 1) as avg_score
    FROM prompts p
    LEFT JOIN prompt_claude_hints h ON p.id = h.prompt_id
  `);

  const stats = statsResult.rows[0];
  console.log("\n=== Final Database State ===");
  console.log(`Total prompts: ${stats.total}`);
  console.log(`Average optimization score: ${stats.avg_score}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
