import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';
import { hasRole } from './Users';

/**
 * Programming Languages Collection
 *
 * Normalizes programming language names and provides metadata
 * for language badges (colors, icons) used in resource displays.
 */
export const ProgrammingLanguages: CollectionConfig = {
  slug: 'programming-languages',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'color', 'resourceCount'],
    group: 'Settings',
    description: 'Programming languages used in resources',
  },
  access: {
    read: () => true, // Public read for badges
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']), // Only superadmin can delete
  },
  hooks: {
    afterChange: [createRevalidateHook('programming-languages')],
    afterDelete: [createDeleteRevalidateHook('programming-languages')],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name (e.g., "TypeScript", "Python")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (e.g., "typescript", "python")',
      },
    },
    {
      name: 'aliases',
      type: 'array',
      admin: {
        description: 'Alternative names that should map to this language',
      },
      fields: [
        {
          name: 'alias',
          type: 'text',
          admin: {
            description: 'Alternative name (e.g., "JS" for JavaScript)',
          },
        },
      ],
    },
    {
      name: 'color',
      type: 'text',
      required: true,
      defaultValue: 'gray-500',
      admin: {
        description: 'Tailwind color class for badges (e.g., "blue-600", "yellow-500")',
      },
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Optional emoji or icon identifier',
      },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Official language website URL',
      },
    },
    {
      name: 'resourceCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of resources using this language (auto-calculated)',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
