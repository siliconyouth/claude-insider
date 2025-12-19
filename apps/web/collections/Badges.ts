import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';

/**
 * Badges Collection
 *
 * Defines badges that appear on user profiles.
 * Types: role, donor, special, event, verified
 */
export const Badges: CollectionConfig = {
  slug: 'badges',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'type', 'priority', 'isActive'],
    group: 'Gamification',
    description: 'Create and manage profile badges',
  },
  access: {
    read: () => true, // Public read for frontend rendering
    create: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
    update: ({ req: { user } }) => hasRole(user, ['admin', 'superadmin']),
    delete: ({ req: { user } }) => hasRole(user, ['superadmin']),
  },
  fields: [
    // Basic Information
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique identifier (e.g., "verified", "beta_tester", "donor_gold")',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name (e.g., "Verified", "Beta Tester")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Tooltip text explaining what this badge represents',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Role Badge', value: 'role' },
        { label: 'Donor Badge', value: 'donor' },
        { label: 'Special Badge', value: 'special' },
        { label: 'Event Badge', value: 'event' },
        { label: 'Verified Badge', value: 'verified' },
        { label: 'Achievement Badge', value: 'achievement' },
      ],
      admin: {
        description: 'Badge category - determines how it\'s awarded',
      },
    },
    // Visual Configuration
    {
      type: 'collapsible',
      label: 'Visual Configuration',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'icon',
          type: 'text',
          required: true,
          admin: {
            description: 'Lucide icon name (e.g., "badge-check", "shield", "star")',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'textColor',
              type: 'text',
              defaultValue: 'white',
              admin: {
                description: 'Text/icon color (Tailwind class)',
                width: '33%',
              },
            },
            {
              name: 'bgColor',
              type: 'text',
              defaultValue: 'blue-500',
              admin: {
                description: 'Background color (Tailwind class)',
                width: '33%',
              },
            },
            {
              name: 'borderColor',
              type: 'text',
              admin: {
                description: 'Border color (optional)',
                width: '33%',
              },
            },
          ],
        },
        {
          name: 'gradient',
          type: 'group',
          label: 'Gradient (Optional)',
          admin: {
            description: 'Use gradient instead of solid background',
          },
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'from',
              type: 'text',
              admin: {
                condition: (data, siblingData) => siblingData?.enabled,
              },
            },
            {
              name: 'via',
              type: 'text',
              admin: {
                condition: (data, siblingData) => siblingData?.enabled,
              },
            },
            {
              name: 'to',
              type: 'text',
              admin: {
                condition: (data, siblingData) => siblingData?.enabled,
              },
            },
          ],
        },
      ],
    },
    // Award Conditions
    {
      type: 'collapsible',
      label: 'Award Conditions',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'roleRequired',
          type: 'select',
          options: [
            { label: 'Any', value: '' },
            { label: 'Editor', value: 'editor' },
            { label: 'Moderator', value: 'moderator' },
            { label: 'Admin', value: 'admin' },
            { label: 'Superadmin', value: 'superadmin' },
          ],
          admin: {
            description: 'User must have this role (for role badges)',
          },
        },
        {
          name: 'donorTierRequired',
          type: 'select',
          options: [
            { label: 'Any', value: '' },
            { label: 'Bronze ($10+)', value: 'bronze' },
            { label: 'Silver ($50+)', value: 'silver' },
            { label: 'Gold ($100+)', value: 'gold' },
            { label: 'Platinum ($500+)', value: 'platinum' },
          ],
          admin: {
            description: 'User must have this donor tier (for donor badges)',
          },
        },
        {
          name: 'achievementRequired',
          type: 'relationship',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          relationTo: 'achievements' as any,
          admin: {
            description: 'User must have earned this achievement',
          },
        },
        {
          name: 'manualOnly',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Only award this badge manually (not auto-assigned)',
          },
        },
      ],
    },
    // Display Settings
    {
      type: 'row',
      fields: [
        {
          name: 'priority',
          type: 'number',
          required: true,
          defaultValue: 0,
          admin: {
            description: 'Higher = shown first on profile',
            width: '50%',
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Badge can be displayed',
            width: '50%',
          },
        },
      ],
    },
  ],
  timestamps: true,
};
