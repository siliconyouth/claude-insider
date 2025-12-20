/**
 * Resource Database Mutations
 *
 * Server-side mutations for creating, updating, and deleting resources.
 * Used by admin routes and sync operations.
 */

import { pool } from "@/lib/db";

// =============================================================================
// TYPES
// =============================================================================

export interface CreateResourceInput {
  slug: string;
  title: string;
  description: string;
  long_description?: string;
  url: string;
  category: string;
  subcategory?: string;
  status?: string;
  is_featured?: boolean;
  featured_reason?: string;
  difficulty?: string;
  version?: string;
  namespace?: string;
  pricing?: string;
  price_details?: Record<string, unknown>;
  platforms?: string[];
  license?: string;
  website_url?: string;
  docs_url?: string;
  changelog_url?: string;
  discord_url?: string;
  twitter_url?: string;
  github_owner?: string;
  github_repo?: string;
  github_stars?: number;
  github_forks?: number;
  github_issues?: number;
  github_language?: string;
  github_last_commit?: string;
  github_contributors?: number;
  npm_package?: string;
  npm_downloads_weekly?: number;
  pypi_package?: string;
  pypi_downloads_monthly?: number;
  icon_url?: string;
  banner_url?: string;
  screenshots?: string[];
  video_url?: string;
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  tags?: string[];
}

export interface UpdateResourceInput extends Partial<CreateResourceInput> {
  is_published?: boolean;
}

export interface MutationResult {
  success: boolean;
  id?: string;
  error?: string;
}

// =============================================================================
// CREATE
// =============================================================================

/**
 * Create a new resource
 */
export async function createResource(
  input: CreateResourceInput
): Promise<MutationResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert main resource
    const resourceResult = await client.query<{ id: string }>(
      `INSERT INTO resources (
        slug, title, description, long_description, url, category, subcategory,
        status, is_featured, featured_reason, difficulty, version, namespace,
        pricing, price_details, platforms, license,
        website_url, docs_url, changelog_url, discord_url, twitter_url,
        github_owner, github_repo, github_stars, github_forks, github_issues,
        github_language, github_last_commit, github_contributors,
        npm_package, npm_downloads_weekly, pypi_package, pypi_downloads_monthly,
        icon_url, banner_url, screenshots, video_url,
        meta_title, meta_description, og_image_url,
        is_published, added_at, last_verified_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37,
        $38, $39, $40, $41, FALSE, NOW(), NOW(), NOW(), NOW()
      ) RETURNING id`,
      [
        input.slug,
        input.title,
        input.description,
        input.long_description || null,
        input.url,
        input.category,
        input.subcategory || null,
        input.status || 'community',
        input.is_featured || false,
        input.featured_reason || null,
        input.difficulty || null,
        input.version || null,
        input.namespace || null,
        input.pricing || 'free',
        input.price_details || null,
        input.platforms || [],
        input.license || null,
        input.website_url || null,
        input.docs_url || null,
        input.changelog_url || null,
        input.discord_url || null,
        input.twitter_url || null,
        input.github_owner || null,
        input.github_repo || null,
        input.github_stars || 0,
        input.github_forks || 0,
        input.github_issues || 0,
        input.github_language || null,
        input.github_last_commit || null,
        input.github_contributors || 0,
        input.npm_package || null,
        input.npm_downloads_weekly || 0,
        input.pypi_package || null,
        input.pypi_downloads_monthly || 0,
        input.icon_url || null,
        input.banner_url || null,
        input.screenshots || [],
        input.video_url || null,
        input.meta_title || null,
        input.meta_description || null,
        input.og_image_url || null,
      ]
    );

    const resourceId = resourceResult.rows[0]?.id;

    // Insert tags if provided
    if (input.tags && input.tags.length > 0 && resourceId) {
      for (const tag of input.tags) {
        await client.query(
          `INSERT INTO resource_tags (resource_id, tag)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [resourceId, tag]
        );
      }
    }

    await client.query('COMMIT');

    return { success: true, id: resourceId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Mutations] Error creating resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    client.release();
  }
}

// =============================================================================
// UPDATE
// =============================================================================

/**
 * Update a resource by slug
 */
export async function updateResource(
  slug: string,
  input: UpdateResourceInput
): Promise<MutationResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get resource ID first
    const idResult = await client.query<{ id: string }>(
      'SELECT id FROM resources WHERE slug = $1',
      [slug]
    );

    if (idResult.rows.length === 0) {
      return { success: false, error: 'Resource not found' };
    }

    const resourceId = idResult.rows[0]!.id;

    // Build dynamic update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fieldMapping: Record<keyof UpdateResourceInput, string> = {
      slug: 'slug',
      title: 'title',
      description: 'description',
      long_description: 'long_description',
      url: 'url',
      category: 'category',
      subcategory: 'subcategory',
      status: 'status',
      is_featured: 'is_featured',
      featured_reason: 'featured_reason',
      is_published: 'is_published',
      difficulty: 'difficulty',
      version: 'version',
      namespace: 'namespace',
      pricing: 'pricing',
      price_details: 'price_details',
      platforms: 'platforms',
      license: 'license',
      website_url: 'website_url',
      docs_url: 'docs_url',
      changelog_url: 'changelog_url',
      discord_url: 'discord_url',
      twitter_url: 'twitter_url',
      github_owner: 'github_owner',
      github_repo: 'github_repo',
      github_stars: 'github_stars',
      github_forks: 'github_forks',
      github_issues: 'github_issues',
      github_language: 'github_language',
      github_last_commit: 'github_last_commit',
      github_contributors: 'github_contributors',
      npm_package: 'npm_package',
      npm_downloads_weekly: 'npm_downloads_weekly',
      pypi_package: 'pypi_package',
      pypi_downloads_monthly: 'pypi_downloads_monthly',
      icon_url: 'icon_url',
      banner_url: 'banner_url',
      screenshots: 'screenshots',
      video_url: 'video_url',
      meta_title: 'meta_title',
      meta_description: 'meta_description',
      og_image_url: 'og_image_url',
      tags: 'tags', // Handled separately
    };

    for (const [key, column] of Object.entries(fieldMapping)) {
      if (key === 'tags') continue; // Handle tags separately
      if (key in input && input[key as keyof UpdateResourceInput] !== undefined) {
        updates.push(`${column} = $${paramIndex}`);
        values.push(input[key as keyof UpdateResourceInput]);
        paramIndex++;
      }
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length > 0) {
      values.push(slug);
      await client.query(
        `UPDATE resources SET ${updates.join(', ')} WHERE slug = $${paramIndex}`,
        values
      );
    }

    // Update tags if provided
    if (input.tags !== undefined) {
      // Remove existing tags
      await client.query('DELETE FROM resource_tags WHERE resource_id = $1', [
        resourceId,
      ]);

      // Add new tags
      if (input.tags.length > 0) {
        for (const tag of input.tags) {
          await client.query(
            `INSERT INTO resource_tags (resource_id, tag)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [resourceId, tag]
          );
        }
      }
    }

    await client.query('COMMIT');

    return { success: true, id: resourceId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Mutations] Error updating resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    client.release();
  }
}

