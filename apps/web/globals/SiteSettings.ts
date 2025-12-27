import type { GlobalConfig } from 'payload';
import { createGlobalRevalidateHook } from '../lib/revalidate';
import { publicRead, adminAccess } from '../lib/payload-access';

/**
 * Site Settings Global
 * Single document for site-wide configuration
 * Editable from admin panel at /admin/globals/site-settings
 *
 * Access Control:
 * - Read: Public (needed for frontend)
 * - Update: Admin and Superadmin only
 * - Announcement section: Moderators can also update
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    description: 'Global site configuration - changes apply site-wide',
  },
  access: {
    read: publicRead,
    update: adminAccess,
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
      admin: {
        description: 'Core site identity and branding',
      },
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
          defaultValue: '1.13.1',
          admin: {
            description: 'Current version displayed in footer',
          },
        },
        {
          name: 'logo',
          type: 'upload',
          label: 'Site Logo',
          relationTo: 'media',
          admin: {
            description: 'Logo image for header and branding (optional)',
          },
        },
        {
          name: 'favicon',
          type: 'upload',
          label: 'Favicon',
          relationTo: 'media',
          admin: {
            description: 'Browser tab icon (optional, uses default if not set)',
          },
        },
      ],
    },

    // ========== Social Links ==========
    {
      name: 'social',
      type: 'group',
      label: 'Social Links',
      admin: {
        description: 'Social media profile URLs',
      },
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
        {
          name: 'youtube',
          type: 'text',
          label: 'YouTube URL',
          admin: {
            description: 'YouTube channel URL (optional)',
          },
        },
        {
          name: 'bluesky',
          type: 'text',
          label: 'Bluesky URL',
          admin: {
            description: 'Bluesky profile URL (optional)',
          },
        },
      ],
    },

    // ========== Footer ==========
    {
      name: 'footer',
      type: 'group',
      label: 'Footer',
      admin: {
        description: 'Footer display options',
      },
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
        {
          name: 'customFooterLinks',
          type: 'array',
          label: 'Custom Footer Links',
          admin: {
            description: 'Additional links to display in footer',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  admin: { width: '40%' },
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  admin: { width: '40%' },
                },
                {
                  name: 'external',
                  type: 'checkbox',
                  label: 'External',
                  defaultValue: false,
                  admin: { width: '20%' },
                },
              ],
            },
          ],
        },
      ],
    },

    // ========== SEO Settings (Basic) ==========
    {
      name: 'seo',
      type: 'group',
      label: 'SEO Settings (Basic)',
      admin: {
        description: 'Basic SEO - see SEO Settings global for comprehensive options',
      },
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
      admin: {
        description: 'Enable or disable site features',
      },
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
          name: 'maintenanceAllowedIPs',
          type: 'textarea',
          label: 'Allowed IPs During Maintenance',
          admin: {
            description: 'Comma-separated list of IPs that bypass maintenance mode',
            condition: (data) => data?.features?.maintenanceMode,
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'enableVoiceAssistant',
              type: 'checkbox',
              label: 'Enable Voice Assistant',
              defaultValue: true,
              admin: {
                description: 'Show/hide the AI voice assistant feature',
                width: '50%',
              },
            },
            {
              name: 'enableSearch',
              type: 'checkbox',
              label: 'Enable Search',
              defaultValue: true,
              admin: {
                description: 'Enable/disable the search functionality',
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'enableAnalytics',
              type: 'checkbox',
              label: 'Enable Analytics',
              defaultValue: true,
              admin: {
                description: 'Enable Vercel Analytics tracking',
                width: '50%',
              },
            },
            {
              name: 'enableChat',
              type: 'checkbox',
              label: 'Enable Chat',
              defaultValue: true,
              admin: {
                description: 'Enable user-to-user messaging',
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'enableAchievements',
              type: 'checkbox',
              label: 'Enable Achievements',
              defaultValue: true,
              admin: {
                description: 'Enable gamification system',
                width: '50%',
              },
            },
            {
              name: 'enableDonations',
              type: 'checkbox',
              label: 'Enable Donations',
              defaultValue: true,
              admin: {
                description: 'Show donation buttons and page',
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'enableUserRegistration',
              type: 'checkbox',
              label: 'Enable User Registration',
              defaultValue: true,
              admin: {
                description: 'Allow new users to sign up',
                width: '50%',
              },
            },
            {
              name: 'enableSoundEffects',
              type: 'checkbox',
              label: 'Enable Sound Effects',
              defaultValue: true,
              admin: {
                description: 'Enable Web Audio API sounds',
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    // ========== Security Settings (NEW) ==========
    {
      name: 'security',
      type: 'group',
      label: 'Security Settings',
      admin: {
        description: 'Security-related configuration (Admin only)',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'enableBotChallenge',
              type: 'checkbox',
              label: 'Enable Bot Challenge',
              defaultValue: true,
              admin: {
                description: 'Require bot challenge for sensitive actions',
                width: '50%',
              },
            },
            {
              name: 'enableHoneypots',
              type: 'checkbox',
              label: 'Enable Honeypots',
              defaultValue: true,
              admin: {
                description: 'Add honeypot fields to forms',
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'enableE2EE',
              type: 'checkbox',
              label: 'Enable E2EE',
              defaultValue: true,
              admin: {
                description: 'Enable end-to-end encryption for messages',
                width: '50%',
              },
            },
            {
              name: 'enableFingerprinting',
              type: 'checkbox',
              label: 'Enable Fingerprinting',
              defaultValue: true,
              admin: {
                description: 'Enable browser fingerprinting for security',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'trustedDomains',
          type: 'textarea',
          label: 'Trusted Domains',
          defaultValue: 'www.claudeinsider.com\nclaudeinsider.com\nlocalhost',
          admin: {
            description: 'One domain per line - domains allowed for CORS and redirects',
          },
        },
        {
          name: 'blockedIPs',
          type: 'textarea',
          label: 'Blocked IPs',
          admin: {
            description: 'One IP per line - permanently blocked IP addresses',
          },
        },
        {
          name: 'rateLimitPerMinute',
          type: 'number',
          label: 'Rate Limit (requests/minute)',
          defaultValue: 60,
          min: 10,
          max: 1000,
          admin: {
            description: 'API rate limit per IP per minute',
          },
        },
      ],
    },

    // ========== Performance Settings (NEW) ==========
    {
      name: 'performance',
      type: 'group',
      label: 'Performance Settings',
      admin: {
        description: 'Caching and performance configuration',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'enableISR',
              type: 'checkbox',
              label: 'Enable ISR',
              defaultValue: true,
              admin: {
                description: 'Incremental Static Regeneration',
                width: '50%',
              },
            },
            {
              name: 'enablePrefetching',
              type: 'checkbox',
              label: 'Enable Prefetching',
              defaultValue: true,
              admin: {
                description: 'Prefetch linked pages',
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'cacheRevalidateSeconds',
          type: 'number',
          label: 'Cache Revalidate (seconds)',
          defaultValue: 3600,
          min: 60,
          max: 86400,
          admin: {
            description: 'Default ISR revalidation period',
          },
        },
        {
          name: 'staticPagePaths',
          type: 'textarea',
          label: 'Static Page Paths',
          defaultValue: '/\n/docs\n/resources\n/donate',
          admin: {
            description: 'One path per line - pages to pre-render at build time',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'enableLazyProviders',
              type: 'checkbox',
              label: 'Enable Lazy Providers',
              defaultValue: true,
              admin: {
                description: 'Defer heavy context providers',
                width: '50%',
              },
            },
            {
              name: 'enableImageOptimization',
              type: 'checkbox',
              label: 'Enable Image Optimization',
              defaultValue: true,
              admin: {
                description: 'Use Next.js Image optimization',
                width: '50%',
              },
            },
          ],
        },
      ],
    },

    // ========== Notification Settings (NEW) ==========
    {
      name: 'notifications',
      type: 'group',
      label: 'Notification Settings',
      admin: {
        description: 'Email and push notification configuration',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'enableEmailNotifications',
              type: 'checkbox',
              label: 'Enable Email Notifications',
              defaultValue: true,
              admin: { width: '50%' },
            },
            {
              name: 'enablePushNotifications',
              type: 'checkbox',
              label: 'Enable Push Notifications',
              defaultValue: false,
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'emailFromAddress',
          type: 'email',
          label: 'Email From Address',
          defaultValue: 'noreply@claudeinsider.com',
          admin: {
            description: 'Sender email address for notifications',
          },
        },
        {
          name: 'emailFromName',
          type: 'text',
          label: 'Email From Name',
          defaultValue: 'Claude Insider',
          admin: {
            description: 'Sender name for notifications',
          },
        },
        {
          name: 'digestFrequency',
          type: 'select',
          label: 'Digest Frequency',
          defaultValue: 'daily',
          options: [
            { label: 'Immediate', value: 'immediate' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Never', value: 'never' },
          ],
          admin: {
            description: 'Default email digest frequency for new users',
          },
        },
        {
          name: 'notificationTypes',
          type: 'group',
          label: 'Default Notification Types',
          admin: {
            description: 'Which notifications are enabled by default',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'messages',
                  type: 'checkbox',
                  label: 'Messages',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
                {
                  name: 'mentions',
                  type: 'checkbox',
                  label: 'Mentions',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
                {
                  name: 'achievements',
                  type: 'checkbox',
                  label: 'Achievements',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'updates',
                  type: 'checkbox',
                  label: 'Site Updates',
                  defaultValue: false,
                  admin: { width: '33%' },
                },
                {
                  name: 'marketing',
                  type: 'checkbox',
                  label: 'Marketing',
                  defaultValue: false,
                  admin: { width: '33%' },
                },
                {
                  name: 'security',
                  type: 'checkbox',
                  label: 'Security Alerts',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
              ],
            },
          ],
        },
      ],
    },

    // ========== API Settings (NEW) ==========
    {
      name: 'api',
      type: 'group',
      label: 'API Settings',
      admin: {
        description: 'Public API configuration',
      },
      fields: [
        {
          name: 'enablePublicAPI',
          type: 'checkbox',
          label: 'Enable Public API',
          defaultValue: true,
          admin: {
            description: 'Allow public access to resources API',
          },
        },
        {
          name: 'apiRateLimit',
          type: 'number',
          label: 'API Rate Limit (requests/hour)',
          defaultValue: 1000,
          min: 100,
          max: 100000,
          admin: {
            description: 'Rate limit for authenticated API requests',
            condition: (data) => data?.api?.enablePublicAPI,
          },
        },
        {
          name: 'apiCorsOrigins',
          type: 'textarea',
          label: 'CORS Origins',
          defaultValue: 'https://www.claudeinsider.com\nhttps://claudeinsider.com',
          admin: {
            description: 'One origin per line - allowed CORS origins for API',
            condition: (data) => data?.api?.enablePublicAPI,
          },
        },
        {
          name: 'apiVersion',
          type: 'text',
          label: 'API Version',
          defaultValue: 'v1',
          admin: {
            description: 'Current API version prefix',
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
        {
          name: 'privacyEmail',
          type: 'email',
          label: 'Privacy Email',
          defaultValue: 'privacy@claudeinsider.com',
          admin: {
            description: 'Email for privacy-related inquiries',
          },
        },
      ],
    },

    // ========== Announcement Banner ==========
    // NOTE: This section has moderator access
    {
      name: 'announcement',
      type: 'group',
      label: 'Announcement Banner',
      admin: {
        description: 'Site-wide announcement (Moderators can edit)',
      },
      // Note: Field-level access in Payload v3 is handled differently
      // Moderators can edit via custom admin component or API
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
            { label: 'Critical (Red)', value: 'critical' },
          ],
          admin: {
            condition: (data) => data?.announcement?.enabled,
          },
        },
        {
          name: 'expiresAt',
          type: 'date',
          label: 'Expires At',
          admin: {
            description: 'Automatically hide banner after this date',
            condition: (data) => data?.announcement?.enabled,
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'dismissible',
          type: 'checkbox',
          label: 'Dismissible',
          defaultValue: true,
          admin: {
            description: 'Allow users to dismiss the banner',
            condition: (data) => data?.announcement?.enabled,
          },
        },
      ],
    },
  ],
};
