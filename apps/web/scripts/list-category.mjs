#!/usr/bin/env node
import './lib/env.mjs';
import pg from 'pg';

const { Pool } = pg;
const category = process.argv[2] || 'sdks';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const { rows } = await pool.query(`
    SELECT slug, title, category, subcategory, github_owner, github_repo, description
    FROM resources
    WHERE category = $1 AND is_published = TRUE
    ORDER BY subcategory, title
  `, [category]);

  console.log(`# ${category.toUpperCase()} (${rows.length})\n`);

  // Group by subcategory
  const groups = {};
  rows.forEach(r => {
    const key = r.subcategory || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  Object.entries(groups).sort().forEach(([sub, items]) => {
    console.log(`\n## ${sub} (${items.length})`);
    items.forEach(r => {
      const gh = r.github_owner ? `${r.github_owner}/${r.github_repo}` : '';
      const desc = r.description ? r.description.slice(0, 60) : '';
      console.log(`- ${r.slug}: ${r.title}${gh ? ` [${gh}]` : ''}`);
      if (desc) console.log(`  ${desc}...`);
    });
  });

  await pool.end();
}

main().catch(console.error);
