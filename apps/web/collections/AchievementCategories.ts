import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';

/**
 * Achievement Categories Collection
 *
 * Organizes achievements into thematic groups.
 * Categories: milestone, social, content, streak, exploration, contribution, security, special, seasonal, veteran
 */
export const AchievementCategories: CollectionConfig = {
  slug: 'achievement-categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'icon', 'sortOrder'],
    group: 'Gamification',
    description: 'Organize achievements into thematic categories',
  },
  access: {
    read: () => true, // Public read for frontend rendering
    create: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
    update: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']),
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (e.g., "milestone", "social", "streak")',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name (e.g., "Milestones", "Social")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Description of what achievements in this category represent',
      },
    },
    {
      name: 'icon',
      type: 'text',
      required: true,
      admin: {
        description: 'Lucide icon name (e.g., "trophy", "users", "flame")',
      },
    },
    {
      name: 'color',
      type: 'text',
      defaultValue: 'blue',
      admin: {
        description: 'Tailwind color for the category (e.g., "blue", "violet", "cyan")',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Display order in the achievements list (lower = first)',
      },
    },
  ],
  timestamps: true,
};
