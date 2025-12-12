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
  DifficultyLevels,
  ProgrammingLanguages,
  Users,
} from './collections';
import { SiteSettings } from './globals';

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
    // Core content collections
    Categories,
    Subcategories,
    Tags,
    Resources,
    // Reference data (Settings group)
    DifficultyLevels,
    ProgrammingLanguages,
  ],

  // Globals (single-instance documents for site-wide config)
  globals: [SiteSettings],

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

  // Localization (English only for now)
  localization: false,

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
