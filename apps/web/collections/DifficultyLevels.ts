import type { CollectionConfig } from 'payload';
import { createRevalidateHook, createDeleteRevalidateHook } from '../lib/revalidate';

/**
 * Difficulty Levels Collection
 *
 * Manages skill level classifications for resources with metadata
 * like colors and descriptions for better filtering UI.
 */
export const DifficultyLevels: CollectionConfig = {
  slug: 'difficulty-levels',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'color', 'sortOrder'],
    group: 'Settings',
    description: 'Skill levels for classifying resource difficulty',
  },
  access: {
    read: () => true, // Public read for filtering
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    afterChange: [createRevalidateHook('difficulty-levels')],
    afterDelete: [createDeleteRevalidateHook('difficulty-levels')],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name (e.g., "Beginner", "Expert")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (e.g., "beginner", "expert")',
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'What this level means (e.g., "No prior experience needed")',
      },
    },
    {
      name: 'color',
      type: 'select',
      required: true,
      defaultValue: 'gray',
      options: [
        { label: 'Green (Easy)', value: 'green' },
        { label: 'Blue (Moderate)', value: 'blue' },
        { label: 'Yellow (Challenging)', value: 'yellow' },
        { label: 'Orange (Hard)', value: 'orange' },
        { label: 'Red (Expert)', value: 'red' },
        { label: 'Purple (Specialist)', value: 'purple' },
        { label: 'Gray (Neutral)', value: 'gray' },
      ],
      admin: {
        description: 'Badge color for this difficulty level',
      },
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Optional emoji icon (e.g., "🌱", "🔥")',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Display order (0=easiest, higher=harder)',
      },
    },
    {
      name: 'resourceCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of resources at this level (auto-calculated)',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
