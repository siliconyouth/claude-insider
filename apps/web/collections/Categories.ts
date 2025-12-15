import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';
import { hasRole } from './Users';

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'icon', 'sortOrder'],
    group: 'Resources',
  },
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']), // Only superadmin can delete
  },
  hooks: {
    afterChange: [createRevalidateHook('categories')],
    afterDelete: [createDeleteRevalidateHook('categories')],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (e.g., "mcp-servers")',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full display name (e.g., "MCP Servers")',
      },
    },
    {
      name: 'shortName',
      type: 'text',
      required: true,
      admin: {
        description: 'Abbreviated name for compact displays (e.g., "MCP")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'icon',
      type: 'text',
      required: true,
      admin: {
        description: 'Emoji icon for the category (e.g., "🔌")',
      },
    },
    {
      name: 'color',
      type: 'select',
      required: true,
      options: [
        { label: 'Violet', value: 'violet' },
        { label: 'Blue', value: 'blue' },
        { label: 'Cyan', value: 'cyan' },
        { label: 'Green', value: 'green' },
        { label: 'Yellow', value: 'yellow' },
        { label: 'Purple', value: 'purple' },
        { label: 'Pink', value: 'pink' },
        { label: 'Indigo', value: 'indigo' },
        { label: 'Amber', value: 'amber' },
        { label: 'Rose', value: 'rose' },
      ],
      defaultValue: 'blue',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order for displaying categories (lower = first)',
      },
    },
  ],
  timestamps: true,
};
