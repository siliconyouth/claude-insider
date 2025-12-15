import type { CollectionConfig, CollectionAfterChangeHook } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';
import { hasRole } from './Users';
import { notifyAdminsResourceSubmission } from '../lib/admin-notifications';
import type { Resource, Category } from '../payload-types';

/**
 * Hook to notify admins when a resource is submitted for review
 */
const notifyAdminsOnPendingReview: CollectionAfterChangeHook<Resource> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // Only notify when status changes to pending_review or when a new resource is created with pending_review
  const isNewPendingReview = operation === 'create' && doc.publishStatus === 'pending_review';
  const isStatusChangeToPending = operation === 'update' &&
    doc.publishStatus === 'pending_review' &&
    previousDoc?.publishStatus !== 'pending_review';

  if (isNewPendingReview || isStatusChangeToPending) {
    // Get category name if it's populated
    const categoryName = typeof doc.category === 'object' && doc.category
      ? (doc.category as Category).name
      : undefined;

    // Get user info from the request
    const user = req.user;

    notifyAdminsResourceSubmission({
      id: doc.id,
      title: doc.title,
      url: doc.url,
      category: categoryName,
      submittedBy: user ? {
        id: String(user.id),
        email: user.email,
        name: (user as { name?: string }).name,
      } : undefined,
      isNew: operation === 'create',
    }).catch((err) => console.error('[Resources] Admin notification error:', err));
  }

  return doc;
};

