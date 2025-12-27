import type { GlobalConfig } from 'payload';
import { createGlobalRevalidateHook } from '../lib/revalidate';

/**
 * SEO Settings Global
 * Comprehensive SEO configuration for the entire site
 * Editable from admin panel at /admin/globals/seo-settings
 */
export const SEOSettings: GlobalConfig = {
  slug: 'seo-settings',
  label: 'SEO Settings',
  admin: {
    group: 'Settings',
    description: 'Search engine optimization settings - meta tags, structured data, social sharing',
  },
  access: {
    read: () => true, // Public read for frontend
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'superadmin',
  },
  hooks: {
    afterChange: [createGlobalRevalidateHook('seo-settings')],
  },
  fields: [
    // ========== Basic Meta Tags ==========
    {
      name: 'meta',
      type: 'group',
      label: 'Meta Tags',
      admin: {
        description: 'Default meta tags for all pages',
      },
      fields: [
        {
          name: 'titleTemplate',
          type: 'text',
          label: 'Title Template',
          defaultValue: '%s | Claude Insider',
          admin: {
            description: 'Template for page titles. Use %s as placeholder for page title.',
          },
        },
        {
          name: 'defaultTitle',
          type: 'text',
          label: 'Default Title',
          defaultValue: 'Claude Insider - Your Guide to Mastering Claude AI',
          admin: {
            description: 'Fallback title when page title is not set (max 60 chars recommended)',
          },
        },
        {
          name: 'defaultDescription',
          type: 'textarea',
          label: 'Default Description',
          defaultValue: 'Comprehensive documentation, tips, and guides for Claude AI, Claude Code, and the Anthropic ecosystem. Master AI-powered development with 34 docs and 1,952+ curated resources.',
          admin: {
            description: 'Default meta description (max 160 chars recommended)',
          },
        },
        {
          name: 'keywords',
          type: 'text',
          label: 'Default Keywords',
          defaultValue: 'Claude AI, Claude Code, Anthropic, AI documentation, AI development, Claude API',
          admin: {
            description: 'Comma-separated keywords for meta tags',
          },
        },
        {
          name: 'author',
          type: 'text',
          label: 'Author',
          defaultValue: 'Vladimir Dukelic',
          admin: {
            description: 'Author name for meta tags',
          },
        },
        {
          name: 'themeColor',
          type: 'text',
          label: 'Theme Color',
          defaultValue: '#0a0a0a',
          admin: {
            description: 'Browser theme color (hex format)',
          },
        },
      ],
    },

    // ========== Open Graph ==========
    {
      name: 'openGraph',
      type: 'group',
      label: 'Open Graph (Facebook/LinkedIn)',
      admin: {
        description: 'Settings for Facebook, LinkedIn, and other platforms using Open Graph',
      },
      fields: [
        {
          name: 'siteName',
          type: 'text',
          label: 'Site Name',
          defaultValue: 'Claude Insider',
        },
        {
          name: 'type',
          type: 'select',
          label: 'Default Type',
          defaultValue: 'website',
          options: [
            { label: 'Website', value: 'website' },
            { label: 'Article', value: 'article' },
            { label: 'Product', value: 'product' },
          ],
        },
        {
          name: 'locale',
          type: 'text',
          label: 'Default Locale',
          defaultValue: 'en_US',
          admin: {
            description: 'Locale in format language_TERRITORY (e.g., en_US)',
          },
        },
        {
          name: 'alternateLocales',
          type: 'array',
          label: 'Alternate Locales',
          admin: {
            description: 'Additional locales for og:locale:alternate',
          },
          fields: [
            {
              name: 'locale',
              type: 'text',
              required: true,
            },
          ],
          defaultValue: [
            { locale: 'de_DE' },
            { locale: 'fr_FR' },
            { locale: 'es_ES' },
            { locale: 'ja_JP' },
          ],
        },
        {
          name: 'defaultImage',
          type: 'upload',
          label: 'Default OG Image',
          relationTo: 'media',
          admin: {
            description: 'Default image for social sharing (recommended: 1200x630px)',
          },
        },
        {
          name: 'imageAlt',
          type: 'text',
          label: 'Default Image Alt',
          defaultValue: 'Claude Insider - Your Guide to Mastering Claude AI',
        },
      ],
    },

    // ========== Twitter Cards ==========
    {
      name: 'twitter',
      type: 'group',
      label: 'Twitter/X Cards',
      admin: {
        description: 'Settings for Twitter/X card previews',
      },
      fields: [
        {
          name: 'cardType',
          type: 'select',
          label: 'Card Type',
          defaultValue: 'summary_large_image',
          options: [
            { label: 'Summary', value: 'summary' },
            { label: 'Summary Large Image', value: 'summary_large_image' },
            { label: 'App', value: 'app' },
            { label: 'Player', value: 'player' },
          ],
        },
        {
          name: 'site',
          type: 'text',
          label: 'Site Handle',
          defaultValue: '@claudeinsider',
          admin: {
            description: 'Twitter handle of the website (e.g., @claudeinsider)',
          },
        },
        {
          name: 'creator',
          type: 'text',
          label: 'Creator Handle',
          defaultValue: '@claudeinsider',
          admin: {
            description: 'Twitter handle of content creator',
          },
        },
      ],
    },

    // ========== Structured Data (JSON-LD) ==========
    {
      name: 'structuredData',
      type: 'group',
      label: 'Structured Data (JSON-LD)',
      admin: {
        description: 'Schema.org structured data for rich snippets',
      },
      fields: [
        {
          name: 'organizationType',
          type: 'select',
          label: 'Organization Type',
          defaultValue: 'Organization',
          options: [
            { label: 'Organization', value: 'Organization' },
            { label: 'Corporation', value: 'Corporation' },
            { label: 'Educational Organization', value: 'EducationalOrganization' },
            { label: 'Local Business', value: 'LocalBusiness' },
          ],
        },
        {
          name: 'organizationName',
          type: 'text',
          label: 'Organization Name',
          defaultValue: 'Claude Insider',
        },
        {
          name: 'logo',
          type: 'upload',
          label: 'Organization Logo',
          relationTo: 'media',
          admin: {
            description: 'Logo for structured data (recommended: 512x512px)',
          },
        },
        {
          name: 'sameAs',
          type: 'array',
          label: 'Social Profiles (sameAs)',
          admin: {
            description: 'URLs of social media profiles for organization',
          },
          fields: [
            {
              name: 'url',
              type: 'text',
              required: true,
            },
          ],
          defaultValue: [
            { url: 'https://github.com/siliconyouth/claude-insider' },
            { url: 'https://twitter.com/claudeinsider' },
          ],
        },
        {
          name: 'contactEmail',
          type: 'email',
          label: 'Contact Email',
          defaultValue: 'vladimir@dukelic.com',
        },
        {
          name: 'contactType',
          type: 'text',
          label: 'Contact Type',
          defaultValue: 'customer support',
        },
      ],
    },

    // ========== Search Engine Verification ==========
    {
      name: 'verification',
      type: 'group',
      label: 'Search Engine Verification',
      admin: {
        description: 'Verification codes for search engine webmaster tools',
      },
      fields: [
        {
          name: 'google',
          type: 'text',
          label: 'Google Search Console',
          admin: {
            description: 'Google site verification code (content value only)',
          },
        },
        {
          name: 'bing',
          type: 'text',
          label: 'Bing Webmaster Tools',
          admin: {
            description: 'Bing site verification code',
          },
        },
        {
          name: 'yandex',
          type: 'text',
          label: 'Yandex Webmaster',
          admin: {
            description: 'Yandex verification code',
          },
        },
        {
          name: 'pinterest',
          type: 'text',
          label: 'Pinterest',
          admin: {
            description: 'Pinterest domain verification code',
          },
        },
      ],
    },

    // ========== Robots & Crawling ==========
    {
      name: 'robots',
      type: 'group',
      label: 'Robots & Crawling',
      admin: {
        description: 'Control search engine crawling behavior',
      },
      fields: [
        {
          name: 'indexSite',
          type: 'checkbox',
          label: 'Allow Search Engine Indexing',
          defaultValue: true,
          admin: {
            description: 'Uncheck to add noindex to entire site (useful for staging)',
          },
        },
        {
          name: 'followLinks',
          type: 'checkbox',
          label: 'Allow Following Links',
          defaultValue: true,
          admin: {
            description: 'Uncheck to add nofollow to entire site',
          },
        },
        {
          name: 'sitemapEnabled',
          type: 'checkbox',
          label: 'Enable Sitemap',
          defaultValue: true,
        },
        {
          name: 'sitemapChangeFreq',
          type: 'select',
          label: 'Default Change Frequency',
          defaultValue: 'weekly',
          options: [
            { label: 'Always', value: 'always' },
            { label: 'Hourly', value: 'hourly' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
            { label: 'Never', value: 'never' },
          ],
        },
        {
          name: 'sitemapPriority',
          type: 'number',
          label: 'Default Priority',
          defaultValue: 0.7,
          min: 0,
          max: 1,
          admin: {
            step: 0.1,
            description: 'Priority from 0.0 to 1.0',
          },
        },
      ],
    },

    // ========== IndexNow ==========
    {
      name: 'indexNow',
      type: 'group',
      label: 'IndexNow (Instant Indexing)',
      admin: {
        description: 'Push URLs to search engines instantly when content changes',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable IndexNow',
          defaultValue: true,
        },
        {
          name: 'apiKey',
          type: 'text',
          label: 'IndexNow API Key',
          admin: {
            description: 'Your IndexNow API key (a 32-character hex string)',
            condition: (data) => data?.indexNow?.enabled,
          },
        },
        {
          name: 'searchEngines',
          type: 'select',
          label: 'Target Search Engines',
          hasMany: true,
          defaultValue: ['bing', 'yandex'],
          options: [
            { label: 'Bing', value: 'bing' },
            { label: 'Yandex', value: 'yandex' },
            { label: 'Seznam', value: 'seznam' },
            { label: 'Naver', value: 'naver' },
          ],
          admin: {
            condition: (data) => data?.indexNow?.enabled,
          },
        },
      ],
    },

    // ========== Analytics Integration ==========
    {
      name: 'analytics',
      type: 'group',
      label: 'Analytics & Tracking',
      admin: {
        description: 'Third-party analytics integration',
      },
      fields: [
        {
          name: 'googleAnalyticsId',
          type: 'text',
          label: 'Google Analytics 4 ID',
          admin: {
            description: 'Measurement ID (e.g., G-XXXXXXXXXX)',
          },
        },
        {
          name: 'googleTagManagerId',
          type: 'text',
          label: 'Google Tag Manager ID',
          admin: {
            description: 'Container ID (e.g., GTM-XXXXXXX)',
          },
        },
        {
          name: 'plausibleDomain',
          type: 'text',
          label: 'Plausible Domain',
          admin: {
            description: 'Domain for Plausible Analytics',
          },
        },
        {
          name: 'enableVercelAnalytics',
          type: 'checkbox',
          label: 'Enable Vercel Analytics',
          defaultValue: true,
        },
      ],
    },

    // ========== Advanced ==========
    {
      name: 'advanced',
      type: 'group',
      label: 'Advanced Settings',
      admin: {
        description: 'Advanced SEO configuration',
      },
      fields: [
        {
          name: 'canonicalDomain',
          type: 'text',
          label: 'Canonical Domain',
          defaultValue: 'https://www.claudeinsider.com',
          admin: {
            description: 'Primary domain for canonical URLs (include https://)',
          },
        },
        {
          name: 'trailingSlash',
          type: 'checkbox',
          label: 'Use Trailing Slashes',
          defaultValue: false,
          admin: {
            description: 'Add trailing slash to URLs (e.g., /docs/ instead of /docs)',
          },
        },
        {
          name: 'wwwRedirect',
          type: 'select',
          label: 'WWW Redirect',
          defaultValue: 'www',
          options: [
            { label: 'Redirect to www', value: 'www' },
            { label: 'Redirect to non-www', value: 'non-www' },
            { label: 'No redirect', value: 'none' },
          ],
        },
        {
          name: 'hreflangEnabled',
          type: 'checkbox',
          label: 'Enable Hreflang Tags',
          defaultValue: true,
          admin: {
            description: 'Add hreflang tags for international SEO',
          },
        },
        {
          name: 'defaultHreflang',
          type: 'text',
          label: 'Default Hreflang',
          defaultValue: 'en',
          admin: {
            description: 'Default language code (e.g., en, en-US)',
            condition: (data) => data?.advanced?.hreflangEnabled,
          },
        },
      ],
    },
  ],
};
