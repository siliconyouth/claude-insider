/**
 * Sync Supabase Data to Payload CMS (Optimized)
 *
 * This script imports existing data from Supabase tables into Payload CMS collections.
 *
 * USAGE:
 *   # Full sync (all resources)
 *   pnpm exec dotenvx run -f .env.local -- pnpm exec tsx scripts/sync-supabase-to-payload.ts
 *
 *   # Incremental sync (only resources updated in last N hours)
 *   pnpm exec dotenvx run -f .env.local -- pnpm exec tsx scripts/sync-supabase-to-payload.ts --incremental --hours 24
 *
 *   # Sync since specific date
 *   pnpm exec dotenvx run -f .env.local -- pnpm exec tsx scripts/sync-supabase-to-payload.ts --since "2024-12-28"
 *
 *   # Sync specific resources by ID
 *   pnpm exec dotenvx run -f .env.local -- pnpm exec tsx scripts/sync-supabase-to-payload.ts --ids "uuid1,uuid2,uuid3"
 *
 *   # Skip categories/difficulty (resources only, faster)
 *   pnpm exec dotenvx run -f .env.local -- pnpm exec tsx scripts/sync-supabase-to-payload.ts --resources-only
 *
 * OPTIMIZATIONS:
 * - Change detection via content hash (skips unchanged resources)
 * - Timestamp filtering for incremental mode
 * - Concurrent batch processing with configurable parallelism
 * - Progress reporting with ETA
 */

// Environment variables injected by dotenvx
import { Pool } from 'pg';
import { getPayload } from 'payload';
import config from '../payload.config';
import { createHash } from 'crypto';

// Parse CLI arguments
interface SyncOptions {
  incremental: boolean;
  since?: Date;
  hours?: number;
  ids?: string[];
  resourcesOnly: boolean;
  batchSize: number;
  concurrency: number;
  skipUnchanged: boolean;
}

function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    incremental: false,
    resourcesOnly: false,
    batchSize: 50,
    concurrency: 5,
    skipUnchanged: true, // Default to skip unchanged
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--incremental':
      case '-i':
        options.incremental = true;
        break;
      case '--hours':
      case '-h':
        options.hours = parseInt(args[++i] || '24', 10);
        options.incremental = true;
        break;
      case '--since':
      case '-s':
        options.since = new Date(args[++i] || new Date().toISOString());
        options.incremental = true;
        break;
      case '--ids':
        options.ids = (args[++i] || '').split(',').filter(Boolean);
        break;
      case '--resources-only':
      case '-r':
        options.resourcesOnly = true;
        break;
      case '--batch-size':
      case '-b':
        options.batchSize = parseInt(args[++i] || '50', 10);
        break;
      case '--concurrency':
      case '-c':
        options.concurrency = parseInt(args[++i] || '5', 10);
        break;
      case '--force':
      case '-f':
        options.skipUnchanged = false;
        break;
      case '--help':
        console.log(`
Supabase → Payload CMS Sync Tool

Options:
  --incremental, -i     Only sync resources updated recently
  --hours, -h <n>       Sync resources updated in last N hours (default: 24)
  --since, -s <date>    Sync resources updated since date (ISO format)
  --ids <id1,id2,...>   Sync specific resources by UUID
  --resources-only, -r  Skip categories/difficulty sync
  --batch-size, -b <n>  Batch size for processing (default: 50)
  --concurrency, -c <n> Parallel operations (default: 5)
  --force, -f           Force sync even if unchanged
  --help                Show this help
        `);
        process.exit(0);
    }
  }

  // Calculate since date from hours if specified
  if (options.hours && !options.since) {
    options.since = new Date(Date.now() - options.hours * 60 * 60 * 1000);
  }

  return options;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface SyncResult {
  collection: string;
  created: number;
  updated: number;
  skipped: number; // Unchanged resources (hash match)
  failed: number;
  errors: string[];
  duration: number; // ms
}

/**
 * Generate content hash for a Supabase resource row
 * Must match the hash algorithm in lib/payload/sync-resources.ts
 */
