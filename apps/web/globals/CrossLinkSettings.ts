import type { GlobalConfig } from 'payload';
import { createGlobalRevalidateHook } from '../lib/revalidate';

/**
 * CrossLinkSettings Global
 *
 * System-wide configuration for the documentation-resources cross-linking system.
 * Controls auto-matching thresholds, display defaults, and category mappings.
 */
export const CrossLinkSettings: GlobalConfig = {
  slug: 'cross-link-settings',
  admin: {
    group: 'Settings',
    description: 'Configure cross-linking between documentation and resources',
  },
  access: {
    read: () => true, // Needed for frontend
    update: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    afterChange: [createGlobalRevalidateHook('cross-link-settings')],
  },
  fields: [
    // Auto-Matching Configuration
    {
      name: 'autoMatching',
      type: 'group',
      label: 'Auto-Matching Settings',
      admin: {
        description: 'Configure automatic tag-based matching algorithm',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'minTagOverlap',
              type: 'number',
              required: true,
              defaultValue: 2,
              min: 1,
              max: 10,
              admin: {
                description: 'Minimum shared tags required for a match',
                width: '33%',
              },
            },
            {
              name: 'minScoreThreshold',
              type: 'number',
              required: true,
              defaultValue: 0.3,
              min: 0,
              max: 1,
              admin: {
                description: 'Minimum match score (0-1)',
                width: '33%',
              },
            },
            {
              name: 'maxAutoMatches',
              type: 'number',
              required: true,
              defaultValue: 5,
              min: 1,
              max: 20,
              admin: {
                description: 'Maximum auto-matched resources per document',
                width: '33%',
              },
            },
          ],
        },
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Enable automatic matching globally',
          },
        },
      ],
    },

    // Display Defaults
    {
      name: 'displayDefaults',
      type: 'group',
      label: 'Display Defaults',
      admin: {
        description: 'Default display settings for cross-links',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'defaultDisplayMode',
              type: 'select',
              required: true,
              defaultValue: 'both',
              options: [
                { label: 'Hover Tooltips Only', value: 'hover' },
                { label: 'Full Cards Only', value: 'cards' },
                { label: 'Both', value: 'both' },
              ],
              admin: {
                description: 'Default display mode for new documents',
                width: '50%',
              },
            },
            {
              name: 'hoverDelayMs',
              type: 'number',
              required: true,
              defaultValue: 200,
              min: 0,
              max: 2000,
              admin: {
                description: 'Hover delay in milliseconds',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'showResourceCardsAfterSection',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show resource cards at the end of sections',
          },
        },
        {
          name: 'showResourceCardsAtDocumentEnd',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show aggregated resources at document end',
          },
        },
        {
          name: 'maxCardsPerSection',
          type: 'number',
          defaultValue: 3,
          min: 1,
          max: 10,
          admin: {
            description: 'Maximum resource cards to show per section',
          },
        },
      ],
    },

    // Scoring Weights
    {
      name: 'scoringWeights',
      type: 'group',
      label: 'Scoring Algorithm Weights',
      admin: {
        description: 'Adjust how different factors influence matching scores',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'tagOverlapWeight',
              type: 'number',
              required: true,
              defaultValue: 0.6,
              min: 0,
              max: 1,
              admin: {
                description: 'Tag overlap weight (0-1)',
                width: '33%',
              },
            },
            {
              name: 'categoryMappingWeight',
              type: 'number',
              required: true,
              defaultValue: 0.25,
              min: 0,
              max: 1,
              admin: {
                description: 'Category mapping weight (0-1)',
                width: '33%',
              },
            },
            {
              name: 'titleSimilarityWeight',
              type: 'number',
              required: true,
              defaultValue: 0.15,
              min: 0,
              max: 1,
              admin: {
                description: 'Title similarity weight (0-1)',
                width: '33%',
              },
            },
          ],
        },
      ],
    },

    // Category Mappings
    {
      name: 'categoryMappings',
      type: 'array',
      label: 'Category Mappings',
      admin: {
        description: 'Map documentation categories to resource categories for boosted matching',
      },
      fields: [
        {
          name: 'docCategory',
          type: 'text',
          required: true,
          admin: {
            description: 'Documentation category (e.g., "getting-started")',
          },
        },
        {
          name: 'resourceCategories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          required: true,
          admin: {
            description: 'Resource categories that should be boosted',
          },
        },
        {
          name: 'boostWeight',
          type: 'number',
          required: true,
          defaultValue: 1.0,
          min: 0.1,
          max: 3.0,
          admin: {
            description: 'Boost multiplier (1.0 = normal, 2.0 = double)',
          },
        },
      ],
      defaultValue: [
        // Default mappings will be initialized by seed script
      ],
    },

    // Feature Flags
    {
      name: 'features',
      type: 'group',
      label: 'Feature Flags',
      admin: {
        description: 'Enable or disable cross-linking features',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'enableHoverCards',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Enable hover preview cards',
                width: '50%',
              },
            },
            {
              name: 'enableInlineCards',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Enable inline resource cards',
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'enableSectionLinks',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Enable section-level linking',
                width: '50%',
              },
            },
            {
              name: 'enableCodeBlockLinks',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Enable code block linking',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'enableBidirectionalLinks',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show related docs on resource pages',
          },
        },
      ],
    },
  ],
};