export const Resources: CollectionConfig = {
  slug: 'resources',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishStatus', 'status', 'featured', 'updatedAt'],
    group: 'Resources',
    listSearchableFields: ['title', 'description', 'url'],
  },
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => hasRole(user, ['admin', 'moderator']),
  },
  versions: {
    drafts: true,
    maxPerDoc: 10,
  },
  hooks: {
    afterChange: [createRevalidateHook('resources'), notifyAdminsOnPendingReview],
    afterDelete: [createDeleteRevalidateHook('resources')],
  },
  fields: [
    // Publication workflow status
    {
      name: 'publishStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Hidden', value: 'hidden' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Draft', value: 'draft' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Publication workflow status',
      },
    },
    // Core fields
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Resource title (e.g., "Claude Desktop")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Brief description of the resource',
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
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: {
        description: 'Primary category for this resource',
      },
    },
    {
      name: 'subcategory',
      type: 'relationship',
      relationTo: 'subcategories',
      admin: {
        description: 'Subcategory within the parent category',
      },
      // Filter subcategories to only show those belonging to the selected category
      filterOptions: ({ data }) => {
        if (data?.category) {
          return {
            category: {
              equals: data.category,
            },
          };
        }
        return true; // Return true to show all when no category selected
      },
    },

    // Metadata
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Tags for filtering and discovery',
      },
    },
    {
      name: 'difficulty',
      type: 'relationship',
      relationTo: 'difficulty-levels',
      admin: {
        description: 'Skill level required to use this resource',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'community',
      options: [
        { label: 'Official (Anthropic)', value: 'official' },
        { label: 'Community', value: 'community' },
        { label: 'Beta', value: 'beta' },
        { label: 'Deprecated', value: 'deprecated' },
        { label: 'Archived', value: 'archived' },
      ],
    },

    // GitHub information group
    {
      name: 'github',
      type: 'group',
      admin: {
        description: 'GitHub repository information (if applicable)',
      },
      fields: [
        {
          name: 'owner',
          type: 'text',
          admin: {
            description: 'GitHub username or organization',
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
          defaultValue: 0,
          admin: {
            description: 'Star count (auto-updated or manual)',
          },
        },
        {
          name: 'forks',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'lastUpdated',
          type: 'date',
          admin: {
            description: 'Last commit date',
          },
        },
        {
          name: 'language',
          type: 'relationship',
          relationTo: 'programming-languages',
          admin: {
            description: 'Primary programming language',
          },
        },
      ],
    },

    // Versioning
    {
      name: 'version',
      type: 'text',
      admin: {
        description: 'Latest version (for packages, MCP servers)',
      },
    },
    {
      name: 'namespace',
      type: 'text',
      admin: {
        description: 'Package namespace (e.g., "@modelcontextprotocol")',
      },
    },

    // Featured
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show on homepage featured section',
      },
    },
    {
      name: 'featuredReason',
      type: 'select',
      options: [
        { label: "Editor's Pick", value: 'editors-pick' },
        { label: 'Most Popular', value: 'most-popular' },
        { label: 'New', value: 'new' },
        { label: 'Trending', value: 'trending' },
        { label: 'Essential', value: 'essential' },
      ],
      admin: {
        condition: (data) => data?.featured,
        description: 'Reason for featuring (shown as badge)',
      },
    },

    // Dates
    {
      name: 'addedDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Date this resource was added to the collection',
      },
    },
    {
      name: 'lastVerified',
      type: 'date',
      required: true,
      admin: {
        description: 'Last date this resource was verified as active',
      },
    },

    // Cross-linking to documentation (bidirectional)
    {
      name: 'crossLinking',
      type: 'group',
      label: 'Documentation Cross-Linking',
      admin: {
        description: 'Link this resource to related documentation',
      },
      fields: [
        {
          name: 'relatedDocs',
          type: 'relationship',
          relationTo: 'documents',
          hasMany: true,
          admin: {
            description: 'Documentation pages related to this resource',
          },
        },
        {
          name: 'relatedSections',
          type: 'relationship',
          relationTo: 'document-sections',
          hasMany: true,
          admin: {
            description: 'Specific sections related to this resource',
          },
        },
        {
          name: 'autoMatchedDocs',
          type: 'relationship',
          relationTo: 'documents',
          hasMany: true,
          admin: {
            description: 'Auto-matched documents based on shared tags (read-only)',
            readOnly: true,
          },
        },
      ],
    },

    // Discovery metadata (for AI-discovered resources)
    {
      name: 'discovery',
      type: 'group',
      label: 'Discovery Information',
      admin: {
        description: 'Metadata about how this resource was discovered',
      },
      fields: [
        {
          name: 'source',
          type: 'relationship',
          relationTo: 'resource-sources',
          admin: {
            description: 'The source from which this resource was discovered',
          },
        },
        {
          name: 'discoveredAt',
          type: 'date',
          admin: {
            description: 'When this resource was discovered',
          },
        },
        {
          name: 'discoveredBy',
          type: 'select',
          options: [
            { label: 'AI Discovery', value: 'ai' },
            { label: 'Manual Entry', value: 'manual' },
            { label: 'Bulk Import', value: 'import' },
            { label: 'User Suggestion', value: 'suggestion' },
          ],
          admin: {
            description: 'How this resource was added to the system',
          },
        },
        {
          name: 'aiConfidenceScore',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            description: 'AI confidence score (0-100) for auto-discovered resources',
            condition: (data) => data?.discovery?.discoveredBy === 'ai',
          },
        },
        {
          name: 'aiNotes',
          type: 'textarea',
          admin: {
            description: 'AI analysis notes and reasoning',
            condition: (data) => data?.discovery?.discoveredBy === 'ai',
          },
        },
      ],
    },

    // Review tracking (for workflow management)
    {
      name: 'review',
      type: 'group',
      label: 'Review Information',
      admin: {
        description: 'Review and approval tracking',
      },
      fields: [
        {
          name: 'reviewedBy',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'Admin who reviewed this resource',
          },
        },
        {
          name: 'reviewedAt',
          type: 'date',
          admin: {
            description: 'When this resource was last reviewed',
          },
        },
        {
          name: 'reviewNotes',
          type: 'textarea',
          admin: {
            description: 'Notes from the reviewer',
          },
        },
        {
          name: 'rejectionReason',
          type: 'textarea',
          admin: {
            description: 'Reason for rejection (if applicable)',
            condition: (data) => data?.publishStatus === 'rejected',
          },
        },
      ],
    },
  ],
  timestamps: true,
};
