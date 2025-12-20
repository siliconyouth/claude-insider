/**
 * Data Quality Review Script
 *
 * Analyzes the resources table for data quality issues
 * and provides actionable insights.
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
console.log('                    RESOURCE DATA QUALITY REVIEW');
console.log('═══════════════════════════════════════════════════════════════\n');

// ─────────────────────────────────────────────────────────────────
// SECTION 1: Overview Statistics
// ─────────────────────────────────────────────────────────────────
console.log('📊 OVERVIEW STATISTICS');
console.log('───────────────────────────────────────────────────────────────');

const { rows: [total] } = await pool.query('SELECT COUNT(*) as count FROM resources');
console.log(`Total resources: ${total.count}`);

const { rows: byStatus } = await pool.query(`
  SELECT status, COUNT(*) as count
  FROM resources
  GROUP BY status
  ORDER BY count DESC
`);
console.log('\nBy Status:');
byStatus.forEach(r => console.log(`  ${r.status || 'null'}: ${r.count}`));

const { rows: byCategory } = await pool.query(`
  SELECT category, COUNT(*) as count
  FROM resources
  GROUP BY category
  ORDER BY count DESC
`);
console.log('\nBy Category:');
byCategory.forEach(r => console.log(`  ${r.category || 'uncategorized'}: ${r.count}`));

// ─────────────────────────────────────────────────────────────────
// SECTION 2: Publication Status
// ─────────────────────────────────────────────────────────────────
console.log('\n\n📝 PUBLICATION STATUS');
console.log('───────────────────────────────────────────────────────────────');

const { rows: [pubCounts] } = await pool.query(`
  SELECT
    COUNT(*) FILTER (WHERE is_published = true) as published,
    COUNT(*) FILTER (WHERE is_published = false OR is_published IS NULL) as unpublished,
    COUNT(*) FILTER (WHERE is_featured = true) as featured
  FROM resources
`);
console.log(`Published: ${pubCounts.published}`);
console.log(`Unpublished: ${pubCounts.unpublished}`);
console.log(`Featured: ${pubCounts.featured}`);

// ─────────────────────────────────────────────────────────────────
// SECTION 3: GitHub Statistics
// ─────────────────────────────────────────────────────────────────
console.log('\n\n⭐ GITHUB STATISTICS');
console.log('───────────────────────────────────────────────────────────────');

const { rows: [ghStats] } = await pool.query(`
  SELECT
    COUNT(*) FILTER (WHERE github_owner IS NOT NULL) as with_github,
    COUNT(*) FILTER (WHERE github_stars > 0) as with_stars,
    MAX(github_stars) as max_stars,
    ROUND(AVG(github_stars) FILTER (WHERE github_stars > 0)) as avg_stars,
    SUM(github_stars) FILTER (WHERE github_stars > 0) as total_stars
  FROM resources
`);
console.log(`Resources with GitHub info: ${ghStats.with_github}`);
console.log(`Resources with stars: ${ghStats.with_stars}`);
console.log(`Maximum stars: ${Number(ghStats.max_stars).toLocaleString()}`);
console.log(`Average stars: ${Number(ghStats.avg_stars).toLocaleString()}`);
console.log(`Total stars: ${Number(ghStats.total_stars).toLocaleString()}`);

// Star distribution
const { rows: starDist } = await pool.query(`
  SELECT
    star_range,
    count,
    sort_order
  FROM (
    SELECT
      CASE
        WHEN github_stars IS NULL OR github_stars = 0 THEN '0 (no stars)'
        WHEN github_stars < 10 THEN '1-9'
        WHEN github_stars < 100 THEN '10-99'
        WHEN github_stars < 1000 THEN '100-999'
        WHEN github_stars < 10000 THEN '1K-10K'
        WHEN github_stars < 100000 THEN '10K-100K'
        ELSE '100K+'
      END as star_range,
      CASE
        WHEN github_stars IS NULL OR github_stars = 0 THEN 0
        WHEN github_stars < 10 THEN 1
        WHEN github_stars < 100 THEN 2
        WHEN github_stars < 1000 THEN 3
        WHEN github_stars < 10000 THEN 4
        WHEN github_stars < 100000 THEN 5
        ELSE 6
      END as sort_order,
      COUNT(*) as count
    FROM resources
    GROUP BY 1, 2
  ) sub
  ORDER BY sort_order
`);
console.log('\nStar Distribution:');
starDist.forEach(r => console.log(`  ${r.star_range}: ${r.count}`));

// ─────────────────────────────────────────────────────────────────
// SECTION 4: Top Resources
// ─────────────────────────────────────────────────────────────────
console.log('\n\n🏆 TOP 15 RESOURCES BY STARS');
console.log('───────────────────────────────────────────────────────────────');

const { rows: topStars } = await pool.query(`
  SELECT title, github_stars, category, github_owner, github_repo
  FROM resources
  WHERE github_stars IS NOT NULL
  ORDER BY github_stars DESC
  LIMIT 15
`);
topStars.forEach((r, i) => {
  const stars = Number(r.github_stars).toLocaleString();
  console.log(`${String(i + 1).padStart(2)}. ${stars.padStart(10)}★  ${r.title}`);
  console.log(`      └─ ${r.category} | ${r.github_owner}/${r.github_repo}`);
});

// ─────────────────────────────────────────────────────────────────
// SECTION 5: Quality Issues
// ─────────────────────────────────────────────────────────────────
console.log('\n\n⚠️ QUALITY ISSUES');
console.log('───────────────────────────────────────────────────────────────');

// Missing descriptions
const { rows: [missingDesc] } = await pool.query(`
  SELECT COUNT(*) as count FROM resources
  WHERE description IS NULL OR description = ''
`);
const descPct = ((missingDesc.count / total.count) * 100).toFixed(1);
console.log(`Missing description: ${missingDesc.count} (${descPct}%)`);

// Short descriptions
const { rows: [shortDesc] } = await pool.query(`
  SELECT COUNT(*) as count FROM resources
  WHERE description IS NOT NULL AND LENGTH(description) < 20
`);
console.log(`Short description (<20 chars): ${shortDesc.count}`);

// Missing slugs
const { rows: [missingSlug] } = await pool.query(`
  SELECT COUNT(*) as count FROM resources
  WHERE slug IS NULL OR slug = ''
`);
console.log(`Missing slug: ${missingSlug.count}`);

// Duplicate URLs
const { rows: duplicateUrls } = await pool.query(`
  SELECT url, COUNT(*) as count
  FROM resources
  GROUP BY url
  HAVING COUNT(*) > 1
  ORDER BY count DESC
  LIMIT 5
`);
console.log(`Duplicate URLs: ${duplicateUrls.length}`);
if (duplicateUrls.length > 0) {
  console.log('  Top duplicates:');
  duplicateUrls.forEach(r => console.log(`    ${r.count}x ${r.url.substring(0, 60)}...`));
}

// Potentially outdated (no recent update info)
const { rows: [noUpdate] } = await pool.query(`
  SELECT COUNT(*) as count FROM resources
  WHERE updated_at IS NULL OR updated_at < NOW() - INTERVAL '90 days'
`);
console.log(`Not updated in 90+ days: ${noUpdate.count}`);

// Missing GitHub info for github URLs
const { rows: [missingGh] } = await pool.query(`
  SELECT COUNT(*) as count FROM resources
  WHERE url LIKE '%github.com%'
    AND github_owner IS NULL
`);
console.log(`GitHub URLs missing metadata: ${missingGh.count}`);

// ─────────────────────────────────────────────────────────────────
// SECTION 6: Category Analysis
// ─────────────────────────────────────────────────────────────────
console.log('\n\n📁 CATEGORY ANALYSIS');
console.log('───────────────────────────────────────────────────────────────');

const { rows: categoryStats } = await pool.query(`
  SELECT
    category,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_published = true) as published,
    COUNT(*) FILTER (WHERE is_featured = true) as featured,
    ROUND(AVG(github_stars) FILTER (WHERE github_stars > 0)) as avg_stars,
    MAX(github_stars) as top_stars
  FROM resources
  GROUP BY category
  ORDER BY total DESC
`);

console.log('Category          | Total | Published | Featured | Avg Stars | Top Stars');
console.log('------------------|-------|-----------|----------|-----------|----------');
categoryStats.forEach(r => {
  const cat = (r.category || 'uncategorized').padEnd(17).substring(0, 17);
  const tot = String(r.total).padStart(5);
  const pub = String(r.published).padStart(9);
  const feat = String(r.featured).padStart(8);
  const avg = r.avg_stars ? String(r.avg_stars).padStart(9) : '      N/A';
  const top = r.top_stars ? Number(r.top_stars).toLocaleString().padStart(9) : '      N/A';
  console.log(`${cat} | ${tot} | ${pub} | ${feat} | ${avg} | ${top}`);
});

// ─────────────────────────────────────────────────────────────────
// SECTION 7: Discovery Queue Status
// ─────────────────────────────────────────────────────────────────
console.log('\n\n📬 DISCOVERY QUEUE STATUS');
console.log('───────────────────────────────────────────────────────────────');

const { rows: queueStats } = await pool.query(`
  SELECT status, COUNT(*) as count
  FROM resource_discovery_queue
  GROUP BY status
  ORDER BY count DESC
`);
const queueTotal = queueStats.reduce((sum, r) => sum + parseInt(r.count), 0);
console.log(`Total items in queue: ${queueTotal}`);
queueStats.forEach(r => {
  const pct = ((r.count / queueTotal) * 100).toFixed(1);
  console.log(`  ${r.status}: ${r.count} (${pct}%)`);
});

// ─────────────────────────────────────────────────────────────────
// SECTION 8: Source Statistics
// ─────────────────────────────────────────────────────────────────
console.log('\n\n🔗 SOURCE STATISTICS');
console.log('───────────────────────────────────────────────────────────────');

const { rows: sourceStats } = await pool.query(`
  SELECT
    rs.name,
    rs.type,
    rs.is_active,
    rs.last_scanned_at,
    COALESCE(
      (SELECT COUNT(*) FROM resource_discovery_queue q WHERE q.source_id = rs.id),
      0
    ) as in_queue,
    COALESCE(
      (SELECT COUNT(*) FROM resource_discovery_queue q WHERE q.source_id = rs.id AND q.status = 'approved'),
      0
    ) as approved
  FROM resource_sources rs
  ORDER BY in_queue DESC NULLS LAST
  LIMIT 10
`);

console.log('Top 10 Sources by Queue Size:');
sourceStats.forEach((r, i) => {
  const status = r.is_active ? '✓' : '✗';
  const lastScan = r.last_scanned_at ? new Date(r.last_scanned_at).toLocaleDateString() : 'Never';
  console.log(`${String(i + 1).padStart(2)}. ${status} ${r.name}`);
  console.log(`      └─ Type: ${r.type} | Queue: ${r.in_queue} | Approved: ${r.approved} | Last: ${lastScan}`);
});

// ─────────────────────────────────────────────────────────────────
// SECTION 9: Recommendations
// ─────────────────────────────────────────────────────────────────
console.log('\n\n💡 RECOMMENDATIONS');
console.log('───────────────────────────────────────────────────────────────');

const recommendations = [];

if (missingDesc.count > 50) {
  recommendations.push(`• Add descriptions to ${missingDesc.count} resources - improves search & UX`);
}

if (duplicateUrls.length > 0) {
  recommendations.push(`• Remove ${duplicateUrls.length} duplicate URL entries`);
}

if (missingGh.count > 20) {
  recommendations.push(`• Enrich ${missingGh.count} GitHub URLs with metadata (stars, language)`);
}

const pendingQueue = queueStats.find(r => r.status === 'pending');
if (pendingQueue && parseInt(pendingQueue.count) > 100) {
  recommendations.push(`• Review ${pendingQueue.count} pending items in discovery queue`);
}

if (pubCounts.featured < 10) {
  recommendations.push(`• Feature more resources (only ${pubCounts.featured} currently featured)`);
}

if (recommendations.length === 0) {
  console.log('✅ No major issues detected!');
} else {
  recommendations.forEach(r => console.log(r));
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    END OF QUALITY REVIEW');
console.log('═══════════════════════════════════════════════════════════════\n');

await pool.end();
