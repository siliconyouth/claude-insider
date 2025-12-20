/**
 * Approve and Import Resources Script
 *
 * Reviews discovered resources in the queue and adds quality ones
 * to the main resources table.
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

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

/**
 * Generate a URL-friendly slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Determine category from URL and source info
 */
function categorize(url, sourceCategory, title) {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Official Anthropic
  if (lowerUrl.includes('anthropic.com') || lowerUrl.includes('github.com/anthropics')) {
    return 'official';
  }

  // MCP Servers
  if (lowerUrl.includes('mcp') || lowerTitle.includes('mcp') ||
      lowerUrl.includes('model-context-protocol') || lowerTitle.includes('model context protocol')) {
    return 'mcp-servers';
  }

  // SDKs
  if (lowerTitle.includes('sdk') || lowerTitle.includes('api') ||
      lowerUrl.includes('npmjs.com/@anthropic') || lowerUrl.includes('pypi.org/project/anthropic')) {
    return 'sdks';
  }

  // Tools (IDE extensions, CLI tools)
  if (lowerTitle.includes('vscode') || lowerTitle.includes('extension') ||
      lowerTitle.includes('cli') || lowerTitle.includes('tool')) {
    return 'tools';
  }

  // Agents
  if (lowerTitle.includes('agent') || lowerTitle.includes('autonomous') ||
      lowerTitle.includes('swarm')) {
    return 'agents';
  }

  // Prompts
  if (lowerTitle.includes('prompt') || lowerTitle.includes('template')) {
    return 'prompts';
  }

  // Rules
  if (lowerTitle.includes('rule') || lowerTitle.includes('cursor') ||
      lowerUrl.includes('cursorrules')) {
    return 'rules';
  }

  // Default to source category or tools
  return sourceCategory || 'tools';
}

/**
 * Quality filter - returns true if resource should be approved
 */
function shouldApprove(resource) {
  const url = resource.discovered_url || '';
  const title = resource.discovered_title || '';

  // Skip if URL looks like documentation/wiki internal pages
  if (url.includes('/wiki/') || url.includes('/blob/') ||
      url.includes('#') || url.includes('/issues/')) {
    return false;
  }

  // Skip very short titles (likely parsing errors)
  if (!title || title.length < 3) {
    return false;
  }

  // Skip non-project URLs
  if (url.includes('/pull/') || url.includes('/commit/')) {
    return false;
  }

  // If we have GitHub data, filter by stars
  const data = resource.discovered_data || {};
  if (data.github) {
    // Skip if less than 5 stars
    if (data.github.stars !== undefined && data.github.stars < 5) {
      return false;
    }
    // Skip archived repos
    if (data.github.archived) {
      return false;
    }
  }

  return true;
}

/**
 * Check if resource URL already exists
 */
async function resourceExists(url) {
  const { rows } = await pool.query(
    'SELECT id FROM resources WHERE url = $1',
    [url]
  );
  return rows.length > 0;
}

/**
 * Check if slug already exists
 */
async function slugExists(slug) {
  const { rows } = await pool.query(
    'SELECT id FROM resources WHERE slug = $1',
    [slug]
  );
  return rows.length > 0;
}

/**
 * Get unique slug
 */
async function getUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 1;

  while (await slugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Main approval function
 */
async function approveResources() {
  console.log('=== REVIEWING AND APPROVING RESOURCES ===\n');

  // Get all pending queue items with source info
  const { rows: pending } = await pool.query(`
    SELECT q.*, s.default_category, s.name as source_name
    FROM resource_discovery_queue q
    LEFT JOIN resource_sources s ON q.source_id = s.id
    WHERE q.status = 'pending'
    ORDER BY q.created_at
  `);

  console.log(`📋 ${pending.length} pending resources to review\n`);

  let approved = 0;
  let rejected = 0;
  let skipped = 0;
  let added = 0;

  for (const resource of pending) {
    // Check quality
    if (!shouldApprove(resource)) {
      await pool.query(
        `UPDATE resource_discovery_queue SET status = 'rejected', review_notes = 'Auto-rejected: Quality filter' WHERE id = $1`,
        [resource.id]
      );
      rejected++;
      continue;
    }

    // Check if already exists in resources
    if (await resourceExists(resource.discovered_url)) {
      await pool.query(
        `UPDATE resource_discovery_queue SET status = 'approved', review_notes = 'Already exists in resources' WHERE id = $1`,
        [resource.id]
      );
      skipped++;
      continue;
    }

    // Generate slug
    const baseSlug = generateSlug(resource.discovered_title);
    const slug = await getUniqueSlug(baseSlug);

    // Determine category
    const category = categorize(
      resource.discovered_url,
      resource.default_category,
      resource.discovered_title
    );

    // Parse GitHub data
    const data = resource.discovered_data || {};
    const githubData = data.github || null;

    try {
      // Insert into resources table
      await pool.query(`
        INSERT INTO resources (
          id, slug, title, description, url, category,
          github_owner, github_repo, github_stars, github_forks,
          is_featured, is_published, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, true, 'community')
      `, [
        randomUUID(),
        slug,
        resource.discovered_title,
        resource.discovered_description || '',
        resource.discovered_url,
        category,
        githubData?.owner || null,
        githubData?.repo || null,
        githubData?.stars || null,
        githubData?.forks || null
      ]);

      // Update queue status
      await pool.query(
        `UPDATE resource_discovery_queue SET status = 'approved', reviewed_at = NOW(), review_notes = 'Auto-approved and added' WHERE id = $1`,
        [resource.id]
      );

      added++;
      approved++;

      // Log progress every 50 resources
      if (added % 50 === 0) {
        console.log(`  ✅ Added ${added} resources so far...`);
      }
    } catch (error) {
      console.log(`  ❌ Error adding ${resource.discovered_title}: ${error.message}`);
      await pool.query(
        `UPDATE resource_discovery_queue SET status = 'rejected', review_notes = $2 WHERE id = $1`,
        [resource.id, `Error: ${error.message}`]
      );
      rejected++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`✅ Approved & added: ${added}`);
  console.log(`⏭️  Skipped (exists): ${skipped}`);
  console.log(`❌ Rejected: ${rejected}`);

  // Show final resource counts by category
  const { rows: counts } = await pool.query(`
    SELECT category, COUNT(*) as count
    FROM resources
    GROUP BY category
    ORDER BY count DESC
  `);

  console.log('\nResources by category:');
  counts.forEach(c => console.log(`  ${c.category}: ${c.count}`));

  // Total
  const { rows: total } = await pool.query('SELECT COUNT(*) as count FROM resources');
  console.log(`\nTotal resources: ${total[0].count}`);

  await pool.end();
}

approveResources().catch(console.error);
