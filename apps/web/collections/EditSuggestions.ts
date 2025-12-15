import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';

/**
 * EditSuggestions Collection
 *
 * Allows public users to suggest edits to documentation and resources.
 * Moderators and editors can review and approve/reject suggestions.
 *
 * Workflow:
 * 1. User submits suggestion (status: pending)
 * 2. Moderator reviews (status: reviewing)
 * 3. Moderator approves/rejects (status: approved/rejected)
 * 4. Editor merges approved changes (status: merged)
 */
export const EditSuggestions: CollectionConfig = {
  slug: 'edit-suggestions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'targetType', 'submitterEmail', 'createdAt'],
    group: 'Moderation',
    description: 'User-submitted edit suggestions for docs and resources',
  },
  access: {
    // Moderators, editors, and admins can read all
    read: ({ req: { user } }) => {
      if (!user) return false;
      return hasRole(user, ['superadmin', 'admin', 'moderator', 'editor']);
    },
    // Public creation handled via API route (not admin panel)
    create: ({ req: { user } }) => hasRole(user, ['superadmin', 'admin']),
    // Moderators and admins can update (change status, add notes)
    update: ({ req: { user } }) => hasRole(user, ['superadmin', 'admin', 'moderator']),
    // Only superadmins can delete
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']),
  },
  fields: [
    // Suggestion Details
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Brief description of the suggested change',
      },
    },
    {
      name: 'targetType',
      type: 'select',
      required: true,
      options: [
        { label: 'Documentation Page', value: 'doc' },
        { label: 'Resource Entry', value: 'resource' },
      ],
      admin: {
        description: 'Type of content being edited',
      },
    },
    {
      name: 'targetId',
      type: 'text',
      required: true,
      admin: {
        description: 'ID or slug of the target content',
      },
    },
    {
      name: 'targetUrl',
      type: 'text',
      admin: {
        description: 'URL where the suggestion was made',
      },
    },

    // Content
    {
      name: 'currentContent',
      type: 'textarea',
      admin: {
        description: 'The current content (for reference)',
        rows: 6,
      },
    },
    {
      name: 'suggestedContent',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The proposed changes (use markdown)',
        rows: 10,
      },
    },
    {
      name: 'reason',
      type: 'textarea',
      admin: {
        description: 'Why this change should be made',
        rows: 3,
      },
    },

    // Status
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Under Review', value: 'reviewing' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Merged', value: 'merged' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Priority for review',
      },
    },

    // Submitter Info
    {
      name: 'submitter',
      type: 'group',
      admin: {
        description: 'Information about who submitted this suggestion',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          defaultValue: 'anonymous',
          options: [
            { label: 'Public User', value: 'public' },
            { label: 'CMS User', value: 'cms' },
            { label: 'Anonymous', value: 'anonymous' },
          ],
        },
        {
          name: 'userId',
          type: 'text',
          admin: {
            description: 'User ID (public or CMS)',
            condition: (data, siblingData) => siblingData?.type !== 'anonymous',
          },
        },
        {
          name: 'email',
          type: 'email',
          admin: {
            description: 'Email for notification about status',
          },
        },
        {
          name: 'name',
          type: 'text',
          admin: {
            description: 'Display name',
          },
        },
      ],
    },
    // Virtual field for admin display
    {
      name: 'submitterEmail',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [
          ({ data }) => data?.submitter?.email || 'Anonymous',
        ],
      },
    },

    // Review Info
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.status !== 'pending',
        description: 'Moderator who reviewed this',
      },
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      admin: {
        description: 'Notes from the reviewer (internal)',
        condition: (data) => data?.status !== 'pending',
        rows: 3,
      },
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        description: 'Reason for rejection (sent to submitter)',
        condition: (data) => data?.status === 'rejected',
        rows: 2,
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => data?.status !== 'pending',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Set review timestamp when status changes from pending
        if (operation === 'update' && data?.status && data.status !== 'pending') {
          if (!data.reviewedAt) {
            data.reviewedAt = new Date().toISOString();
          }
          if (!data.reviewedBy && req.user) {
            data.reviewedBy = req.user.id;
          }
        }
        return data;
      },
    ],
  },
  timestamps: true,
};
