import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';

/**
 * DocumentSections Collection
 *
 * Tracks individual sections (headings) within documents for granular
 * cross-linking. Sections can have their own tags and resource associations.
 */
export const DocumentSections: CollectionConfig = {
  slug: 'document-sections',
  admin: {
    useAsTitle: 'headingText',
    defaultColumns: ['headingText', 'document', 'headingLevel', 'order'],
    group: 'Content',
    listSearchableFields: ['headingText', 'headingId'],
    description: 'Document sections for granular cross-linking',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  hooks: {
    afterChange: [createRevalidateHook('document-sections')],
    afterDelete: [createDeleteRevalidateHook('document-sections')],
  },
  fields: [
    // Parent document
    {
      name: 'document',
      type: 'relationship',
      relationTo: 'documents',
      required: true,
      admin: {
        description: 'Parent document this section belongs to',
      },
    },

    // Section identification
    {
      name: 'headingId',
      type: 'text',
      required: true,
      admin: {
        description: 'Anchor ID (e.g., "installation-methods")',
        readOnly: true,
      },
    },
    {
      name: 'headingText',
      type: 'text',
      required: true,
      admin: {
        description: 'Heading text content',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'headingLevel',
          type: 'number',
          required: true,
          min: 1,
          max: 6,
          admin: {
            description: 'Heading level (1-6)',
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

    // Section-specific tagging
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Section-specific tags for targeted matching',
      },
    },

    // Related resources for this section
    {
      name: 'relatedResources',
      type: 'relationship',
      relationTo: 'resources',
      hasMany: true,
      admin: {
        description: 'Resources specifically related to this section',
      },
    },

    // Display preferences
    {
      type: 'row',
      fields: [
        {
          name: 'showRelatedResources',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show resources after this section',
            width: '50%',
          },
        },
        {
          name: 'displayMode',
          type: 'select',
          defaultValue: 'inherit',
          options: [
            { label: 'Inherit from Document', value: 'inherit' },
            { label: 'Hover Tooltips Only', value: 'hover' },
            { label: 'Full Cards', value: 'cards' },
          ],
          admin: {
            description: 'Display mode override',
            width: '50%',
          },
        },
      ],
    },

    // Content preview
    {
      name: 'contentPreview',
      type: 'textarea',
      admin: {
        description: 'Preview of section content (first 200 chars)',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
