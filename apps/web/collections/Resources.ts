import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';

export const Resources: CollectionConfig = {
  slug: 'resources',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'featured', 'updatedAt'],
    group: 'Resources',
    listSearchableFields: ['title', 'description', 'url'],
  },
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: {
    afterChange: [createRevalidateHook('resources')],
    afterDelete: [createDeleteRevalidateHook('resources')],
  },
  fields: [
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
        return {};
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
  ],
  timestamps: true,
};
