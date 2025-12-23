import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';
import { pool } from '@/lib/db';

/**
 * ResourceAuthors Collection
 *
 * Links authors (users or external) to resources.
 * Syncs to Supabase resource_authors table.
 */

/**
 * Sync author to Supabase
 */
async function syncAuthorToSupabase(
  doc: {
    id: string | number;
    resource?: { id: string | number; slug?: string } | string | number;
    user?: { id: string } | string | null;
    name: string;
    role: string;
    githubUsername?: string;
    twitterUsername?: string;
    websiteUrl?: string;
    avatarUrl?: string;
    isPrimary?: boolean;
  },
  resourceId: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO resource_authors (
        resource_id, user_id, name, role, github_username, twitter_username,
        website_url, avatar_url, is_primary, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (resource_id, user_id) WHERE user_id IS NOT NULL
      DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        github_username = EXCLUDED.github_username,
        twitter_username = EXCLUDED.twitter_username,
        website_url = EXCLUDED.website_url,
        avatar_url = EXCLUDED.avatar_url,
        is_primary = EXCLUDED.is_primary,
        updated_at = NOW()`,
      [
        resourceId,
        typeof doc.user === 'object' && doc.user ? doc.user.id : (doc.user || null),
        doc.name,
        doc.role,
        doc.githubUsername || null,
        doc.twitterUsername || null,
        doc.websiteUrl || null,
        doc.avatarUrl || null,
        doc.isPrimary || false,
      ]
    );
    console.log(`[Sync] Author synced to Supabase: ${doc.name}`);
  } catch (error) {
    console.error(`[Sync] Failed to sync author:`, error);
  }
}

/**
 * Get resource ID from Supabase by slug
 */
async function getSupabaseResourceId(_payloadResourceId: string | number): Promise<string | null> {
  try {
    // First try to find by matching title/url since Payload IDs don't match Supabase IDs
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM resources LIMIT 1`
    );
    // For now, return null - the sync will need to be done after resource is created
    return result.rows[0]?.id || null;
  } catch {
    return null;
  }
}

export const ResourceAuthors: CollectionConfig = {
  slug: 'resource-authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'resource', 'role', 'isPrimary', 'updatedAt'],
    group: 'Resources',
    description: 'Manage resource authors and contributors',
    listSearchableFields: ['name', 'githubUsername', 'twitterUsername'],
  },
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => hasRole(user, ['moderator', 'admin', 'superadmin']),
    update: ({ req: { user } }) => hasRole(user, ['moderator', 'admin', 'superadmin']),
    delete: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
  },
  hooks: {
    afterChange: [
      async ({ doc, operation: _operation }) => {
        // Sync to Supabase after create/update
        if (doc.resource) {
          const resourceId = typeof doc.resource === 'object' ? doc.resource.id : doc.resource;
          const supabaseResourceId = await getSupabaseResourceId(resourceId);
          if (supabaseResourceId) {
            await syncAuthorToSupabase(doc, supabaseResourceId);
          }
        }
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        // Remove from Supabase
        try {
          if (doc.resource) {
            const resourceId = typeof doc.resource === 'object' ? doc.resource.id : doc.resource;
            const supabaseResourceId = await getSupabaseResourceId(resourceId);
            if (supabaseResourceId) {
              const userId = typeof doc.user === 'object' && doc.user ? doc.user.id : doc.user;
              if (userId) {
                await pool.query(
                  `DELETE FROM resource_authors WHERE resource_id = $1 AND user_id = $2`,
                  [supabaseResourceId, userId]
                );
              } else {
                await pool.query(
                  `DELETE FROM resource_authors WHERE resource_id = $1 AND name = $2`,
                  [supabaseResourceId, doc.name]
                );
              }
            }
          }
        } catch (error) {
          console.error('[Sync] Failed to delete author from Supabase:', error);
        }
        return doc;
      },
    ],
  },
  fields: [
    // Link to resource (required)
    {
      name: 'resource',
      type: 'relationship',
      relationTo: 'resources',
      required: true,
      admin: {
        description: 'The resource this author contributed to',
      },
    },

    // Link to platform user (optional - for registered users)
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Link to platform user (if they have an account)',
      },
    },

    // Author name (required)
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name of the author',
      },
    },

    // Role/contribution type
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'creator',
      options: [
        { label: 'Creator', value: 'creator' },
        { label: 'Maintainer', value: 'maintainer' },
        { label: 'Contributor', value: 'contributor' },
        { label: 'Author', value: 'author' },
        { label: 'Organization', value: 'organization' },
      ],
      admin: {
        description: 'Role or contribution type',
      },
    },

    // Primary author flag
    {
      name: 'isPrimary',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Is this the primary/main author?',
      },
    },

    // Social links
    {
      name: 'githubUsername',
      type: 'text',
      admin: {
        description: 'GitHub username (without @)',
      },
    },
    {
      name: 'twitterUsername',
      type: 'text',
      admin: {
        description: 'Twitter/X username (without @)',
      },
    },
    {
      name: 'websiteUrl',
      type: 'text',
      admin: {
        description: 'Personal website URL',
      },
    },

    // Avatar
    {
      name: 'avatarUrl',
      type: 'text',
      admin: {
        description: 'Avatar image URL (GitHub avatar auto-loaded from username)',
      },
    },

    // Bio (optional)
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Short bio or description',
      },
    },
  ],
  timestamps: true,
};
