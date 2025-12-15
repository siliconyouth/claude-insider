import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';
import { hasRole } from './Users';

/**
 * Documents Collection
 *
 * Mirrors MDX documentation files in Payload CMS for cross-linking management.
 * Documents are synced from the filesystem at build time, with relationships
 * managed through the admin panel.
 */
export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'docCategory', 'displayMode', 'lastSynced', 'updatedAt'],
    group: 'Content',
    listSearchableFields: ['title', 'slug', 'description'],
    description: 'Documentation pages synced from MDX files',
  },
  access: {
    read: () => true, // Public read for API access
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']), // Only superadmin can delete
  },
  hooks: {
    afterChange: [createRevalidateHook('documents')],
    afterDelete: [createDeleteRevalidateHook('documents')],
  },
  fields: [
    // Core identification
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL path slug (e.g., "getting-started/installation")',
        readOnly: true, // Set by sync script
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Document title from frontmatter',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Document description from frontmatter',
      },
    },

    // Categorization
    {
      name: 'docCategory',
      type: 'text',
      required: true,
      admin: {
        description: 'Documentation category (e.g., "getting-started", "api")',
        readOnly: true, // Derived from file path
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Tags for auto-matching with resources',
      },
    },

    // Cross-linking configuration
    {
      type: 'row',
      fields: [
        {
          name: 'displayMode',
          type: 'select',
          defaultValue: 'both',
          options: [
            { label: 'Hover Tooltips Only', value: 'hover' },
            { label: 'Full Cards Only', value: 'cards' },
            { label: 'Both (Recommended)', value: 'both' },
          ],
          admin: {
            description: 'How to display related resources',
            width: '50%',
          },
        },
        {
          name: 'autoMatchEnabled',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Enable automatic tag-based matching',
            width: '50%',
          },
        },
      ],
    },

    // Related resources - manual overrides
    {
      name: 'relatedResources',
      type: 'relationship',
      relationTo: 'resources',
      hasMany: true,
      admin: {
        description: 'Manually linked resources (takes priority over auto-matched)',
      },
    },
    {
      name: 'excludedResources',
      type: 'relationship',
      relationTo: 'resources',
      hasMany: true,
      admin: {
        description: 'Resources to exclude from auto-matching',
      },
    },

    // Auto-matched resources (computed, read-only)
    {
      name: 'autoMatchedResources',
      type: 'relationship',
      relationTo: 'resources',
      hasMany: true,
      admin: {
        description: 'Automatically matched based on shared tags (read-only)',
        readOnly: true,
      },
    },

    // Sync tracking
    {
      name: 'syncInfo',
      type: 'group',
      admin: {
        description: 'Sync tracking information',
      },
      fields: [
        {
          name: 'mdxPath',
          type: 'text',
          admin: {
            description: 'Path to source MDX file',
            readOnly: true,
          },
        },
        {
          name: 'contentHash',
          type: 'text',
          admin: {
            description: 'MD5 hash for change detection',
            readOnly: true,
          },
        },
        {
          name: 'lastSynced',
          type: 'date',
          admin: {
            description: 'Last sync timestamp',
            readOnly: true,
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },

    // Metadata
    {
      name: 'metadata',
      type: 'group',
      admin: {
        description: 'Additional metadata',
      },
      fields: [
        {
          name: 'readingTime',
          type: 'text',
          admin: {
            description: 'Estimated reading time',
            readOnly: true,
          },
        },
        {
          name: 'wordCount',
          type: 'number',
          admin: {
            description: 'Word count',
            readOnly: true,
          },
        },
        {
          name: 'headingCount',
          type: 'number',
          admin: {
            description: 'Number of headings/sections',
            readOnly: true,
          },
        },
        {
          name: 'codeBlockCount',
          type: 'number',
          admin: {
            description: 'Number of code blocks',
            readOnly: true,
          },
        },
      ],
    },
  ],
  timestamps: true,
};