function generateResourceHash(row: Record<string, unknown>): string {
  const relevantData = {
    title: row.title,
    description: row.description,
    url: row.url,
    is_published: row.is_published,
    status: row.status,
    is_featured: row.is_featured,
    featured_reason: row.featured_reason,
    category: row.category,
    difficulty: row.difficulty,
    github_owner: row.github_owner,
    github_repo: row.github_repo,
    github_stars: row.github_stars,
    github_forks: row.github_forks,
    key_features: row.key_features,
    target_audience: row.target_audience,
    use_cases: row.use_cases,
    pros: row.pros,
    cons: row.cons,
  };

  return createHash('md5')
    .update(JSON.stringify(relevantData))
    .digest('hex');
}

// Category metadata for nice display names and icons
// NOTE: shortName and color are REQUIRED by Payload Categories collection
type CategoryColor = 'violet' | 'blue' | 'cyan' | 'green' | 'yellow' | 'purple' | 'pink' | 'indigo' | 'amber' | 'rose';
const CATEGORY_META: Record<string, { name: string; shortName: string; icon: string; description: string; color: CategoryColor }> = {
  'mcp-servers': { name: 'MCP Servers', shortName: 'MCP', icon: '🔌', description: 'Model Context Protocol servers for extending Claude capabilities', color: 'violet' },
  'tools': { name: 'Tools & Utilities', shortName: 'Tools', icon: '🛠️', description: 'Development tools, CLI utilities, and productivity helpers', color: 'blue' },
  'sdks': { name: 'SDKs & Libraries', shortName: 'SDKs', icon: '📦', description: 'Official and community SDKs for Claude integration', color: 'cyan' },
  'agents': { name: 'AI Agents', shortName: 'Agents', icon: '🤖', description: 'Autonomous AI agents built with Claude', color: 'purple' },
  'official': { name: 'Official Resources', shortName: 'Official', icon: '✨', description: 'Official Anthropic documentation and resources', color: 'indigo' },
  'prompts': { name: 'Prompts & Templates', shortName: 'Prompts', icon: '📝', description: 'Prompt templates and system prompts', color: 'green' },
  'rules': { name: 'CLAUDE.md Rules', shortName: 'Rules', icon: '📋', description: 'Project rules and configuration files', color: 'amber' },
  'community': { name: 'Community', shortName: 'Community', icon: '👥', description: 'Community projects and contributions', color: 'pink' },
  'showcases': { name: 'Showcases', shortName: 'Showcase', icon: '🎨', description: 'Projects and demos showcasing Claude capabilities', color: 'rose' },
  'tutorials': { name: 'Tutorials & Guides', shortName: 'Tutorials', icon: '📚', description: 'Learning resources and how-to guides', color: 'yellow' },
};

/**
 * Convert featured_reason text from Supabase to Payload select value (slug format)
 * e.g., "Official Repository" → "official-repository"
 */
function convertFeaturedReasonToSlug(reason: string | null | undefined): string | undefined {
  if (!reason) return undefined;

  // Convert to lowercase and replace spaces/special chars with hyphens
  const slug = reason
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Valid featured reason slugs (must match Payload schema)
  const validSlugs = [
    'editors-pick', 'most-popular', 'popular', 'new', 'trending', 'essential',
    'official', 'official-source', 'official-repository', 'official-community',
    'official-courses', 'official-examples', 'active-community', 'built-with-claude',
    'industry-standard', 'industry-example',
  ];

  // Handle special case: "Editor's Pick" → "editors-pick" (apostrophe handling)
  const normalizedSlug = slug === 'editor-s-pick' ? 'editors-pick' : slug;

  return validSlugs.includes(normalizedSlug) ? normalizedSlug : undefined;
}