// =============================================================================
// DELETE
// =============================================================================

/**
 * Delete a resource by slug
 */
export async function deleteResource(slug: string): Promise<MutationResult> {
  try {
    const result = await pool.query(
      'DELETE FROM resources WHERE slug = $1 RETURNING id',
      [slug]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Resource not found' };
    }

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('[Mutations] Error deleting resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// PUBLISH STATUS
// =============================================================================

/**
 * Publish or unpublish a resource
 */
export async function setResourcePublished(
  slug: string,
  published: boolean
): Promise<MutationResult> {
  try {
    const result = await pool.query(
      'UPDATE resources SET is_published = $1, updated_at = NOW() WHERE slug = $2 RETURNING id',
      [published, slug]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Resource not found' };
    }

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('[Mutations] Error updating publish status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// FAVORITES
// =============================================================================

/**
 * Toggle favorite status for a user
 */
export async function toggleFavorite(
  resourceId: string,
  userId: string
): Promise<{ favorited: boolean }> {
  try {
    // Check if already favorited
    const existing = await pool.query(
      'SELECT 1 FROM resource_favorites WHERE resource_id = $1 AND user_id = $2',
      [resourceId, userId]
    );

    if (existing.rows.length > 0) {
      // Remove favorite
      await pool.query(
        'DELETE FROM resource_favorites WHERE resource_id = $1 AND user_id = $2',
        [resourceId, userId]
      );
      // Decrement counter
      await pool.query(
        'UPDATE resources SET favorites_count = GREATEST(0, favorites_count - 1) WHERE id = $1',
        [resourceId]
      );
      return { favorited: false };
    } else {
      // Add favorite
      await pool.query(
        'INSERT INTO resource_favorites (resource_id, user_id) VALUES ($1, $2)',
        [resourceId, userId]
      );
      // Increment counter
      await pool.query(
        'UPDATE resources SET favorites_count = favorites_count + 1 WHERE id = $1',
        [resourceId]
      );
      return { favorited: true };
    }
  } catch (error) {
    console.error('[Mutations] Error toggling favorite:', error);
    throw error;
  }
}

// =============================================================================
// RATINGS
// =============================================================================

/**
 * Set or update a user's rating for a resource
 */
export async function setRating(
  resourceId: string,
  userId: string,
  rating: number
): Promise<{ averageRating: number; count: number }> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Upsert rating
    await client.query(
      `INSERT INTO resource_ratings (resource_id, user_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (resource_id, user_id)
       DO UPDATE SET rating = $3, updated_at = NOW()`,
      [resourceId, userId, rating]
    );

    // Calculate new average and count
    const statsResult = await client.query<{
      avg: string;
      count: string;
    }>(
      `SELECT AVG(rating)::NUMERIC(3,2) as avg, COUNT(*)::INTEGER as count
       FROM resource_ratings
       WHERE resource_id = $1`,
      [resourceId]
    );

    const avg = parseFloat(statsResult.rows[0]?.avg || '0');
    const count = parseInt(statsResult.rows[0]?.count || '0', 10);

    // Update denormalized counts on resource
    await client.query(
      `UPDATE resources
       SET average_rating = $1, ratings_count = $2, updated_at = NOW()
       WHERE id = $3`,
      [avg, count, resourceId]
    );

    await client.query('COMMIT');

    return { averageRating: avg, count };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Mutations] Error setting rating:', error);
    throw error;
  } finally {
    client.release();
  }
}

// =============================================================================
// AUTHORS
// =============================================================================

export interface AuthorInput {
  user_id?: string;
  name: string;
  role: string;
  github_username?: string;
  twitter_username?: string;
  website_url?: string;
  avatar_url?: string;
  is_primary?: boolean;
}

/**
 * Set authors for a resource (replaces all existing)
 */
export async function setResourceAuthors(
  resourceId: string,
  authors: AuthorInput[]
): Promise<MutationResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Remove existing authors
    await client.query('DELETE FROM resource_authors WHERE resource_id = $1', [
      resourceId,
    ]);

    // Insert new authors
    for (const author of authors) {
      await client.query(
        `INSERT INTO resource_authors
         (resource_id, user_id, name, role, github_username, twitter_username,
          website_url, avatar_url, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          resourceId,
          author.user_id || null,
          author.name,
          author.role,
          author.github_username || null,
          author.twitter_username || null,
          author.website_url || null,
          author.avatar_url || null,
          author.is_primary || false,
        ]
      );
    }

    await client.query('COMMIT');

    return { success: true, id: resourceId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Mutations] Error setting authors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    client.release();
  }
}

// =============================================================================
// ALTERNATIVES
// =============================================================================

export interface AlternativeInput {
  alternative_resource_id: string;
  relationship: 'similar' | 'alternative' | 'complement' | 'successor';
}

/**
 * Set alternatives for a resource (replaces all existing)
 */
export async function setResourceAlternatives(
  resourceId: string,
  alternatives: AlternativeInput[]
): Promise<MutationResult> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Remove existing alternatives
    await client.query(
      'DELETE FROM resource_alternatives WHERE resource_id = $1',
      [resourceId]
    );

    // Insert new alternatives
    for (const alt of alternatives) {
      await client.query(
        `INSERT INTO resource_alternatives
         (resource_id, alternative_resource_id, relationship)
         VALUES ($1, $2, $3)`,
        [resourceId, alt.alternative_resource_id, alt.relationship]
      );
    }

    await client.query('COMMIT');

    return { success: true, id: resourceId };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Mutations] Error setting alternatives:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    client.release();
  }
}

// =============================================================================
// SYNC STATS
// =============================================================================

/**
 * Update GitHub stats for a resource
 */
export async function updateGitHubStats(
  slug: string,
  stats: {
    stars?: number;
    forks?: number;
    issues?: number;
    contributors?: number;
    lastCommit?: string;
    language?: string;
  }
): Promise<MutationResult> {
  try {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (stats.stars !== undefined) {
      updates.push(`github_stars = $${paramIndex++}`);
      values.push(stats.stars);
    }
    if (stats.forks !== undefined) {
      updates.push(`github_forks = $${paramIndex++}`);
      values.push(stats.forks);
    }
    if (stats.issues !== undefined) {
      updates.push(`github_issues = $${paramIndex++}`);
      values.push(stats.issues);
    }
    if (stats.contributors !== undefined) {
      updates.push(`github_contributors = $${paramIndex++}`);
      values.push(stats.contributors);
    }
    if (stats.lastCommit) {
      updates.push(`github_last_commit = $${paramIndex++}`);
      values.push(stats.lastCommit);
    }
    if (stats.language) {
      updates.push(`github_language = $${paramIndex++}`);
      values.push(stats.language);
    }

    updates.push(`last_synced_at = NOW()`);
    updates.push(`updated_at = NOW()`);

    values.push(slug);

    const result = await pool.query(
      `UPDATE resources SET ${updates.join(', ')} WHERE slug = $${paramIndex} RETURNING id`,
      values
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Resource not found' };
    }

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('[Mutations] Error updating GitHub stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update npm stats for a resource
 */
export async function updateNpmStats(
  slug: string,
  weeklyDownloads: number
): Promise<MutationResult> {
  try {
    const result = await pool.query(
      `UPDATE resources
       SET npm_downloads_weekly = $1, last_synced_at = NOW(), updated_at = NOW()
       WHERE slug = $2
       RETURNING id`,
      [weeklyDownloads, slug]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Resource not found' };
    }

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('[Mutations] Error updating npm stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update PyPI stats for a resource
 */
export async function updatePyPiStats(
  slug: string,
  monthlyDownloads: number
): Promise<MutationResult> {
  try {
    const result = await pool.query(
      `UPDATE resources
       SET pypi_downloads_monthly = $1, last_synced_at = NOW(), updated_at = NOW()
       WHERE slug = $2
       RETURNING id`,
      [monthlyDownloads, slug]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Resource not found' };
    }

    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error('[Mutations] Error updating PyPI stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
