import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';

/**
 * CodeExamples Collection
 *
 * Tracks code blocks within documents for granular cross-linking.
 * Each code block can be tagged and linked to relevant resources.
 */
export const CodeExamples: CollectionConfig = {
  slug: 'code-examples',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'document', 'language', 'order'],
    group: 'Content',
    listSearchableFields: ['title', 'codeId', 'filename'],
    description: 'Code blocks for targeted resource linking',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: {
    afterChange: [createRevalidateHook('code-examples')],
    afterDelete: [createDeleteRevalidateHook('code-examples')],
  },
  fields: [
    // Parent relationships
    {
      name: 'document',
      type: 'relationship',
      relationTo: 'documents',
      required: true,
      admin: {
        description: 'Parent document containing this code block',
      },
    },
    {
      name: 'section',
      type: 'relationship',
      relationTo: 'document-sections',
      admin: {
        description: 'Parent section (optional, for nested context)',
      },
      // Filter to show only sections from the selected document
      filterOptions: ({ data }) => {
        if (data?.document) {
          return {
            document: {
              equals: data.document,
            },
          };
        }
        return true;
      },
    },

    // Code identification
    {
      name: 'codeId',
      type: 'text',
      required: true,
      admin: {
        description: 'Unique identifier for this code block',
        readOnly: true,
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Optional title for the code block',
      },
    },
    {
      name: 'filename',
      type: 'text',
      admin: {
        description: 'Filename if specified (e.g., "settings.json")',
      },
    },

    // Language and position
    {
      type: 'row',
      fields: [
        {
          name: 'language',
          type: 'relationship',
          relationTo: 'programming-languages',
          admin: {
            description: 'Programming language',
            width: '50%',
          },
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          admin: {
            description: 'Position in document',
            width: '50%',
          },
        },
      ],
    },

    // Code preview
    {
      name: 'codePreview',
      type: 'textarea',
      admin: {
        description: 'First 500 characters of the code',
        readOnly: true,
      },
    },

    // Tagging
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Tags for this specific code example',
      },
    },

    // Related resources
    {
      name: 'relatedResources',
      type: 'relationship',
      relationTo: 'resources',
      hasMany: true,
      admin: {
        description: 'Resources related to this code example',
      },
    },

    // Metadata
    {
      name: 'metadata',
      type: 'group',
      admin: {
        description: 'Code block metadata',
      },
      fields: [
        {
          name: 'lineCount',
          type: 'number',
          admin: {
            description: 'Number of lines',
            readOnly: true,
          },
        },
        {
          name: 'patterns',
          type: 'json',
          admin: {
            description: 'Detected patterns (cli, apiCall, config, etc.)',
            readOnly: true,
          },
        },
      ],
    },
  ],
  timestamps: true,
};