async function syncCategoriesFromResources(payload: Awaited<ReturnType<typeof getPayload>>): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = { collection: 'categories', created: 0, updated: 0, skipped: 0, failed: 0, errors: [], duration: 0 };

  // Get unique categories from resources
  const { rows } = await pool.query(`
    SELECT DISTINCT category, COUNT(*) as count
    FROM resources
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
  `);

  console.log(`[Categories] Found ${rows.length} unique categories in resources`);

  let sortOrder = 0;
  for (const row of rows) {
    const slug = row.category;
    const defaultName = slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const meta = CATEGORY_META[slug] || {
      name: defaultName,
      shortName: slug.slice(0, 10), // First 10 chars for unknown categories
      icon: '📁',
      description: `Resources in the ${slug} category`,
      color: 'blue' as CategoryColor, // Default color
    };

    try {
      const existing = await payload.find({
        collection: 'categories',
        where: { slug: { equals: slug } },
        limit: 1,
      });

      const categoryData = {
        name: meta.name,
        shortName: meta.shortName,
        slug,
        description: meta.description,
        icon: meta.icon,
        color: meta.color,
        sortOrder: sortOrder++,
      };

      if (existing.docs.length > 0 && existing.docs[0]) {
        await payload.update({
          collection: 'categories',
          id: existing.docs[0].id,
          data: categoryData,
        });
        result.updated++;
      } else {
        await payload.create({
          collection: 'categories',
          data: categoryData,
        });
        result.created++;
      }
      console.log(`  ✓ ${meta.name} (${row.count} resources)`);
    } catch (error) {
      result.failed++;
      result.errors.push(`${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`  ✗ ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

async function syncDifficultyLevels(payload: Awaited<ReturnType<typeof getPayload>>): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = { collection: 'difficulty-levels', created: 0, updated: 0, skipped: 0, failed: 0, errors: [], duration: 0 };

  // Get unique difficulty levels from resources
  const { rows } = await pool.query(`
    SELECT DISTINCT difficulty, COUNT(*) as count
    FROM resources
    WHERE difficulty IS NOT NULL AND difficulty != ''
    GROUP BY difficulty
    ORDER BY count DESC
  `);

  console.log(`[DifficultyLevels] Found ${rows.length} unique difficulty levels`);

  // Color must be a valid select value from DifficultyLevels collection:
  // 'green', 'blue', 'yellow', 'orange', 'red', 'purple', 'gray'
  type DifficultyColor = 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red' | 'gray';
  const DIFFICULTY_META: Record<string, { name: string; color: DifficultyColor; order: number; description: string }> = {
    'beginner': { name: 'Beginner', color: 'green', order: 1, description: 'No prior experience needed' },
    'intermediate': { name: 'Intermediate', color: 'yellow', order: 2, description: 'Some experience required' },
    'advanced': { name: 'Advanced', color: 'orange', order: 3, description: 'Significant experience required' },
    'expert': { name: 'Expert', color: 'red', order: 4, description: 'Deep expertise required' },
  };

  for (const row of rows) {
    const slug = row.difficulty.toLowerCase();
    const meta = DIFFICULTY_META[slug] || {
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      color: 'gray' as DifficultyColor,
      order: 99,
      description: `Difficulty level: ${slug}`,
    };

    try {
      const existing = await payload.find({
        collection: 'difficulty-levels',
        where: { slug: { equals: slug } },
        limit: 1,
      });

      const difficultyData = {
        name: meta.name,
        slug,
        description: meta.description,
        color: meta.color,
        sortOrder: meta.order,
      };

      if (existing.docs.length > 0 && existing.docs[0]) {
        await payload.update({
          collection: 'difficulty-levels',
          id: existing.docs[0].id,
          data: difficultyData,
        });
        result.updated++;
      } else {
        await payload.create({
          collection: 'difficulty-levels',
          data: difficultyData,
        });
        result.created++;
      }
      console.log(`  ✓ ${meta.name} (${row.count} resources)`);
    } catch (error) {
      result.failed++;
      result.errors.push(`${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log(`  ✗ ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

async function syncResources(
  payload: Awaited<ReturnType<typeof getPayload>>,
  options: SyncOptions
): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    collection: 'resources',
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    duration: 0,
  };

  // Get lookup maps first
  const categoryMap = new Map<string, number>();
  const difficultyMap = new Map<string, number>();

  const categories = await payload.find({ collection: 'categories', limit: 100 });
  for (const cat of categories.docs) {
    categoryMap.set(cat.slug, cat.id as number);
  }
  console.log(`[Resources] Loaded ${categoryMap.size} category mappings`);

  const difficulties = await payload.find({ collection: 'difficulty-levels', limit: 20 });
  for (const diff of difficulties.docs) {
    difficultyMap.set(diff.slug, diff.id as number);
  }
  console.log(`[Resources] Loaded ${difficultyMap.size} difficulty mappings`);

  // Build WHERE clause based on options
  let whereClause = 'WHERE 1=1';
  const params: (string | Date | number)[] = [];

  if (options.ids && options.ids.length > 0) {
    // Sync specific IDs
    const placeholders = options.ids.map((_, i) => `$${i + 1}`).join(', ');
    whereClause += ` AND id IN (${placeholders})`;
    params.push(...options.ids);
    console.log(`[Resources] Mode: Specific IDs (${options.ids.length} resources)`);
  } else if (options.since) {
    // Incremental sync by timestamp
    whereClause += ` AND updated_at > $${params.length + 1}`;
    params.push(options.since.toISOString());
    console.log(`[Resources] Mode: Incremental since ${options.since.toISOString()}`);
  } else {
    console.log(`[Resources] Mode: Full sync`);
  }

  // Get count of resources to process
  const countQuery = `SELECT COUNT(*) as count FROM resources ${whereClause}`;
  const { rows: countResult } = await pool.query(countQuery, params);
  const totalCount = parseInt(countResult[0].count);

  if (totalCount === 0) {
    console.log(`[Resources] No resources to sync`);
    result.duration = Date.now() - startTime;
    return result;
  }

  console.log(`[Resources] Found ${totalCount} resources to process`);

  const batchSize = options.batchSize;
  let offset = 0;
  let processedCount = 0;

  // Pre-load existing Payload resources for hash comparison (if skip unchanged enabled)
  const payloadHashMap = new Map<string, string>();
  if (options.skipUnchanged) {
    console.log(`[Resources] Loading existing hashes for change detection...`);
    const existingResources = await payload.find({
      collection: 'resources',
      limit: 5000,
      select: { title: true, contentHash: true },
    });
    for (const doc of existingResources.docs) {
      if (doc.title && doc.contentHash) {
        payloadHashMap.set(doc.title, doc.contentHash as string);
      }
    }
    console.log(`[Resources] Loaded ${payloadHashMap.size} existing hashes`);
  }

  while (offset < totalCount) {
    // Build query with pagination
    const selectParams = [...params, batchSize, offset];
    const query = `
      SELECT
        id, slug, title, description, url, category, subcategory, difficulty,
        status, is_featured, featured_reason, is_published, added_at, last_verified_at, updated_at,
        github_owner, github_repo, github_stars, github_forks, github_language,
        ai_summary, key_features, target_audience, use_cases, pros, cons, prerequisites
      FROM resources
      ${whereClause}
      ORDER BY updated_at DESC NULLS LAST, added_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const { rows } = await pool.query(query, selectParams);

    const batchNum = Math.floor(offset / batchSize) + 1;
    const totalBatches = Math.ceil(totalCount / batchSize);
    console.log(`[Resources] Processing batch ${batchNum}/${totalBatches} (${rows.length} items)`);

    // Process batch with limited concurrency
    const processBatch = async (row: Record<string, unknown>) => {
      try {
        // Check content hash for change detection
        if (options.skipUnchanged) {
          const newHash = generateResourceHash(row);
          const existingHash = payloadHashMap.get(row.title as string);
          if (existingHash === newHash) {
            return { status: 'skipped' as const, title: row.title };
          }
        }

        // Map relationships - category is stored as slug string
        const categoryId = row.category ? categoryMap.get(row.category as string) : undefined;
        const difficultyId = row.difficulty
          ? difficultyMap.get((row.difficulty as string)?.toLowerCase())
          : undefined;

        // Map publish status
        let publishStatus: 'published' | 'hidden' | 'pending_review' | 'draft' = 'published';
        if (!row.is_published) publishStatus = 'draft';

        // Map resource status
        let resourceType: 'official' | 'community' | 'beta' | 'deprecated' | 'archived' = 'community';
        if (row.status === 'official') resourceType = 'official';
        else if (row.status === 'beta') resourceType = 'beta';
        else if (row.status === 'deprecated') resourceType = 'deprecated';
        else if (row.status === 'archived') resourceType = 'archived';

        // Both addedDate and lastVerified are required in Resources collection
        const now = new Date().toISOString();
        const contentHash = generateResourceHash(row);

        const data: Record<string, unknown> = {
          title: row.title,
          description: row.description || '',
          url: row.url,
          category: categoryId,
          difficulty: difficultyId,
          publishStatus,
          resourceType,
          featured: row.is_featured || false,
          featuredReason: convertFeaturedReasonToSlug(row.featured_reason as string),
          addedDate: row.added_at ? new Date(row.added_at as string).toISOString() : now,
          lastVerified: row.last_verified_at ? new Date(row.last_verified_at as string).toISOString() : now,
          aiSummary: row.ai_summary || undefined,
          contentHash, // Store hash for future comparisons
        };

        // Add GitHub info if present
        if (row.github_owner && row.github_repo) {
          data.github = {
            owner: row.github_owner,
            repo: row.github_repo,
            stars: row.github_stars || 0,
            forks: row.github_forks || 0,
          };
        }

        // Add array fields if present
        const keyFeatures = row.key_features as string[] | null;
        const pros = row.pros as string[] | null;
        const cons = row.cons as string[] | null;
        const useCases = row.use_cases as string[] | null;

        if (keyFeatures && Array.isArray(keyFeatures) && keyFeatures.length > 0) {
          data.keyFeatures = keyFeatures.map((f: string) => ({ feature: f }));
        }
        if (pros && Array.isArray(pros) && pros.length > 0) {
          data.pros = pros.map((p: string) => ({ pro: p }));
        }
        if (cons && Array.isArray(cons) && cons.length > 0) {
          data.cons = cons.map((c: string) => ({ con: c }));
        }
        if (useCases && Array.isArray(useCases) && useCases.length > 0) {
          data.useCases = useCases.map((u: string) => ({ useCase: u }));
        }

        const existing = await payload.find({
          collection: 'resources',
          where: { title: { equals: row.title } },
          limit: 1,
        });

        if (existing.docs.length > 0 && existing.docs[0]) {
          await payload.update({
            collection: 'resources',
            id: existing.docs[0].id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: data as any,
          });
          return { status: 'updated' as const, title: row.title };
        } else {
          await payload.create({
            collection: 'resources',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: data as any,
          });
          return { status: 'created' as const, title: row.title };
        }
      } catch (error) {
        return {
          status: 'failed' as const,
          title: row.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    };

    // Process with concurrency limit
    const concurrencyLimit = options.concurrency;
    for (let i = 0; i < rows.length; i += concurrencyLimit) {
      const chunk = rows.slice(i, i + concurrencyLimit);
      const results = await Promise.all(chunk.map(processBatch));

      for (const res of results) {
        if (res.status === 'created') result.created++;
        else if (res.status === 'updated') result.updated++;
        else if (res.status === 'skipped') result.skipped++;
        else if (res.status === 'failed') {
          result.failed++;
          if (result.errors.length < 20) {
            result.errors.push(`${String(res.title).slice(0, 30)}: ${res.error}`);
          }
        }
      }
    }

    offset += batchSize;
    processedCount = Math.min(offset, totalCount);

    // Calculate ETA
    const elapsed = Date.now() - startTime;
    const rate = processedCount / (elapsed / 1000); // items per second
    const remaining = totalCount - processedCount;
    const etaSeconds = remaining / rate;
    const etaStr = etaSeconds > 60
      ? `${Math.round(etaSeconds / 60)}m ${Math.round(etaSeconds % 60)}s`
      : `${Math.round(etaSeconds)}s`;

    const pct = Math.round((processedCount / totalCount) * 100);
    console.log(
      `  Progress: ${processedCount}/${totalCount} (${pct}%) - ` +
      `Created: ${result.created}, Updated: ${result.updated}, ` +
      `Skipped: ${result.skipped}, Failed: ${result.failed} - ETA: ${etaStr}`
    );
  }

  result.duration = Date.now() - startTime;
  return result;
}

async function main() {
  const options = parseArgs();
  const mainStartTime = Date.now();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       SUPABASE → PAYLOAD CMS SYNC (Optimized)            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Show active options
  console.log('\n📋 Options:');
  if (options.incremental) {
    console.log(`   • Mode: Incremental${options.since ? ` (since ${options.since.toISOString()})` : ''}`);
  } else if (options.ids) {
    console.log(`   • Mode: Specific IDs (${options.ids.length} resources)`);
  } else {
    console.log('   • Mode: Full sync');
  }
  console.log(`   • Batch size: ${options.batchSize}`);
  console.log(`   • Concurrency: ${options.concurrency}`);
  console.log(`   • Skip unchanged: ${options.skipUnchanged ? 'Yes' : 'No'}`);
  console.log(`   • Resources only: ${options.resourcesOnly ? 'Yes' : 'No'}`);
  console.log('');

  try {
    // Initialize Payload
    console.log('[Init] Initializing Payload CMS...');
    const payload = await getPayload({ config });
    console.log('[Init] Payload CMS initialized\n');

    const results: SyncResult[] = [];

    // Skip categories/difficulty if resources-only mode
    if (!options.resourcesOnly) {
      console.log('='.repeat(60));
      console.log('PHASE 1: Categories (from resources.category values)');
      console.log('='.repeat(60));
      results.push(await syncCategoriesFromResources(payload));

      console.log('\n' + '='.repeat(60));
      console.log('PHASE 2: Difficulty Levels (from resources.difficulty values)');
      console.log('='.repeat(60));
      results.push(await syncDifficultyLevels(payload));

      console.log('\n' + '='.repeat(60));
      console.log('PHASE 3: Resources');
      console.log('='.repeat(60));
    } else {
      console.log('='.repeat(60));
      console.log('Syncing Resources (--resources-only mode)');
      console.log('='.repeat(60));
    }

    results.push(await syncResources(payload, options));

    // Print summary
    const totalDuration = Date.now() - mainStartTime;
    const formatDuration = (ms: number) => {
      if (ms < 1000) return `${ms}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
    };

    console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                  SYNC SUMMARY                                         ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════════════╣');

    for (const r of results) {
      const status = r.failed === 0 ? '✅' : '⚠️';
      const duration = formatDuration(r.duration);
      console.log(
        `║  ${status} ${r.collection.padEnd(20)} ` +
        `Created: ${String(r.created).padStart(4)} | ` +
        `Updated: ${String(r.updated).padStart(4)} | ` +
        `Skipped: ${String(r.skipped).padStart(4)} | ` +
        `Failed: ${String(r.failed).padStart(3)} | ` +
        `${duration.padStart(8)} ║`
      );
    }

    const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    console.log('╠══════════════════════════════════════════════════════════════════════════════════════╣');
    console.log(
      `║  TOTAL                     ` +
      `Created: ${String(totalCreated).padStart(4)} | ` +
      `Updated: ${String(totalUpdated).padStart(4)} | ` +
      `Skipped: ${String(totalSkipped).padStart(4)} | ` +
      `Failed: ${String(totalFailed).padStart(3)} | ` +
      `${formatDuration(totalDuration).padStart(8)} ║`
    );
    console.log('╚══════════════════════════════════════════════════════════════════════════════════════╝\n');

    // Print performance stats
    const totalProcessed = totalCreated + totalUpdated + totalSkipped;
    if (totalProcessed > 0) {
      const avgRate = totalProcessed / (totalDuration / 1000);
      console.log(`📊 Performance: ${avgRate.toFixed(1)} resources/second`);
      if (totalSkipped > 0) {
        const skipPercent = ((totalSkipped / (totalProcessed)) * 100).toFixed(1);
        console.log(`⏭️  Efficiency: ${skipPercent}% unchanged (skipped)`);
      }
    }

    // Print any errors
    const allErrors = results.flatMap(r => r.errors);
    if (allErrors.length > 0) {
      console.log('\n⚠️  Errors (first 20):');
      allErrors.slice(0, 20).forEach(e => console.log(`   - ${e}`));
    }

    console.log('\n✅ Sync complete! Check the Payload admin at /admin to verify.\n');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
