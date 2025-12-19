import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';

/**
 * Achievement Tiers Collection
 *
 * Defines rarity tiers for achievements with associated visuals and point multipliers.
 * Default tiers: common, rare, epic, legendary
 */
export const AchievementTiers: CollectionConfig = {
  slug: 'achievement-tiers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'pointMultiplier', 'sortOrder'],
    group: 'Gamification',
    description: 'Configure achievement rarity tiers with colors and animations',
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
        description: 'Unique identifier (e.g., "common", "rare", "epic", "legendary")',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name (e.g., "Common", "Rare")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional description of what this tier represents',
      },
    },
    {
      name: 'pointMultiplier',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      max: 10,
      admin: {
        description: 'Points multiplier for achievements in this tier (1-10x)',
      },
    },
    // Visual Configuration
    {
      name: 'colorGradient',
      type: 'group',
      label: 'Color Gradient',
      admin: {
        description: 'Tailwind gradient classes for the tier badge',
      },
      fields: [
        {
          name: 'from',
          type: 'text',
          required: true,
          defaultValue: 'gray-400',
          admin: {
            description: 'Starting color (e.g., "gray-400", "violet-500")',
          },
        },
        {
          name: 'via',
          type: 'text',
          admin: {
            description: 'Middle color (optional)',
          },
        },
        {
          name: 'to',
          type: 'text',
          required: true,
          defaultValue: 'gray-500',
          admin: {
            description: 'Ending color (e.g., "gray-500", "blue-600")',
          },
        },
      ],
    },
    {
      name: 'glowColor',
      type: 'text',
      defaultValue: 'gray-500/20',
      admin: {
        description: 'Glow/shadow color with opacity (e.g., "blue-500/25")',
      },
    },
    {
      name: 'textColor',
      type: 'text',
      defaultValue: 'gray-600',
      admin: {
        description: 'Text color for the tier name (e.g., "gray-600", "violet-400")',
      },
    },
    {
      name: 'animation',
      type: 'select',
      required: true,
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Pulse', value: 'pulse' },
        { label: 'Glow', value: 'glow' },
        { label: 'Shine', value: 'shine' },
        { label: 'Rainbow', value: 'rainbow' },
      ],
      admin: {
        description: 'CSS animation effect for this tier',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Display order (lower = more common, higher = more rare)',
      },
    },
  ],
  timestamps: true,
};
