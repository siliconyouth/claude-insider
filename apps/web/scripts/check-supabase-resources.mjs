import pg from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

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
  SELECT category, COUNT(*) as count
  FROM resources
  GROUP BY category
  ORDER BY count DESC
`);
console.log('Supabase resources by category:');
result.rows.forEach(r => console.log('  ' + r.category + ': ' + r.count));

const total = await pool.query('SELECT COUNT(*) as count FROM resources');
console.log('\nTotal in Supabase: ' + total.rows[0].count);

// Show some sample resources
const samples = await pool.query(`
  SELECT slug, title, category, github_stars
  FROM resources
  ORDER BY github_stars DESC NULLS LAST
  LIMIT 5
`);
console.log('\nTop 5 by stars:');
samples.rows.forEach(r => console.log('  ' + (r.github_stars || 0) + '★ ' + r.title + ' (' + r.category + ')'));

await pool.end();
