import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { resendAdapter } from '@payloadcms/email-resend';

// All collections now enabled - first user created via custom seed endpoint
import {
  Categories,
  Subcategories,
  Tags,
  Resources,
  ResourceSources,
  ResourceDiscoveryQueue,
  ResourceReviews,
  ResourceAuthors,
  AuditLogs,
  Documents,
  DocumentSections,
  CodeExamples,
  DifficultyLevels,
  ProgrammingLanguages,
  Users,
  EditSuggestions,
  Media,
  Translations,
  EmailTemplates,
  // Gamification
  AchievementTiers,
  AchievementCategories,
  Achievements,
  Badges,
} from './collections';
import { SiteSettings, CrossLinkSettings, GamificationSettings, AIPipelineSettings } from './globals';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  // Admin panel configuration
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — Claude Insider Admin',
      // Note: favicon and ogImage are handled via public/admin/ folder in Payload v3
    },
    components: {
      // Custom branding can be added here later
    },
  },

  // Collections - order matters for admin UI grouping
  collections: [
    // User management first
    Users,
    // Media uploads (needed for user avatars)
    Media,
    // Core content collections
    Categories,
    Subcategories,
    Tags,
    Resources,
    // Resource discovery and administration
    ResourceSources,
    ResourceDiscoveryQueue,
    // Resource reviews moderation
    ResourceReviews,
    // Resource authors management
    ResourceAuthors,
    // System - Audit logging
    AuditLogs,
    // Documentation cross-linking (Content group)
    Documents,
    DocumentSections,
    CodeExamples,
    // Reference data (Settings group)
    DifficultyLevels,
    ProgrammingLanguages,
    // Moderation (Community group)
    EditSuggestions,
    // Internationalization (Settings group)
    Translations,
    // Email Management (Settings group)
    EmailTemplates,
    // Gamification (Gamification group)
    AchievementTiers,
    AchievementCategories,
    Achievements,
    Badges,
  ],

  // Globals (single-instance documents for site-wide config)
  globals: [SiteSettings, CrossLinkSettings, GamificationSettings, AIPipelineSettings],

  // Database - Supabase PostgreSQL via Drizzle
  // Using Session Pooler with PgBouncer compatibility
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      max: 10, // Maximum connections in pool
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 10000, // Wait 10s for connection
    },
    // Disable prepared statements for PgBouncer compatibility
    push: false,
  }),

  // Rich text editor
  editor: lexicalEditor(),

  // Secret for JWT tokens
  secret: process.env.PAYLOAD_SECRET || 'change-this-secret-in-production',

  // TypeScript output path
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // GraphQL disabled (using REST API only)
  graphQL: {
    disable: true,
  },

  // Plugins can be added here
  plugins: [],

  // Localization - 18 supported languages
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Español', code: 'es' },
      { label: 'Français', code: 'fr' },
      { label: 'Deutsch', code: 'de' },
      { label: '日本語', code: 'ja' },
      { label: '中文', code: 'zh' },
      { label: '한국어', code: 'ko' },
      { label: 'Português', code: 'pt' },
      { label: 'Српски', code: 'sr' },
      { label: 'Русский', code: 'ru' },
      { label: 'Italiano', code: 'it' },
      { label: 'Nederlands', code: 'nl' },
      { label: 'Polski', code: 'pl' },
      { label: 'Svenska', code: 'sv' },
      { label: 'Norsk', code: 'no' },
      { label: 'Dansk', code: 'da' },
      { label: 'Suomi', code: 'fi' },
      { label: 'Ελληνικά', code: 'el' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },

  // CORS for API access
  cors: [
    'http://localhost:3001',
    'https://www.claudeinsider.com',
    'https://claudeinsider.com',
  ],

  // Note: Rate limiting is handled at the Vercel/infrastructure level in Payload v3

  // Email configuration using Resend
  // Get a free API key at https://resend.com (100 emails/day free)
  // Falls back to console logging if RESEND_API_KEY is not set
  email: process.env.RESEND_API_KEY
    ? resendAdapter({
        defaultFromAddress: 'noreply@claudeinsider.com',
        defaultFromName: 'Claude Insider',
        apiKey: process.env.RESEND_API_KEY,
      })
    : undefined,

  // File uploads (disabled for now)
  upload: {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
  },

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Telemetry
  telemetry: false,
});
