/**
 * Analyze Data Quality Issues in Resources
 *
 * Identifies:
 * 1. Resources with bad titles (GitHub, asterisks, generic)
 * 2. Resources with missing/short descriptions
 * 3. Resources that can be enriched from GitHub data
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

console.log('═══════════════════════════════════════════════════════════════');
console.log('              DATA QUALITY ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Resources with bad titles
console.log('📛 RESOURCES WITH BAD TITLES');
console.log('───────────────────────────────────────────────────────────────');

const badTitles = await pool.query(`
  SELECT id, title, slug, category, github_owner, github_repo,
         COALESCE(description, '') as description
  FROM resources
  WHERE title = 'GitHub'
     OR title LIKE '**%'
     OR title LIKE 'GitHub (%'
     OR LENGTH(title) < 3
  ORDER BY category, title
`);

console.log(`Found ${badTitles.rows.length} resources with bad titles:\n`);

const byCategory = {};
for (const r of badTitles.rows) {
  if (!byCategory[r.category]) byCategory[r.category] = [];
  byCategory[r.category].push(r);
}

for (const [cat, resources] of Object.entries(byCategory)) {
  console.log(`\n${cat} (${resources.length}):`);
  for (const r of resources.slice(0, 10)) {
    const github = r.github_owner && r.github_repo ? `${r.github_owner}/${r.github_repo}` : 'no github';
    console.log(`  "${r.title}" → slug: ${r.slug}, github: ${github}`);
  }
  if (resources.length > 10) console.log(`  ... and ${resources.length - 10} more`);
}

// 2. Resources that can use GitHub owner/repo as title
console.log('\n\n🔧 RESOURCES WITH GITHUB DATA THAT CAN BE FIXED');
console.log('───────────────────────────────────────────────────────────────');

const fixableFromGithub = await pool.query(`
  SELECT id, title, slug, category, github_owner, github_repo
  FROM resources
  WHERE (title = 'GitHub' OR title LIKE '**%')
    AND github_owner IS NOT NULL
    AND github_repo IS NOT NULL
  ORDER BY category
  LIMIT 50
`);

console.log(`Found ${fixableFromGithub.rows.length} resources fixable from GitHub data:\n`);
for (const r of fixableFromGithub.rows.slice(0, 20)) {
  console.log(`  "${r.title}" → "${r.github_owner}/${r.github_repo}"`);
}

// 3. Resources with missing descriptions but have GitHub data
console.log('\n\n📝 RESOURCES MISSING DESCRIPTIONS (WITH GITHUB DATA)');
console.log('───────────────────────────────────────────────────────────────');

const missingDescWithGithub = await pool.query(`
  SELECT id, title, slug, category, github_owner, github_repo, url
  FROM resources
  WHERE (description IS NULL OR LENGTH(description) < 30)
    AND github_owner IS NOT NULL
    AND github_repo IS NOT NULL
  ORDER BY COALESCE(github_stars, 0) DESC
  LIMIT 100
`);

console.log(`Found ${missingDescWithGithub.rows.length} resources with GitHub data but missing descriptions:\n`);
for (const r of missingDescWithGithub.rows.slice(0, 20)) {
  console.log(`  ${r.github_owner}/${r.github_repo} [${r.category}]`);
}

// 4. Resources with asterisks in title (markdown formatting)
console.log('\n\n⭐ RESOURCES WITH ASTERISKS IN TITLE');
console.log('───────────────────────────────────────────────────────────────');

const asteriskTitles = await pool.query(`
  SELECT id, title, slug, category,
         REPLACE(REPLACE(title, '**', ''), '*', '') as clean_title
  FROM resources
  WHERE title LIKE '**%'
     OR title LIKE '*%'
  ORDER BY category, title
`);

console.log(`Found ${asteriskTitles.rows.length} resources with asterisks:\n`);
for (const r of asteriskTitles.rows.slice(0, 30)) {
  console.log(`  "${r.title}" → "${r.clean_title}"`);
}

// 5. Summary by category
console.log('\n\n📊 DATA QUALITY SUMMARY BY CATEGORY');
console.log('───────────────────────────────────────────────────────────────');

const summary = await pool.query(`
  SELECT
    category,
    COUNT(*) as total,
    SUM(CASE WHEN title = 'GitHub' OR title LIKE '**%' THEN 1 ELSE 0 END) as bad_titles,
    SUM(CASE WHEN description IS NULL OR LENGTH(description) < 30 THEN 1 ELSE 0 END) as missing_desc,
    SUM(CASE WHEN github_owner IS NOT NULL AND github_repo IS NOT NULL THEN 1 ELSE 0 END) as has_github
  FROM resources
  GROUP BY category
  ORDER BY total DESC
`);

console.log('\nCategory           | Total | Bad Titles | Missing Desc | Has GitHub');
console.log('-------------------|-------|------------|--------------|----------');
for (const r of summary.rows) {
  console.log(`${r.category.padEnd(18)} | ${String(r.total).padStart(5)} | ${String(r.bad_titles).padStart(10)} | ${String(r.missing_desc).padStart(12)} | ${String(r.has_github).padStart(10)}`);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    ANALYSIS COMPLETE');
console.log('═══════════════════════════════════════════════════════════════\n');

await pool.end();
