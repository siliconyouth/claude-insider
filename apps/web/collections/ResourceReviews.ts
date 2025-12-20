import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';
import { pool } from '@/lib/db';

/**
 * ResourceReviews Collection
 *
 * Admin moderation interface for user-submitted resource reviews.
 * Syncs status changes back to Supabase resource_reviews table.
 */

/**
 * Sync review status changes to Supabase
 */
async function syncReviewStatus(
  supabaseId: string,
  status: string,
  moderationNotes?: string
): Promise<void> {
  try {
    await pool.query(
      `UPDATE resource_reviews
       SET status = $1, moderation_notes = $2, updated_at = NOW()
       WHERE id = $3`,
      [status, moderationNotes || null, supabaseId]
    );
    console.log(`[Sync] Review status updated in Supabase: ${supabaseId} -> ${status}`);
  } catch (error) {
    console.error(`[Sync] Failed to sync review status:`, error);
  }
}

export const ResourceReviews: CollectionConfig = {
  slug: 'resource-reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'resourceTitle', 'userName', 'rating', 'status', 'createdAt'],
    group: 'Resources',
    description: 'Moderate user reviews for resources',
    listSearchableFields: ['title', 'content', 'userName', 'resourceTitle'],
  },
  access: {
    // Only moderators and above can access reviews
    read: ({ req: { user } }) => hasRole(user, ['moderator', 'admin', 'superadmin']),
    create: () => false, // Reviews are created via API, not CMS
    update: ({ req: { user } }) => hasRole(user, ['moderator', 'admin', 'superadmin']),
    delete: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, operation }) => {
        // Sync status changes to Supabase
        if (operation === 'update' && doc.supabaseId) {
          if (doc.status !== previousDoc?.status) {
            await syncReviewStatus(doc.supabaseId, doc.status, doc.moderationNotes);
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    // Supabase reference (read-only)
    {
      name: 'supabaseId',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Reference to resource_reviews.id in Supabase',
        readOnly: true,
      },
    },

    // Resource info (read-only, from Supabase)
    {
      name: 'resourceTitle',
      type: 'text',
      admin: {
        description: 'Resource being reviewed',
        readOnly: true,
      },
    },
    {
      name: 'resourceSlug',
      type: 'text',
      admin: {
        description: 'Resource slug for linking',
        readOnly: true,
      },
    },

    // User info (read-only, from Supabase)
    {
      name: 'userName',
      type: 'text',
      admin: {
        description: 'User who wrote the review',
        readOnly: true,
      },
    },
    {
      name: 'userEmail',
      type: 'text',
      admin: {
        description: 'User email',
        readOnly: true,
      },
    },
    {
      name: 'userId',
      type: 'text',
      admin: {
        description: 'Supabase user ID',
        readOnly: true,
      },
    },

    // Review content (editable for moderation cleanup)
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Review title (can be edited for cleanup)',
      },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Review content (can be edited for cleanup)',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      admin: {
        description: 'Star rating (1-5)',
        readOnly: true,
      },
    },

    // Pros and Cons
    {
      name: 'pros',
      type: 'array',
      admin: {
        description: 'List of pros mentioned',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      name: 'cons',
      type: 'array',
      admin: {
        description: 'List of cons mentioned',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },

    // Moderation status
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Flagged', value: 'flagged' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Moderation status',
      },
    },

    // Moderation metadata
    {
      name: 'moderationNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes for moderators (not visible to user)',
      },
    },
    {
      name: 'rejectionReason',
      type: 'select',
      options: [
        { label: 'Spam', value: 'spam' },
        { label: 'Inappropriate language', value: 'inappropriate' },
        { label: 'Off-topic', value: 'off-topic' },
        { label: 'Fake/misleading', value: 'fake' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Reason for rejection (if applicable)',
        condition: (data) => data?.status === 'rejected',
      },
    },
    {
      name: 'moderatedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Admin who moderated this review',
        readOnly: true,
      },
    },
    {
      name: 'moderatedAt',
      type: 'date',
      admin: {
        description: 'When this review was moderated',
        readOnly: true,
      },
    },

    // Engagement stats (read-only, synced from Supabase)
    {
      name: 'helpfulCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of helpful votes',
        readOnly: true,
      },
    },
    {
      name: 'notHelpfulCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of not helpful votes',
        readOnly: true,
      },
    },

    // Original submission date
    {
      name: 'submittedAt',
      type: 'date',
      admin: {
        description: 'When the review was submitted',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
