/**
 * Fix remaining bad titles
 */

import './lib/env.mjs';
import pg from 'pg';
import { join } from 'path';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('              CHECKING REMAINING BAD TITLES');
console.log('═══════════════════════════════════════════════════════════════\n');

// Check what's left
const badTitles = await pool.query(`
  SELECT id, title, slug, category, github_owner, github_repo, url
  FROM resources
  WHERE title = 'GitHub'
     OR title LIKE '**%'
     OR title LIKE 'GitHub (%'
     OR LENGTH(title) < 3
  ORDER BY category, title
`);

console.log(`Found ${badTitles.rows.length} remaining bad titles:\n`);

for (const r of badTitles.rows) {
  const github = r.github_owner && r.github_repo ? `${r.github_owner}/${r.github_repo}` : 'no github';
  console.log(`  [${r.category}] "${r.title}" - slug: ${r.slug}, github: ${github}`);

  // Try to fix based on available data
  let newTitle = null;

  if (r.github_owner && r.github_repo) {
    newTitle = `${r.github_owner}/${r.github_repo}`;
  } else if (r.slug && r.slug.length > 3) {
    // Use slug as title, cleaned up
    newTitle = r.slug
      .replace(/-\d+$/, '') // Remove trailing numbers like -1, -2
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } else if (r.url) {
    // Extract from URL
    const urlMatch = r.url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (urlMatch) {
      newTitle = urlMatch[1];
    }
  }

  if (newTitle && newTitle !== r.title) {
    await pool.query(`
      UPDATE resources SET title = $1, updated_at = NOW() WHERE id = $2
    `, [newTitle, r.id]);
    console.log(`    → Fixed to: "${newTitle}"`);
  }
}

// Final check
const remaining = await pool.query(`
  SELECT COUNT(*) as count
  FROM resources
  WHERE title = 'GitHub'
     OR title LIKE '**%'
     OR title LIKE 'GitHub (%'
     OR LENGTH(title) < 3
`);

console.log(`\n\nRemaining bad titles after fix: ${remaining.rows[0].count}`);

// Check descriptions
const missingDesc = await pool.query(`
  SELECT COUNT(*) as count
  FROM resources
  WHERE description IS NULL OR LENGTH(description) < 30
`);

console.log(`Resources with missing/short descriptions: ${missingDesc.rows[0].count}`);

console.log('\n═══════════════════════════════════════════════════════════════\n');

await pool.end();
