import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';

/**
 * ResourceDiscoveryQueue Collection
 *
 * Holds AI-discovered resources that are pending review before being added
 * to the main Resources collection. This enables a workflow where:
 *
 * 1. AI (Claude Opus 4.5) analyzes URLs/repos and extracts resource data
 * 2. Discovered resources land in this queue with pre-populated fields
 * 3. Admins review, edit if needed, then approve or reject
 * 4. Approved resources are created in the main Resources collection
 *
 * Workflow states:
 * - pending: Awaiting review
 * - approved: Approved and converted to a Resource
 * - rejected: Rejected with reason
 * - duplicate: Marked as duplicate of existing resource
 * - needs_info: Requires more information before decision
 */
export const ResourceDiscoveryQueue: CollectionConfig = {
  slug: 'resource-discovery-queue',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'priority', 'aiAnalysis.confidenceScore', 'source', 'createdAt'],
    group: 'Resources',
    description: 'AI-discovered resources pending review',
    listSearchableFields: ['title', 'description', 'url'],
  },
  access: {
    read: ({ req: { user } }) => hasRole(user, ['admin', 'moderator']),
    create: ({ req: { user } }) => hasRole(user, ['admin', 'moderator']),
    update: ({ req: { user } }) => hasRole(user, ['admin', 'moderator']),
    delete: ({ req: { user } }) => hasRole(user, ['admin']),
  },
  fields: [
    // Pre-populated resource fields (from AI analysis)
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Resource title (AI-suggested, editable)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Resource description (AI-suggested, editable)',
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'Primary URL for the resource',
      },
    },

    // AI-suggested categorization
    {
      name: 'suggestedCategory',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'AI-suggested category (can be changed)',
      },
    },
    {
      name: 'suggestedSubcategory',
      type: 'relationship',
      relationTo: 'subcategories',
      admin: {
        description: 'AI-suggested subcategory',
      },
    },
    {
      name: 'suggestedTags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'AI-suggested tags',
      },
    },
    {
      name: 'suggestedDifficulty',
      type: 'relationship',
      relationTo: 'difficulty-levels',
      admin: {
        description: 'AI-suggested difficulty level',
      },
    },
    {
      name: 'suggestedStatus',
      type: 'select',
      options: [
        { label: 'Official (Anthropic)', value: 'official' },
        { label: 'Community', value: 'community' },
        { label: 'Beta', value: 'beta' },
        { label: 'Deprecated', value: 'deprecated' },
      ],
      defaultValue: 'community',
      admin: {
        description: 'AI-suggested status',
      },
    },

    // GitHub metadata (if applicable)
    {
      name: 'github',
      type: 'group',
      admin: {
        description: 'GitHub repository data',
        condition: (data) => !!data?.github?.owner,
      },
      fields: [
        {
          name: 'owner',
          type: 'text',
          admin: {
            description: 'Repository owner',
          },
        },
        {
          name: 'repo',
          type: 'text',
          admin: {
            description: 'Repository name',
          },
        },
        {
          name: 'stars',
          type: 'number',
          admin: {
            description: 'Star count',
          },
        },
        {
          name: 'forks',
          type: 'number',
          admin: {
            description: 'Fork count',
          },
        },
        {
          name: 'language',
          type: 'text',
          admin: {
            description: 'Primary language',
          },
        },
        {
          name: 'lastCommit',
          type: 'date',
          admin: {
            description: 'Last commit date',
          },
        },
        {
          name: 'openIssues',
          type: 'number',
          admin: {
            description: 'Open issues count',
          },
        },
        {
          name: 'license',
          type: 'text',
          admin: {
            description: 'Repository license',
          },
        },
      ],
    },

    // npm/package metadata (if applicable)
    {
      name: 'package',
      type: 'group',
      admin: {
        description: 'Package registry data',
        condition: (data) => !!data?.package?.name,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          admin: {
            description: 'Package name',
          },
        },
        {
          name: 'version',
          type: 'text',
          admin: {
            description: 'Latest version',
          },
        },
        {
          name: 'weeklyDownloads',
          type: 'number',
          admin: {
            description: 'Weekly downloads',
          },
        },
        {
          name: 'registry',
          type: 'select',
          options: [
            { label: 'npm', value: 'npm' },
            { label: 'PyPI', value: 'pypi' },
          ],
          admin: {
            description: 'Package registry',
          },
        },
      ],
    },

    // Discovery source
    {
      name: 'source',
      type: 'relationship',
      relationTo: 'resource-sources',
      admin: {
        description: 'Source where this resource was discovered',
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        description: 'Specific URL where this was found',
      },
    },

    // Raw scraped data (for debugging)
    {
      name: 'rawData',
      type: 'json',
      admin: {
        description: 'Raw scraped data (for debugging)',
      },
    },

    // AI Analysis Results
    {
      name: 'aiAnalysis',
      type: 'group',
      label: 'AI Analysis',
      admin: {
        description: 'Results from Claude Opus 4.5 analysis',
      },
      fields: [
        {
          name: 'confidenceScore',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Overall confidence in categorization (0-100)',
          },
        },
        {
          name: 'relevanceScore',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Relevance to Claude/Anthropic ecosystem (0-100)',
          },
        },
        {
          name: 'qualityScore',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'Project quality assessment (0-100)',
          },
        },
        {
          name: 'reasoning',
          type: 'textarea',
          admin: {
            description: 'AI reasoning for categorization and scores',
          },
        },
        {
          name: 'suggestedImprovements',
          type: 'textarea',
          admin: {
            description: 'Suggestions for improving the resource listing',
          },
        },
        {
          name: 'warnings',
          type: 'textarea',
          admin: {
            description: 'Potential issues or concerns noted by AI',
          },
        },
        {
          name: 'analyzedAt',
          type: 'date',
          admin: {
            description: 'When the AI analysis was performed',
          },
        },
      ],
    },

    // Workflow Status
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Duplicate', value: 'duplicate' },
        { label: 'Needs More Info', value: 'needs_info' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Review workflow status',
      },
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { label: 'High', value: 'high' },
        { label: 'Normal', value: 'normal' },
        { label: 'Low', value: 'low' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Review priority',
      },
    },

    // Review tracking
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'Admin who reviewed this item',
        condition: (data) => data?.status !== 'pending',
      },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'When this was reviewed',
        condition: (data) => data?.status !== 'pending',
      },
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      admin: {
        description: 'Notes from the reviewer',
        condition: (data) => data?.status !== 'pending',
      },
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        description: 'Reason for rejection',
        condition: (data) => data?.status === 'rejected',
      },
    },

    // Links to created/duplicate resources
    {
      name: 'createdResource',
      type: 'relationship',
      relationTo: 'resources',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Resource created from this queue item',
        condition: (data) => data?.status === 'approved',
      },
    },
    {
      name: 'duplicateOf',
      type: 'relationship',
      relationTo: 'resources',
      admin: {
        position: 'sidebar',
        description: 'Existing resource this is a duplicate of',
        condition: (data) => data?.status === 'duplicate',
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
