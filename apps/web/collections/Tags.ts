import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';
import { hasRole } from './Users';

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'resourceCount', 'updatedAt'],
    group: 'Resources',
  },
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']), // Only superadmin can delete
  },
  hooks: {
    afterChange: [createRevalidateHook('tags')],
    afterDelete: [createDeleteRevalidateHook('tags')],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Tag name (e.g., "typescript", "ai-agent")',
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Optional description of what this tag represents',
      },
    },
    {
      name: 'resourceCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of resources using this tag (auto-calculated)',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
