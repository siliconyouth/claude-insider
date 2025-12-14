import type { CollectionConfig } from 'payload';
import { hasRole } from './Users';

/**
 * ResourceSources Collection
 *
 * Tracks discovery sources for resources - where to find new Claude AI tools,
 * libraries, and resources. Supports multiple source types:
 *
 * - GitHub repositories (search by topic, parse READMEs)
 * - Awesome lists (markdown files with curated links)
 * - Package registries (npm, PyPI)
 * - Websites (generic URL scraping)
 * - RSS feeds (for blogs and announcements)
 * - APIs (programmatic discovery)
 */
export const ResourceSources: CollectionConfig = {
  slug: 'resource-sources',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'isActive', 'scanFrequency', 'lastScannedAt', 'resourceCount'],
    group: 'Resources',
    description: 'Sources for discovering new resources',
  },
  access: {
    read: ({ req: { user } }) => hasRole(user, ['admin', 'moderator']),
    create: ({ req: { user } }) => hasRole(user, ['admin']),
    update: ({ req: { user } }) => hasRole(user, ['admin', 'moderator']),
    delete: ({ req: { user } }) => hasRole(user, ['admin']),
  },
  fields: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for this source (e.g., "Awesome Claude Code")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'What kind of resources can be found from this source',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'GitHub Repository', value: 'github_repo' },
        { label: 'GitHub Topic/Search', value: 'github_search' },
        { label: 'Awesome List', value: 'awesome_list' },
        { label: 'npm Registry', value: 'npm' },
        { label: 'PyPI Registry', value: 'pypi' },
        { label: 'Website', value: 'website' },
        { label: 'RSS Feed', value: 'rss' },
        { label: 'API Endpoint', value: 'api' },
        { label: 'Manual Collection', value: 'manual' },
      ],
      admin: {
        description: 'Type of source determines how discovery works',
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'Primary URL or API endpoint for this source',
      },
    },

    // GitHub-specific configuration
    {
      name: 'github',
      type: 'group',
      admin: {
        description: 'GitHub-specific configuration',
        condition: (data) => data?.type?.startsWith('github'),
      },
      fields: [
        {
          name: 'owner',
          type: 'text',
          admin: {
            description: 'Repository owner (username or organization)',
          },
        },
        {
          name: 'repo',
          type: 'text',
          admin: {
            description: 'Repository name',
          },
        },
        {
          name: 'branch',
          type: 'text',
          defaultValue: 'main',
          admin: {
            description: 'Branch to scan (default: main)',
          },
        },
        {
          name: 'path',
          type: 'text',
          admin: {
            description: 'Path to scan (e.g., "README.md" or "docs/")',
          },
        },
        {
          name: 'searchQuery',
          type: 'text',
          admin: {
            description: 'GitHub search query (for github_search type)',
            condition: (data, siblingData) => siblingData?.type === 'github_search',
          },
        },
        {
          name: 'topics',
          type: 'text',
          admin: {
            description: 'Comma-separated topics to filter by',
          },
        },
      ],
    },

    // Package registry configuration
    {
      name: 'registry',
      type: 'group',
      admin: {
        description: 'Package registry configuration',
        condition: (data) => ['npm', 'pypi'].includes(data?.type),
      },
      fields: [
        {
          name: 'searchQuery',
          type: 'text',
          admin: {
            description: 'Package search query (e.g., "claude", "anthropic")',
          },
        },
        {
          name: 'scope',
          type: 'text',
          admin: {
            description: 'Package scope to monitor (e.g., "@anthropic-ai")',
          },
        },
        {
          name: 'keywords',
          type: 'text',
          admin: {
            description: 'Comma-separated keywords to filter by',
          },
        },
      ],
    },

    // Discovery Settings
    {
      name: 'discoverySettings',
      type: 'group',
      label: 'Discovery Settings',
      admin: {
        description: 'How discovered resources should be processed',
      },
      fields: [
        {
          name: 'defaultCategory',
          type: 'relationship',
          relationTo: 'categories',
          admin: {
            description: 'Default category for resources from this source',
          },
        },
        {
          name: 'defaultSubcategory',
          type: 'relationship',
          relationTo: 'subcategories',
          admin: {
            description: 'Default subcategory for resources from this source',
          },
        },
        {
          name: 'defaultTags',
          type: 'relationship',
          relationTo: 'tags',
          hasMany: true,
          admin: {
            description: 'Tags to automatically apply to discovered resources',
          },
        },
        {
          name: 'autoApprove',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Automatically approve resources from trusted sources',
          },
        },
        {
          name: 'minStars',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: {
            description: 'Minimum GitHub stars required (0 = no minimum)',
            condition: (data) => data?.type?.startsWith('github'),
          },
        },
        {
          name: 'minDownloads',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: {
            description: 'Minimum weekly downloads required (0 = no minimum)',
            condition: (data) => ['npm', 'pypi'].includes(data?.type),
          },
        },
        {
          name: 'includePatterns',
          type: 'textarea',
          admin: {
            description: 'URL patterns to include (one per line, regex supported)',
          },
        },
        {
          name: 'excludePatterns',
          type: 'textarea',
          admin: {
            description: 'URL patterns to exclude (one per line, regex supported)',
          },
        },
      ],
    },

    // Status and Scheduling
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Enable or disable this source',
      },
    },
    {
      name: 'scanFrequency',
      type: 'select',
      defaultValue: 'weekly',
      options: [
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Manual Only', value: 'manual' },
      ],
      admin: {
        position: 'sidebar',
        description: 'How often to scan this source',
      },
    },
    {
      name: 'lastScannedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Last successful scan timestamp',
      },
    },
    {
      name: 'lastScanStatus',
      type: 'select',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Partial', value: 'partial' },
        { label: 'Failed', value: 'failed' },
        { label: 'Never Scanned', value: 'never' },
      ],
      defaultValue: 'never',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Status of last scan',
      },
    },
    {
      name: 'lastScanError',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Error message from last failed scan',
        condition: (data) => data?.lastScanStatus === 'failed',
      },
    },

    // Statistics
    {
      name: 'resourceCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Total resources discovered from this source',
      },
    },
    {
      name: 'pendingCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Resources pending review from this source',
      },
    },

    // Notes
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this source',
      },
    },
  ],
  timestamps: true,
};
