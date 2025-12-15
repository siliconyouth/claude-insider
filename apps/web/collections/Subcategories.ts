import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';
import { hasRole } from './Users';

/**
 * Subcategories Collection
 *
 * Subcategories are linked to their parent Category, enabling hierarchical
 * organization of resources. Examples:
 * - Category: "Tools" → Subcategories: "Desktop Apps", "CLI Tools", "Browser Extensions"
 * - Category: "MCP Servers" → Subcategories: "Data Sources", "AI Services", "Developer Tools"
 */
export const Subcategories: CollectionConfig = {
  slug: 'subcategories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'resourceCount', 'sortOrder'],
    group: 'Resources',
    description: 'Subcategories belong to a parent category for hierarchical organization',
  },
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']), // Only superadmin can delete
  },
  hooks: {
    afterChange: [createRevalidateHook('subcategories')],
    afterDelete: [createDeleteRevalidateHook('subcategories')],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name (e.g., "Desktop Apps", "CLI Tools")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'URL-friendly identifier (e.g., "desktop-apps")',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: {
        description: 'Parent category this subcategory belongs to',
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Brief description of what resources belong here',
      },
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Optional emoji icon for the subcategory',
      },
    },
    {
      name: 'resourceCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of resources in this subcategory (auto-calculated)',
        readOnly: true,
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Display order within the parent category (lower = first)',
      },
    },
  ],
  timestamps: true,
};
