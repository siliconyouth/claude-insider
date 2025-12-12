import type { GlobalConfig } from 'payload';
import { createGlobalRevalidateHook } from '../lib/revalidate';

/**
 * Site Settings Global
 * Single document for site-wide configuration
 * Editable from admin panel at /admin/globals/site-settings
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description: 'Global site configuration - changes apply site-wide',
  },
  access: {
    read: () => true, // Public read for frontend
    update: ({ req: { user } }) => user?.role === 'admin', // Only admins can edit
  },
  hooks: {
    afterChange: [createGlobalRevalidateHook('site-settings')],
  },
  fields: [
    // ========== General Settings ==========
    {
      name: 'general',
      type: 'group',
      label: 'General',
      fields: [
        {
          name: 'siteName',
          type: 'text',
          label: 'Site Name',
          required: true,
          defaultValue: 'Claude Insider',
          admin: {
            description: 'The name of the website',
          },
        },
        {
          name: 'tagline',
          type: 'text',
          label: 'Tagline',
          required: true,
          defaultValue: 'Your Guide to Mastering Claude AI',
          admin: {
            description: 'Short tagline displayed in header and meta tags',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Site Description',
          required: true,
          defaultValue: 'Comprehensive documentation, tips, tricks, and resources for Claude AI by Anthropic.',
          admin: {
            description: 'Used for SEO meta description and Open Graph',
          },
        },
        {
          name: 'version',
          type: 'text',
          label: 'Site Version',
          defaultValue: '0.26.0',
          admin: {
            description: 'Current version displayed in footer',
          },
        },
      ],
    },

    // ========== Social Links ==========
    {
      name: 'social',
      type: 'group',
      label: 'Social Links',
      fields: [
        {
          name: 'github',
          type: 'text',
          label: 'GitHub URL',
          defaultValue: 'https://github.com/siliconyouth/claude-insider',
          admin: {
            description: 'GitHub repository URL',
          },
        },
        {
          name: 'twitter',
          type: 'text',
          label: 'Twitter/X URL',
          admin: {
            description: 'Twitter/X profile URL (optional)',
          },
        },
        {
          name: 'discord',
          type: 'text',
          label: 'Discord URL',
          admin: {
            description: 'Discord server invite URL (optional)',
          },
        },
        {
          name: 'linkedin',
          type: 'text',
          label: 'LinkedIn URL',
          admin: {
            description: 'LinkedIn profile or company page URL (optional)',
          },
        },
      ],
    },

    // ========== Footer ==========
    {
      name: 'footer',
      type: 'group',
      label: 'Footer',
      fields: [
        {
          name: 'copyrightText',
          type: 'text',
          label: 'Copyright Text',
          defaultValue: '© 2025 Vladimir Dukelic. All rights reserved.',
          admin: {
            description: 'Copyright notice in footer',
          },
        },
        {
          name: 'showVersion',
          type: 'checkbox',
          label: 'Show Version in Footer',
          defaultValue: true,
        },
        {
          name: 'showBuildInfo',
          type: 'checkbox',
          label: 'Show Build Info in Footer',
          defaultValue: true,
          admin: {
            description: 'Shows build date and commit SHA',
          },
        },
      ],
    },

    // ========== SEO Settings ==========
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Settings',
      fields: [
        {
          name: 'ogImage',
          type: 'text',
          label: 'Default OG Image URL',
          defaultValue: '/og-image.png',
          admin: {
            description: 'Default Open Graph image for social sharing',
          },
        },
        {
          name: 'twitterHandle',
          type: 'text',
          label: 'Twitter Handle',
          admin: {
            description: 'Twitter handle for Twitter Cards (e.g., @claudeinsider)',
          },
        },
        {
          name: 'googleAnalyticsId',
          type: 'text',
          label: 'Google Analytics ID',
          admin: {
            description: 'Google Analytics measurement ID (optional)',
          },
        },
      ],
    },

    // ========== Feature Flags ==========
    {
      name: 'features',
      type: 'group',
      label: 'Feature Flags',
      fields: [
        {
          name: 'maintenanceMode',
          type: 'checkbox',
          label: 'Maintenance Mode',
          defaultValue: false,
          admin: {
            description: 'Enable to show maintenance page to visitors',
          },
        },
        {
          name: 'maintenanceMessage',
          type: 'textarea',
          label: 'Maintenance Message',
          defaultValue: 'We are currently performing scheduled maintenance. Please check back soon.',
          admin: {
            description: 'Message displayed during maintenance',
            condition: (data) => data?.features?.maintenanceMode,
          },
        },
        {
          name: 'enableVoiceAssistant',
          type: 'checkbox',
          label: 'Enable Voice Assistant',
          defaultValue: true,
          admin: {
            description: 'Show/hide the AI voice assistant feature',
          },
        },
        {
          name: 'enableSearch',
          type: 'checkbox',
          label: 'Enable Search',
          defaultValue: true,
          admin: {
            description: 'Enable/disable the search functionality',
          },
        },
        {
          name: 'enableAnalytics',
          type: 'checkbox',
          label: 'Enable Analytics',
          defaultValue: true,
          admin: {
            description: 'Enable Vercel Analytics tracking',
          },
        },
      ],
    },

    // ========== Contact Info ==========
    {
      name: 'contact',
      type: 'group',
      label: 'Contact Information',
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Contact Email',
          defaultValue: 'vladimir@dukelic.com',
          admin: {
            description: 'Primary contact email address',
          },
        },
        {
          name: 'supportUrl',
          type: 'text',
          label: 'Support URL',
          defaultValue: 'https://github.com/siliconyouth/claude-insider/issues',
          admin: {
            description: 'URL for support/issues',
          },
        },
      ],
    },

    // ========== Announcement Banner ==========
    {
      name: 'announcement',
      type: 'group',
      label: 'Announcement Banner',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Show Announcement Banner',
          defaultValue: false,
        },
        {
          name: 'message',
          type: 'text',
          label: 'Announcement Message',
          admin: {
            description: 'Short message for the top banner',
            condition: (data) => data?.announcement?.enabled,
          },
        },
        {
          name: 'link',
          type: 'text',
          label: 'Announcement Link',
          admin: {
            description: 'Optional link for "Learn more"',
            condition: (data) => data?.announcement?.enabled,
          },
        },
        {
          name: 'type',
          type: 'select',
          label: 'Banner Type',
          defaultValue: 'info',
          options: [
            { label: 'Info (Blue)', value: 'info' },
            { label: 'Success (Green)', value: 'success' },
            { label: 'Warning (Yellow)', value: 'warning' },
            { label: 'New Feature (Purple)', value: 'feature' },
          ],
          admin: {
            condition: (data) => data?.announcement?.enabled,
          },
        },
      ],
    },
  ],
};
